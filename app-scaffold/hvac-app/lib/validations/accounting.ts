import { z } from 'zod'

export const ACCOUNTING_PROVIDERS = ['quickbooks', 'xero'] as const
export type AccountingProvider = (typeof ACCOUNTING_PROVIDERS)[number]

export const SYNC_STATUSES = ['pending', 'synced', 'failed', 'skipped'] as const
export type SyncStatus = (typeof SYNC_STATUSES)[number]

export const SYNC_ENTITY_TYPES = ['customer', 'invoice', 'payment'] as const
export type SyncEntityType = (typeof SYNC_ENTITY_TYPES)[number]

export const updateAccountingConfigSchema = z.object({
  accountingProvider: z.enum(ACCOUNTING_PROVIDERS).nullable(),
  accountingConnected: z.boolean(),
})

export type UpdateAccountingConfigInput = z.infer<typeof updateAccountingConfigSchema>
