import { requireAuth } from '@/lib/session'
import { db } from '@/lib/db'
import { NewJobForm } from './form'

export default async function NewJobPage({ searchParams }: { searchParams: Promise<{ customerId?: string }> }) {
  const { organizationId } = await requireAuth()
  const { customerId } = await searchParams

  const customers = await db.customer.findMany({
    where: { organizationId },
    orderBy: { firstName: 'asc' },
    select: { id: true, firstName: true, lastName: true, companyName: true },
  })

  return (
    <main>
      <div className="card" style={{ maxWidth: 540, margin: '0 auto' }}>
        <h1>New job</h1>
        <p className="muted">Create a job for one of your customers.</p>

        {customers.length === 0 ? (
          <p style={{ marginTop: 16 }}>
            You need to <a href="/customers/new" style={{ color: 'var(--primary)' }}>add a customer</a> first.
          </p>
        ) : (
          <NewJobForm customers={customers} preselectedCustomerId={customerId} />
        )}
      </div>
    </main>
  )
}
