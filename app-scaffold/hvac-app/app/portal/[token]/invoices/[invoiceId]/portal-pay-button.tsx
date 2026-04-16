'use client'

import { useState } from 'react'
import { createPortalCheckoutSession } from './payment-action'
import { Button } from '@/components/ui/button'

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
        <div className="text-destructive mb-3 text-sm">{error}</div>
      )}
      <Button
        onClick={handlePay}
        disabled={loading}
        size="lg"
        className="bg-emerald-600 hover:bg-emerald-700 text-base px-6 py-3 h-auto"
      >
        {loading ? 'Redirecting to payment...' : 'Pay now'}
      </Button>
    </div>
  )
}
