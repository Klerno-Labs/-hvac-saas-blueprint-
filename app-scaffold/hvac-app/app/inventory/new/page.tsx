'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createInventoryItem } from './actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'

export default function NewInventoryItemPage() {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const formData = new FormData(e.currentTarget)
    const result = await createInventoryItem(formData)

    if (result.success) {
      router.push(`/inventory/${result.itemId}`)
    } else {
      setError(result.error)
      setLoading(false)
    }
  }

  return (
    <main className="max-w-xl mx-auto px-4 py-8">
      <Card>
        <CardHeader>
          <CardTitle>Add inventory item</CardTitle>
          <CardDescription>Add a new part or material to your inventory.</CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="text-sm text-destructive mb-4 p-3 bg-destructive/10 rounded-lg">{error}</div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name *</Label>
              <Input id="name" name="name" required />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="sku">SKU</Label>
                <Input id="sku" name="sku" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Input id="category" name="category" placeholder="e.g. Filters, Compressors" />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea id="description" name="description" rows={3} />
            </div>

            <Separator />

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="unitCost">Unit cost ($)</Label>
                <Input id="unitCost" name="unitCost" type="number" step="0.01" min="0" defaultValue="0" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="sellPrice">Sell price ($)</Label>
                <Input id="sellPrice" name="sellPrice" type="number" step="0.01" min="0" defaultValue="0" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="quantityOnHand">Quantity on hand</Label>
                <Input id="quantityOnHand" name="quantityOnHand" type="number" min="0" defaultValue="0" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="reorderPoint">Reorder point</Label>
                <Input id="reorderPoint" name="reorderPoint" type="number" min="0" defaultValue="0" />
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <Button type="submit" disabled={loading}>
                {loading ? 'Saving...' : 'Add item'}
              </Button>
              <Button variant="ghost" type="button" onClick={() => router.push('/inventory')}>
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </main>
  )
}
