'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { signup } from './actions'

export default function SignupPage() {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const formData = new FormData(e.currentTarget)
    const result = await signup(formData)

    if (result.success) {
      router.push('/login?registered=true')
    } else {
      setError(result.error)
      setLoading(false)
    }
  }

  return (
    <main>
      <div className="card" style={{ maxWidth: 420, margin: '60px auto' }}>
        <h1>Create your account</h1>
        <p className="muted">Get paid faster on every HVAC job.</p>

        {error && (
          <div style={{ color: '#dc2626', marginBottom: 16, fontSize: 14 }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <label>
            <span style={{ fontSize: 14, fontWeight: 500 }}>Full name</span>
            <input
              name="name"
              type="text"
              required
              autoComplete="name"
              style={inputStyle}
            />
          </label>
          <label>
            <span style={{ fontSize: 14, fontWeight: 500 }}>Email</span>
            <input
              name="email"
              type="email"
              required
              autoComplete="email"
              style={inputStyle}
            />
          </label>
          <label>
            <span style={{ fontSize: 14, fontWeight: 500 }}>Password</span>
            <input
              name="password"
              type="password"
              required
              minLength={8}
              autoComplete="new-password"
              style={inputStyle}
            />
          </label>
          <button type="submit" className="button" disabled={loading} style={{ marginTop: 8, textAlign: 'center' }}>
            {loading ? 'Creating account...' : 'Sign up'}
          </button>
        </form>

        <p style={{ marginTop: 16, fontSize: 14, textAlign: 'center' }} className="muted">
          Already have an account? <Link href="/login">Log in</Link>
        </p>
      </div>
    </main>
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
