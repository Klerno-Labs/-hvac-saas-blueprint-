import { requireAuth } from '@/lib/session'
import { db } from '@/lib/db'
import Link from 'next/link'

export default async function EstimatesPage() {
  const { organizationId } = await requireAuth()

  const estimates = await db.estimate.findMany({
    where: { organizationId },
    include: { job: { include: { customer: true } } },
    orderBy: { createdAt: 'desc' },
  })

  return (
    <main>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h1>Estimates</h1>
      </div>

      {estimates.length === 0 ? (
        <div className="card">
          <p className="muted">No estimates yet. Create an estimate from a job detail page.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {estimates.map((est) => (
            <Link
              key={est.id}
              href={`/estimates/${est.id}` as never}
              style={{ textDecoration: 'none', color: 'inherit' }}
            >
              <div className="card" style={{ cursor: 'pointer' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <strong>#{est.estimateNumber}</strong>
                    <span className="muted" style={{ marginLeft: 8, fontSize: 13 }}>
                      {est.job.title} — {est.job.customer.firstName} {est.job.customer.lastName || ''}
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <span style={{ fontWeight: 600 }}>{formatCents(est.totalCents)}</span>
                    <span style={{
                      fontSize: 12,
                      padding: '2px 8px',
                      borderRadius: 6,
                      background: estimateStatusColor(est.status),
                      color: 'white',
                    }}>
                      {est.status}
                    </span>
                  </div>
                </div>
                {est.aiDraftUsed && (
                  <p className="muted" style={{ fontSize: 12, marginTop: 4 }}>AI-assisted draft</p>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}

      <div style={{ marginTop: 16 }}>
        <Link href="/dashboard" className="muted" style={{ fontSize: 13 }}>Back to dashboard</Link>
      </div>
    </main>
  )
}

function formatCents(cents: number): string {
  return '$' + (cents / 100).toFixed(2)
}

function estimateStatusColor(status: string): string {
  switch (status) {
    case 'draft': return '#6b7280'
    case 'sent': return '#2563eb'
    case 'accepted': return '#059669'
    case 'declined': return '#dc2626'
    default: return '#6b7280'
  }
}
