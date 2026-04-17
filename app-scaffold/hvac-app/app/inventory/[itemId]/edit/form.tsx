'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { updateInventoryItem } from './actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'

interface InventoryItemData {
  id: string
  name: string
  sku: string | null
  description: string | null
  unitCostCents: number
  sellPriceCents: number
  quantityOnHand: number
  reorderPoint: number
  category: string | null
}

export function EditInventoryForm({ item }: { item: InventoryItemData }) {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const formData = new FormData(e.currentTarget)
    const result = await updateInventoryItem(item.id, formData)

    if (result.success) {
      router.push(`/inventory/${item.id}`)
    } else {
      setError(result.error)
      setLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Edit inventory item</CardTitle>
        <CardDescription>Update part details and stock levels.</CardDescription>
      </CardHeader>
      <CardContent>
        {error && (
          <div className="text-sm text-destructive mb-4 p-3 bg-destructive/10 rounded-lg">{error}</div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name *</Label>
            <Input id="name" name="name" required defaultValue={item.name} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="sku">SKU</Label>
              <Input id="sku" name="sku" defaultValue={item.sku || ''} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Input id="category" name="category" defaultValue={item.category || ''} />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea id="description" name="description" rows={3} defaultValue={item.description || ''} />
          </div>

          <Separator />

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="unitCost">Unit cost ($)</Label>
              <Input
                id="unitCost"
                name="unitCost"
                type="number"
                step="0.01"
                min="0"
                defaultValue={(item.unitCostCents / 100).toFixed(2)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="sellPrice">Sell price ($)</Label>
              <Input
                id="sellPrice"
                name="sellPrice"
                type="number"
                step="0.01"
                min="0"
                defaultValue={(item.sellPriceCents / 100).toFixed(2)}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="quantityOnHand">Quantity on hand</Label>
              <Input
                id="quantityOnHand"
                name="quantityOnHand"
                type="number"
                min="0"
                defaultValue={item.quantityOnHand}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="reorderPoint">Reorder point</Label>
              <Input
                id="reorderPoint"
                name="reorderPoint"
                type="number"
                min="0"
                defaultValue={item.reorderPoint}
              />
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <Button type="submit" disabled={loading}>
              {loading ? 'Saving...' : 'Save changes'}
            </Button>
            <Button variant="ghost" type="button" onClick={() => router.push(`/inventory/${item.id}`)}>
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
