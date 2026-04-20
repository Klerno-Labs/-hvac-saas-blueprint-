import { requireActiveSubscription } from '@/lib/session'
import { db } from '@/lib/db'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

function startOfMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), 1)
}

function startOfPreviousMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth() - 1, 1)
}

function daysBetween(later: Date, earlier: Date): number {
  return Math.floor((later.getTime() - earlier.getTime()) / (1000 * 60 * 60 * 24))
}

export default async function ReportsPage() {
  const { organizationId, organization } = await requireActiveSubscription()

  const now = new Date()
  const monthStart = startOfMonth(now)
  const prevMonthStart = startOfPreviousMonth(now)
  const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

  const [
    paymentsThisMonth,
    paymentsPrevMonth,
    paymentsLast30,
    invoicesLast90,
    estimatesLast90,
    estimatesAcceptedLast90,
    outstandingInvoices,
    overdueInvoices,
    recentPayments,
    topCustomers,
    syncRecords,
  ] = await Promise.all([
    db.payment.aggregate({
      where: { organizationId, status: 'succeeded', paidAt: { gte: monthStart } },
      _sum: { amountCents: true },
      _count: true,
    }),
    db.payment.aggregate({
      where: { organizationId, status: 'succeeded', paidAt: { gte: prevMonthStart, lt: monthStart } },
      _sum: { amountCents: true },
      _count: true,
    }),
    db.payment.aggregate({
      where: { organizationId, status: 'succeeded', paidAt: { gte: thirtyDaysAgo } },
      _sum: { amountCents: true },
      _count: true,
    }),
    db.invoice.aggregate({
      where: { organizationId, status: { not: 'draft' }, createdAt: { gte: ninetyDaysAgo } },
      _sum: { totalCents: true },
      _count: true,
    }),
    db.estimate.count({
      where: { organizationId, status: { in: ['sent', 'accepted', 'declined'] }, sentAt: { gte: ninetyDaysAgo } },
    }),
    db.estimate.count({
      where: { organizationId, status: 'accepted', sentAt: { gte: ninetyDaysAgo } },
    }),
    db.invoice.findMany({
      where: { organizationId, status: { in: ['sent', 'overdue'] } },
      select: { id: true, invoiceNumber: true, outstandingCents: true, dueDate: true, sentAt: true, customer: { select: { firstName: true, lastName: true } } },
    }),
    db.invoice.findMany({
      where: { organizationId, status: { in: ['sent', 'overdue'] }, dueDate: { lt: now } },
      include: { customer: true },
      orderBy: { dueDate: 'asc' },
      take: 10,
    }),
    db.payment.findMany({
      where: { organizationId, status: 'succeeded' },
      include: { invoice: { select: { invoiceNumber: true, customer: { select: { firstName: true, lastName: true } } } } },
      orderBy: { paidAt: 'desc' },
      take: 10,
    }),
    db.payment.groupBy({
      by: ['invoiceId'],
      where: { organizationId, status: 'succeeded' },
      _sum: { amountCents: true },
      orderBy: { _sum: { amountCents: 'desc' } },
      take: 5,
    }),
    db.accountingSyncRecord.groupBy({ by: ['syncStatus'], where: { organizationId }, _count: true }),
  ])

  const revenueThisMonth = paymentsThisMonth._sum.amountCents || 0
  const revenuePrevMonth = paymentsPrevMonth._sum.amountCents || 0
  const monthChangePct = revenuePrevMonth > 0
    ? Math.round(((revenueThisMonth - revenuePrevMonth) / revenuePrevMonth) * 100)
    : null

  const avgTicketLast30 = (paymentsLast30._count || 0) > 0
    ? Math.round((paymentsLast30._sum.amountCents || 0) / paymentsLast30._count)
    : 0

  const conversionRate = estimatesLast90 > 0
    ? Math.round((estimatesAcceptedLast90 / estimatesLast90) * 100)
    : null

  // AR aging buckets
  const aging = { current: 0, d1to30: 0, d31to60: 0, d61to90: 0, d90plus: 0 }
  for (const inv of outstandingInvoices) {
    if (!inv.dueDate || inv.dueDate >= now) {
      aging.current += inv.outstandingCents
      continue
    }
    const days = daysBetween(now, inv.dueDate)
    if (days <= 30) aging.d1to30 += inv.outstandingCents
    else if (days <= 60) aging.d31to60 += inv.outstandingCents
    else if (days <= 90) aging.d61to90 += inv.outstandingCents
    else aging.d90plus += inv.outstandingCents
  }
  const totalAR = aging.current + aging.d1to30 + aging.d31to60 + aging.d61to90 + aging.d90plus

  // Resolve top customers — need to get customer names
  const topInvoiceIds = topCustomers.map((c) => c.invoiceId)
  const topInvoices = topInvoiceIds.length > 0
    ? await db.invoice.findMany({
        where: { id: { in: topInvoiceIds } },
        select: { id: true, customer: { select: { id: true, firstName: true, lastName: true, companyName: true } } },
      })
    : []
  const customerRevenueMap: Record<string, { name: string; cents: number }> = {}
  for (const tc of topCustomers) {
    const inv = topInvoices.find((i) => i.id === tc.invoiceId)
    if (!inv) continue
    const name = inv.customer.companyName || [inv.customer.firstName, inv.customer.lastName].filter(Boolean).join(' ')
    const key = inv.customer.id
    if (!customerRevenueMap[key]) customerRevenueMap[key] = { name, cents: 0 }
    customerRevenueMap[key].cents += tc._sum.amountCents || 0
  }
  const topCustomersFinal = Object.entries(customerRevenueMap)
    .sort((a, b) => b[1].cents - a[1].cents)
    .slice(0, 5)

  const syncSummary = syncRecords.reduce((acc, r) => { acc[r.syncStatus] = r._count; return acc }, {} as Record<string, number>)

  return (
    <main className="max-w-[1200px] mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight">Reports</h1>
        <p className="text-sm text-muted-foreground">{organization.name}</p>
      </div>

      {/* Headline KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Revenue this month</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{formatCents(revenueThisMonth)}</p>
            {monthChangePct !== null && (
              <p className={`text-xs mt-1 ${monthChangePct >= 0 ? 'text-emerald-600' : 'text-destructive'}`}>
                {monthChangePct >= 0 ? '↑' : '↓'} {Math.abs(monthChangePct)}% vs last month
              </p>
            )}
            {monthChangePct === null && revenuePrevMonth === 0 && (
              <p className="text-xs text-muted-foreground mt-1">First month with revenue</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Avg ticket (30d)</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{formatCents(avgTicketLast30)}</p>
            <p className="text-xs text-muted-foreground mt-1">{paymentsLast30._count || 0} payments</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Estimate conversion</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{conversionRate !== null ? `${conversionRate}%` : '—'}</p>
            <p className="text-xs text-muted-foreground mt-1">{estimatesAcceptedLast90}/{estimatesLast90} accepted (90d)</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Total AR</CardTitle>
          </CardHeader>
          <CardContent>
            <p className={`text-3xl font-bold ${totalAR > 0 ? 'text-amber-600' : 'text-emerald-600'}`}>{formatCents(totalAR)}</p>
            <p className="text-xs text-muted-foreground mt-1">{outstandingInvoices.length} unpaid</p>
          </CardContent>
        </Card>
      </div>

      {/* AR aging */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-lg">AR aging</CardTitle>
          <CardDescription>How long invoices have been outstanding</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
            <AgingBucket label="Current" cents={aging.current} tone="neutral" />
            <AgingBucket label="1–30 days" cents={aging.d1to30} tone="info" />
            <AgingBucket label="31–60 days" cents={aging.d31to60} tone="warn" />
            <AgingBucket label="61–90 days" cents={aging.d61to90} tone="danger" />
            <AgingBucket label="90+ days" cents={aging.d90plus} tone="danger" />
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Top customers */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Top customers</CardTitle>
            <CardDescription>By total revenue paid</CardDescription>
          </CardHeader>
          <CardContent>
            {topCustomersFinal.length === 0 ? (
              <p className="text-sm text-muted-foreground">No revenue yet.</p>
            ) : (
              <div className="space-y-2">
                {topCustomersFinal.map(([id, c], idx) => (
                  <div key={id} className="flex justify-between items-center py-2 border-b last:border-0">
                    <div>
                      <span className="text-xs text-muted-foreground mr-2">#{idx + 1}</span>
                      <span className="text-sm font-medium">{c.name}</span>
                    </div>
                    <span className="text-sm font-semibold">{formatCents(c.cents)}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent payments */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Recent payments</CardTitle>
          </CardHeader>
          <CardContent>
            {recentPayments.length === 0 ? (
              <p className="text-sm text-muted-foreground">No payments received yet.</p>
            ) : (
              recentPayments.map((p) => (
                <div key={p.id} className="flex justify-between py-2 border-b last:border-0">
                  <div>
                    <span className="text-sm font-semibold">{formatCents(p.amountCents)}</span>
                    <span className="text-xs text-muted-foreground ml-2">#{p.invoice.invoiceNumber} — {p.invoice.customer.firstName} {p.invoice.customer.lastName || ''}</span>
                  </div>
                  <span className="text-xs text-muted-foreground">{p.paidAt ? new Date(p.paidAt).toLocaleDateString() : '—'}</span>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      {/* Overdue call list */}
      {overdueInvoices.length > 0 && (
        <Card className="mb-6 border-l-4 border-l-amber-500">
          <CardHeader>
            <CardTitle className="text-lg">Overdue call list</CardTitle>
            <CardDescription>Invoices past due — call these customers</CardDescription>
          </CardHeader>
          <CardContent>
            {overdueInvoices.map((inv) => {
              const daysOverdue = inv.dueDate ? Math.floor((Date.now() - inv.dueDate.getTime()) / (1000 * 60 * 60 * 24)) : 0
              return (
                <Link key={inv.id} href={`/invoices/${inv.id}` as never} className="no-underline text-inherit">
                  <div className="flex justify-between items-center py-2 border-b last:border-0 cursor-pointer hover:bg-muted/50 -mx-2 px-2 rounded">
                    <div>
                      <span className="text-sm font-medium">#{inv.invoiceNumber}</span>
                      <span className="text-xs text-muted-foreground ml-2">{inv.customer.firstName} {inv.customer.lastName || ''}</span>
                      {inv.customer.phone && <span className="text-xs text-primary ml-2">{inv.customer.phone}</span>}
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-semibold text-amber-600">{formatCents(inv.outstandingCents)}</span>
                      <Badge variant={daysOverdue > 60 ? 'destructive' : 'secondary'} className="text-xs">{daysOverdue}d overdue</Badge>
                    </div>
                  </div>
                </Link>
              )
            })}
          </CardContent>
        </Card>
      )}

      {/* Pipeline metric */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-lg">Last 90 days</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <Stat label="Estimates sent" value={`${estimatesLast90}`} />
            <Stat label="Estimates accepted" value={`${estimatesAcceptedLast90}`} />
            <Stat label="Invoices sent" value={`${invoicesLast90._count || 0}`} />
            <Stat label="Total invoiced" value={formatCents(invoicesLast90._sum.totalCents || 0)} />
          </div>
        </CardContent>
      </Card>

      {/* Accounting sync */}
      {organization.accountingConnected && (
        <Card>
          <CardHeader><CardTitle className="text-lg">Accounting sync status</CardTitle></CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <Stat label="Provider" value={organization.accountingProvider || '—'} />
              <Stat label="Synced" value={`${syncSummary['synced'] || 0}`} tone="success" />
              <Stat label="Pending" value={`${syncSummary['pending'] || 0}`} tone="warn" />
              <Stat label="Failed" value={`${syncSummary['failed'] || 0}`} tone={syncSummary['failed'] ? 'danger' : 'neutral'} />
            </div>
            {organization.accountingLastSyncAt && (
              <p className="text-xs text-muted-foreground mt-3">Last sync: {new Date(organization.accountingLastSyncAt).toLocaleString()}</p>
            )}
          </CardContent>
        </Card>
      )}
    </main>
  )
}

function AgingBucket({ label, cents, tone }: { label: string; cents: number; tone: 'neutral' | 'info' | 'warn' | 'danger' }) {
  const color = tone === 'danger' ? 'text-destructive' : tone === 'warn' ? 'text-amber-600' : tone === 'info' ? 'text-foreground' : 'text-muted-foreground'
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={`text-lg font-bold ${color}`}>{formatCents(cents)}</p>
    </div>
  )
}

function Stat({ label, value, tone }: { label: string; value: string; tone?: 'success' | 'warn' | 'danger' | 'neutral' }) {
  const color = tone === 'success' ? 'text-emerald-600' : tone === 'danger' ? 'text-destructive' : tone === 'warn' ? 'text-amber-600' : 'text-foreground'
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={`text-sm font-semibold ${color}`}>{value}</p>
    </div>
  )
}

function formatCents(cents: number): string {
  return '$' + (cents / 100).toFixed(2)
}
