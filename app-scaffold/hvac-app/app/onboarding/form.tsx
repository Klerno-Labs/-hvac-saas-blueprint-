'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createOrganization } from './actions'

export function OnboardingForm() {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const formData = new FormData(e.currentTarget)
    const result = await createOrganization(formData)

    if (result.success) {
      router.push('/dashboard')
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
          <span style={{ fontSize: 14, fontWeight: 500 }}>Business name *</span>
          <input
            name="name"
            type="text"
            required
            placeholder="e.g. Smith HVAC Services"
            style={inputStyle}
          />
        </label>
        <label>
          <span style={{ fontSize: 14, fontWeight: 500 }}>Business phone</span>
          <input
            name="phone"
            type="tel"
            placeholder="(555) 555-5555"
            style={inputStyle}
          />
        </label>
        <label>
          <span style={{ fontSize: 14, fontWeight: 500 }}>Business email</span>
          <input
            name="email"
            type="email"
            placeholder="office@smithhvac.com"
            style={inputStyle}
          />
        </label>
        <label>
          <span style={{ fontSize: 14, fontWeight: 500 }}>Timezone</span>
          <select name="timezone" style={inputStyle}>
            <option value="">Select timezone</option>
            <option value="America/New_York">Eastern</option>
            <option value="America/Chicago">Central</option>
            <option value="America/Denver">Mountain</option>
            <option value="America/Los_Angeles">Pacific</option>
            <option value="America/Anchorage">Alaska</option>
            <option value="Pacific/Honolulu">Hawaii</option>
          </select>
        </label>
        <button type="submit" className="button" disabled={loading} style={{ marginTop: 8, textAlign: 'center' }}>
          {loading ? 'Creating...' : 'Create business'}
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
