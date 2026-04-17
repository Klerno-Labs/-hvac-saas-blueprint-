'use client'

import { useState, useRef } from 'react'
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

type UploadedPhoto = {
  id: string
  fileUrl: string
}

type ExistingAsset = {
  id: string
  fileUrl: string
  fileType: string
}

export function ProofOfWorkForm({
  jobId,
  initialData,
  existingAssets = [],
}: {
  jobId: string
  initialData: InitialData
  existingAssets?: ExistingAsset[]
}) {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [uploadedPhotos, setUploadedPhotos] = useState<UploadedPhoto[]>(
    existingAssets.map((a) => ({ id: a.id, fileUrl: a.fileUrl }))
  )
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files
    if (!files || files.length === 0) return

    setUploadError(null)
    setUploading(true)

    const newPhotos: UploadedPhoto[] = []

    for (let i = 0; i < files.length; i++) {
      const file = files[i]

      if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
        setUploadError(`"${file.name}" is not a supported image type. Use JPG, PNG, or WebP.`)
        continue
      }

      if (file.size > 10 * 1024 * 1024) {
        setUploadError(`"${file.name}" exceeds the 10 MB limit.`)
        continue
      }

      const formData = new FormData()
      formData.append('file', file)
      formData.append('jobId', jobId)

      try {
        const res = await fetch('/api/uploads', {
          method: 'POST',
          body: formData,
        })

        if (!res.ok) {
          const data = await res.json()
          setUploadError(data.error || `Failed to upload "${file.name}"`)
          continue
        }

        const data = await res.json()
        newPhotos.push({ id: data.id, fileUrl: data.fileUrl })
      } catch {
        setUploadError(`Network error uploading "${file.name}"`)
      }
    }

    if (newPhotos.length > 0) {
      setUploadedPhotos((prev) => [...prev, ...newPhotos])
    }

    setUploading(false)

    // Reset file input so the same files can be selected again
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

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

        {/* Photo upload section */}
        <div className="space-y-2">
          <Label htmlFor="photos">Proof-of-work photos</Label>
          <Input
            ref={fileInputRef}
            id="photos"
            type="file"
            accept="image/jpeg,image/png,image/webp"
            multiple
            onChange={handleFileUpload}
            disabled={uploading}
            className="cursor-pointer"
          />
          <p className="text-xs text-muted-foreground">
            JPG, PNG, or WebP. Max 10 MB per file.
          </p>
          {uploading && (
            <p className="text-sm text-muted-foreground">Uploading...</p>
          )}
          {uploadError && (
            <p className="text-sm text-destructive">{uploadError}</p>
          )}
        </div>

        {uploadedPhotos.length > 0 && (
          <div className="space-y-2">
            <Label>Uploaded photos ({uploadedPhotos.length})</Label>
            <div className="grid grid-cols-3 gap-2">
              {uploadedPhotos.map((photo) => (
                <div
                  key={photo.id}
                  className="relative aspect-square rounded-lg overflow-hidden border bg-muted"
                >
                  <img
                    src={photo.fileUrl}
                    alt="Proof of work"
                    className="object-cover w-full h-full"
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        <Button type="submit" disabled={loading || uploading} className="mt-2">
          {loading ? 'Saving...' : 'Record completion'}
        </Button>
      </form>
    </>
  )
}
