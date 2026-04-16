import { requireAuth } from '@/lib/session'
import { db } from '@/lib/db'
import Link from 'next/link'

export default async function InvoicesPage() {
  const { organizationId } = await requireAuth()

  const invoices = await db.invoice.findMany({
    where: { organizationId },
    include: { job: true, customer: true },
    orderBy: { createdAt: 'desc' },
  })

  return (
    <main>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h1>Invoices</h1>
      </div>

      {invoices.length === 0 ? (
        <div className="card">
          <p className="muted">No invoices yet. Create an invoice from a job detail page.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {invoices.map((inv) => (
            <Link
              key={inv.id}
              href={`/invoices/${inv.id}` as never}
              style={{ textDecoration: 'none', color: 'inherit' }}
            >
              <div className="card" style={{ cursor: 'pointer' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <strong>#{inv.invoiceNumber}</strong>
                    <span className="muted" style={{ marginLeft: 8, fontSize: 13 }}>
                      {inv.job.title} — {inv.customer.firstName} {inv.customer.lastName || ''}
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <span style={{ fontWeight: 600 }}>{formatCents(inv.totalCents)}</span>
                    <span style={{
                      fontSize: 12,
                      padding: '2px 8px',
                      borderRadius: 6,
                      background: invoiceStatusColor(inv.status),
                      color: 'white',
                    }}>
                      {inv.status}
                    </span>
                  </div>
                </div>
                {inv.dueDate && (
                  <p className="muted" style={{ fontSize: 13, marginTop: 4 }}>
                    Due: {new Date(inv.dueDate).toLocaleDateString()}
                  </p>
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
