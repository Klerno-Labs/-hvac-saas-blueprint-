import { requireAuth } from '@/lib/session'
import { db } from '@/lib/db'
import Link from 'next/link'
import { ReminderStatusForm } from './status-form'

export default async function RemindersPage() {
  const { organizationId } = await requireAuth()

  const reminders = await db.reminder.findMany({
    where: { organizationId },
    include: {
      job: { select: { id: true, title: true } },
      customer: { select: { id: true, firstName: true, lastName: true } },
      estimate: { select: { id: true, estimateNumber: true } },
      invoice: { select: { id: true, invoiceNumber: true } },
    },
    orderBy: [{ status: 'asc' }, { dueAt: 'asc' }, { createdAt: 'desc' }],
  })

  const openReminders = reminders.filter((r) => r.status === 'open')
  const closedReminders = reminders.filter((r) => r.status !== 'open')

  return (
    <main>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h1>Reminders</h1>
        <Link href="/reminders/new" className="button">New reminder</Link>
      </div>

      {reminders.length === 0 ? (
        <div className="card">
          <p className="muted">No reminders yet. Create one to track follow-ups.</p>
        </div>
      ) : (
        <>
          {openReminders.length > 0 && (
            <div style={{ marginBottom: 24 }}>
              <h2 style={{ marginBottom: 12, fontSize: 16 }}>Open ({openReminders.length})</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {openReminders.map((rem) => (
                  <ReminderCard key={rem.id} reminder={rem} />
                ))}
              </div>
            </div>
          )}

          {closedReminders.length > 0 && (
            <div>
              <h2 style={{ marginBottom: 12, fontSize: 16 }} className="muted">
                Resolved ({closedReminders.length})
              </h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {closedReminders.map((rem) => (
                  <ReminderCard key={rem.id} reminder={rem} />
                ))}
              </div>
            </div>
          )}
        </>
      )}

      <div style={{ marginTop: 16 }}>
        <Link href="/dashboard" className="muted" style={{ fontSize: 13 }}>Back to dashboard</Link>
      </div>
    </main>
  )
}

type ReminderWithRelations = {
  id: string
  title: string
  notes: string | null
  reminderType: string
  status: string
  dueAt: Date | null
  createdAt: Date
  job: { id: string; title: string } | null
  customer: { id: string; firstName: string; lastName: string | null } | null
  estimate: { id: string; estimateNumber: string } | null
  invoice: { id: string; invoiceNumber: string } | null
}

function ReminderCard({ reminder }: { reminder: ReminderWithRelations }) {
  const isOpen = reminder.status === 'open'
  const isOverdue = isOpen && reminder.dueAt && new Date(reminder.dueAt) < new Date()

  return (
    <div
      className="card"
      style={{
        opacity: isOpen ? 1 : 0.6,
        borderLeft: isOverdue ? '4px solid #d97706' : undefined,
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <strong>{reminder.title}</strong>
            <span style={{
              fontSize: 11,
              padding: '1px 6px',
              borderRadius: 4,
              background: statusColor(reminder.status),
              color: 'white',
            }}>
              {reminder.status}
            </span>
            {isOverdue && (
              <span style={{ fontSize: 11, color: '#d97706', fontWeight: 600 }}>Overdue</span>
            )}
          </div>

          <div style={{ display: 'flex', gap: 12, fontSize: 13 }} className="muted">
            {reminder.dueAt && (
              <span>Due: {new Date(reminder.dueAt).toLocaleDateString()}</span>
            )}
            <span>{reminder.reminderType.replace(/_/g, ' ')}</span>
          </div>

          {reminder.notes && (
            <p style={{ fontSize: 13, marginTop: 4 }}>{reminder.notes}</p>
          )}

          <div style={{ display: 'flex', gap: 8, marginTop: 6, fontSize: 12 }}>
            {reminder.job && (
              <Link href={`/jobs/${reminder.job.id}` as never} style={{ color: 'var(--primary)' }}>
                Job: {reminder.job.title}
              </Link>
            )}
            {reminder.customer && (
              <Link href={`/customers/${reminder.customer.id}` as never} style={{ color: 'var(--primary)' }}>
                Customer: {reminder.customer.firstName} {reminder.customer.lastName || ''}
              </Link>
            )}
            {reminder.estimate && (
              <Link href={`/estimates/${reminder.estimate.id}` as never} style={{ color: 'var(--primary)' }}>
                Estimate: #{reminder.estimate.estimateNumber}
              </Link>
            )}
            {reminder.invoice && (
              <Link href={`/invoices/${reminder.invoice.id}` as never} style={{ color: 'var(--primary)' }}>
                Invoice: #{reminder.invoice.invoiceNumber}
              </Link>
            )}
          </div>
        </div>

        {isOpen && (
          <div style={{ marginLeft: 12, flexShrink: 0 }}>
            <ReminderStatusForm reminderId={reminder.id} />
          </div>
        )}
      </div>
    </div>
  )
}

function statusColor(status: string): string {
  switch (status) {
    case 'open': return '#2563eb'
    case 'completed': return '#059669'
    case 'dismissed': return '#6b7280'
    default: return '#6b7280'
  }
}
