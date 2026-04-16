# Database Schema

## Core tables

### users
- id
- email
- name
- role
- created_at
- updated_at

### organizations
- id
- name
- trade_type
- owner_user_id
- timezone
- phone
- email
- address_line_1
- address_line_2
- city
- state
- postal_code
- onboarding_status
- stripe_connected_account_id
- stripe_charges_enabled
- stripe_payouts_enabled
- created_at
- updated_at

### organization_members
- id
- organization_id
- user_id
- role
- invited_at
- accepted_at

### customers
- id
- organization_id
- first_name
- last_name
- company_name
- email
- phone
- notes
- created_at
- updated_at

### service_locations
- id
- organization_id
- customer_id
- address_line_1
- address_line_2
- city
- state
- postal_code
- gate_notes
- created_at
- updated_at

### jobs
- id
- organization_id
- customer_id
- service_location_id
- title
- status
- scheduled_for
- completed_at
- technician_name
- notes
- created_at
- updated_at

### estimates
- id
- organization_id
- job_id
- estimate_number
- status
- subtotal_cents
- tax_cents
- total_cents
- ai_draft_used
- sent_at
- accepted_at
- created_at
- updated_at

### estimate_line_items
- id
- estimate_id
- name
- description
- quantity
- unit_price_cents
- line_total_cents
- sort_order

### proof_of_work_assets
- id
- organization_id
- job_id
- file_url
- file_type
- file_size
- uploaded_by_user_id
- created_at

### job_signatures
- id
- organization_id
- job_id
- signer_name
- signer_role
- signature_image_url
- signed_at

### invoices
- id
- organization_id
- job_id
- customer_id
- invoice_number
- status
- due_date
- subtotal_cents
- tax_cents
- total_cents
- outstanding_cents
- sent_at
- paid_at
- created_at
- updated_at

### invoice_line_items
- id
- invoice_id
- name
- description
- quantity
- unit_price_cents
- line_total_cents
- sort_order

### payments
- id
- organization_id
- invoice_id
- stripe_payment_intent_id
- stripe_charge_id
- amount_cents
- currency
- status
- paid_at
- created_at
- updated_at

### reminders
- id
- organization_id
- invoice_id
- reminder_type
- scheduled_for
- sent_at
- status
- channel
- created_at
- updated_at

### activity_events
- id
- organization_id
- user_id
- event_name
- entity_type
- entity_id
- metadata_json
- created_at

## Status enums to define early
- job_status: draft, scheduled, in_progress, completed, invoiced, paid
- estimate_status: draft, sent, accepted, declined
- invoice_status: draft, sent, viewed, partially_paid, paid, overdue, void
- reminder_status: pending, sent, failed, canceled
