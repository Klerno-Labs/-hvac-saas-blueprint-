'use server'

import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { trackEvent } from '@/lib/events'
import { createInventoryItemSchema } from '@/lib/validations/inventory'

type CreateInventoryItemResult =
  | { success: true; itemId: string }
  | { success: false; error: string }

export async function createInventoryItem(formData: FormData): Promise<CreateInventoryItemResult> {
  const session = await auth()
  if (!session?.user?.id) {
    return { success: false, error: 'You must be logged in' }
  }

  const userId = session.user.id

  const membership = await db.organizationMember.findFirst({
    where: { userId },
  })
  if (!membership) {
    return { success: false, error: 'You must belong to an organization' }
  }

  const organizationId = membership.organizationId

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

  const parsed = createInventoryItemSchema.safeParse(raw)
  if (!parsed.success) {
    return { success: false, error: parsed.error.errors[0].message }
  }

  const data = parsed.data

  const item = await db.inventoryItem.create({
    data: {
      organizationId,
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
    organizationId,
    userId,
    eventName: 'inventory_item_created',
    entityType: 'inventory_item',
    entityId: item.id,
  })

  return { success: true, itemId: item.id }
}
