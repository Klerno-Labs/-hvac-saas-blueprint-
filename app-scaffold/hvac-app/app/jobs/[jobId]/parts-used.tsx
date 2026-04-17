'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { recordPartUsage } from './inventory-actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'

interface InventoryItemOption {
  id: string
  name: string
  sku: string | null
  quantityOnHand: number
}

interface UsageRecord {
  id: string
  quantity: number
  notes: string | null
  createdAt: Date
  inventoryItem: {
    id: string
    name: string
    sku: string | null
  }
}

export function PartsUsedSection({
  jobId,
  usages,
  inventoryItems,
}: {
  jobId: string
  usages: UsageRecord[]
  inventoryItems: InventoryItemOption[]
}) {
  const router = useRouter()
  const [showForm, setShowForm] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const formData = new FormData(e.currentTarget)
    const result = await recordPartUsage(jobId, formData)

    if (result.success) {
      setShowForm(false)
      router.refresh()
    } else {
      setError(result.error)
    }
    setLoading(false)
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-3">
        <h2 className="text-lg font-semibold">Parts used</h2>
        <Button size="sm" onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Cancel' : 'Add part'}
        </Button>
      </div>

      {showForm && (
        <Card className="mb-4">
          <CardContent className="pt-4">
            {error && (
              <div className="text-sm text-destructive mb-4 p-3 bg-destructive/10 rounded-lg">
                {error}
              </div>
            )}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="inventoryItemId">Part *</Label>
                <select
                  id="inventoryItemId"
                  name="inventoryItemId"
                  required
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                >
                  <option value="">Select a part...</option>
                  {inventoryItems.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name}
                      {item.sku ? ` (${item.sku})` : ''} — {item.quantityOnHand} in stock
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="quantity">Quantity *</Label>
                  <Input
                    id="quantity"
                    name="quantity"
                    type="number"
                    min="1"
                    defaultValue="1"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="notes">Notes</Label>
                  <Input id="notes" name="notes" placeholder="Optional" />
                </div>
              </div>
              <Button type="submit" disabled={loading} size="sm">
                {loading ? 'Recording...' : 'Record usage'}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      {usages.length === 0 && !showForm ? (
        <Card className="mb-4">
          <CardContent className="py-6 text-center">
            <p className="text-sm text-muted-foreground">No parts recorded for this job.</p>
          </CardContent>
        </Card>
      ) : (
        usages.length > 0 && (
          <div className="space-y-2 mb-4">
            {usages.map((usage) => (
              <Card key={usage.id}>
                <CardContent className="py-3">
                  <div className="flex justify-between items-center">
                    <div>
                      <Link
                        href={`/inventory/${usage.inventoryItem.id}` as never}
                        className="text-primary hover:underline font-medium text-sm"
                      >
                        {usage.inventoryItem.name}
                      </Link>
                      {usage.inventoryItem.sku && (
                        <span className="text-xs text-muted-foreground ml-2">
                          SKU: {usage.inventoryItem.sku}
                        </span>
                      )}
                      {usage.notes && (
                        <p className="text-xs text-muted-foreground mt-1">{usage.notes}</p>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">Qty: {usage.quantity}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(usage.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )
      )}
    </div>
  )
}
