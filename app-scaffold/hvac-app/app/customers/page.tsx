import { requireAuth } from '@/lib/session'
import { db } from '@/lib/db'
import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export default async function CustomersPage() {
  const { organizationId } = await requireAuth()

  const customers = await db.customer.findMany({
    where: { organizationId, deletedAt: null },
    orderBy: { createdAt: 'desc' },
  })

  return (
    <main className="max-w-[1200px] mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Customers</h1>
        <Link href="/customers/new" className={cn(buttonVariants(), 'no-underline')}>
          Add customer
        </Link>
      </div>

      {customers.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-muted-foreground">No customers yet. Add your first customer to get started.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {customers.map((customer) => (
            <Link key={customer.id} href={`/customers/${customer.id}` as never} className="no-underline text-inherit">
              <Card className="hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="py-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <span className="font-semibold">{customer.firstName} {customer.lastName || ''}</span>
                      {customer.companyName && (
                        <span className="text-muted-foreground ml-2 text-sm">{customer.companyName}</span>
                      )}
                    </div>
                    <span className="text-sm text-muted-foreground">{customer.phone || customer.email || ''}</span>
                  </div>
                  {customer.city && customer.state && (
                    <p className="text-xs text-muted-foreground mt-1">{customer.city}, {customer.state}</p>
                  )}
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </main>
  )
}
