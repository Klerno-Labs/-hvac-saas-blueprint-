'use client'

import { useState } from 'react'
import { updateAccountingConfig, triggerAccountingSync } from './accounting/actions'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'

const PROVIDERS = [
  { value: 'quickbooks', label: 'QuickBooks' },
  { value: 'xero', label: 'Xero' },
]

export function AccountingSettingsSection({
  initialProvider,
  initialConnected,
  lastSyncAt,
}: {
  initialProvider: string | null
  initialConnected: boolean
  lastSyncAt: Date | null
}) {
  const [provider, setProvider] = useState(initialProvider || '')
  const [connected, setConnected] = useState(initialConnected)
  const [saving, setSaving] = useState(false)
  const [syncing, setSyncing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)
  const [syncResult, setSyncResult] = useState<string | null>(null)

  async function handleSave() {
    setError(null)
    setSaved(false)
    setSaving(true)

    const result = await updateAccountingConfig({
      accountingProvider: provider || null,
      accountingConnected: connected && !!provider,
    })

    if (result.success) {
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } else {
      setError(result.error)
    }
    setSaving(false)
  }

  async function handleSync() {
    setError(null)
    setSyncResult(null)
    setSyncing(true)

    const result = await triggerAccountingSync()

    if (result.success) {
      setSyncResult(
        `Synced: ${result.customersProcessed} customers, ${result.invoicesProcessed} invoices, ${result.paymentsProcessed} payments${result.errors > 0 ? `, ${result.errors} errors` : ''}`,
      )
    } else {
      setError(result.error)
    }
    setSyncing(false)
  }

  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle>Accounting Integration</CardTitle>
        <CardDescription>
          Connect your accounting software to sync customers, invoices, and payments.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <div className="text-destructive text-sm">{error}</div>
        )}
        {saved && (
          <div className="text-emerald-600 text-sm">Settings saved.</div>
        )}
        {syncResult && (
          <div className="text-emerald-600 text-sm">{syncResult}</div>
        )}

        <div className="flex flex-col gap-3">
          <div className="space-y-1">
            <Label className="text-sm font-medium">Provider</Label>
            <select
              value={provider}
              onChange={(e) => setProvider(e.target.value)}
              className="block w-full rounded-lg border border-input bg-transparent px-2.5 py-1.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
            >
              <option value="">Select provider</option>
              {PROVIDERS.map((p) => (
                <option key={p.value} value={p.value}>{p.label}</option>
              ))}
            </select>
          </div>

          {provider && (
            <Label className="cursor-pointer">
              <input
                type="checkbox"
                checked={connected}
                onChange={(e) => setConnected(e.target.checked)}
                className="size-4.5"
              />
              <span className="text-sm font-medium">Mark as connected</span>
            </Label>
          )}

          <div className="grid grid-cols-2 gap-4 mt-2">
            <div>
              <p className="text-xs text-muted-foreground">Status</p>
              <p className={cn('font-semibold', connected && provider ? 'text-emerald-600' : 'text-gray-500')}>
                {connected && provider ? `Connected (${provider})` : 'Not connected'}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Last sync</p>
              <p className="text-sm">
                {lastSyncAt ? new Date(lastSyncAt).toLocaleString() : 'Never'}
              </p>
            </div>
          </div>
        </div>

        <div className="flex gap-3">
          <Button
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? 'Saving...' : 'Save settings'}
          </Button>
          {connected && provider && (
            <Button
              onClick={handleSync}
              disabled={syncing}
              variant="outline"
            >
              {syncing ? 'Syncing...' : 'Sync now'}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
