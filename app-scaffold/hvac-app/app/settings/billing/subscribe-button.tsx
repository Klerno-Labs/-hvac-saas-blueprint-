'use client'

import { useState } from 'react'
import { subscribe } from './actions'
import { Button } from '@/components/ui/button'

export function SubscribeButton({ planId, userEmail }: { planId: string; userEmail: string }) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubscribe() {
    setLoading(true)
    setError(null)

    const result = await subscribe(planId, userEmail)

    if ('url' in result) {
      window.location.href = result.url
    } else {
      setError(result.error)
      setLoading(false)
    }
  }

  return (
    <div>
      {error && <p className="text-xs text-destructive mb-2">{error}</p>}
      <Button className="w-full" disabled={loading} onClick={handleSubscribe}>
        {loading ? 'Redirecting...' : 'Subscribe'}
      </Button>
    </div>
  )
}
