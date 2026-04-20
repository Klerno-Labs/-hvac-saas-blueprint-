'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createEquipment } from './actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { EQUIPMENT_TYPES, EQUIPMENT_TYPE_LABELS } from '@/lib/validations/equipment'

export function NewEquipmentForm({ customerId }: { customerId: string }) {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const formData = new FormData(e.currentTarget)
    const result = await createEquipment(formData)

    if (result.success) {
      router.push(`/customers/${customerId}`)
    } else {
      setError(result.error)
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <input type="hidden" name="customerId" value={customerId} />

      {error && <div className="text-sm text-destructive p-3 bg-destructive/10 rounded-lg">{error}</div>}

      <div className="space-y-2">
        <Label htmlFor="type">Equipment type *</Label>
        <select
          id="type"
          name="type"
          required
          defaultValue=""
          className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs"
        >
          <option value="" disabled>Choose a type</option>
          {EQUIPMENT_TYPES.map((t) => (
            <option key={t} value={t}>{EQUIPMENT_TYPE_LABELS[t]}</option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label htmlFor="make">Make</Label>
          <Input id="make" name="make" placeholder="Trane, Carrier, Lennox..." />
        </div>
        <div className="space-y-2">
          <Label htmlFor="model">Model</Label>
          <Input id="model" name="model" placeholder="XR16, Infinity..." />
        </div>
        <div className="space-y-2">
          <Label htmlFor="serial">Serial #</Label>
          <Input id="serial" name="serial" />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="locationOnProperty">Location on property</Label>
          <Input id="locationOnProperty" name="locationOnProperty" placeholder="Attic, garage, side yard..." />
        </div>
        <div className="space-y-2">
          <Label htmlFor="installDate">Install date</Label>
          <Input id="installDate" name="installDate" type="date" />
        </div>
      </div>

      <div className="flex items-center gap-2">
        <input type="checkbox" id="installedByUs" name="installedByUs" className="h-4 w-4" />
        <Label htmlFor="installedByUs" className="cursor-pointer">We installed this unit</Label>
      </div>

      <div className="space-y-2">
        <Label htmlFor="installerName">Installer (if not us)</Label>
        <Input id="installerName" name="installerName" />
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="space-y-2">
          <Label htmlFor="tonnage">Tonnage</Label>
          <Input id="tonnage" name="tonnage" type="number" step="0.5" placeholder="3" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="seer">SEER</Label>
          <Input id="seer" name="seer" type="number" step="0.1" placeholder="16" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="btu">BTU</Label>
          <Input id="btu" name="btu" type="number" placeholder="36000" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="refrigerantType">Refrigerant</Label>
          <Input id="refrigerantType" name="refrigerantType" placeholder="R-410A" />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label htmlFor="warrantyStartDate">Warranty start</Label>
          <Input id="warrantyStartDate" name="warrantyStartDate" type="date" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="partsWarrantyMonths">Parts (months)</Label>
          <Input id="partsWarrantyMonths" name="partsWarrantyMonths" type="number" placeholder="120" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="laborWarrantyMonths">Labor (months)</Label>
          <Input id="laborWarrantyMonths" name="laborWarrantyMonths" type="number" placeholder="12" />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">Notes</Label>
        <Textarea id="notes" name="notes" rows={3} placeholder="Any details about this unit..." />
      </div>

      <div className="flex gap-3 pt-2">
        <Button type="submit" disabled={loading}>{loading ? 'Saving...' : 'Add equipment'}</Button>
        <Button variant="ghost" type="button" onClick={() => router.push(`/customers/${customerId}`)}>Cancel</Button>
      </div>
    </form>
  )
}
