'use server'

import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { trackEvent } from '@/lib/events'
import { recordInventoryUsageSchema } from '@/lib/validations/inventory'

type ActionResult = { success: true } | { success: false; error: string }

export async function recordPartUsage(
  jobId: string,
  formData: FormData
): Promise<ActionResult> {
  const session = await auth()
  if (!session?.user?.id) return { success: false, error: 'You must be logged in' }

  const membership = await db.organizationMember.findFirst({
    where: { userId: session.user.id },
  })
  if (!membership) return { success: false, error: 'You must belong to an organization' }

  const organizationId = membership.organizationId

  // Verify job belongs to org
  const job = await db.job.findFirst({
    where: { id: jobId, organizationId },
  })
  if (!job) return { success: false, error: 'Job not found' }

  const raw = {
    inventoryItemId: formData.get('inventoryItemId'),
    quantity: formData.get('quantity'),
    notes: formData.get('notes') || undefined,
  }

  const parsed = recordInventoryUsageSchema.safeParse(raw)
  if (!parsed.success) return { success: false, error: parsed.error.errors[0].message }

  const data = parsed.data

  // Verify item belongs to org and has enough stock
  const item = await db.inventoryItem.findFirst({
    where: { id: data.inventoryItemId, organizationId },
  })
  if (!item) return { success: false, error: 'Inventory item not found' }

  if (item.quantityOnHand < data.quantity) {
    return {
      success: false,
      error: `Insufficient stock. Only ${item.quantityOnHand} available.`,
    }
  }

  // Create usage record and decrement stock in a transaction
  await db.$transaction([
    db.inventoryUsage.create({
      data: {
        organizationId,
        inventoryItemId: data.inventoryItemId,
        jobId,
        quantity: data.quantity,
        notes: data.notes || null,
      },
    }),
    db.inventoryItem.update({
      where: { id: data.inventoryItemId },
      data: {
        quantityOnHand: { decrement: data.quantity },
      },
    }),
  ])

  await trackEvent({
    organizationId,
    userId: session.user.id,
    eventName: 'inventory_usage_recorded',
    entityType: 'job',
    entityId: jobId,
    metadataJson: {
      inventoryItemId: data.inventoryItemId,
      quantity: data.quantity,
    },
  })

  return { success: true }
}
