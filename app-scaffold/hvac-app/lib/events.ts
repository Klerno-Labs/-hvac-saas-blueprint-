import { Prisma } from '@prisma/client'
import { db } from '@/lib/db'

type EventInput = {
  organizationId?: string
  userId?: string
  eventName: string
  entityType?: string
  entityId?: string
  metadataJson?: Record<string, unknown>
}

export async function trackEvent(input: EventInput) {
  const data: Prisma.ActivityEventUncheckedCreateInput = {
    organizationId: input.organizationId ?? null,
    userId: input.userId,
    eventName: input.eventName,
    entityType: input.entityType,
    entityId: input.entityId,
    metadataJson: input.metadataJson as Prisma.InputJsonValue | undefined,
  }
  return db.activityEvent.create({ data })
}
