'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toggleCollectionsPause, dismissCollectionAttempt } from './collections-actions'

type Attempt = {
  id: string
  stage: string
  status: string
  notes: string | null
  createdAt: Date
}

export function CollectionsSection({
  invoiceId,
  collectionsPaused,
  attempts,
}: {
  invoiceId: string
  collectionsPaused: boolean
  attempts: Attempt[]
}) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleTogglePause() {
    setError(null)
    setLoading(true)

    const result = await toggleCollectionsPause(invoiceId, !collectionsPaused)
    if (result.success) {
      router.refresh()
    } else {
      setError(result.error)
    }
    setLoading(false)
  }

  async function handleDismiss(attemptId: string) {
    const result = await dismissCollectionAttempt(attemptId)
    if (result.success) {
      router.refresh()
    }
  }

  return (
    <div>
      {error && (
        <div style={{ color: '#dc2626', marginBottom: 12, fontSize: 14 }}>{error}</div>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <div>
          <span style={{ fontSize: 13 }} className="muted">Collections status: </span>
          <span style={{
            fontSize: 12,
            padding: '2px 8px',
            borderRadius: 4,
            background: collectionsPaused ? '#fef3c7' : '#dcfce7',
            color: collectionsPaused ? '#92400e' : '#166534',
          }}>
            {collectionsPaused ? 'Paused' : 'Active'}
          </span>
        </div>
        <button
          onClick={handleTogglePause}
          disabled={loading}
          style={{
            fontSize: 13,
            padding: '6px 12px',
            background: 'none',
            border: '1px solid var(--border)',
            borderRadius: 8,
            cursor: 'pointer',
            color: 'var(--text)',
          }}
        >
          {loading ? '...' : collectionsPaused ? 'Resume collections' : 'Pause collections'}
        </button>
      </div>

      {attempts.length === 0 ? (
        <p className="muted" style={{ fontSize: 13 }}>No collection attempts yet.</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {attempts.map((a) => (
            <div key={a.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0', borderBottom: '1px solid var(--border)' }}>
              <div>
                <span style={{ fontSize: 13, fontWeight: 600 }}>{a.stage.replace(/_/g, ' ')}</span>
                <span style={{
                  marginLeft: 8,
                  fontSize: 11,
                  padding: '1px 6px',
                  borderRadius: 4,
                  background: attemptStatusColor(a.status).bg,
                  color: attemptStatusColor(a.status).text,
                }}>
                  {a.status}
                </span>
                {a.notes && <span className="muted" style={{ marginLeft: 8, fontSize: 12 }}>{a.notes}</span>}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span className="muted" style={{ fontSize: 12 }}>
                  {new Date(a.createdAt).toLocaleDateString()}
                </span>
                {a.status === 'created' && (
                  <button
                    onClick={() => handleDismiss(a.id)}
                    style={{ fontSize: 11, padding: '2px 8px', background: 'none', border: '1px solid var(--border)', borderRadius: 4, cursor: 'pointer', color: 'var(--muted)' }}
                  >
                    Dismiss
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function attemptStatusColor(status: string): { bg: string; text: string } {
  switch (status) {
    case 'created': return { bg: '#dbeafe', text: '#1d4ed8' }
    case 'sent': return { bg: '#dcfce7', text: '#166534' }
    case 'skipped': return { bg: '#f3f4f6', text: '#374151' }
    case 'dismissed': return { bg: '#f3f4f6', text: '#6b7280' }
    default: return { bg: '#f3f4f6', text: '#374151' }
  }
}
