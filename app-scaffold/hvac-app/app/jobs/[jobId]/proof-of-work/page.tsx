import { requireAuth } from '@/lib/session'
import { db } from '@/lib/db'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ProofOfWorkForm } from './form'

export default async function ProofOfWorkPage({ params }: { params: Promise<{ jobId: string }> }) {
  const { organizationId } = await requireAuth()
  const { jobId } = await params

  const job = await db.job.findFirst({
    where: { id: jobId, organizationId },
    include: { customer: true },
  })

  if (!job) {
    notFound()
  }

  return (
    <main>
      <div style={{ marginBottom: 20 }}>
        <Link href={`/jobs/${job.id}` as never} className="muted" style={{ fontSize: 13 }}>
          &larr; Back to job
        </Link>
      </div>

      <div className="card" style={{ maxWidth: 600, margin: '0 auto' }}>
        <h1>Record proof of work</h1>
        <p className="muted">
          Job: <strong>{job.title}</strong> — {job.customer.firstName} {job.customer.lastName || ''}
        </p>

        {job.workSummary && (
          <div style={{ marginTop: 16, padding: '12px 16px', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 8 }}>
            <p style={{ fontSize: 13, fontWeight: 600, color: '#059669' }}>Proof of work already recorded</p>
            <p style={{ fontSize: 13, marginTop: 4 }}>You can update the details below.</p>
          </div>
        )}

        <ProofOfWorkForm
          jobId={job.id}
          initialData={{
            workSummary: job.workSummary || '',
            materialsUsed: job.materialsUsed || '',
            completionNotes: job.completionNotes || '',
            technicianName: job.technicianName || '',
          }}
        />
      </div>
    </main>
  )
}
