'use client'

import { useState } from 'react'
import { startStripeOnboarding, refreshStripeStatus } from './stripe/actions'

export function StripeConnectSection({
  accountId,
  chargesEnabled,
  payoutsEnabled,
}: {
  accountId: string | null
  chargesEnabled: boolean
  payoutsEnabled: boolean
}) {
  const [loading, setLoading] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [localCharges, setLocalCharges] = useState(chargesEnabled)
  const [localPayouts, setLocalPayouts] = useState(payoutsEnabled)

  async function handleConnect() {
    setError(null)
    setLoading(true)

    const result = await startStripeOnboarding()

    if (result.success) {
      window.location.href = result.url
    } else {
      setError(result.error)
      setLoading(false)
    }
  }

  async function handleRefresh() {
    setError(null)
    setRefreshing(true)

    const result = await refreshStripeStatus()

    if (result.success) {
      setLocalCharges(result.chargesEnabled)
      setLocalPayouts(result.payoutsEnabled)
    } else {
      setError(result.error)
    }
    setRefreshing(false)
  }

  const isConnected = accountId && localCharges

  return (
    <div className="card">
      <h2>Stripe Payments</h2>
      <p className="muted" style={{ marginBottom: 16 }}>
        Connect your Stripe account to collect payments from customers.
      </p>

      {error && (
        <div style={{ color: '#dc2626', marginBottom: 16, fontSize: 14 }}>{error}</div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
        <div>
          <p style={{ fontSize: 13 }} className="muted">Connection status</p>
          <p style={{ fontWeight: 600, color: isConnected ? '#059669' : '#d97706' }}>
            {isConnected ? 'Connected' : accountId ? 'Onboarding incomplete' : 'Not connected'}
          </p>
        </div>
        <div>
          <p style={{ fontSize: 13 }} className="muted">Charges enabled</p>
          <p style={{ fontWeight: 600, color: localCharges ? '#059669' : '#6b7280' }}>
            {localCharges ? 'Yes' : 'No'}
          </p>
        </div>
        <div>
          <p style={{ fontSize: 13 }} className="muted">Payouts enabled</p>
          <p style={{ fontWeight: 600, color: localPayouts ? '#059669' : '#6b7280' }}>
            {localPayouts ? 'Yes' : 'No'}
          </p>
        </div>
        {accountId && (
          <div>
            <p style={{ fontSize: 13 }} className="muted">Account ID</p>
            <p style={{ fontSize: 13, fontFamily: 'monospace' }}>{accountId}</p>
          </div>
        )}
      </div>

      <div style={{ display: 'flex', gap: 12 }}>
        {!isConnected && (
          <button
            onClick={handleConnect}
            disabled={loading}
            className="button"
            style={{ textAlign: 'center' }}
          >
            {loading ? 'Redirecting...' : accountId ? 'Continue onboarding' : 'Connect Stripe'}
          </button>
        )}
        {accountId && (
          <button
            onClick={handleRefresh}
            disabled={refreshing}
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
            {refreshing ? 'Checking...' : 'Refresh status'}
          </button>
        )}
      </div>
    </div>
  )
}
