import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { redirect } from 'next/navigation'
import { OnboardingForm } from './form'

export default async function OnboardingPage() {
  const session = await auth()

  if (!session?.user?.id) {
    redirect('/login')
  }

  // If user already has an org, send them to dashboard
  const membership = await db.organizationMember.findFirst({
    where: { userId: session.user.id },
  })
  if (membership) {
    redirect('/dashboard')
  }

  return (
    <main>
      <div className="card" style={{ maxWidth: 480, margin: '60px auto' }}>
        <h1>Set up your business</h1>
        <p className="muted">Tell us about your HVAC company to get started.</p>
        <OnboardingForm />
      </div>
    </main>
  )
}
