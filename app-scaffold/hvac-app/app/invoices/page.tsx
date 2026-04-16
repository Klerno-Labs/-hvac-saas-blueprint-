import { requireAuth } from '@/lib/session'
import { db } from '@/lib/db'
import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

export default async function InvoicesPage() {
  const { organizationId } = await requireAuth()

  const invoices = await db.invoice.findMany({
    where: { organizationId },
    include: { job: true, customer: true },
    orderBy: { createdAt: 'desc' },
  })

  return (
    <main className="max-w-[1200px] mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Invoices</h1>
      </div>

      {invoices.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-muted-foreground">No invoices yet. Create an invoice from a job detail page.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {invoices.map((inv) => (
            <Link key={inv.id} href={`/invoices/${inv.id}` as never} className="no-underline text-inherit">
              <Card className="hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="py-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <span className="font-semibold">#{inv.invoiceNumber}</span>
                      <span className="text-sm text-muted-foreground ml-2">
                        {inv.job.title} — {inv.customer.firstName} {inv.customer.lastName || ''}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-semibold">{formatCents(inv.totalCents)}</span>
                      <Badge variant={invoiceVariant(inv.status)}>{inv.status}</Badge>
                    </div>
                  </div>
                  {inv.dueDate && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Due: {new Date(inv.dueDate).toLocaleDateString()}
                    </p>
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

function formatCents(cents: number): string {
  return '$' + (cents / 100).toFixed(2)
}

function invoiceVariant(status: string): 'default' | 'secondary' | 'destructive' | 'outline' {
  switch (status) {
    case 'paid': return 'default'
    case 'void': return 'destructive'
    case 'overdue': return 'destructive'
    case 'sent': return 'outline'
    default: return 'secondary'
  }
}
