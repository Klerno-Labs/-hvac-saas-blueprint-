import { requireAuth } from '@/lib/session'
import { db } from '@/lib/db'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

export default async function ReportsPage() {
  const { organizationId, organization } = await requireAuth()

  const [
    totalInvoicedResult,
    totalPaidResult,
    invoicesByStatus,
    overdueInvoices,
    recentPayments,
    syncRecords,
  ] = await Promise.all([
    db.invoice.aggregate({ where: { organizationId, status: { not: 'draft' } }, _sum: { totalCents: true }, _count: true }),
    db.invoice.aggregate({ where: { organizationId, status: 'paid' }, _sum: { totalCents: true }, _count: true }),
    db.invoice.groupBy({ by: ['status'], where: { organizationId }, _count: true, _sum: { totalCents: true, outstandingCents: true } }),
    db.invoice.findMany({ where: { organizationId, status: { in: ['sent', 'overdue'] }, dueDate: { lt: new Date() } }, include: { customer: true }, orderBy: { dueDate: 'asc' }, take: 10 }),
    db.payment.findMany({ where: { organizationId, status: 'succeeded' }, include: { invoice: { select: { invoiceNumber: true, customer: { select: { firstName: true, lastName: true } } } } }, orderBy: { paidAt: 'desc' }, take: 10 }),
    db.accountingSyncRecord.groupBy({ by: ['syncStatus'], where: { organizationId }, _count: true }),
  ])

  const totalInvoicedCents = totalInvoicedResult._sum.totalCents || 0
  const totalInvoiceCount = totalInvoicedResult._count
  const totalPaidCents = totalPaidResult._sum.totalCents || 0
  const totalPaidCount = totalPaidResult._count
  const totalOutstandingCents = totalInvoicedCents - totalPaidCents

  const statusBreakdown = invoicesByStatus.map((s) => ({
    status: s.status, count: s._count, totalCents: s._sum.totalCents || 0, outstandingCents: s._sum.outstandingCents || 0,
  }))

  const syncSummary = syncRecords.reduce((acc, r) => { acc[r.syncStatus] = r._count; return acc }, {} as Record<string, number>)

  return (
    <main className="max-w-300 mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight">Reports</h1>
        <p className="text-sm text-muted-foreground">{organization.name}</p>
      </div>

      {/* Receivables overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total invoiced</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{formatCents(totalInvoicedCents)}</p>
            <p className="text-xs text-muted-foreground mt-1">{totalInvoiceCount} invoice{totalInvoiceCount !== 1 ? 's' : ''}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total collected</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-emerald-600">{formatCents(totalPaidCents)}</p>
            <p className="text-xs text-muted-foreground mt-1">{totalPaidCount} paid</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Outstanding</CardTitle>
          </CardHeader>
          <CardContent>
            <p className={`text-3xl font-bold ${totalOutstandingCents > 0 ? 'text-amber-600' : 'text-emerald-600'}`}>
              {formatCents(totalOutstandingCents)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Invoice status breakdown */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-lg">Invoice breakdown by status</CardTitle>
        </CardHeader>
        <CardContent>
          {statusBreakdown.length === 0 ? (
            <p className="text-sm text-muted-foreground">No invoices yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 px-1 text-xs font-semibold text-muted-foreground">Status</th>
                    <th className="text-right py-2 px-1 text-xs font-semibold text-muted-foreground">Count</th>
                    <th className="text-right py-2 px-1 text-xs font-semibold text-muted-foreground">Total</th>
                    <th className="text-right py-2 px-1 text-xs font-semibold text-muted-foreground">Outstanding</th>
                  </tr>
                </thead>
                <tbody>
                  {statusBreakdown.map((s) => (
                    <tr key={s.status} className="border-b">
                      <td className="py-2 px-1"><Badge variant={s.status === 'paid' ? 'default' : s.status === 'void' ? 'destructive' : 'secondary'}>{s.status}</Badge></td>
                      <td className="text-right py-2 px-1">{s.count}</td>
                      <td className="text-right py-2 px-1">{formatCents(s.totalCents)}</td>
                      <td className="text-right py-2 px-1">{formatCents(s.outstandingCents)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Overdue invoices */}
        {overdueInvoices.length > 0 && (
          <Card className="border-l-4 border-l-amber-500">
            <CardHeader><CardTitle className="text-lg">Overdue invoices</CardTitle></CardHeader>
            <CardContent>
              {overdueInvoices.map((inv) => {
                const daysOverdue = inv.dueDate ? Math.floor((Date.now() - inv.dueDate.getTime()) / (1000 * 60 * 60 * 24)) : 0
                return (
                  <Link key={inv.id} href={`/invoices/${inv.id}` as never} className="no-underline text-inherit">
                    <div className="flex justify-between py-2 border-b cursor-pointer hover:bg-muted/50 -mx-2 px-2 rounded">
                      <div>
                        <span className="text-sm font-medium">#{inv.invoiceNumber}</span>
                        <span className="text-xs text-muted-foreground ml-2">{inv.customer.firstName} {inv.customer.lastName || ''}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-amber-600">{formatCents(inv.outstandingCents)}</span>
                        <span className="text-xs text-muted-foreground">{daysOverdue}d</span>
                      </div>
                    </div>
                  </Link>
                )
              })}
            </CardContent>
          </Card>
        )}

        {/* Recent payments */}
        <Card>
          <CardHeader><CardTitle className="text-lg">Recent payments</CardTitle></CardHeader>
          <CardContent>
            {recentPayments.length === 0 ? (
              <p className="text-sm text-muted-foreground">No payments received yet.</p>
            ) : (
              recentPayments.map((p) => (
                <div key={p.id} className="flex justify-between py-2 border-b">
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

      {/* Accounting sync */}
      {organization.accountingConnected && (
        <Card>
          <CardHeader><CardTitle className="text-lg">Accounting sync status</CardTitle></CardHeader>
          <CardContent>
            <div className="grid grid-cols-4 gap-4">
              <div><p className="text-xs text-muted-foreground">Provider</p><p className="text-sm font-semibold">{organization.accountingProvider || '—'}</p></div>
              <div><p className="text-xs text-muted-foreground">Synced</p><p className="text-sm font-semibold text-emerald-600">{syncSummary['synced'] || 0}</p></div>
              <div><p className="text-xs text-muted-foreground">Pending</p><p className="text-sm font-semibold text-amber-600">{syncSummary['pending'] || 0}</p></div>
              <div><p className="text-xs text-muted-foreground">Failed</p><p className={`text-sm font-semibold ${(syncSummary['failed'] || 0) > 0 ? 'text-destructive' : 'text-muted-foreground'}`}>{syncSummary['failed'] || 0}</p></div>
            </div>
            {organization.accountingLastSyncAt && (
              <p className="text-xs text-muted-foreground mt-2">Last sync: {new Date(organization.accountingLastSyncAt).toLocaleString()}</p>
            )}
          </CardContent>
        </Card>
      )}
    </main>
  )
}

function formatCents(cents: number): string {
  return '$' + (cents / 100).toFixed(2)
}
