'use client'

import { useState } from 'react'
import { createCheckoutSession } from './payment-actions'
import { Button } from '@/components/ui/button'

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
        <div className="text-sm text-destructive mb-4 p-3 bg-destructive/10 rounded-lg">{error}</div>
      )}
      <Button
        onClick={handlePay}
        disabled={loading}
        className="bg-emerald-600 hover:bg-emerald-700 text-white"
      >
        {loading ? 'Creating payment link...' : 'Create payment link'}
      </Button>
      <p className="text-xs text-muted-foreground mt-2">
        Opens Stripe Checkout. Payment is confirmed via webhook.
      </p>
    </div>
  )
}
