import { requireActiveSubscription } from '@/lib/session'
import { db } from '@/lib/db'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

export default async function DashboardPage() {
  const { organization, organizationId } = await requireActiveSubscription()

  const [
    customerCount,
    activeJobCount,
    completedJobCount,
    draftEstimateCount,
    sentEstimateCount,
    outstandingInvoices,
    openReminders,
    recentActivity,
    overdueInvoices,
    stalledJobs,
  ] = await Promise.all([
    db.customer.count({ where: { organizationId } }),
    db.job.count({ where: { organizationId, status: { in: ['draft', 'scheduled', 'in_progress'] } } }),
    db.job.count({ where: { organizationId, status: 'completed' } }),
    db.estimate.count({ where: { organizationId, status: 'draft' } }),
    db.estimate.count({ where: { organizationId, status: 'sent' } }),
    db.invoice.findMany({
      where: { organizationId, status: { notIn: ['paid', 'void'] } },
      include: { customer: true },
      orderBy: { createdAt: 'desc' },
      take: 10,
    }),
    db.reminder.findMany({
      where: { organizationId, status: 'open' },
      orderBy: { dueAt: 'asc' },
      take: 5,
    }),
    db.activityEvent.findMany({
      where: { organizationId, eventName: { not: 'dashboard_viewed' } },
      orderBy: { createdAt: 'desc' },
      take: 10,
    }),
    db.invoice.findMany({
      where: { organizationId, status: 'sent', dueDate: { lt: new Date() } },
      include: { customer: true },
      take: 5,
    }),
    db.job.findMany({
      where: { organizationId, status: 'in_progress', updatedAt: { lt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } },
      include: { customer: true },
      take: 5,
    }),
  ])

  const totalOutstandingCents = outstandingInvoices.reduce((sum, inv) => sum + inv.outstandingCents, 0)

  return (
    <main className="max-w-[1200px] mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-sm text-muted-foreground">{organization.name}</p>
      </div>

      {/* Metric cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Link href="/customers" className="no-underline text-inherit">
          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Customers</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{customerCount}</p>
            </CardContent>
          </Card>
        </Link>
        <Link href="/jobs" className="no-underline text-inherit">
          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Active jobs</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{activeJobCount}</p>
              <p className="text-xs text-muted-foreground mt-1">{completedJobCount} completed</p>
            </CardContent>
          </Card>
        </Link>
        <Link href="/invoices" className="no-underline text-inherit">
          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Outstanding</CardTitle>
            </CardHeader>
            <CardContent>
              <p className={`text-3xl font-bold ${totalOutstandingCents > 0 ? 'text-amber-600' : 'text-emerald-600'}`}>
                {formatCents(totalOutstandingCents)}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {outstandingInvoices.length} invoice{outstandingInvoices.length !== 1 ? 's' : ''}
              </p>
            </CardContent>
          </Card>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <Link href="/estimates" className="no-underline text-inherit">
          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Draft estimates</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{draftEstimateCount}</p>
              <p className="text-xs text-muted-foreground mt-1">{sentEstimateCount} sent</p>
            </CardContent>
          </Card>
        </Link>
        <Link href="/reminders" className="no-underline text-inherit">
          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Open reminders</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{openReminders.length}</p>
            </CardContent>
          </Card>
        </Link>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Stripe</CardTitle>
          </CardHeader>
          <CardContent>
            <Badge variant={organization.stripeChargesEnabled ? 'default' : 'secondary'}>
              {organization.stripeChargesEnabled ? 'Connected' : 'Not connected'}
            </Badge>
          </CardContent>
        </Card>
      </div>

      {/* Attention needed */}
      {(overdueInvoices.length > 0 || stalledJobs.length > 0) && (
        <Card className="mb-6 border-l-4 border-l-amber-500">
          <CardHeader>
            <CardTitle className="text-lg">Needs attention</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {overdueInvoices.length > 0 && (
              <div>
                <p className="text-sm font-semibold mb-2">Overdue invoices</p>
                {overdueInvoices.map((inv) => (
                  <Link key={inv.id} href={`/invoices/${inv.id}` as never} className="no-underline text-inherit">
                    <div className="flex justify-between py-2 border-b cursor-pointer hover:bg-muted/50 -mx-2 px-2 rounded">
                      <span className="text-sm">#{inv.invoiceNumber} — {inv.customer.firstName} {inv.customer.lastName || ''}</span>
                      <span className="text-sm font-semibold text-amber-600">{formatCents(inv.outstandingCents)}</span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
            {stalledJobs.length > 0 && (
              <div>
                <p className="text-sm font-semibold mb-2">Stalled jobs (no update in 7+ days)</p>
                {stalledJobs.map((job) => (
                  <Link key={job.id} href={`/jobs/${job.id}` as never} className="no-underline text-inherit">
                    <div className="flex justify-between py-2 border-b cursor-pointer hover:bg-muted/50 -mx-2 px-2 rounded">
                      <span className="text-sm">{job.title} — {job.customer.firstName} {job.customer.lastName || ''}</span>
                      <Badge variant="secondary" className="text-xs">{job.status.replace('_', ' ')}</Badge>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Outstanding invoices */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">Outstanding invoices</CardTitle>
            <Link href="/invoices" className="text-xs text-muted-foreground hover:underline">View all</Link>
          </CardHeader>
          <CardContent>
            {outstandingInvoices.length === 0 ? (
              <p className="text-sm text-muted-foreground">No outstanding invoices.</p>
            ) : (
              outstandingInvoices.map((inv) => (
                <Link key={inv.id} href={`/invoices/${inv.id}` as never} className="no-underline text-inherit">
                  <div className="flex justify-between items-center py-2 border-b cursor-pointer hover:bg-muted/50 -mx-2 px-2 rounded">
                    <div>
                      <span className="text-sm font-medium">#{inv.invoiceNumber}</span>
                      <span className="text-xs text-muted-foreground ml-2">
                        {inv.customer.firstName} {inv.customer.lastName || ''}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold">{formatCents(inv.outstandingCents)}</span>
                      <Badge variant="outline" className="text-[10px]">{inv.status}</Badge>
                    </div>
                  </div>
                </Link>
              ))
            )}
          </CardContent>
        </Card>

        {/* Recent activity */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Recent activity</CardTitle>
          </CardHeader>
          <CardContent>
            {recentActivity.length === 0 ? (
              <p className="text-sm text-muted-foreground">No activity yet.</p>
            ) : (
              recentActivity.map((event) => (
                <div key={event.id} className="flex justify-between py-2 border-b">
                  <span className="text-sm">{formatEventName(event.eventName)}</span>
                  <span className="text-xs text-muted-foreground">
                    {new Date(event.createdAt).toLocaleDateString()}{' '}
                    {new Date(event.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </main>
  )
}

function formatCents(cents: number): string {
  return '$' + (cents / 100).toFixed(2)
}

function formatEventName(name: string): string {
  return name.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
}
