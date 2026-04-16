import { requireAuth } from '@/lib/session'
import { db } from '@/lib/db'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { JobStatusForm } from './status-form'

export default async function JobDetailPage({ params }: { params: Promise<{ jobId: string }> }) {
  const { organizationId } = await requireAuth()
  const { jobId } = await params

  const job = await db.job.findFirst({
    where: { id: jobId, organizationId },
    include: {
      customer: true,
      estimates: { orderBy: { createdAt: 'desc' } },
      invoices: { orderBy: { createdAt: 'desc' } },
    },
  })

  if (!job) {
    notFound()
  }

  return (
    <main>
      <div style={{ marginBottom: 20 }}>
        <Link href="/jobs" className="muted" style={{ fontSize: 13 }}>
          &larr; All jobs
        </Link>
      </div>

      <div className="card" style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h1>{job.title}</h1>
            <p className="muted">
              Customer:{' '}
              <Link href={`/customers/${job.customerId}` as never} style={{ color: 'var(--primary)' }}>
                {job.customer.firstName} {job.customer.lastName || ''}
              </Link>
            </p>
          </div>
          <span style={{
            fontSize: 12,
            padding: '4px 10px',
            borderRadius: 6,
            background: statusColor(job.status),
            color: 'white',
          }}>
            {job.status.replace('_', ' ')}
          </span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginTop: 20 }}>
          <div>
            <p style={{ fontSize: 13 }} className="muted">Scheduled</p>
            <p>{job.scheduledFor ? new Date(job.scheduledFor).toLocaleDateString() : '—'}</p>
          </div>
          <div>
            <p style={{ fontSize: 13 }} className="muted">Completed</p>
            <p>{job.completedAt ? new Date(job.completedAt).toLocaleDateString() : '—'}</p>
          </div>
        </div>

        {job.notes && (
          <div style={{ marginTop: 16 }}>
            <p style={{ fontSize: 13 }} className="muted">Notes</p>
            <p>{job.notes}</p>
          </div>
        )}

        {job.technicianName && (
          <div style={{ marginTop: 16 }}>
            <p style={{ fontSize: 13 }} className="muted">Technician</p>
            <p>{job.technicianName}</p>
          </div>
        )}
      </div>

      {/* Proof of work section */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <h2>Proof of work</h2>
        <Link href={`/jobs/${job.id}/proof-of-work` as never} className="button" style={{ fontSize: 14 }}>
          {job.workSummary ? 'Update' : 'Record completion'}
        </Link>
      </div>

      {job.workSummary ? (
        <div className="card" style={{ marginBottom: 16 }}>
          <div>
            <p style={{ fontSize: 13 }} className="muted">Work summary</p>
            <p style={{ whiteSpace: 'pre-wrap' }}>{job.workSummary}</p>
          </div>
          {job.materialsUsed && (
            <div style={{ marginTop: 12 }}>
              <p style={{ fontSize: 13 }} className="muted">Materials used</p>
              <p>{job.materialsUsed}</p>
            </div>
          )}
          {job.completionNotes && (
            <div style={{ marginTop: 12 }}>
              <p style={{ fontSize: 13 }} className="muted">Completion notes</p>
              <p>{job.completionNotes}</p>
            </div>
          )}
        </div>
      ) : (
        <div className="card" style={{ marginBottom: 16 }}>
          <p className="muted">No proof of work recorded yet.</p>
        </div>
      )}

      {/* Estimates section */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <h2>Estimates</h2>
        <Link href={`/estimates/new?jobId=${job.id}` as never} className="button" style={{ fontSize: 14 }}>
          New estimate
        </Link>
      </div>

      {job.estimates.length === 0 ? (
        <div className="card" style={{ marginBottom: 16 }}>
          <p className="muted">No estimates yet for this job.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
          {job.estimates.map((est) => (
            <Link key={est.id} href={`/estimates/${est.id}` as never} style={{ textDecoration: 'none', color: 'inherit' }}>
              <div className="card" style={{ cursor: 'pointer' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <strong>#{est.estimateNumber}</strong>
                    {est.aiDraftUsed && <span className="muted" style={{ marginLeft: 8, fontSize: 12 }}>AI draft</span>}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontWeight: 600 }}>${(est.totalCents / 100).toFixed(2)}</span>
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
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Invoices section */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <h2>Invoices</h2>
        <Link href={`/invoices/new?jobId=${job.id}` as never} className="button" style={{ fontSize: 14 }}>
          New invoice
        </Link>
      </div>

      {job.invoices.length === 0 ? (
        <div className="card" style={{ marginBottom: 16 }}>
          <p className="muted">No invoices yet for this job.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
          {job.invoices.map((inv) => (
            <Link key={inv.id} href={`/invoices/${inv.id}` as never} style={{ textDecoration: 'none', color: 'inherit' }}>
              <div className="card" style={{ cursor: 'pointer' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <strong>#{inv.invoiceNumber}</strong>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontWeight: 600 }}>${(inv.totalCents / 100).toFixed(2)}</span>
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
              </div>
            </Link>
          ))}
        </div>
      )}

      <div className="card">
        <h3>Update status</h3>
        <JobStatusForm jobId={job.id} currentStatus={job.status} />
      </div>
    </main>
  )
}

function statusColor(status: string): string {
  switch (status) {
    case 'draft': return '#6b7280'
    case 'scheduled': return '#2563eb'
    case 'in_progress': return '#d97706'
    case 'completed': return '#059669'
    case 'cancelled': return '#dc2626'
    default: return '#6b7280'
  }
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
