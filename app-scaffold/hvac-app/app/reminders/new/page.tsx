'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createReminder } from './actions'

const REMINDER_TYPES = [
  { value: 'general', label: 'General' },
  { value: 'follow_up_estimate', label: 'Follow up on estimate' },
  { value: 'follow_up_invoice', label: 'Follow up on invoice' },
  { value: 'call_customer', label: 'Call customer back' },
  { value: 'review_job', label: 'Review job' },
]

export default function NewReminderPage() {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const formData = new FormData(e.currentTarget)
    const result = await createReminder(formData)

    if (result.success) {
      router.push('/reminders')
    } else {
      setError(result.error)
      setLoading(false)
    }
  }

  return (
    <main>
      <div className="card" style={{ maxWidth: 540, margin: '0 auto' }}>
        <h1>New reminder</h1>
        <p className="muted">Create a follow-up reminder for your team.</p>

        {error && (
          <div style={{ color: '#dc2626', marginBottom: 16, fontSize: 14 }}>{error}</div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 16 }}>
          <label>
            <span style={labelStyle}>Title *</span>
            <input
              name="title"
              type="text"
              required
              placeholder="e.g. Follow up with Smith on AC estimate"
              style={inputStyle}
            />
          </label>

          <label>
            <span style={labelStyle}>Type</span>
            <select name="reminderType" style={inputStyle}>
              {REMINDER_TYPES.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </label>

          <label>
            <span style={labelStyle}>Due date</span>
            <input name="dueAt" type="date" style={inputStyle} />
          </label>

          <label>
            <span style={labelStyle}>Notes</span>
            <textarea
              name="notes"
              rows={3}
              placeholder="Additional context..."
              style={{ ...inputStyle, resize: 'vertical' }}
            />
          </label>

          <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
            <button type="submit" className="button" disabled={loading} style={{ textAlign: 'center' }}>
              {loading ? 'Creating...' : 'Create reminder'}
            </button>
            <Link href="/reminders" style={{ padding: '10px 16px', fontSize: 14, color: 'var(--muted)', textDecoration: 'none' }}>
              Cancel
            </Link>
          </div>
        </form>
      </div>
    </main>
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
