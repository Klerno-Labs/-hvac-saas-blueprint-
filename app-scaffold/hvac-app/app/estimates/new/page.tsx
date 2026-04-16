import { requireAuth } from '@/lib/session'
import { db } from '@/lib/db'
import { notFound, redirect } from 'next/navigation'
import { EstimateForm } from './form'

export default async function NewEstimatePage({ searchParams }: { searchParams: Promise<{ jobId?: string }> }) {
  const { organizationId } = await requireAuth()
  const { jobId } = await searchParams

  if (!jobId) {
    redirect('/jobs')
  }

  const job = await db.job.findFirst({
    where: { id: jobId, organizationId },
    include: { customer: true },
  })

  if (!job) {
    notFound()
  }

  return (
    <main>
      <div className="card" style={{ maxWidth: 700, margin: '0 auto' }}>
        <h1>New estimate</h1>
        <p className="muted">
          For job: <strong>{job.title}</strong> — {job.customer.firstName} {job.customer.lastName || ''}
        </p>
        <EstimateForm
          jobId={job.id}
          jobTitle={job.title}
        />
      </div>
    </main>
  )
}
