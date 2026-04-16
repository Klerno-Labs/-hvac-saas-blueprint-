import { validatePortalToken } from '@/lib/portal'
import { db } from '@/lib/db'
import { trackEvent } from '@/lib/events'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { PortalPayButton } from './portal-pay-button'

export default async function PortalInvoiceDetailPage({
  params,
}: {
  params: Promise<{ token: string; invoiceId: string }>
}) {
  const { token, invoiceId } = await params

  const ctx = await validatePortalToken(token)
  if (!ctx) {
    notFound()
  }

  // Customer-safe projection — no internal notes, no collections data
  const invoice = await db.invoice.findFirst({
    where: {
      id: invoiceId,
      organizationId: ctx.organizationId,
      customerId: ctx.customerId,
      status: { not: 'draft' },
    },
    select: {
      id: true,
      invoiceNumber: true,
      status: true,
      descriptionOfWork: true,
      subtotalCents: true,
      taxCents: true,
      totalCents: true,
      outstandingCents: true,
      dueDate: true,
      paidAt: true,
      lineItems: {
        select: { id: true, name: true, description: true, quantity: true, unitPriceCents: true, lineTotalCents: true },
        orderBy: { sortOrder: 'asc' },
      },
      job: { select: { title: true } },
    },
  })

  if (!invoice) {
    notFound()
  }

  await trackEvent({
    organizationId: ctx.organizationId,
    eventName: 'customer_portal_invoice_viewed',
    entityType: 'invoice',
    entityId: invoiceId,
  })

  const canPay = invoice.status !== 'paid' && invoice.status !== 'void'

  return (
    <main>
      <div style={{ maxWidth: 700, margin: '0 auto' }}>
        <div style={{ marginBottom: 20 }}>
          <Link href={`/portal/${token}` as never} className="muted" style={{ fontSize: 13 }}>
            &larr; Back to portal
          </Link>
        </div>

        <div className="card" style={{ marginBottom: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <h1>Invoice #{invoice.invoiceNumber}</h1>
              <p className="muted">From {ctx.organizationName} — {invoice.job.title}</p>
            </div>
            <span style={{
              fontSize: 12,
              padding: '4px 10px',
              borderRadius: 6,
              background: statusBg(invoice.status),
              color: statusFg(invoice.status),
            }}>
              {customerFriendlyStatus(invoice.status)}
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16, marginTop: 20 }}>
            <div>
              <p style={{ fontSize: 13 }} className="muted">Subtotal</p>
              <p>{formatCents(invoice.subtotalCents)}</p>
            </div>
            <div>
              <p style={{ fontSize: 13 }} className="muted">Tax</p>
              <p>{formatCents(invoice.taxCents)}</p>
            </div>
            <div>
              <p style={{ fontSize: 13 }} className="muted">Total</p>
              <p style={{ fontWeight: 700 }}>{formatCents(invoice.totalCents)}</p>
            </div>
          </div>

          {invoice.outstandingCents > 0 && (
            <div style={{ marginTop: 16, padding: '12px 16px', background: '#fef3c7', borderRadius: 8 }}>
              <span style={{ fontWeight: 700, color: '#92400e' }}>
                Amount due: {formatCents(invoice.outstandingCents)}
              </span>
              {invoice.dueDate && (
                <span className="muted" style={{ marginLeft: 12, fontSize: 13 }}>
                  Due {new Date(invoice.dueDate).toLocaleDateString()}
                </span>
              )}
            </div>
          )}

          {invoice.status === 'paid' && invoice.paidAt && (
            <div style={{ marginTop: 16, padding: '12px 16px', background: '#dcfce7', borderRadius: 8 }}>
              <span style={{ fontWeight: 700, color: '#166534' }}>
                Paid on {new Date(invoice.paidAt).toLocaleDateString()}
              </span>
            </div>
          )}

          {invoice.descriptionOfWork && (
            <div style={{ marginTop: 16 }}>
              <p style={{ fontSize: 13 }} className="muted">Description of work</p>
              <p style={{ whiteSpace: 'pre-wrap' }}>{invoice.descriptionOfWork}</p>
            </div>
          )}

          {invoice.lineItems.length > 0 && (
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
                  {invoice.lineItems.map((li) => (
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
        </div>

        {canPay && (
          <div className="card" style={{ textAlign: 'center' }}>
            <h3>Pay this invoice</h3>
            <p className="muted" style={{ marginBottom: 16, fontSize: 13 }}>
              Secure payment powered by Stripe
            </p>
            <PortalPayButton token={token} invoiceId={invoice.id} />
          </div>
        )}
      </div>
    </main>
  )
}

function formatCents(cents: number): string {
  return '$' + (cents / 100).toFixed(2)
}

function customerFriendlyStatus(status: string): string {
  switch (status) {
    case 'sent': return 'Awaiting payment'
    case 'overdue': return 'Overdue'
    case 'paid': return 'Paid'
    case 'void': return 'Cancelled'
    default: return status
  }
}

function statusBg(status: string): string {
  switch (status) {
    case 'sent': return '#dbeafe'
    case 'overdue': return '#fef3c7'
    case 'paid': return '#dcfce7'
    case 'void': return '#f3f4f6'
    default: return '#f3f4f6'
  }
}

function statusFg(status: string): string {
  switch (status) {
    case 'sent': return '#1d4ed8'
    case 'overdue': return '#92400e'
    case 'paid': return '#166534'
    case 'void': return '#374151'
    default: return '#374151'
  }
}

const thStyle: React.CSSProperties = { padding: '8px 4px', textAlign: 'left', fontSize: 12, fontWeight: 600, color: 'var(--muted)' }
const tdStyle: React.CSSProperties = { padding: '8px 4px' }
