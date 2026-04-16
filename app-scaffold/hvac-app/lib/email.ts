import { Resend } from 'resend'

let _resend: Resend | null = null

function getResend(): Resend | null {
  if (!process.env.RESEND_API_KEY) return null
  if (!_resend) {
    _resend = new Resend(process.env.RESEND_API_KEY)
  }
  return _resend
}

const FROM_EMAIL = process.env.EMAIL_FROM || 'HVAC SaaS <noreply@resend.dev>'

type SendResult = { success: true; id: string } | { success: false; error: string }

export async function sendEmail(params: {
  to: string
  subject: string
  html: string
}): Promise<SendResult> {
  const resend = getResend()
  if (!resend) {
    console.log(`[email-skipped] No RESEND_API_KEY — would send to ${params.to}: ${params.subject}`)
    return { success: false, error: 'Email delivery not configured (RESEND_API_KEY missing)' }
  }

  try {
    const result = await resend.emails.send({
      from: FROM_EMAIL,
      to: params.to,
      subject: params.subject,
      html: params.html,
    })

    if (result.error) {
      console.error('[email-error]', result.error)
      return { success: false, error: result.error.message }
    }

    return { success: true, id: result.data?.id || '' }
  } catch (error) {
    console.error('[email-error]', error)
    return { success: false, error: 'Failed to send email' }
  }
}

/**
 * Send an invoice to a customer via email with a portal payment link.
 */
export async function sendInvoiceEmail(params: {
  to: string
  customerName: string
  invoiceNumber: string
  totalFormatted: string
  orgName: string
  portalUrl?: string
  dueDate?: string
}): Promise<SendResult> {
  const payLink = params.portalUrl
    ? `<p><a href="${params.portalUrl}" style="display:inline-block;background:#0f766e;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;">View &amp; Pay Invoice</a></p>`
    : ''

  return sendEmail({
    to: params.to,
    subject: `Invoice #${params.invoiceNumber} from ${params.orgName}`,
    html: `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto;">
        <h2 style="color:#0f766e;">Invoice #${params.invoiceNumber}</h2>
        <p>Hi ${params.customerName},</p>
        <p>${params.orgName} has sent you an invoice for <strong>${params.totalFormatted}</strong>.</p>
        ${params.dueDate ? `<p>Due date: ${params.dueDate}</p>` : ''}
        ${payLink}
        <p style="color:#6b7280;font-size:13px;margin-top:24px;">If you have questions, contact ${params.orgName} directly.</p>
      </div>
    `,
  })
}

/**
 * Send an estimate to a customer via email with a portal link.
 */
export async function sendEstimateEmail(params: {
  to: string
  customerName: string
  estimateNumber: string
  totalFormatted: string
  orgName: string
  portalUrl?: string
}): Promise<SendResult> {
  const viewLink = params.portalUrl
    ? `<p><a href="${params.portalUrl}" style="display:inline-block;background:#0f766e;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;">View Estimate</a></p>`
    : ''

  return sendEmail({
    to: params.to,
    subject: `Estimate #${params.estimateNumber} from ${params.orgName}`,
    html: `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto;">
        <h2 style="color:#0f766e;">Estimate #${params.estimateNumber}</h2>
        <p>Hi ${params.customerName},</p>
        <p>${params.orgName} has sent you an estimate for <strong>${params.totalFormatted}</strong>.</p>
        ${viewLink}
        <p style="color:#6b7280;font-size:13px;margin-top:24px;">If you have questions, contact ${params.orgName} directly.</p>
      </div>
    `,
  })
}

/**
 * Send a password reset email.
 */
export async function sendPasswordResetEmail(params: {
  to: string
  resetUrl: string
}): Promise<SendResult> {
  return sendEmail({
    to: params.to,
    subject: 'Reset your HVAC SaaS password',
    html: `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto;">
        <h2>Reset your password</h2>
        <p>Click the link below to reset your password. This link expires in 1 hour.</p>
        <p><a href="${params.resetUrl}" style="display:inline-block;background:#0f766e;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;">Reset Password</a></p>
        <p style="color:#6b7280;font-size:13px;margin-top:24px;">If you didn't request this, you can safely ignore this email.</p>
      </div>
    `,
  })
}

/**
 * Send a team invite email.
 */
export async function sendTeamInviteEmail(params: {
  to: string
  orgName: string
  inviterName: string
  signupUrl: string
}): Promise<SendResult> {
  return sendEmail({
    to: params.to,
    subject: `You've been invited to ${params.orgName} on HVAC SaaS`,
    html: `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto;">
        <h2>You're invited!</h2>
        <p>${params.inviterName} has invited you to join <strong>${params.orgName}</strong> on HVAC SaaS.</p>
        <p><a href="${params.signupUrl}" style="display:inline-block;background:#0f766e;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;">Accept Invitation</a></p>
      </div>
    `,
  })
}
