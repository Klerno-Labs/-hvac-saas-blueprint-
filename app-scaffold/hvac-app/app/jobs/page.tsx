import { requireAuth } from '@/lib/session'
import { db } from '@/lib/db'
import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export default async function JobsPage() {
  const { organizationId } = await requireAuth()

  const jobs = await db.job.findMany({
    where: { organizationId },
    include: { customer: true },
    orderBy: { createdAt: 'desc' },
  })

  return (
    <main className="max-w-300 mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Jobs</h1>
        <Link href="/jobs/new" className={cn(buttonVariants(), 'no-underline')}>New job</Link>
      </div>

      {jobs.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-muted-foreground">No jobs yet. Create your first job to get started.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {jobs.map((job) => (
            <Link key={job.id} href={`/jobs/${job.id}` as never} className="no-underline text-inherit">
              <Card className="hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="py-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <span className="font-semibold">{job.title}</span>
                      <span className="text-sm text-muted-foreground ml-2">
                        {job.customer.firstName} {job.customer.lastName || ''}
                      </span>
                    </div>
                    <Badge variant={statusVariant(job.status)}>{job.status.replace('_', ' ')}</Badge>
                  </div>
                  {job.scheduledFor && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Scheduled: {new Date(job.scheduledFor).toLocaleDateString()}
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

function statusVariant(status: string): 'default' | 'secondary' | 'destructive' | 'outline' {
  switch (status) {
    case 'completed': return 'default'
    case 'cancelled': return 'destructive'
    case 'in_progress': return 'outline'
    default: return 'secondary'
  }
}
