'use client'

import { useState } from 'react'
import { updateCollectionsPolicy } from './collections/actions'

export function CollectionsSettingsSection({
  initialEnabled,
  initialOverdue1Days,
  initialOverdue2Days,
  initialFinalDays,
}: {
  initialEnabled: boolean
  initialOverdue1Days: number
  initialOverdue2Days: number
  initialFinalDays: number
}) {
  const [enabled, setEnabled] = useState(initialEnabled)
  const [overdue1Days, setOverdue1Days] = useState(initialOverdue1Days)
  const [overdue2Days, setOverdue2Days] = useState(initialOverdue2Days)
  const [finalDays, setFinalDays] = useState(initialFinalDays)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)

  async function handleSave() {
    setError(null)
    setSaved(false)
    setLoading(true)

    const result = await updateCollectionsPolicy({
      collectionsEnabled: enabled,
      collectionsOverdue1Days: overdue1Days,
      collectionsOverdue2Days: overdue2Days,
      collectionsFinalDays: finalDays,
    })

    if (result.success) {
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } else {
      setError(result.error)
    }
    setLoading(false)
  }

  return (
    <div className="card" style={{ marginTop: 24 }}>
      <h2>Collections Automation</h2>
      <p className="muted" style={{ marginBottom: 16 }}>
        Automatically track overdue invoices and create follow-up reminders.
      </p>

      {error && (
        <div style={{ color: '#dc2626', marginBottom: 16, fontSize: 14 }}>{error}</div>
      )}
      {saved && (
        <div style={{ color: '#059669', marginBottom: 16, fontSize: 14 }}>Settings saved.</div>
      )}

      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
          <input
            type="checkbox"
            checked={enabled}
            onChange={(e) => setEnabled(e.target.checked)}
            style={{ width: 18, height: 18 }}
          />
          <span style={{ fontSize: 14, fontWeight: 500 }}>Enable collections automation</span>
        </label>
      </div>

      {enabled && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, padding: '16px', background: '#f9fafb', borderRadius: 8 }}>
          <p style={{ fontSize: 13, fontWeight: 600 }}>Reminder stages (days after due date)</p>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
            <label>
              <span style={labelStyle}>First reminder</span>
              <input
                type="number"
                min={1}
                max={90}
                value={overdue1Days}
                onChange={(e) => setOverdue1Days(parseInt(e.target.value) || 7)}
                style={inputStyle}
              />
              <span className="muted" style={{ fontSize: 11 }}>days overdue</span>
            </label>
            <label>
              <span style={labelStyle}>Second reminder</span>
              <input
                type="number"
                min={2}
                max={120}
                value={overdue2Days}
                onChange={(e) => setOverdue2Days(parseInt(e.target.value) || 14)}
                style={inputStyle}
              />
              <span className="muted" style={{ fontSize: 11 }}>days overdue</span>
            </label>
            <label>
              <span style={labelStyle}>Final notice</span>
              <input
                type="number"
                min={3}
                max={180}
                value={finalDays}
                onChange={(e) => setFinalDays(parseInt(e.target.value) || 30)}
                style={inputStyle}
              />
              <span className="muted" style={{ fontSize: 11 }}>days overdue</span>
            </label>
          </div>
        </div>
      )}

      <button
        onClick={handleSave}
        disabled={loading}
        className="button"
        style={{ marginTop: 16, textAlign: 'center' }}
      >
        {loading ? 'Saving...' : 'Save settings'}
      </button>
    </div>
  )
}

const labelStyle: React.CSSProperties = { fontSize: 14, fontWeight: 500 }

const inputStyle: React.CSSProperties = {
  display: 'block',
  width: '100%',
  padding: '8px 12px',
  marginTop: 4,
  border: '1px solid var(--border)',
  borderRadius: 8,
  fontSize: 14,
}
