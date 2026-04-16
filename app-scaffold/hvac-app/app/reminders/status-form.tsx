'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { updateReminderStatus } from './actions'

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
    <div style={{ display: 'flex', gap: 4 }}>
      <button
        onClick={handleComplete}
        disabled={loading}
        className="button"
        style={{ fontSize: 12, padding: '4px 10px', background: '#059669' }}
      >
        Done
      </button>
      <button
        onClick={handleDismiss}
        disabled={loading}
        style={{
          fontSize: 12,
          padding: '4px 10px',
          background: 'none',
          border: '1px solid var(--border)',
          borderRadius: 8,
          cursor: 'pointer',
          color: 'var(--muted)',
        }}
      >
        Dismiss
      </button>
    </div>
  )
}
