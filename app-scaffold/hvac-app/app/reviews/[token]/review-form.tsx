'use client'

import { useState } from 'react'
import { submitReview } from './actions'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'

export function ReviewForm({ token }: { token: string }) {
  const [rating, setRating] = useState<number>(0)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(formData: FormData) {
    if (rating === 0) {
      setError('Please select a rating.')
      return
    }
    setError(null)
    setLoading(true)

    formData.set('rating', String(rating))
    const result = await submitReview(token, formData)

    if (result.error) {
      setError(result.error)
      setLoading(false)
    } else {
      setSubmitted(true)
    }
  }

  if (submitted) {
    return (
      <div className="py-8 text-center">
        <h3 className="text-lg font-semibold mb-2">Thank you!</h3>
        <p className="text-sm text-muted-foreground">
          Your review has been submitted successfully.
        </p>
      </div>
    )
  }

  return (
    <form action={handleSubmit} className="space-y-6">
      {/* Star rating */}
      <div>
        <Label className="mb-2 block">Rating</Label>
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => setRating(n)}
              className="text-3xl transition-colors focus:outline-none"
              aria-label={`${n} star${n > 1 ? 's' : ''}`}
            >
              <span className={n <= rating ? 'text-yellow-400' : 'text-muted-foreground/30'}>
                ★
              </span>
            </button>
          ))}
        </div>
        <input type="hidden" name="rating" value={rating} />
      </div>

      {/* Comment */}
      <div>
        <Label htmlFor="comment" className="mb-2 block">
          Comment (optional)
        </Label>
        <Textarea
          id="comment"
          name="comment"
          placeholder="Tell us about your experience..."
          rows={4}
        />
      </div>

      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}

      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? 'Submitting...' : 'Submit Review'}
      </Button>
    </form>
  )
}
