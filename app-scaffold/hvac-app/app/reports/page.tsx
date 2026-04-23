import { requireActiveSubscription } from '@/lib/session'
import { db } from '@/lib/db'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

type FunnelStep = { label: string; reached: boolean; reachedAt?: Date | null }

const earliestCreatedAt = { orderBy: { createdAt: 'asc' as const }, select: { createdAt: true } }

export default async function ReportsPage() {
  const { organizationId, organization } = await requireActiveSubscription()

  const [firstCustomer, firstJob, firstEstimateSent, firstInvoiceSent, firstPayment, weeklyActiveActors] =
    await Promise.all([
      db.customer.findFirst({ where: { organizationId }, ...earliestCreatedAt }),
      db.job.findFirst({ where: { organizationId }, ...earliestCreatedAt }),
      db.estimate.findFirst({ where: { organizationId, status: 'sent' }, ...earliestCreatedAt }),
      db.invoice.findFirst({ where: { organizationId, status: 'sent' }, ...earliestCreatedAt }),
      db.invoice.findFirst({ where: { organizationId, status: 'paid' }, ...earliestCreatedAt }),
      // Schema field is `userId`, not `actorId` — same semantic concept
      // (who fired the event). Null userIds are system/cron-generated
      // events and don't count toward WAU.
      db.activityEvent.groupBy({
        by: ['userId'],
        where: {
          organizationId,
          userId: { not: null },
          createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
          eventName: { not: 'dashboard_viewed' },
        },
      }),
    ])

  const steps: FunnelStep[] = [
    { label: 'Signed up', reached: true, reachedAt: organization.createdAt },
    { label: 'First customer', reached: firstCustomer !== null, reachedAt: firstCustomer?.createdAt },
    { label: 'First job', reached: firstJob !== null, reachedAt: firstJob?.createdAt },
    { label: 'First estimate sent', reached: firstEstimateSent !== null, reachedAt: firstEstimateSent?.createdAt },
    { label: 'First invoice sent', reached: firstInvoiceSent !== null, reachedAt: firstInvoiceSent?.createdAt },
    { label: 'First payment', reached: firstPayment !== null, reachedAt: firstPayment?.createdAt },
  ]

  const completedCount = steps.filter((s) => s.reached).length
  const nextUnreached = steps.find((s) => !s.reached)
  const allComplete = completedCount === steps.length

  return (
    <main className="mx-auto max-w-[800px] px-4 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight">Activation funnel</h1>
        <p className="text-sm text-muted-foreground">{organization.name}</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Quote-to-payment activation</CardTitle>
        </CardHeader>
        <CardContent>
          <ol className="space-y-3">
            {steps.map((step, i) => (
              <li
                key={step.label}
                className={`flex items-center gap-4 rounded-r py-3 pl-4 pr-3 border-l-4 ${
                  step.reached ? 'border-l-emerald-500 bg-emerald-500/5' : 'border-l-slate-200'
                }`}
              >
                <span
                  className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${
                    step.reached ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-muted-foreground'
                  }`}
                >
                  {i + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium">{step.label}</p>
                  {step.reached && (
                    <p className="text-xs text-muted-foreground">
                      Completed {step.reachedAt ? new Date(step.reachedAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }) : '—'}
                    </p>
                  )}
                </div>
                {!step.reached && <Badge variant="secondary" className="text-xs">Not yet</Badge>}
              </li>
            ))}
          </ol>

          <div className="mt-6 border-t pt-4">
            {allComplete ? (
              <>
                <Badge className="bg-emerald-500 text-white hover:bg-emerald-500">Stage 2 complete ✓</Badge>
                <p className="mt-3 text-sm text-muted-foreground">
                  Ready to measure retention. Check back after your first week of active users.
                </p>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">
                <span className="font-medium text-foreground">{completedCount} of {steps.length}</span> steps completed.
                {nextUnreached && <> Next: {nextUnreached.label}.</>}
              </p>
            )}
          </div>

          <div className="pt-4 text-sm text-muted-foreground">
            <span className="font-medium text-foreground">{weeklyActiveActors.length}</span>
            {' '}active user{weeklyActiveActors.length !== 1 ? 's' : ''} in the last 7 days.
          </div>
        </CardContent>
      </Card>
    </main>
  )
}
