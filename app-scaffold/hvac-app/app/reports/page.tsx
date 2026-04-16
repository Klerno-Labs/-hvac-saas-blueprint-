import { requireAuth } from '@/lib/session'
import { db } from '@/lib/db'
import Link from 'next/link'

export default async function ReportsPage() {
  const { organizationId, organization } = await requireAuth()

  const [
    totalInvoicedResult,
    totalPaidResult,
    invoicesByStatus,
    overdueInvoices,
    recentPayments,
    syncRecords,
  ] = await Promise.all([
    db.invoice.aggregate({
      where: { organizationId, status: { not: 'draft' } },
      _sum: { totalCents: true },
      _count: true,
    }),
    db.invoice.aggregate({
      where: { organizationId, status: 'paid' },
      _sum: { totalCents: true },
      _count: true,
    }),
    db.invoice.groupBy({
      by: ['status'],
      where: { organizationId },
      _count: true,
      _sum: { totalCents: true, outstandingCents: true },
    }),
    db.invoice.findMany({
      where: {
        organizationId,
        status: { in: ['sent', 'overdue'] },
        dueDate: { lt: new Date() },
      },
      include: { customer: true },
      orderBy: { dueDate: 'asc' },
      take: 10,
    }),
    db.payment.findMany({
      where: { organizationId, status: 'succeeded' },
      include: { invoice: { select: { invoiceNumber: true, customer: { select: { firstName: true, lastName: true } } } } },
      orderBy: { paidAt: 'desc' },
      take: 10,
    }),
    db.accountingSyncRecord.groupBy({
      by: ['syncStatus'],
      where: { organizationId },
      _count: true,
    }),
  ])

  const totalInvoicedCents = totalInvoicedResult._sum.totalCents || 0
  const totalInvoiceCount = totalInvoicedResult._count
  const totalPaidCents = totalPaidResult._sum.totalCents || 0
  const totalPaidCount = totalPaidResult._count
  const totalOutstandingCents = totalInvoicedCents - totalPaidCents

  // Build status breakdown
  const statusBreakdown = invoicesByStatus.map((s) => ({
    status: s.status,
    count: s._count,
    totalCents: s._sum.totalCents || 0,
    outstandingCents: s._sum.outstandingCents || 0,
  }))

  // Sync status summary
  const syncSummary = syncRecords.reduce(
    (acc, r) => {
      acc[r.syncStatus] = r._count
      return acc
    },
    {} as Record<string, number>,
  )
  const totalSynced = syncSummary['synced'] || 0
  const totalPending = syncSummary['pending'] || 0
  const totalFailed = syncSummary['failed'] || 0

  return (
    <main>
      <h1>Reports</h1>
      <p className="muted" style={{ marginBottom: 24 }}>{organization.name}</p>

      {/* Receivables overview */}
      <div className="grid grid-3" style={{ marginBottom: 24 }}>
        <div className="card">
          <p style={{ fontSize: 13 }} className="muted">Total invoiced</p>
          <p style={{ fontSize: 28, fontWeight: 700 }}>{formatCents(totalInvoicedCents)}</p>
          <p className="muted" style={{ fontSize: 12 }}>{totalInvoiceCount} invoice{totalInvoiceCount !== 1 ? 's' : ''}</p>
        </div>
        <div className="card">
          <p style={{ fontSize: 13 }} className="muted">Total collected</p>
          <p style={{ fontSize: 28, fontWeight: 700, color: '#059669' }}>{formatCents(totalPaidCents)}</p>
          <p className="muted" style={{ fontSize: 12 }}>{totalPaidCount} paid</p>
        </div>
        <div className="card">
          <p style={{ fontSize: 13 }} className="muted">Outstanding</p>
          <p style={{ fontSize: 28, fontWeight: 700, color: totalOutstandingCents > 0 ? '#d97706' : '#059669' }}>
            {formatCents(totalOutstandingCents)}
          </p>
        </div>
      </div>

      {/* Invoice status breakdown */}
      <div className="card" style={{ marginBottom: 24 }}>
        <h2 style={{ marginBottom: 12 }}>Invoice breakdown by status</h2>
        {statusBreakdown.length === 0 ? (
          <p className="muted">No invoices yet.</p>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)' }}>
                <th style={thStyle}>Status</th>
                <th style={{ ...thStyle, textAlign: 'right' }}>Count</th>
                <th style={{ ...thStyle, textAlign: 'right' }}>Total</th>
                <th style={{ ...thStyle, textAlign: 'right' }}>Outstanding</th>
              </tr>
            </thead>
            <tbody>
              {statusBreakdown.map((s) => (
                <tr key={s.status} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={tdStyle}>
                    <span style={{
                      fontSize: 12,
                      padding: '2px 8px',
                      borderRadius: 4,
                      background: statusBg(s.status),
                      color: 'white',
                    }}>
                      {s.status}
                    </span>
                  </td>
                  <td style={{ ...tdStyle, textAlign: 'right' }}>{s.count}</td>
                  <td style={{ ...tdStyle, textAlign: 'right' }}>{formatCents(s.totalCents)}</td>
                  <td style={{ ...tdStyle, textAlign: 'right' }}>{formatCents(s.outstandingCents)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Overdue invoices */}
      {overdueInvoices.length > 0 && (
        <div className="card" style={{ marginBottom: 24, borderLeft: '4px solid #d97706' }}>
          <h2 style={{ marginBottom: 12 }}>Overdue invoices</h2>
          {overdueInvoices.map((inv) => {
            const daysOverdue = inv.dueDate
              ? Math.floor((Date.now() - inv.dueDate.getTime()) / (1000 * 60 * 60 * 24))
              : 0
            return (
              <Link key={inv.id} href={`/invoices/${inv.id}` as never} style={{ textDecoration: 'none', color: 'inherit' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid var(--border)', cursor: 'pointer' }}>
                  <div>
                    <strong>#{inv.invoiceNumber}</strong>
                    <span className="muted" style={{ marginLeft: 8, fontSize: 13 }}>
                      {inv.customer.firstName} {inv.customer.lastName || ''}
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <span style={{ fontWeight: 600, color: '#d97706' }}>{formatCents(inv.outstandingCents)}</span>
                    <span className="muted" style={{ fontSize: 12 }}>{daysOverdue}d overdue</span>
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      )}

      {/* Recent payments */}
      <div className="card" style={{ marginBottom: 24 }}>
        <h2 style={{ marginBottom: 12 }}>Recent payments</h2>
        {recentPayments.length === 0 ? (
          <p className="muted">No payments received yet.</p>
        ) : (
          recentPayments.map((p) => (
            <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid var(--border)' }}>
              <div>
                <span style={{ fontWeight: 600 }}>{formatCents(p.amountCents)}</span>
                <span className="muted" style={{ marginLeft: 8, fontSize: 13 }}>
                  #{p.invoice.invoiceNumber} — {p.invoice.customer.firstName} {p.invoice.customer.lastName || ''}
                </span>
              </div>
              <span className="muted" style={{ fontSize: 12 }}>
                {p.paidAt ? new Date(p.paidAt).toLocaleDateString() : '—'}
              </span>
            </div>
          ))
        )}
      </div>

      {/* Accounting sync status */}
      {organization.accountingConnected && (
        <div className="card" style={{ marginBottom: 24 }}>
          <h2 style={{ marginBottom: 12 }}>Accounting sync status</h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 16 }}>
            <div>
              <p style={{ fontSize: 13 }} className="muted">Provider</p>
              <p style={{ fontWeight: 600 }}>{organization.accountingProvider || '—'}</p>
            </div>
            <div>
              <p style={{ fontSize: 13 }} className="muted">Synced</p>
              <p style={{ fontWeight: 600, color: '#059669' }}>{totalSynced}</p>
            </div>
            <div>
              <p style={{ fontSize: 13 }} className="muted">Pending</p>
              <p style={{ fontWeight: 600, color: '#d97706' }}>{totalPending}</p>
            </div>
            <div>
              <p style={{ fontSize: 13 }} className="muted">Failed</p>
              <p style={{ fontWeight: 600, color: totalFailed > 0 ? '#dc2626' : '#6b7280' }}>{totalFailed}</p>
            </div>
          </div>
          {organization.accountingLastSyncAt && (
            <p className="muted" style={{ fontSize: 12, marginTop: 8 }}>
              Last sync: {new Date(organization.accountingLastSyncAt).toLocaleString()}
            </p>
          )}
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

function statusBg(status: string): string {
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
