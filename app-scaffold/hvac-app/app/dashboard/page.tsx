import { requireAuth } from '@/lib/session'
import { db } from '@/lib/db'
import Link from 'next/link'

export default async function DashboardPage() {
  const { organization, organizationId } = await requireAuth()

  // Parallel queries for dashboard metrics
  const [
    customerCount,
    activeJobCount,
    completedJobCount,
    draftEstimateCount,
    sentEstimateCount,
    outstandingInvoices,
    openReminders,
    recentActivity,
    overdueInvoices,
    stalledJobs,
  ] = await Promise.all([
    db.customer.count({ where: { organizationId } }),
    db.job.count({ where: { organizationId, status: { in: ['draft', 'scheduled', 'in_progress'] } } }),
    db.job.count({ where: { organizationId, status: 'completed' } }),
    db.estimate.count({ where: { organizationId, status: 'draft' } }),
    db.estimate.count({ where: { organizationId, status: 'sent' } }),
    db.invoice.findMany({
      where: { organizationId, status: { notIn: ['paid', 'void'] } },
      include: { customer: true },
      orderBy: { createdAt: 'desc' },
      take: 10,
    }),
    db.reminder.findMany({
      where: { organizationId, status: 'open' },
      orderBy: { dueAt: 'asc' },
      take: 5,
    }),
    db.activityEvent.findMany({
      where: { organizationId, eventName: { not: 'dashboard_viewed' } },
      orderBy: { createdAt: 'desc' },
      take: 10,
    }),
    db.invoice.findMany({
      where: {
        organizationId,
        status: 'sent',
        dueDate: { lt: new Date() },
      },
      include: { customer: true },
      take: 5,
    }),
    db.job.findMany({
      where: {
        organizationId,
        status: 'in_progress',
        updatedAt: { lt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
      },
      include: { customer: true },
      take: 5,
    }),
  ])

  const totalOutstandingCents = outstandingInvoices.reduce((sum, inv) => sum + inv.outstandingCents, 0)

  return (
    <main>
      <h1>Dashboard</h1>
      <p className="muted" style={{ marginBottom: 24 }}>
        {organization.name}
      </p>

      {/* Key metrics */}
      <div className="grid grid-3" style={{ marginBottom: 24 }}>
        <Link href="/customers" style={{ textDecoration: 'none', color: 'inherit' }}>
          <div className="card" style={{ cursor: 'pointer' }}>
            <p style={{ fontSize: 13 }} className="muted">Customers</p>
            <p style={{ fontSize: 28, fontWeight: 700 }}>{customerCount}</p>
          </div>
        </Link>
        <Link href="/jobs" style={{ textDecoration: 'none', color: 'inherit' }}>
          <div className="card" style={{ cursor: 'pointer' }}>
            <p style={{ fontSize: 13 }} className="muted">Active jobs</p>
            <p style={{ fontSize: 28, fontWeight: 700 }}>{activeJobCount}</p>
            <p className="muted" style={{ fontSize: 12 }}>{completedJobCount} completed</p>
          </div>
        </Link>
        <Link href="/invoices" style={{ textDecoration: 'none', color: 'inherit' }}>
          <div className="card" style={{ cursor: 'pointer' }}>
            <p style={{ fontSize: 13 }} className="muted">Outstanding</p>
            <p style={{ fontSize: 28, fontWeight: 700, color: totalOutstandingCents > 0 ? '#d97706' : '#059669' }}>
              {formatCents(totalOutstandingCents)}
            </p>
            <p className="muted" style={{ fontSize: 12 }}>{outstandingInvoices.length} invoice{outstandingInvoices.length !== 1 ? 's' : ''}</p>
          </div>
        </Link>
      </div>

      <div className="grid grid-3" style={{ marginBottom: 24 }}>
        <Link href="/estimates" style={{ textDecoration: 'none', color: 'inherit' }}>
          <div className="card" style={{ cursor: 'pointer' }}>
            <p style={{ fontSize: 13 }} className="muted">Draft estimates</p>
            <p style={{ fontSize: 28, fontWeight: 700 }}>{draftEstimateCount}</p>
            <p className="muted" style={{ fontSize: 12 }}>{sentEstimateCount} sent</p>
          </div>
        </Link>
        <Link href="/reminders" style={{ textDecoration: 'none', color: 'inherit' }}>
          <div className="card" style={{ cursor: 'pointer' }}>
            <p style={{ fontSize: 13 }} className="muted">Open reminders</p>
            <p style={{ fontSize: 28, fontWeight: 700 }}>{openReminders.length}</p>
          </div>
        </Link>
        <div className="card">
          <p style={{ fontSize: 13 }} className="muted">Stripe</p>
          <p style={{ fontSize: 14, fontWeight: 600, color: organization.stripeChargesEnabled ? '#059669' : '#d97706' }}>
            {organization.stripeChargesEnabled ? 'Connected' : 'Not connected'}
          </p>
        </div>
      </div>

      {/* Attention needed */}
      {(overdueInvoices.length > 0 || stalledJobs.length > 0) && (
        <div className="card" style={{ marginBottom: 24, borderLeft: '4px solid #d97706' }}>
          <h2 style={{ marginBottom: 12 }}>Needs attention</h2>

          {overdueInvoices.length > 0 && (
            <div style={{ marginBottom: overdueInvoices.length > 0 && stalledJobs.length > 0 ? 16 : 0 }}>
              <p style={{ fontSize: 13, fontWeight: 600, marginBottom: 8 }}>Overdue invoices</p>
              {overdueInvoices.map((inv) => (
                <Link key={inv.id} href={`/invoices/${inv.id}` as never} style={{ textDecoration: 'none', color: 'inherit' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid var(--border)', cursor: 'pointer' }}>
                    <span>#{inv.invoiceNumber} — {inv.customer.firstName} {inv.customer.lastName || ''}</span>
                    <span style={{ fontWeight: 600, color: '#d97706' }}>{formatCents(inv.outstandingCents)}</span>
                  </div>
                </Link>
              ))}
            </div>
          )}

          {stalledJobs.length > 0 && (
            <div>
              <p style={{ fontSize: 13, fontWeight: 600, marginBottom: 8 }}>Stalled jobs (no update in 7+ days)</p>
              {stalledJobs.map((job) => (
                <Link key={job.id} href={`/jobs/${job.id}` as never} style={{ textDecoration: 'none', color: 'inherit' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid var(--border)', cursor: 'pointer' }}>
                    <span>{job.title} — {job.customer.firstName} {job.customer.lastName || ''}</span>
                    <span className="muted" style={{ fontSize: 12 }}>{job.status.replace('_', ' ')}</span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Open reminders */}
      {openReminders.length > 0 && (
        <div className="card" style={{ marginBottom: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <h2>Open reminders</h2>
            <Link href="/reminders" className="muted" style={{ fontSize: 13 }}>View all</Link>
          </div>
          {openReminders.map((rem) => (
            <div key={rem.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid var(--border)' }}>
              <span>{rem.title}</span>
              <span className="muted" style={{ fontSize: 12 }}>
                {rem.dueAt ? new Date(rem.dueAt).toLocaleDateString() : '—'}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Outstanding invoices */}
      {outstandingInvoices.length > 0 && (
        <div className="card" style={{ marginBottom: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <h2>Outstanding invoices</h2>
            <Link href="/invoices" className="muted" style={{ fontSize: 13 }}>View all</Link>
          </div>
          {outstandingInvoices.map((inv) => (
            <Link key={inv.id} href={`/invoices/${inv.id}` as never} style={{ textDecoration: 'none', color: 'inherit' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid var(--border)', cursor: 'pointer' }}>
                <div>
                  <strong>#{inv.invoiceNumber}</strong>
                  <span className="muted" style={{ marginLeft: 8, fontSize: 13 }}>
                    {inv.customer.firstName} {inv.customer.lastName || ''}
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontWeight: 600 }}>{formatCents(inv.outstandingCents)}</span>
                  <span style={{
                    fontSize: 11,
                    padding: '1px 6px',
                    borderRadius: 4,
                    background: inv.status === 'sent' ? '#dbeafe' : '#fef3c7',
                    color: inv.status === 'sent' ? '#1d4ed8' : '#92400e',
                  }}>
                    {inv.status}
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Recent activity */}
      <div className="card">
        <h2 style={{ marginBottom: 12 }}>Recent activity</h2>
        {recentActivity.length === 0 ? (
          <p className="muted">No activity yet.</p>
        ) : (
          recentActivity.map((event) => (
            <div key={event.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid var(--border)' }}>
              <span style={{ fontSize: 13 }}>{formatEventName(event.eventName)}</span>
              <span className="muted" style={{ fontSize: 12 }}>
                {new Date(event.createdAt).toLocaleDateString()}{' '}
                {new Date(event.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          ))
        )}
      </div>
    </main>
  )
}

function formatCents(cents: number): string {
  return '$' + (cents / 100).toFixed(2)
}

function formatEventName(name: string): string {
  return name
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase())
}
