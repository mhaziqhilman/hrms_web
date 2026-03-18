# e-Invoice Module — Implementation Plan

> **Created:** March 14, 2026
> **Status:** Implementation In Progress
> **Scope:** Full Invoice Module (manual + payroll self-billed + claim-based + vendor tracking)
> **LHDN API:** Mock/stub mode (no credentials yet — real API wired later)

---

## Additions from Cross-Check (3 items)

### 1. Retry Logic in lhdnService.js
- 3 attempts with exponential backoff for transient HTTP errors (408, 429, 500, 502, 503)
- Uses existing `lhdn.js` config: `retry.attempts = 3`, `retry.delay = 1000`

### 2. Invoice Aging Data in Analytics
- `/api/invoices/analytics` response includes aging breakdown:
  - `aging: { current: X, days_31_60: X, days_61_90: X, days_over_90: X }`
- Groups outstanding (balance_due > 0) invoices by days since invoice_date

### 3. Notification Triggers
- Add to `notificationService.js` TYPE_TO_PREFERENCE map:
  - `invoice_submitted` — notify admin when invoice submitted to LHDN
  - `invoice_validated` — notify creator when LHDN validates
  - `invoice_rejected` — notify creator when LHDN rejects
  - `invoice_cancelled` — notify relevant parties on cancellation
- All map to new preference column `notify_invoice_status` (default true)

---

## Implementation Phases

### Phase 1: Backend Data Layer
- Add TIN/BRN/MSIC/SST/invoice fields to Company model
- Create Invoice, InvoiceItem, InvoicePayment models
- Register in models/index.js with associations

### Phase 2: Backend Services
- lhdnService.js (mock + real dual-mode, retry logic)
- invoiceService.js (business logic, numbering, generation)
- invoicePdfService.js (PDF with QR code)

### Phase 3: Backend Controller & Routes
- invoiceController.js (18 endpoints)
- invoice.routes.js (validation + RBAC)
- Register in app.js

### Phase 4: Frontend
- TypeScript models, e-invoice service
- Invoice list, form, detail components
- Routes, sidebar menu entry

### Phase 5: DB Sync & Verify

---

See full technical details in the conversation where this plan was created.
