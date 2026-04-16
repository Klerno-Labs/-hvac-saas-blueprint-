import { db } from '@/lib/db'

type EventInput = {
  organizationId: string
  userId?: string
  eventName: string
  entityType?: string
  entityId?: string
  metadataJson?: Record<string, unknown>
}

export async function trackEvent(input: EventInput) {
  return db.activityEvent.create({ data: input })
}
