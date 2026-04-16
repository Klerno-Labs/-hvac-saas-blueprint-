import { requireAuth } from '@/lib/session'
import { db } from '@/lib/db'
import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

export default async function EstimatesPage() {
  const { organizationId } = await requireAuth()

  const estimates = await db.estimate.findMany({
    where: { organizationId },
    include: { job: { include: { customer: true } } },
    orderBy: { createdAt: 'desc' },
  })

  return (
    <main className="max-w-[1200px] mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Estimates</h1>
      </div>

      {estimates.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-muted-foreground">No estimates yet. Create an estimate from a job detail page.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {estimates.map((est) => (
            <Link key={est.id} href={`/estimates/${est.id}` as never} className="no-underline text-inherit">
              <Card className="hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="py-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <span className="font-semibold">#{est.estimateNumber}</span>
                      <span className="text-sm text-muted-foreground ml-2">
                        {est.job.title} — {est.job.customer.firstName} {est.job.customer.lastName || ''}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-semibold">{formatCents(est.totalCents)}</span>
                      <Badge variant={est.status === 'accepted' ? 'default' : est.status === 'declined' ? 'destructive' : 'secondary'}>
                        {est.status}
                      </Badge>
                    </div>
                  </div>
                  {est.aiDraftUsed && (
                    <p className="text-xs text-muted-foreground mt-1">AI-assisted draft</p>
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
