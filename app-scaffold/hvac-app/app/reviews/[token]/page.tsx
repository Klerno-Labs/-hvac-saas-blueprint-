import { db } from '@/lib/db'
import { notFound } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ReviewForm } from './review-form'

export default async function ReviewPage({
  params,
}: {
  params: Promise<{ token: string }>
}) {
  const { token } = await params

  const review = await db.customerReview.findUnique({
    where: { token },
    include: {
      job: { select: { title: true } },
      organization: { select: { name: true } },
    },
  })

  if (!review) {
    notFound()
  }

  if (review.submittedAt) {
    return (
      <main className="max-w-lg mx-auto px-4 py-16">
        <Card>
          <CardContent className="py-12 text-center">
            <h2 className="text-xl font-semibold mb-2">Thank you!</h2>
            <p className="text-sm text-muted-foreground">
              Your review has already been submitted. We appreciate your feedback.
            </p>
          </CardContent>
        </Card>
      </main>
    )
  }

  return (
    <main className="max-w-lg mx-auto px-4 py-16">
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Leave a Review</CardTitle>
          <p className="text-sm text-muted-foreground">
            How was your experience with{' '}
            <span className="font-medium text-foreground">{review.organization.name}</span>{' '}
            for <span className="font-medium text-foreground">{review.job.title}</span>?
          </p>
        </CardHeader>
        <CardContent>
          <ReviewForm token={token} />
        </CardContent>
      </Card>
    </main>
  )
}
