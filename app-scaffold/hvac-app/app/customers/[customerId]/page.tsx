import { requireAuth } from '@/lib/session'
import { db } from '@/lib/db'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { PortalLinkSection } from './portal-link'

export default async function CustomerDetailPage({ params }: { params: Promise<{ customerId: string }> }) {
  const { organizationId } = await requireAuth()
  const { customerId } = await params

  const customer = await db.customer.findFirst({
    where: { id: customerId, organizationId },
    include: {
      jobs: {
        orderBy: { createdAt: 'desc' },
        take: 20,
      },
    },
  })

  if (!customer) {
    notFound()
  }

  return (
    <main>
      <div style={{ marginBottom: 20 }}>
        <Link href="/customers" className="muted" style={{ fontSize: 13 }}>
          &larr; All customers
        </Link>
      </div>

      <div className="card" style={{ marginBottom: 16 }}>
        <h1>{customer.firstName} {customer.lastName || ''}</h1>
        {customer.companyName && <p className="muted">{customer.companyName}</p>}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginTop: 16 }}>
          <div>
            <p style={{ fontSize: 13 }} className="muted">Phone</p>
            <p>{customer.phone || '—'}</p>
          </div>
          <div>
            <p style={{ fontSize: 13 }} className="muted">Email</p>
            <p>{customer.email || '—'}</p>
          </div>
        </div>

        {(customer.addressLine1 || customer.city) && (
          <div style={{ marginTop: 16 }}>
            <p style={{ fontSize: 13 }} className="muted">Address</p>
            <p>
              {customer.addressLine1 && <>{customer.addressLine1}<br /></>}
              {customer.addressLine2 && <>{customer.addressLine2}<br /></>}
              {[customer.city, customer.state].filter(Boolean).join(', ')}
              {customer.postalCode && ` ${customer.postalCode}`}
            </p>
          </div>
        )}

        {customer.notes && (
          <div style={{ marginTop: 16 }}>
            <p style={{ fontSize: 13 }} className="muted">Notes</p>
            <p>{customer.notes}</p>
          </div>
        )}
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <h2>Jobs</h2>
        <Link href={`/jobs/new?customerId=${customer.id}` as never} className="button" style={{ fontSize: 14 }}>
          New job
        </Link>
      </div>

      {customer.jobs.length === 0 ? (
        <div className="card">
          <p className="muted">No jobs yet for this customer.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {customer.jobs.map((job) => (
            <Link key={job.id} href={`/jobs/${job.id}` as never} style={{ textDecoration: 'none', color: 'inherit' }}>
              <div className="card" style={{ cursor: 'pointer' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <strong>{job.title}</strong>
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

      <div className="card" style={{ marginTop: 16 }}>
        <h2>Customer portal</h2>
        <PortalLinkSection customerId={customer.id} />
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
