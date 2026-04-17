import { db } from '@/lib/db'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { dismissOnboarding } from '@/app/dashboard/dismiss-onboarding-action'

export async function GettingStartedChecklist({ organizationId }: { organizationId: string }) {
  const [customerCount, jobCount, sentEstimateCount, paidInvoiceCount] = await Promise.all([
    db.customer.count({ where: { organizationId, deletedAt: null } }),
    db.job.count({ where: { organizationId } }),
    db.estimate.count({ where: { organizationId, status: { in: ['sent', 'accepted'] } } }),
    db.invoice.count({ where: { organizationId, status: 'paid' } }),
  ])

  const steps = [
    { done: customerCount > 0, title: 'Add your first customer', href: '/customers/new' as const },
    { done: jobCount > 0, title: 'Create your first job', href: '/jobs/new' as const },
    { done: sentEstimateCount > 0, title: 'Send an estimate', href: '/estimates' as const },
    { done: paidInvoiceCount > 0, title: 'Collect your first payment', href: '/invoices' as const },
  ]

  const completedCount = steps.filter((s) => s.done).length
  if (completedCount === steps.length) return null

  return (
    <Card className="mb-6 border-primary/30 bg-primary/5">
      <CardHeader className="flex flex-row items-start justify-between">
        <div>
          <CardTitle className="text-lg">Getting started</CardTitle>
          <CardDescription>{completedCount} of {steps.length} complete</CardDescription>
        </div>
        <form action={dismissOnboarding}>
          <button type="submit" className="text-xs text-muted-foreground hover:underline cursor-pointer">Dismiss</button>
        </form>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {steps.map((step) => (
            <Link key={step.title} href={step.href} className="no-underline text-inherit">
              <div className="flex items-center gap-3 py-2 px-3 rounded-md hover:bg-background transition-colors cursor-pointer">
                <Badge variant={step.done ? 'default' : 'outline'} className="text-[10px] w-5 h-5 justify-center p-0 rounded-full">
                  {step.done ? '✓' : ''}
                </Badge>
                <span className={`text-sm ${step.done ? 'line-through text-muted-foreground' : ''}`}>
                  {step.title}
                </span>
              </div>
            </Link>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
