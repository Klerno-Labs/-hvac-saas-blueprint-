'use server'

import { db } from '@/lib/db'
import { trackEvent } from '@/lib/events'
import { signupSchema } from '@/lib/validations/auth'
import bcrypt from 'bcryptjs'

type SignupResult =
  | { success: true }
  | { success: false; error: string }

export async function signup(formData: FormData): Promise<SignupResult> {
  const raw = {
    name: formData.get('name'),
    email: formData.get('email'),
    password: formData.get('password'),
  }

  const parsed = signupSchema.safeParse(raw)
  if (!parsed.success) {
    return { success: false, error: parsed.error.errors[0].message }
  }

  const { name, email, password } = parsed.data

  const existing = await db.user.findUnique({ where: { email } })
  if (existing) {
    return { success: false, error: 'An account with this email already exists' }
  }

  const hashedPassword = await bcrypt.hash(password, 12)

  const user = await db.user.create({
    data: {
      name,
      email,
      hashedPassword,
    },
  })

  await trackEvent({
    userId: user.id,
    eventName: 'user_signed_up',
    entityType: 'user',
    entityId: user.id,
  })

  return { success: true }
}
