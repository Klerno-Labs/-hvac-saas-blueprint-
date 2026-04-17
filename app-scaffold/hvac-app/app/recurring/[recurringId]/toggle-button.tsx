'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { toggleRecurringJob } from './actions'

export function ToggleActiveButton({
  recurringId,
  isActive,
}: {
  recurringId: string
  isActive: boolean
}) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function handleToggle() {
    setLoading(true)
    const result = await toggleRecurringJob(recurringId)
    if (result.success) {
      router.refresh()
    }
    setLoading(false)
  }

  return (
    <Button
      variant={isActive ? 'secondary' : 'default'}
      onClick={handleToggle}
      disabled={loading}
    >
      {loading
        ? 'Updating...'
        : isActive
          ? 'Pause'
          : 'Activate'}
    </Button>
  )
}
