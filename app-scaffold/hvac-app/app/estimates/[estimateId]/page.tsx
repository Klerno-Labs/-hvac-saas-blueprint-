import { requireAuth } from '@/lib/session'
import { db } from '@/lib/db'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { EstimateStatusForm } from './status-form'
import { EstimateEditForm } from './edit-form'

export default async function EstimateDetailPage({ params }: { params: Promise<{ estimateId: string }> }) {
  const { organizationId } = await requireAuth()
  const { estimateId } = await params

  const estimate = await db.estimate.findFirst({
    where: { id: estimateId, organizationId },
    include: {
      job: { include: { customer: true } },
      lineItems: { orderBy: { sortOrder: 'asc' } },
    },
  })

  if (!estimate) {
    notFound()
  }

  const isDraft = estimate.status === 'draft'

  return (
    <main>
      <div style={{ marginBottom: 20 }}>
        <Link href="/estimates" className="muted" style={{ fontSize: 13 }}>
          &larr; All estimates
        </Link>
      </div>

      <div className="card" style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h1>Estimate #{estimate.estimateNumber}</h1>
            <p className="muted">
              Job:{' '}
              <Link href={`/jobs/${estimate.jobId}` as never} style={{ color: 'var(--primary)' }}>
                {estimate.job.title}
              </Link>
              {' '}— {estimate.job.customer.firstName} {estimate.job.customer.lastName || ''}
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {estimate.aiDraftUsed && (
              <span style={{ fontSize: 11, padding: '2px 6px', borderRadius: 4, background: '#dbeafe', color: '#1d4ed8' }}>
                AI draft
              </span>
            )}
            <span style={{
              fontSize: 12,
              padding: '4px 10px',
              borderRadius: 6,
              background: estimateStatusColor(estimate.status),
              color: 'white',
            }}>
              {estimate.status}
            </span>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16, marginTop: 20 }}>
          <div>
            <p style={{ fontSize: 13 }} className="muted">Subtotal</p>
            <p>{formatCents(estimate.subtotalCents)}</p>
          </div>
          <div>
            <p style={{ fontSize: 13 }} className="muted">Tax</p>
            <p>{formatCents(estimate.taxCents)}</p>
          </div>
          <div>
            <p style={{ fontSize: 13 }} className="muted">Total</p>
            <p style={{ fontWeight: 700 }}>{formatCents(estimate.totalCents)}</p>
          </div>
        </div>

        {estimate.scopeOfWork && (
          <div style={{ marginTop: 16 }}>
            <p style={{ fontSize: 13 }} className="muted">Scope of work</p>
            <p style={{ whiteSpace: 'pre-wrap' }}>{estimate.scopeOfWork}</p>
          </div>
        )}

        {estimate.lineItems.length > 0 && (
          <div style={{ marginTop: 16 }}>
            <p style={{ fontSize: 13, marginBottom: 8 }} className="muted">Line items</p>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)' }}>
                  <th style={thStyle}>Item</th>
                  <th style={{ ...thStyle, textAlign: 'right' }}>Qty</th>
                  <th style={{ ...thStyle, textAlign: 'right' }}>Unit price</th>
                  <th style={{ ...thStyle, textAlign: 'right' }}>Total</th>
                </tr>
              </thead>
              <tbody>
                {estimate.lineItems.map((li) => (
                  <tr key={li.id} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={tdStyle}>
                      <strong>{li.name}</strong>
                      {li.description && <br />}
                      {li.description && <span className="muted" style={{ fontSize: 13 }}>{li.description}</span>}
                    </td>
                    <td style={{ ...tdStyle, textAlign: 'right' }}>{li.quantity}</td>
                    <td style={{ ...tdStyle, textAlign: 'right' }}>{formatCents(li.unitPriceCents)}</td>
                    <td style={{ ...tdStyle, textAlign: 'right' }}>{formatCents(li.lineTotalCents)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {estimate.terms && (
          <div style={{ marginTop: 16 }}>
            <p style={{ fontSize: 13 }} className="muted">Terms</p>
            <p>{estimate.terms}</p>
          </div>
        )}

        {estimate.notes && (
          <div style={{ marginTop: 16 }}>
            <p style={{ fontSize: 13 }} className="muted">Notes</p>
            <p>{estimate.notes}</p>
          </div>
        )}
      </div>

      <div className="card" style={{ marginBottom: 16 }}>
        <h3>Update status</h3>
        <EstimateStatusForm estimateId={estimate.id} currentStatus={estimate.status} />
      </div>

      {isDraft && (
        <div className="card">
          <h3>Edit estimate</h3>
          <p className="muted" style={{ fontSize: 13, marginBottom: 12 }}>
            Only draft estimates can be edited.
          </p>
          <EstimateEditForm
            estimateId={estimate.id}
            initialData={{
              scopeOfWork: estimate.scopeOfWork || '',
              terms: estimate.terms || '',
              notes: estimate.notes || '',
              taxCents: estimate.taxCents,
              lineItems: estimate.lineItems.map((li) => ({
                name: li.name,
                description: li.description || '',
                quantity: li.quantity,
                unitPriceCents: li.unitPriceCents,
              })),
            }}
          />
        </div>
      )}
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

const thStyle: React.CSSProperties = { padding: '8px 4px', textAlign: 'left', fontSize: 12, fontWeight: 600, color: 'var(--muted)' }
const tdStyle: React.CSSProperties = { padding: '8px 4px' }
