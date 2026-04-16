'use client'

import { useState } from 'react'
import { createPortalCheckoutSession } from './payment-action'

export function PortalPayButton({ token, invoiceId }: { token: string; invoiceId: string }) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handlePay() {
    setError(null)
    setLoading(true)

    const result = await createPortalCheckoutSession(token, invoiceId)

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
        style={{ textAlign: 'center', background: '#059669', fontSize: 16, padding: '12px 24px' }}
      >
        {loading ? 'Redirecting to payment...' : 'Pay now'}
      </button>
    </div>
  )
}
