import Link from 'next/link'
import { getOptionalSession } from '@/lib/session'
import { redirect } from 'next/navigation'
import { buttonVariants } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'

export default async function HomePage() {
  const session = await getOptionalSession()

  if (session?.membership) {
    redirect('/dashboard')
  }

  return (
    <main className="max-w-4xl mx-auto px-4 py-16">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold tracking-tight mb-4">
          Get paid faster on every HVAC job
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8">
          Quote, complete, invoice, and collect payment in one workflow built for small residential HVAC shops.
        </p>
        <div className="flex justify-center gap-4">
          <Link href="/signup" className={cn(buttonVariants({ size: 'lg' }), 'no-underline')}>
            Start setup
          </Link>
          <Link href="/login" className={cn(buttonVariants({ variant: 'outline', size: 'lg' }), 'no-underline')}>
            Log in
          </Link>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Create quotes fast</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Generate estimates with AI-assisted drafting and line-item detail.
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Capture proof of work</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Record job completion details before creating invoices.
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Collect payment</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Send invoices with built-in Stripe payment links.
            </p>
          </CardContent>
        </Card>
      </div>
    </main>
  )
}
