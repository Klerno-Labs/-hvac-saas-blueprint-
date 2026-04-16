import { requireAuth } from '@/lib/session'
import { db } from '@/lib/db'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { InvoiceStatusForm } from './status-form'
import { InvoiceEditForm } from './edit-form'
import { PayButton } from './pay-button'
import { CollectionsSection } from './collections-section'

export default async function InvoiceDetailPage({ params }: { params: Promise<{ invoiceId: string }> }) {
  const { organizationId, organization } = await requireAuth()
  const { invoiceId } = await params

  const invoice = await db.invoice.findFirst({
    where: { id: invoiceId, organizationId },
    include: {
      job: true,
      customer: true,
      lineItems: { orderBy: { sortOrder: 'asc' } },
      payments: { orderBy: { createdAt: 'desc' }, take: 5 },
      collectionAttempts: { orderBy: { createdAt: 'asc' } },
    },
  })

  if (!invoice) {
    notFound()
  }

  const isDraft = invoice.status === 'draft'
  const canPay = invoice.status !== 'paid' && invoice.status !== 'void' && invoice.status !== 'draft'
  const stripeReady = organization.stripeChargesEnabled
  const showCollections = invoice.status !== 'draft' && invoice.status !== 'paid' && invoice.status !== 'void'

  return (
    <main>
      <div style={{ marginBottom: 20 }}>
        <Link href="/invoices" className="muted" style={{ fontSize: 13 }}>
          &larr; All invoices
        </Link>
      </div>

      <div className="card" style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h1>Invoice #{invoice.invoiceNumber}</h1>
            <p className="muted">
              Job:{' '}
              <Link href={`/jobs/${invoice.jobId}` as never} style={{ color: 'var(--primary)' }}>
                {invoice.job.title}
              </Link>
              {' '}— {invoice.customer.firstName} {invoice.customer.lastName || ''}
            </p>
          </div>
          <span style={{
            fontSize: 12,
            padding: '4px 10px',
            borderRadius: 6,
            background: invoiceStatusColor(invoice.status),
            color: 'white',
          }}>
            {invoice.status}
          </span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 16, marginTop: 20 }}>
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
          <div>
            <p style={{ fontSize: 13 }} className="muted">Outstanding</p>
            <p style={{ fontWeight: 700, color: invoice.outstandingCents > 0 ? '#d97706' : '#059669' }}>
              {formatCents(invoice.outstandingCents)}
            </p>
          </div>
        </div>

        {invoice.dueDate && (
          <div style={{ marginTop: 16 }}>
            <p style={{ fontSize: 13 }} className="muted">Due date</p>
            <p>{new Date(invoice.dueDate).toLocaleDateString()}</p>
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

        {invoice.notes && (
          <div style={{ marginTop: 16 }}>
            <p style={{ fontSize: 13 }} className="muted">Notes</p>
            <p>{invoice.notes}</p>
          </div>
        )}
      </div>

      {/* Payment section */}
      {canPay && (
        <div className="card" style={{ marginBottom: 16 }}>
          <h3>Payment</h3>
          {stripeReady ? (
            <PayButton invoiceId={invoice.id} />
          ) : (
            <div>
              <p className="muted" style={{ fontSize: 14 }}>
                Stripe is not connected. <Link href="/settings" style={{ color: 'var(--primary)' }}>Connect Stripe</Link> to collect payments.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Payment history */}
      {invoice.payments.length > 0 && (
        <div className="card" style={{ marginBottom: 16 }}>
          <h3>Payment history</h3>
          {invoice.payments.map((p) => (
            <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid var(--border)' }}>
              <div>
                <span style={{ fontWeight: 600 }}>{formatCents(p.amountCents)}</span>
                <span style={{
                  marginLeft: 8,
                  fontSize: 11,
                  padding: '1px 6px',
                  borderRadius: 4,
                  background: p.status === 'succeeded' ? '#dcfce7' : p.status === 'failed' ? '#fef2f2' : '#f3f4f6',
                  color: p.status === 'succeeded' ? '#166534' : p.status === 'failed' ? '#991b1b' : '#374151',
                }}>
                  {p.status}
                </span>
              </div>
              <span className="muted" style={{ fontSize: 12 }}>
                {p.paidAt ? new Date(p.paidAt).toLocaleDateString() : new Date(p.createdAt).toLocaleDateString()}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Collections section */}
      {showCollections && (
        <div className="card" style={{ marginBottom: 16 }}>
          <h3>Collections</h3>
          <CollectionsSection
            invoiceId={invoice.id}
            collectionsPaused={invoice.collectionsPaused}
            attempts={invoice.collectionAttempts}
          />
        </div>
      )}

      <div className="card" style={{ marginBottom: 16 }}>
        <h3>Update status</h3>
        <InvoiceStatusForm invoiceId={invoice.id} currentStatus={invoice.status} />
      </div>

      {isDraft && (
        <div className="card">
          <h3>Edit invoice</h3>
          <p className="muted" style={{ fontSize: 13, marginBottom: 12 }}>
            Only draft invoices can be edited.
          </p>
          <InvoiceEditForm
            invoiceId={invoice.id}
            initialData={{
              descriptionOfWork: invoice.descriptionOfWork || '',
              notes: invoice.notes || '',
              taxCents: invoice.taxCents,
              dueDate: invoice.dueDate ? invoice.dueDate.toISOString().split('T')[0] : '',
              lineItems: invoice.lineItems.map((li) => ({
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

function invoiceStatusColor(status: string): string {
  switch (status) {
    case 'draft': return '#6b7280'
    case 'sent': return '#2563eb'
    case 'paid': return '#059669'
    case 'void': return '#dc2626'
    case 'overdue': return '#d97706'
    default: return '#6b7280'
  }
}

const thStyle: React.CSSProperties = { padding: '8px 4px', textAlign: 'left', fontSize: 12, fontWeight: 600, color: 'var(--muted)' }
const tdStyle: React.CSSProperties = { padding: '8px 4px' }
