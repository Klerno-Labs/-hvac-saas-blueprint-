import { validatePortalToken } from '@/lib/portal'
import { db } from '@/lib/db'
import { trackEvent } from '@/lib/events'
import { notFound } from 'next/navigation'
import Link from 'next/link'

export default async function PortalDashboardPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params

  const ctx = await validatePortalToken(token)
  if (!ctx) {
    notFound()
  }

  await trackEvent({
    organizationId: ctx.organizationId,
    eventName: 'customer_portal_accessed',
    entityType: 'customer',
    entityId: ctx.customerId,
  })

  const [estimates, invoices] = await Promise.all([
    db.estimate.findMany({
      where: {
        organizationId: ctx.organizationId,
        job: { customerId: ctx.customerId },
        status: { in: ['sent', 'accepted', 'declined'] },
      },
      include: { job: { select: { title: true } } },
      orderBy: { createdAt: 'desc' },
      take: 20,
    }),
    db.invoice.findMany({
      where: {
        organizationId: ctx.organizationId,
        customerId: ctx.customerId,
        status: { notIn: ['draft'] },
      },
      include: { job: { select: { title: true } } },
      orderBy: { createdAt: 'desc' },
      take: 20,
    }),
  ])

  const outstandingInvoices = invoices.filter((i) => i.status !== 'paid' && i.status !== 'void')

  return (
    <main>
      <div style={{ maxWidth: 700, margin: '0 auto' }}>
        <div className="card" style={{ marginBottom: 24, textAlign: 'center' }}>
          <h1>Welcome, {ctx.customerName}</h1>
          <p className="muted">{ctx.organizationName}</p>
        </div>

        {outstandingInvoices.length > 0 && (
          <div className="card" style={{ marginBottom: 16, borderLeft: '4px solid #d97706' }}>
            <h2 style={{ marginBottom: 12 }}>Payment needed</h2>
            {outstandingInvoices.map((inv) => (
              <Link
                key={inv.id}
                href={`/portal/${token}/invoices/${inv.id}` as never}
                style={{ textDecoration: 'none', color: 'inherit' }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border)', cursor: 'pointer' }}>
                  <div>
                    <strong>#{inv.invoiceNumber}</strong>
                    <span className="muted" style={{ marginLeft: 8, fontSize: 13 }}>{inv.job.title}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontWeight: 600, color: '#d97706' }}>{formatCents(inv.outstandingCents)}</span>
                    {inv.dueDate && (
                      <span className="muted" style={{ fontSize: 12 }}>
                        Due {new Date(inv.dueDate).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}

        <div className="card" style={{ marginBottom: 16 }}>
          <h2 style={{ marginBottom: 12 }}>Invoices</h2>
          {invoices.length === 0 ? (
            <p className="muted">No invoices yet.</p>
          ) : (
            invoices.map((inv) => (
              <Link
                key={inv.id}
                href={`/portal/${token}/invoices/${inv.id}` as never}
                style={{ textDecoration: 'none', color: 'inherit' }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border)', cursor: 'pointer' }}>
                  <div>
                    <strong>#{inv.invoiceNumber}</strong>
                    <span className="muted" style={{ marginLeft: 8, fontSize: 13 }}>{inv.job.title}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontWeight: 600 }}>{formatCents(inv.totalCents)}</span>
                    <span style={{
                      fontSize: 11,
                      padding: '1px 6px',
                      borderRadius: 4,
                      background: invoiceStatusBg(inv.status),
                      color: invoiceStatusFg(inv.status),
                    }}>
                      {customerFriendlyStatus(inv.status)}
                    </span>
                  </div>
                </div>
              </Link>
            ))
          )}
        </div>

        {estimates.length > 0 && (
          <div className="card" style={{ marginBottom: 16 }}>
            <h2 style={{ marginBottom: 12 }}>Estimates</h2>
            {estimates.map((est) => (
              <Link
                key={est.id}
                href={`/portal/${token}/estimates/${est.id}` as never}
                style={{ textDecoration: 'none', color: 'inherit' }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border)', cursor: 'pointer' }}>
                  <div>
                    <strong>#{est.estimateNumber}</strong>
                    <span className="muted" style={{ marginLeft: 8, fontSize: 13 }}>{est.job.title}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontWeight: 600 }}>{formatCents(est.totalCents)}</span>
                    <span style={{
                      fontSize: 11,
                      padding: '1px 6px',
                      borderRadius: 4,
                      background: est.status === 'accepted' ? '#dcfce7' : est.status === 'declined' ? '#fef2f2' : '#dbeafe',
                      color: est.status === 'accepted' ? '#166534' : est.status === 'declined' ? '#991b1b' : '#1d4ed8',
                    }}>
                      {est.status}
                    </span>
                  </div>
                </div>
              </Link>
            ))}
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

function invoiceStatusBg(status: string): string {
  switch (status) {
    case 'sent': return '#dbeafe'
    case 'overdue': return '#fef3c7'
    case 'paid': return '#dcfce7'
    case 'void': return '#f3f4f6'
    default: return '#f3f4f6'
  }
}

function invoiceStatusFg(status: string): string {
  switch (status) {
    case 'sent': return '#1d4ed8'
    case 'overdue': return '#92400e'
    case 'paid': return '#166534'
    case 'void': return '#374151'
    default: return '#374151'
  }
}
