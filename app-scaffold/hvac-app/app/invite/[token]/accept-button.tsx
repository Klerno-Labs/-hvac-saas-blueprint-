'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { acceptInvite } from './actions'
import { Button } from '@/components/ui/button'

export function AcceptInviteButton({ token }: { token: string }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleAccept() {
    setLoading(true)
    setError(null)
    const result = await acceptInvite(token)
    if (result.success) {
      router.push('/dashboard')
    } else {
      setError(result.error)
      setLoading(false)
    }
  }

  return (
    <div>
      {error && <div className="text-sm text-destructive mb-4 p-3 bg-destructive/10 rounded-lg">{error}</div>}
      <Button onClick={handleAccept} disabled={loading} className="w-full">
        {loading ? 'Joining...' : 'Accept invitation'}
      </Button>
    </div>
  )
}
