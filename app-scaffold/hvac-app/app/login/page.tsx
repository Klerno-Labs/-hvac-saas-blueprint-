'use client'

import { Suspense, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { signIn } from 'next-auth/react'
import Link from 'next/link'

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const registered = searchParams.get('registered') === 'true'
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleCredentials(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const formData = new FormData(e.currentTarget)
    const result = await signIn('credentials', {
      email: formData.get('email') as string,
      password: formData.get('password') as string,
      redirect: false,
    })

    if (result?.error) {
      setError('Invalid email or password')
      setLoading(false)
    } else {
      router.push('/dashboard')
    }
  }

  async function handleGitHub() {
    await signIn('github', { callbackUrl: '/dashboard' })
  }

  return (
    <div className="card" style={{ maxWidth: 420, margin: '60px auto' }}>
      <h1>Log in</h1>
      <p className="muted">Welcome back.</p>

      {registered && (
        <div style={{ color: 'var(--primary)', marginBottom: 16, fontSize: 14 }}>
          Account created. Please log in.
        </div>
      )}

      {error && (
        <div style={{ color: '#dc2626', marginBottom: 16, fontSize: 14 }}>
          {error}
        </div>
      )}

      <form onSubmit={handleCredentials} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
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
            autoComplete="current-password"
            style={inputStyle}
          />
        </label>
        <button type="submit" className="button" disabled={loading} style={{ marginTop: 8, textAlign: 'center' }}>
          {loading ? 'Logging in...' : 'Log in'}
        </button>
      </form>

      <div style={{ margin: '20px 0', textAlign: 'center', position: 'relative' }}>
        <span className="muted" style={{ fontSize: 12, background: 'var(--surface)', padding: '0 8px', position: 'relative', zIndex: 1 }}>or</span>
        <hr style={{ position: 'absolute', top: '50%', left: 0, right: 0, border: 'none', borderTop: '1px solid var(--border)', margin: 0 }} />
      </div>

      <button
        onClick={handleGitHub}
        className="button"
        style={{ width: '100%', textAlign: 'center', background: '#24292e' }}
      >
        Continue with GitHub
      </button>

      <p style={{ marginTop: 16, fontSize: 14, textAlign: 'center' }} className="muted">
        Don&apos;t have an account? <Link href="/signup">Sign up</Link>
      </p>
    </div>
  )
}

export default function LoginPage() {
  return (
    <main>
      <Suspense fallback={<div className="card" style={{ maxWidth: 420, margin: '60px auto' }}><p>Loading...</p></div>}>
        <LoginForm />
      </Suspense>
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
