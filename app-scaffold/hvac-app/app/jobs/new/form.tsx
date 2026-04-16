'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createJob } from './actions'

type CustomerOption = {
  id: string
  firstName: string
  lastName: string | null
  companyName: string | null
}

export function NewJobForm({
  customers,
  preselectedCustomerId,
}: {
  customers: CustomerOption[]
  preselectedCustomerId?: string
}) {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const formData = new FormData(e.currentTarget)
    const result = await createJob(formData)

    if (result.success) {
      router.push(`/jobs/${result.jobId}`)
    } else {
      setError(result.error)
      setLoading(false)
    }
  }

  return (
    <>
      {error && (
        <div style={{ color: '#dc2626', marginBottom: 16, fontSize: 14 }}>
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <label>
          <span style={labelStyle}>Customer *</span>
          <select name="customerId" required defaultValue={preselectedCustomerId || ''} style={inputStyle}>
            <option value="">Select a customer</option>
            {customers.map((c) => (
              <option key={c.id} value={c.id}>
                {c.firstName} {c.lastName || ''}{c.companyName ? ` — ${c.companyName}` : ''}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span style={labelStyle}>Job title *</span>
          <input name="title" type="text" required placeholder="e.g. AC unit repair" style={inputStyle} />
        </label>
        <label>
          <span style={labelStyle}>Scheduled date</span>
          <input name="scheduledFor" type="date" style={inputStyle} />
        </label>
        <label>
          <span style={labelStyle}>Notes</span>
          <textarea name="notes" rows={3} style={{ ...inputStyle, resize: 'vertical' }} />
        </label>

        <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
          <button type="submit" className="button" disabled={loading} style={{ textAlign: 'center' }}>
            {loading ? 'Creating...' : 'Create job'}
          </button>
          <Link href="/jobs" style={{ padding: '10px 16px', fontSize: 14, color: 'var(--muted)', textDecoration: 'none' }}>
            Cancel
          </Link>
        </div>
      </form>
    </>
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
