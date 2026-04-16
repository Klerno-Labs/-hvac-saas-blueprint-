'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { recordProofOfWork } from './actions'

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
        <div style={{ color: '#dc2626', marginBottom: 16, fontSize: 14 }}>{error}</div>
      )}

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 16 }}>
        <label>
          <span style={labelStyle}>Summary of work performed *</span>
          <textarea
            name="workSummary"
            required
            rows={4}
            defaultValue={initialData.workSummary}
            placeholder="Describe the work completed on this job..."
            style={{ ...inputStyle, resize: 'vertical' }}
          />
        </label>
        <label>
          <span style={labelStyle}>Materials used</span>
          <textarea
            name="materialsUsed"
            rows={2}
            defaultValue={initialData.materialsUsed}
            placeholder="List materials, parts, or supplies used..."
            style={{ ...inputStyle, resize: 'vertical' }}
          />
        </label>
        <label>
          <span style={labelStyle}>Technician name</span>
          <input
            name="technicianName"
            type="text"
            defaultValue={initialData.technicianName}
            style={inputStyle}
          />
        </label>
        <label>
          <span style={labelStyle}>Completion notes</span>
          <textarea
            name="completionNotes"
            rows={2}
            defaultValue={initialData.completionNotes}
            placeholder="Any internal notes about job completion..."
            style={{ ...inputStyle, resize: 'vertical' }}
          />
        </label>

        <button type="submit" className="button" disabled={loading} style={{ marginTop: 8, textAlign: 'center' }}>
          {loading ? 'Saving...' : 'Record completion'}
        </button>
      </form>
    </>
  )
}

const labelStyle: React.CSSProperties = { fontSize: 14, fontWeight: 500 }

const inputStyle: React.CSSProperties = {
  display: 'block',
  width: '100%',
  padding: '8px 12px',
  marginTop: 4,
  border: '1px solid var(--border)',
  borderRadius: 8,
  fontSize: 14,
}
