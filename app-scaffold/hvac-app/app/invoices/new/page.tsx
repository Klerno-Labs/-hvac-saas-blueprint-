import { requireAuth } from '@/lib/session'
import { db } from '@/lib/db'
import { notFound, redirect } from 'next/navigation'
import { InvoiceForm } from './form'

export default async function NewInvoicePage({ searchParams }: { searchParams: Promise<{ jobId?: string }> }) {
  const { organizationId } = await requireAuth()
  const { jobId } = await searchParams

  if (!jobId) {
    redirect('/jobs')
  }

  const job = await db.job.findFirst({
    where: { id: jobId, organizationId },
    include: {
      customer: true,
      estimates: {
        where: { status: 'accepted' },
        include: { lineItems: { orderBy: { sortOrder: 'asc' } } },
        orderBy: { createdAt: 'desc' },
        take: 1,
      },
    },
  })

  if (!job) {
    notFound()
  }

  // Seed from accepted estimate if available
  const acceptedEstimate = job.estimates[0] || null
  const seedDescription = job.workSummary
    || acceptedEstimate?.scopeOfWork
    || `Work performed for ${job.title}`
  const seedLineItems = acceptedEstimate?.lineItems.map((li) => ({
    name: li.name,
    description: li.description || '',
    quantity: li.quantity,
    unitPriceCents: li.unitPriceCents,
  })) || [{ name: job.title, description: 'Service as described', quantity: 1, unitPriceCents: 0 }]
  const seedTaxCents = acceptedEstimate?.taxCents || 0

  return (
    <main>
      <div className="card" style={{ maxWidth: 700, margin: '0 auto' }}>
        <h1>New invoice</h1>
        <p className="muted">
          For job: <strong>{job.title}</strong> — {job.customer.firstName} {job.customer.lastName || ''}
        </p>
        {acceptedEstimate && (
          <p style={{ fontSize: 13, color: '#059669', marginTop: 4 }}>
            Seeded from accepted estimate #{acceptedEstimate.estimateNumber}
          </p>
        )}
        {job.workSummary && !acceptedEstimate && (
          <p style={{ fontSize: 13, color: '#2563eb', marginTop: 4 }}>
            Seeded from proof of work summary
          </p>
        )}
        <InvoiceForm
          jobId={job.id}
          initialData={{
            descriptionOfWork: seedDescription,
            notes: '',
            taxCents: seedTaxCents,
            dueDate: '',
            lineItems: seedLineItems,
          }}
        />
      </div>
    </main>
  )
}
