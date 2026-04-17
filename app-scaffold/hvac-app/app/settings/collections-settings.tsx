'use client'

import { useState } from 'react'
import { updateCollectionsPolicy } from './collections/actions'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export function CollectionsSettingsSection({
  initialEnabled,
  initialOverdue1Days,
  initialOverdue2Days,
  initialFinalDays,
  initialSmsEnabled,
  twilioConfigured,
}: {
  initialEnabled: boolean
  initialOverdue1Days: number
  initialOverdue2Days: number
  initialFinalDays: number
  initialSmsEnabled: boolean
  twilioConfigured: boolean
}) {
  const [enabled, setEnabled] = useState(initialEnabled)
  const [overdue1Days, setOverdue1Days] = useState(initialOverdue1Days)
  const [overdue2Days, setOverdue2Days] = useState(initialOverdue2Days)
  const [finalDays, setFinalDays] = useState(initialFinalDays)
  const [smsEnabled, setSmsEnabled] = useState(initialSmsEnabled)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)

  async function handleSave() {
    setError(null)
    setSaved(false)
    setLoading(true)

    const result = await updateCollectionsPolicy({
      collectionsEnabled: enabled,
      collectionsOverdue1Days: overdue1Days,
      collectionsOverdue2Days: overdue2Days,
      collectionsFinalDays: finalDays,
      smsEnabled,
    })

    if (result.success) {
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } else {
      setError(result.error)
    }
    setLoading(false)
  }

  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle>Collections Automation</CardTitle>
        <CardDescription>
          Automatically track overdue invoices and create follow-up reminders.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <div className="text-destructive text-sm">{error}</div>
        )}
        {saved && (
          <div className="text-emerald-600 text-sm">Settings saved.</div>
        )}

        <Label className="cursor-pointer">
          <input
            type="checkbox"
            checked={enabled}
            onChange={(e) => setEnabled(e.target.checked)}
            className="size-4.5"
          />
          <span className="text-sm font-medium">Enable collections automation</span>
        </Label>

        {enabled && (
          <div className="flex flex-col gap-3 rounded-lg bg-muted/50 p-4">
            <p className="text-xs font-semibold">Reminder stages (days after due date)</p>

            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1">
                <Label className="text-sm font-medium">First reminder</Label>
                <Input
                  type="number"
                  min={1}
                  max={90}
                  value={overdue1Days}
                  onChange={(e) => setOverdue1Days(parseInt(e.target.value) || 7)}
                />
                <span className="text-[11px] text-muted-foreground">days overdue</span>
              </div>
              <div className="space-y-1">
                <Label className="text-sm font-medium">Second reminder</Label>
                <Input
                  type="number"
                  min={2}
                  max={120}
                  value={overdue2Days}
                  onChange={(e) => setOverdue2Days(parseInt(e.target.value) || 14)}
                />
                <span className="text-[11px] text-muted-foreground">days overdue</span>
              </div>
              <div className="space-y-1">
                <Label className="text-sm font-medium">Final notice</Label>
                <Input
                  type="number"
                  min={3}
                  max={180}
                  value={finalDays}
                  onChange={(e) => setFinalDays(parseInt(e.target.value) || 30)}
                />
                <span className="text-[11px] text-muted-foreground">days overdue</span>
              </div>
            </div>

            {twilioConfigured && (
              <Label className="cursor-pointer mt-2">
                <input
                  type="checkbox"
                  checked={smsEnabled}
                  onChange={(e) => setSmsEnabled(e.target.checked)}
                  className="size-4.5"
                />
                <span className="text-sm font-medium">
                  Send SMS reminders to customers with a phone number
                </span>
              </Label>
            )}
          </div>
        )}

        <Button
          onClick={handleSave}
          disabled={loading}
        >
          {loading ? 'Saving...' : 'Save settings'}
        </Button>
      </CardContent>
    </Card>
  )
}
