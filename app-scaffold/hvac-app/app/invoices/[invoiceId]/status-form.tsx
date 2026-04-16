'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { updateInvoiceStatus } from './actions'

const STATUSES = [
  { value: 'draft', label: 'Draft' },
  { value: 'sent', label: 'Sent' },
  { value: 'paid', label: 'Paid' },
  { value: 'overdue', label: 'Overdue' },
  { value: 'void', label: 'Void' },
]

export function InvoiceStatusForm({ invoiceId, currentStatus }: { invoiceId: string; currentStatus: string }) {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const formData = new FormData(e.currentTarget)
    const result = await updateInvoiceStatus(invoiceId, formData)

    if (result.success) {
      router.refresh()
    } else {
      setError(result.error)
    }
    setLoading(false)
  }

  return (
    <>
      {error && (
        <div style={{ color: '#dc2626', marginBottom: 12, fontSize: 14 }}>{error}</div>
      )}
      <form onSubmit={handleSubmit} style={{ display: 'flex', gap: 12, alignItems: 'flex-end', marginTop: 8 }}>
        <label style={{ flex: 1 }}>
          <span style={{ fontSize: 14, fontWeight: 500 }}>Status</span>
          <select name="status" defaultValue={currentStatus} style={inputStyle}>
            {STATUSES.map((s) => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>
        </label>
        <button type="submit" className="button" disabled={loading} style={{ textAlign: 'center' }}>
          {loading ? 'Updating...' : 'Update'}
        </button>
      </form>
    </>
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
