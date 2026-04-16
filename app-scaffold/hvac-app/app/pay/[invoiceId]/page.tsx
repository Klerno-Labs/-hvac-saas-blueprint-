import { db } from '@/lib/db'
import { notFound } from 'next/navigation'
import Link from 'next/link'

export default async function PaymentReturnPage({
  params,
  searchParams,
}: {
  params: Promise<{ invoiceId: string }>
  searchParams: Promise<{ status?: string }>
}) {
  const { invoiceId } = await params
  const { status: returnStatus } = await searchParams

  // This is a semi-public page — we only show minimal invoice info
  const invoice = await db.invoice.findUnique({
    where: { id: invoiceId },
    select: {
      id: true,
      invoiceNumber: true,
      status: true,
      totalCents: true,
      paidAt: true,
      organization: { select: { name: true } },
    },
  })

  if (!invoice) {
    notFound()
  }

  const isPaid = invoice.status === 'paid'
  const isCancelled = returnStatus === 'cancelled'

  return (
    <main>
      <div className="card" style={{ maxWidth: 480, margin: '60px auto', textAlign: 'center' }}>
        {isPaid ? (
          <>
            <div style={{ fontSize: 48, marginBottom: 16 }}>&#10003;</div>
            <h1 style={{ color: '#059669' }}>Payment received</h1>
            <p className="muted">
              Invoice #{invoice.invoiceNumber} for {formatCents(invoice.totalCents)} has been paid.
            </p>
            <p className="muted" style={{ fontSize: 13, marginTop: 8 }}>
              Thank you for your payment to {invoice.organization.name}.
            </p>
          </>
        ) : isCancelled ? (
          <>
            <h1>Payment cancelled</h1>
            <p className="muted">
              The payment for invoice #{invoice.invoiceNumber} was not completed.
            </p>
            <p className="muted" style={{ fontSize: 13, marginTop: 8 }}>
              You can try again or contact {invoice.organization.name} for assistance.
            </p>
          </>
        ) : (
          <>
            <h1>Payment processing</h1>
            <p className="muted">
              Your payment for invoice #{invoice.invoiceNumber} is being processed.
            </p>
            <p className="muted" style={{ fontSize: 13, marginTop: 8 }}>
              The invoice status will update once the payment is confirmed.
              This usually takes a few seconds.
            </p>
          </>
        )}

        <div style={{ marginTop: 24 }}>
          <Link href="/dashboard" className="button" style={{ textAlign: 'center' }}>
            Go to dashboard
          </Link>
        </div>
      </div>
    </main>
  )
}

function formatCents(cents: number): string {
  return '$' + (cents / 100).toFixed(2)
}
