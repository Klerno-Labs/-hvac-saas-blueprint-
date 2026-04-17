import { requireActiveSubscription } from '@/lib/session'
import { db } from '@/lib/db'
import Link from 'next/link'
import { NewRecurringJobForm } from './form'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default async function NewRecurringJobPage() {
  const { organizationId } = await requireActiveSubscription()

  const customers = await db.customer.findMany({
    where: { organizationId, deletedAt: null },
    orderBy: { firstName: 'asc' },
    select: { id: true, firstName: true, lastName: true, companyName: true },
  })

  return (
    <main className="max-w-xl mx-auto px-4 py-8">
      <Card>
        <CardHeader>
          <CardTitle>New recurring job</CardTitle>
          <CardDescription>Set up a maintenance contract or recurring service.</CardDescription>
        </CardHeader>
        <CardContent>
          {customers.length === 0 ? (
            <p className="text-sm">
              You need to <Link href="/customers/new" className="text-primary hover:underline">add a customer</Link> first.
            </p>
          ) : (
            <NewRecurringJobForm customers={customers} />
          )}
        </CardContent>
      </Card>
    </main>
  )
}
