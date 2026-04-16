'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createReminder } from './actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

const REMINDER_TYPES = [
  { value: 'general', label: 'General' },
  { value: 'follow_up_estimate', label: 'Follow up on estimate' },
  { value: 'follow_up_invoice', label: 'Follow up on invoice' },
  { value: 'call_customer', label: 'Call customer back' },
  { value: 'review_job', label: 'Review job' },
]

export default function NewReminderPage() {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const formData = new FormData(e.currentTarget)
    const result = await createReminder(formData)

    if (result.success) {
      router.push('/reminders')
    } else {
      setError(result.error)
      setLoading(false)
    }
  }

  return (
    <main className="max-w-xl mx-auto px-4 py-8">
      <Card>
        <CardHeader>
          <CardTitle>New reminder</CardTitle>
          <CardDescription>Create a follow-up reminder for your team.</CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="text-sm text-destructive mb-4 p-3 bg-destructive/10 rounded-lg">{error}</div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title *</Label>
              <Input id="title" name="title" required placeholder="e.g. Follow up with Smith on AC estimate" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="reminderType">Type</Label>
              <select name="reminderType" id="reminderType" className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs">
                {REMINDER_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="dueAt">Due date</Label>
              <Input id="dueAt" name="dueAt" type="date" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea id="notes" name="notes" rows={3} placeholder="Additional context..." />
            </div>

            <div className="flex gap-3 pt-2">
              <Button type="submit" disabled={loading}>
                {loading ? 'Creating...' : 'Create reminder'}
              </Button>
              <Button variant="ghost" type="button" onClick={() => router.push('/reminders')}>
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </main>
  )
}
