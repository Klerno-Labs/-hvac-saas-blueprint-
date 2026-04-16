'use client'

import { useState } from 'react'
import { updateAccountingConfig, triggerAccountingSync } from './accounting/actions'

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
    <div className="card" style={{ marginTop: 24 }}>
      <h2>Accounting Integration</h2>
      <p className="muted" style={{ marginBottom: 16 }}>
        Connect your accounting software to sync customers, invoices, and payments.
      </p>

      {error && (
        <div style={{ color: '#dc2626', marginBottom: 16, fontSize: 14 }}>{error}</div>
      )}
      {saved && (
        <div style={{ color: '#059669', marginBottom: 16, fontSize: 14 }}>Settings saved.</div>
      )}
      {syncResult && (
        <div style={{ color: '#059669', marginBottom: 16, fontSize: 14 }}>{syncResult}</div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <label>
          <span style={{ fontSize: 14, fontWeight: 500 }}>Provider</span>
          <select
            value={provider}
            onChange={(e) => setProvider(e.target.value)}
            style={inputStyle}
          >
            <option value="">Select provider</option>
            {PROVIDERS.map((p) => (
              <option key={p.value} value={p.value}>{p.label}</option>
            ))}
          </select>
        </label>

        {provider && (
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={connected}
              onChange={(e) => setConnected(e.target.checked)}
              style={{ width: 18, height: 18 }}
            />
            <span style={{ fontSize: 14, fontWeight: 500 }}>Mark as connected</span>
          </label>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginTop: 8 }}>
          <div>
            <p style={{ fontSize: 13 }} className="muted">Status</p>
            <p style={{ fontWeight: 600, color: connected && provider ? '#059669' : '#6b7280' }}>
              {connected && provider ? `Connected (${provider})` : 'Not connected'}
            </p>
          </div>
          <div>
            <p style={{ fontSize: 13 }} className="muted">Last sync</p>
            <p style={{ fontSize: 14 }}>
              {lastSyncAt ? new Date(lastSyncAt).toLocaleString() : 'Never'}
            </p>
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 12, marginTop: 16 }}>
        <button
          onClick={handleSave}
          disabled={saving}
          className="button"
          style={{ textAlign: 'center' }}
        >
          {saving ? 'Saving...' : 'Save settings'}
        </button>
        {connected && provider && (
          <button
            onClick={handleSync}
            disabled={syncing}
            style={{
              padding: '10px 16px',
              fontSize: 14,
              background: 'none',
              border: '1px solid var(--border)',
              borderRadius: 10,
              cursor: 'pointer',
              color: 'var(--text)',
            }}
          >
            {syncing ? 'Syncing...' : 'Sync now'}
          </button>
        )}
      </div>
    </div>
  )
}

const inputStyle: React.CSSProperties = {
  display: 'block',
  width: '100%',
  padding: '8px 12px',
  marginTop: 4,
  border: '1px solid var(--border)',
  borderRadius: 8,
  fontSize: 14,
}
