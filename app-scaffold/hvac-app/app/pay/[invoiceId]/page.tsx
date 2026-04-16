import { db } from '@/lib/db'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export default async function PaymentReturnPage({
  params,
  searchParams,
}: {
  params: Promise<{ invoiceId: string }>
  searchParams: Promise<{ status?: string }>
}) {
  const { invoiceId } = await params
  const { status: returnStatus } = await searchParams

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
    <main className="flex items-center justify-center min-h-screen p-4">
      <Card className="w-full max-w-md text-center">
        <CardContent className="pt-8 pb-8">
          {isPaid ? (
            <>
              <div className="text-5xl mb-4 text-emerald-600">&#10003;</div>
              <h1 className="text-2xl font-bold text-emerald-600 mb-2">Payment received</h1>
              <p className="text-muted-foreground">
                Invoice #{invoice.invoiceNumber} for {formatCents(invoice.totalCents)} has been paid.
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                Thank you for your payment to {invoice.organization.name}.
              </p>
            </>
          ) : isCancelled ? (
            <>
              <h1 className="text-2xl font-bold mb-2">Payment cancelled</h1>
              <p className="text-muted-foreground">
                The payment for invoice #{invoice.invoiceNumber} was not completed.
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                You can try again or contact {invoice.organization.name} for assistance.
              </p>
            </>
          ) : (
            <>
              <h1 className="text-2xl font-bold mb-2">Payment processing</h1>
              <p className="text-muted-foreground">
                Your payment for invoice #{invoice.invoiceNumber} is being processed.
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                The invoice status will update once the payment is confirmed. This usually takes a few seconds.
              </p>
            </>
          )}

          <div className="mt-6">
            <Link href="/dashboard" className={cn(buttonVariants(), 'no-underline')}>
              Go to dashboard
            </Link>
          </div>
        </CardContent>
      </Card>
    </main>
  )
}

function formatCents(cents: number): string {
  return '$' + (cents / 100).toFixed(2)
}
