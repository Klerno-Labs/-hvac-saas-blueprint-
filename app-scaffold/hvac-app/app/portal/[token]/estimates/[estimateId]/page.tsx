import { validatePortalToken } from '@/lib/portal'
import { db } from '@/lib/db'
import { trackEvent } from '@/lib/events'
import { notFound } from 'next/navigation'
import Link from 'next/link'

export default async function PortalEstimateDetailPage({
  params,
}: {
  params: Promise<{ token: string; estimateId: string }>
}) {
  const { token, estimateId } = await params

  const ctx = await validatePortalToken(token)
  if (!ctx) {
    notFound()
  }

  // Customer-safe projection — no internal notes, no AI draft flag
  const estimate = await db.estimate.findFirst({
    where: {
      id: estimateId,
      organizationId: ctx.organizationId,
      job: { customerId: ctx.customerId },
      status: { in: ['sent', 'accepted', 'declined'] },
    },
    select: {
      id: true,
      estimateNumber: true,
      status: true,
      scopeOfWork: true,
      terms: true,
      subtotalCents: true,
      taxCents: true,
      totalCents: true,
      sentAt: true,
      lineItems: {
        select: { id: true, name: true, description: true, quantity: true, unitPriceCents: true, lineTotalCents: true },
        orderBy: { sortOrder: 'asc' },
      },
      job: { select: { title: true } },
    },
  })

  if (!estimate) {
    notFound()
  }

  await trackEvent({
    organizationId: ctx.organizationId,
    eventName: 'customer_portal_estimate_viewed',
    entityType: 'estimate',
    entityId: estimateId,
  })

  return (
    <main>
      <div style={{ maxWidth: 700, margin: '0 auto' }}>
        <div style={{ marginBottom: 20 }}>
          <Link href={`/portal/${token}` as never} className="muted" style={{ fontSize: 13 }}>
            &larr; Back to portal
          </Link>
        </div>

        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <h1>Estimate #{estimate.estimateNumber}</h1>
              <p className="muted">From {ctx.organizationName} — {estimate.job.title}</p>
            </div>
            <span style={{
              fontSize: 12,
              padding: '4px 10px',
              borderRadius: 6,
              background: estimate.status === 'accepted' ? '#dcfce7' : estimate.status === 'declined' ? '#fef2f2' : '#dbeafe',
              color: estimate.status === 'accepted' ? '#166534' : estimate.status === 'declined' ? '#991b1b' : '#1d4ed8',
            }}>
              {estimate.status}
            </span>
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
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border)' }}>
                    <th style={thStyle}>Item</th>
                    <th style={{ ...thStyle, textAlign: 'right' }}>Qty</th>
                    <th style={{ ...thStyle, textAlign: 'right' }}>Price</th>
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

          {estimate.sentAt && (
            <div style={{ marginTop: 16 }}>
              <p className="muted" style={{ fontSize: 12 }}>
                Sent on {new Date(estimate.sentAt).toLocaleDateString()}
              </p>
            </div>
          )}
        </div>
      </div>
    </main>
  )
}

function formatCents(cents: number): string {
  return '$' + (cents / 100).toFixed(2)
}

const thStyle: React.CSSProperties = { padding: '8px 4px', textAlign: 'left', fontSize: 12, fontWeight: 600, color: 'var(--muted)' }
const tdStyle: React.CSSProperties = { padding: '8px 4px' }
