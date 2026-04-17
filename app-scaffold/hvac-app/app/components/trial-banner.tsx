import Link from 'next/link'

export function TrialBanner({ daysRemaining }: { daysRemaining: number }) {
  const urgency = daysRemaining <= 2

  return (
    <div
      className={`w-full text-center text-sm py-1.5 px-4 ${
        urgency
          ? 'bg-destructive text-destructive-foreground'
          : 'bg-yellow-100 text-yellow-900 dark:bg-yellow-900 dark:text-yellow-100'
      }`}
    >
      {daysRemaining === 0
        ? 'Your trial has expired. '
        : `${daysRemaining} day${daysRemaining === 1 ? '' : 's'} left in your trial. `}
      <Link
        href="/settings/billing"
        className="underline font-semibold hover:opacity-80"
      >
        Upgrade now
      </Link>
    </div>
  )
}
