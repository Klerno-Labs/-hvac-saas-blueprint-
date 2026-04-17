import { requireActiveSubscription } from '@/lib/session'
import { db } from '@/lib/db'
import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Pagination } from '@/app/components/pagination'
import { SearchInput } from '@/app/components/search-input'

const PAGE_SIZE = 20

const INVOICE_STATUSES = ['draft', 'sent', 'paid', 'overdue', 'void'] as const

export default async function InvoicesPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; q?: string; status?: string }>
}) {
  const { organizationId } = await requireActiveSubscription()
  const params = await searchParams
  const page = Math.max(1, parseInt(params.page || '1', 10) || 1)
  const q = params.q?.trim() || ''
  const statusFilter = params.status || ''

  const where: Record<string, unknown> = { organizationId }

  if (statusFilter && INVOICE_STATUSES.includes(statusFilter as (typeof INVOICE_STATUSES)[number])) {
    where.status = statusFilter
  }

  if (q) {
    where.OR = [
      { invoiceNumber: { contains: q, mode: 'insensitive' } },
      { customer: { firstName: { contains: q, mode: 'insensitive' } } },
      { customer: { lastName: { contains: q, mode: 'insensitive' } } },
    ]
  }

  const [invoices, totalCount] = await Promise.all([
    db.invoice.findMany({
      where,
      include: { job: true, customer: true },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    db.invoice.count({ where }),
  ])

  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE))
  const spParams: Record<string, string> = {}
  if (q) spParams.q = q
  if (statusFilter) spParams.status = statusFilter

  return (
    <main className="max-w-[1200px] mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Invoices</h1>
      </div>

      <div className="flex flex-wrap items-end gap-4 mb-6">
        <SearchInput
          action="/invoices"
          defaultValue={q}
          placeholder="Search by invoice number or customer name..."
          hiddenInputs={statusFilter ? { status: statusFilter } : undefined}
        />
      </div>

      <div className="flex gap-2 mb-4 flex-wrap">
        <Link href="/invoices">
          <Badge variant={!statusFilter ? 'default' : 'outline'} className="cursor-pointer">All</Badge>
        </Link>
        {INVOICE_STATUSES.map((s) => (
          <Link key={s} href={`/invoices?status=${s}${q ? `&q=${encodeURIComponent(q)}` : ''}`}>
            <Badge variant={statusFilter === s ? 'default' : 'outline'} className="cursor-pointer">
              {s}
            </Badge>
          </Link>
        ))}
      </div>

      {invoices.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-muted-foreground">
              {q || statusFilter ? 'No invoices match your filters.' : 'No invoices yet. Create an invoice from a job detail page.'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="space-y-2">
            {invoices.map((inv) => (
              <Link key={inv.id} href={`/invoices/${inv.id}` as never} className="no-underline text-inherit">
                <Card className="hover:shadow-md transition-shadow cursor-pointer">
                  <CardContent className="py-4">
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1 sm:gap-2">
                      <div className="min-w-0 truncate">
                        <span className="font-semibold">#{inv.invoiceNumber}</span>
                        <span className="text-sm text-muted-foreground ml-2">
                          {inv.job.title} — {inv.customer.firstName} {inv.customer.lastName || ''}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
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
          <Pagination currentPage={page} totalPages={totalPages} basePath="/invoices" searchParams={spParams} />
        </>
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
