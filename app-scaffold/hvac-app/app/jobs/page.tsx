import { requireAuth } from '@/lib/session'
import { db } from '@/lib/db'
import Link from 'next/link'

export default async function JobsPage() {
  const { organizationId } = await requireAuth()

  const jobs = await db.job.findMany({
    where: { organizationId },
    include: { customer: true },
    orderBy: { createdAt: 'desc' },
  })

  return (
    <main>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h1>Jobs</h1>
        <Link href="/jobs/new" className="button">New job</Link>
      </div>

      {jobs.length === 0 ? (
        <div className="card">
          <p className="muted">No jobs yet. Create your first job to get started.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {jobs.map((job) => (
            <Link key={job.id} href={`/jobs/${job.id}` as never} style={{ textDecoration: 'none', color: 'inherit' }}>
              <div className="card" style={{ cursor: 'pointer' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <strong>{job.title}</strong>
                    <span className="muted" style={{ marginLeft: 8, fontSize: 13 }}>
                      {job.customer.firstName} {job.customer.lastName || ''}
                    </span>
                  </div>
                  <span style={{
                    fontSize: 12,
                    padding: '2px 8px',
                    borderRadius: 6,
                    background: statusColor(job.status),
                    color: 'white',
                  }}>
                    {job.status.replace('_', ' ')}
                  </span>
                </div>
                {job.scheduledFor && (
                  <p className="muted" style={{ fontSize: 13, marginTop: 4 }}>
                    Scheduled: {new Date(job.scheduledFor).toLocaleDateString()}
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
