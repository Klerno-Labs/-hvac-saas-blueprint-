'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { recordProofOfWork } from './actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'

type InitialData = {
  workSummary: string
  materialsUsed: string
  completionNotes: string
  technicianName: string
}

export function ProofOfWorkForm({ jobId, initialData }: { jobId: string; initialData: InitialData }) {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const formData = new FormData(e.currentTarget)
    const result = await recordProofOfWork(jobId, formData)

    if (result.success) {
      router.push(`/jobs/${jobId}`)
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
          <Label htmlFor="workSummary">Summary of work performed *</Label>
          <Textarea
            id="workSummary"
            name="workSummary"
            required
            rows={4}
            defaultValue={initialData.workSummary}
            placeholder="Describe the work completed on this job..."
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="materialsUsed">Materials used</Label>
          <Textarea
            id="materialsUsed"
            name="materialsUsed"
            rows={2}
            defaultValue={initialData.materialsUsed}
            placeholder="List materials, parts, or supplies used..."
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="technicianName">Technician name</Label>
          <Input
            id="technicianName"
            name="technicianName"
            type="text"
            defaultValue={initialData.technicianName}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="completionNotes">Completion notes</Label>
          <Textarea
            id="completionNotes"
            name="completionNotes"
            rows={2}
            defaultValue={initialData.completionNotes}
            placeholder="Any internal notes about job completion..."
          />
        </div>

        <Button type="submit" disabled={loading} className="mt-2">
          {loading ? 'Saving...' : 'Record completion'}
        </Button>
      </form>
    </>
  )
}
