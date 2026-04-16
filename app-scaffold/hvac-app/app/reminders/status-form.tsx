'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { updateReminderStatus } from './actions'
import { Button } from '@/components/ui/button'

export function ReminderStatusForm({ reminderId }: { reminderId: string }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function handleComplete() {
    setLoading(true)
    await updateReminderStatus(reminderId, 'completed')
    router.refresh()
    setLoading(false)
  }

  async function handleDismiss() {
    setLoading(true)
    await updateReminderStatus(reminderId, 'dismissed')
    router.refresh()
    setLoading(false)
  }

  return (
    <div className="flex gap-1">
      <Button
        onClick={handleComplete}
        disabled={loading}
        size="xs"
        className="bg-emerald-600 hover:bg-emerald-700"
      >
        Done
      </Button>
      <Button
        onClick={handleDismiss}
        disabled={loading}
        size="xs"
        variant="outline"
        className="text-muted-foreground"
      >
        Dismiss
      </Button>
    </div>
  )
}
