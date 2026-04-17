'use client'

import { useState } from 'react'
import { requestReview } from './review-actions'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

type ReviewData = {
  rating: number
  comment: string | null
  submittedAt: string | null
  token: string
} | null

export function ReviewSection({
  jobId,
  jobStatus,
  existingReview,
}: {
  jobId: string
  jobStatus: string
  existingReview: ReviewData
}) {
  const [reviewUrl, setReviewUrl] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  // Only show for completed jobs
  if (jobStatus !== 'completed') {
    return null
  }

  // Review exists and was submitted
  if (existingReview?.submittedAt) {
    return (
      <Card className="mb-4">
        <CardHeader>
          <CardTitle className="text-lg">Customer Review</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div>
            <p className="text-xs text-muted-foreground">Rating</p>
            <p className="text-lg">
              {Array.from({ length: 5 }, (_, i) => (
                <span
                  key={i}
                  className={
                    i < existingReview.rating
                      ? 'text-yellow-400'
                      : 'text-muted-foreground/30'
                  }
                >
                  ★
                </span>
              ))}
              <span className="text-sm text-muted-foreground ml-2">
                ({existingReview.rating}/5)
              </span>
            </p>
          </div>
          {existingReview.comment && (
            <div>
              <p className="text-xs text-muted-foreground">Comment</p>
              <p className="text-sm">{existingReview.comment}</p>
            </div>
          )}
        </CardContent>
      </Card>
    )
  }

  // Review requested but not yet submitted
  if (existingReview && !existingReview.submittedAt) {
    const appUrl =
      typeof window !== 'undefined'
        ? window.location.origin
        : ''
    const url = `${appUrl}/reviews/${existingReview.token}`

    return (
      <Card className="mb-4">
        <CardHeader>
          <CardTitle className="text-lg">Customer Review</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Review requested — awaiting customer response.
          </p>
          <div className="flex items-center gap-2">
            <input
              readOnly
              value={url}
              className="flex-1 text-xs bg-muted rounded px-3 py-2 border"
            />
            <Button
              size="sm"
              variant="outline"
              onClick={() => navigator.clipboard.writeText(url)}
            >
              Copy
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  // No review yet — show request button
  async function handleRequest() {
    setLoading(true)
    setError(null)
    const result = await requestReview(jobId)
    if (result.error) {
      setError(result.error)
    } else if (result.url) {
      setReviewUrl(result.url)
    }
    setLoading(false)
  }

  if (reviewUrl) {
    return (
      <Card className="mb-4">
        <CardHeader>
          <CardTitle className="text-lg">Customer Review</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Review link created. Share it with the customer:
          </p>
          <div className="flex items-center gap-2">
            <input
              readOnly
              value={reviewUrl}
              className="flex-1 text-xs bg-muted rounded px-3 py-2 border"
            />
            <Button
              size="sm"
              variant="outline"
              onClick={() => navigator.clipboard.writeText(reviewUrl!)}
            >
              Copy
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="mb-4">
      <CardHeader>
        <CardTitle className="text-lg">Customer Review</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground mb-3">
          This job is complete. Request a review from the customer.
        </p>
        {error && <p className="text-sm text-destructive mb-2">{error}</p>}
        <Button onClick={handleRequest} disabled={loading} size="sm">
          {loading ? 'Creating...' : 'Request Review'}
        </Button>
      </CardContent>
    </Card>
  )
}
