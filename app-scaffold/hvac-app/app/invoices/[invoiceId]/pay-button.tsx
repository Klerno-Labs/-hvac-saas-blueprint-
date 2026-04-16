'use client'

import { useState } from 'react'
import { createCheckoutSession } from './payment-actions'

export function PayButton({ invoiceId }: { invoiceId: string }) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handlePay() {
    setError(null)
    setLoading(true)

    const result = await createCheckoutSession(invoiceId)

    if (result.success) {
      window.location.href = result.checkoutUrl
    } else {
      setError(result.error)
      setLoading(false)
    }
  }

  return (
    <div>
      {error && (
        <div style={{ color: '#dc2626', marginBottom: 12, fontSize: 14 }}>{error}</div>
      )}
      <button
        onClick={handlePay}
        disabled={loading}
        className="button"
        style={{ textAlign: 'center', background: '#059669' }}
      >
        {loading ? 'Creating payment link...' : 'Create payment link'}
      </button>
      <p className="muted" style={{ fontSize: 12, marginTop: 8 }}>
        Opens Stripe Checkout. Payment is confirmed via webhook.
      </p>
    </div>
  )
}
