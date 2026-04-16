'use server'

import { db } from '@/lib/db'
import { sendPasswordResetEmail } from '@/lib/email'
import { randomBytes } from 'crypto'

type Result = { success: true } | { success: false; error: string }

export async function requestPasswordReset(formData: FormData): Promise<Result> {
  const email = formData.get('email') as string
  if (!email) {
    return { success: false, error: 'Email is required' }
  }

  const user = await db.user.findUnique({ where: { email } })

  // Always return success to prevent email enumeration
  if (!user) {
    return { success: true }
  }

  // Invalidate existing tokens
  await db.passwordResetToken.updateMany({
    where: { email, usedAt: null },
    data: { usedAt: new Date() },
  })

  const token = randomBytes(32).toString('hex')
  await db.passwordResetToken.create({
    data: {
      token,
      email,
      expiresAt: new Date(Date.now() + 60 * 60 * 1000), // 1 hour
    },
  })

  const appUrl = process.env.APP_URL || 'http://localhost:3000'
  await sendPasswordResetEmail({
    to: email,
    resetUrl: `${appUrl}/reset-password?token=${token}`,
  })

  return { success: true }
}
