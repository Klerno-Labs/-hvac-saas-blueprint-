'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createRecurringJob } from './actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'

const FREQUENCIES = [
  { value: 'monthly', label: 'Monthly' },
  { value: 'quarterly', label: 'Quarterly (every 3 months)' },
  { value: 'biannual', label: 'Biannual (every 6 months)' },
  { value: 'annual', label: 'Annual (every 12 months)' },
]

type CustomerOption = {
  id: string
  firstName: string
  lastName: string | null
  companyName: string | null
}

export function NewRecurringJobForm({ customers }: { customers: CustomerOption[] }) {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const formData = new FormData(e.currentTarget)
    const result = await createRecurringJob(formData)

    if (result.success) {
      router.push('/recurring')
    } else {
      setError(result.error)
      setLoading(false)
    }
  }

  return (
    <>
      {error && (
        <div className="text-sm text-destructive mb-4 p-3 bg-destructive/10 rounded-lg">{error}</div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="customerId">Customer *</Label>
          <select
            name="customerId"
            id="customerId"
            required
            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs"
          >
            <option value="">Select a customer</option>
            {customers.map((c) => (
              <option key={c.id} value={c.id}>
                {c.firstName} {c.lastName || ''}{c.companyName ? ` (${c.companyName})` : ''}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="title">Title *</Label>
          <Input id="title" name="title" required placeholder="e.g. Annual HVAC maintenance" />
        </div>

        <div className="space-y-2">
          <Label htmlFor="frequency">Frequency *</Label>
          <select
            name="frequency"
            id="frequency"
            required
            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs"
          >
            {FREQUENCIES.map((f) => (
              <option key={f.value} value={f.value}>{f.label}</option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="nextDueDate">Start date *</Label>
          <Input id="nextDueDate" name="nextDueDate" type="date" required />
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">Description</Label>
          <Textarea id="description" name="description" rows={3} placeholder="Scope of recurring work..." />
        </div>

        <div className="flex gap-3 pt-2">
          <Button type="submit" disabled={loading}>
            {loading ? 'Creating...' : 'Create recurring job'}
          </Button>
          <Button variant="ghost" type="button" onClick={() => router.push('/recurring')}>
            Cancel
          </Button>
        </div>
      </form>
    </>
  )
}
