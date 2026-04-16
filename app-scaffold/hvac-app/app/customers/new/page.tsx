'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createCustomer } from './actions'

export default function NewCustomerPage() {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const formData = new FormData(e.currentTarget)
    const result = await createCustomer(formData)

    if (result.success) {
      router.push(`/customers/${result.customerId}`)
    } else {
      setError(result.error)
      setLoading(false)
    }
  }

  return (
    <main>
      <div className="card" style={{ maxWidth: 540, margin: '0 auto' }}>
        <h1>Add customer</h1>
        <p className="muted">Add a new customer to your organization.</p>

        {error && (
          <div style={{ color: '#dc2626', marginBottom: 16, fontSize: 14 }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <label>
              <span style={labelStyle}>First name *</span>
              <input name="firstName" type="text" required style={inputStyle} />
            </label>
            <label>
              <span style={labelStyle}>Last name</span>
              <input name="lastName" type="text" style={inputStyle} />
            </label>
          </div>
          <label>
            <span style={labelStyle}>Company name</span>
            <input name="companyName" type="text" style={inputStyle} />
          </label>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <label>
              <span style={labelStyle}>Phone *</span>
              <input name="phone" type="tel" required placeholder="(555) 555-5555" style={inputStyle} />
            </label>
            <label>
              <span style={labelStyle}>Email</span>
              <input name="email" type="email" style={inputStyle} />
            </label>
          </div>

          <hr style={{ border: 'none', borderTop: '1px solid var(--border)', margin: '8px 0' }} />

          <label>
            <span style={labelStyle}>Address line 1</span>
            <input name="addressLine1" type="text" style={inputStyle} />
          </label>
          <label>
            <span style={labelStyle}>Address line 2</span>
            <input name="addressLine2" type="text" style={inputStyle} />
          </label>
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: 12 }}>
            <label>
              <span style={labelStyle}>City</span>
              <input name="city" type="text" style={inputStyle} />
            </label>
            <label>
              <span style={labelStyle}>State</span>
              <input name="state" type="text" maxLength={2} placeholder="TX" style={inputStyle} />
            </label>
            <label>
              <span style={labelStyle}>ZIP</span>
              <input name="postalCode" type="text" style={inputStyle} />
            </label>
          </div>

          <hr style={{ border: 'none', borderTop: '1px solid var(--border)', margin: '8px 0' }} />

          <label>
            <span style={labelStyle}>Notes</span>
            <textarea name="notes" rows={3} style={{ ...inputStyle, resize: 'vertical' }} />
          </label>

          <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
            <button type="submit" className="button" disabled={loading} style={{ textAlign: 'center' }}>
              {loading ? 'Saving...' : 'Add customer'}
            </button>
            <Link href="/customers" style={{ padding: '10px 16px', fontSize: 14, color: 'var(--muted)', textDecoration: 'none' }}>
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
