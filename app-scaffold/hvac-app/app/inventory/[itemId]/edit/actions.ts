'use server'

import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { trackEvent } from '@/lib/events'
import { updateInventoryItemSchema } from '@/lib/validations/inventory'

type ActionResult = { success: true } | { success: false; error: string }

export async function updateInventoryItem(
  itemId: string,
  formData: FormData
): Promise<ActionResult> {
  const session = await auth()
  if (!session?.user?.id) return { success: false, error: 'You must be logged in' }

  const membership = await db.organizationMember.findFirst({
    where: { userId: session.user.id },
  })
  if (!membership) return { success: false, error: 'You must belong to an organization' }

  const item = await db.inventoryItem.findFirst({
    where: { id: itemId, organizationId: membership.organizationId },
  })
  if (!item) return { success: false, error: 'Item not found' }

  const raw = {
    name: formData.get('name'),
    sku: formData.get('sku') || undefined,
    description: formData.get('description') || undefined,
    unitCostCents: Math.round(parseFloat(formData.get('unitCost') as string || '0') * 100),
    sellPriceCents: Math.round(parseFloat(formData.get('sellPrice') as string || '0') * 100),
    quantityOnHand: parseInt(formData.get('quantityOnHand') as string || '0', 10),
    reorderPoint: parseInt(formData.get('reorderPoint') as string || '0', 10),
    category: formData.get('category') || undefined,
  }

  const parsed = updateInventoryItemSchema.safeParse(raw)
  if (!parsed.success) return { success: false, error: parsed.error.errors[0].message }

  const data = parsed.data
  await db.inventoryItem.update({
    where: { id: itemId },
    data: {
      name: data.name,
      sku: data.sku || null,
      description: data.description || null,
      unitCostCents: data.unitCostCents,
      sellPriceCents: data.sellPriceCents,
      quantityOnHand: data.quantityOnHand,
      reorderPoint: data.reorderPoint,
      category: data.category || null,
    },
  })

  await trackEvent({
    organizationId: membership.organizationId,
    userId: session.user.id,
    eventName: 'inventory_item_updated',
    entityType: 'inventory_item',
    entityId: itemId,
  })

  return { success: true }
}
