'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { deleteCustomer } from './edit-actions'
import { Button } from '@/components/ui/button'

export function DeleteCustomerButton({ customerId }: { customerId: string }) {
  const router = useRouter()
  const [confirming, setConfirming] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleDelete() {
    setLoading(true)
    const result = await deleteCustomer(customerId)
    if (result.success) {
      router.push('/customers')
    } else {
      setError(result.error)
      setLoading(false)
      setConfirming(false)
    }
  }

  if (error) {
    return <p className="text-sm text-destructive">{error}</p>
  }

  if (!confirming) {
    return (
      <Button variant="destructive" size="sm" onClick={() => setConfirming(true)}>
        Delete customer
      </Button>
    )
  }

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-muted-foreground">Are you sure?</span>
      <Button variant="destructive" size="sm" onClick={handleDelete} disabled={loading}>
        {loading ? 'Deleting...' : 'Yes, delete'}
      </Button>
      <Button variant="ghost" size="sm" onClick={() => setConfirming(false)}>
        Cancel
      </Button>
    </div>
  )
}
