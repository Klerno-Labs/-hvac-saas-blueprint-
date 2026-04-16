import { requireAuth } from '@/lib/session'
import { db } from '@/lib/db'
import Link from 'next/link'

export default async function CustomersPage() {
  const { organizationId } = await requireAuth()

  const customers = await db.customer.findMany({
    where: { organizationId },
    orderBy: { createdAt: 'desc' },
  })

  return (
    <main>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h1>Customers</h1>
        <Link href="/customers/new" className="button">Add customer</Link>
      </div>

      {customers.length === 0 ? (
        <div className="card">
          <p className="muted">No customers yet. Add your first customer to get started.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {customers.map((customer) => (
            <Link
              key={customer.id}
              href={`/customers/${customer.id}` as never}
              style={{ textDecoration: 'none', color: 'inherit' }}
            >
              <div className="card" style={{ cursor: 'pointer' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <strong>{customer.firstName} {customer.lastName || ''}</strong>
                    {customer.companyName && (
                      <span className="muted" style={{ marginLeft: 8 }}>{customer.companyName}</span>
                    )}
                  </div>
                  <span className="muted" style={{ fontSize: 13 }}>{customer.phone || customer.email || ''}</span>
                </div>
                {customer.city && customer.state && (
                  <p className="muted" style={{ fontSize: 13, marginTop: 4 }}>
                    {customer.city}, {customer.state}
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
