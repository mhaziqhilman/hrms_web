# e-Invoice Module — Implementation Plan

> **Created:** March 8, 2026
> **Status:** Planning → Implementation
> **Scope:** Full Invoice Module (manual + payroll self-billed + claim-based + vendor tracking)
> **LHDN API:** Mock/stub mode (no credentials yet — real API wired later)
> **PRD Reference:** Section 3.8, 5.7, 8.3.5

---

## Table of Contents

1. [Overview](#1-overview)
2. [LHDN MyInvois Background](#2-lhdn-myinvois-background)
3. [Use Cases & User Flows](#3-use-cases--user-flows)
4. [Data Models](#4-data-models)
5. [API Endpoints](#5-api-endpoints)
6. [Mock LHDN Service Design](#6-mock-lhdn-service-design)
7. [Frontend Components](#7-frontend-components)
8. [Implementation Phases](#8-implementation-phases)
9. [Files Manifest](#9-files-manifest)
10. [Verification Checklist](#10-verification-checklist)

---

## 1. Overview

### What This Module Does

The e-Invoice module enables the HRMS to:

1. **Create invoices** — manually or auto-generated from payroll/claims
2. **Submit to LHDN** — via the MyInvois API (mocked for now)
3. **Track validation** — poll LHDN for acceptance/rejection status
4. **Generate PDFs** — with QR code for LHDN verification
5. **Record payments** — track payment against invoices
6. **Cancel/amend** — issue credit/debit notes

### Why It Matters

Starting July 1, 2025, **all Malaysian businesses** must submit e-Invoices to LHDN for every B2B and B2C transaction. Non-compliance carries penalties of RM200–RM20,000 per late submission, and up to RM100,000 and/or imprisonment for willful non-compliance.

### What Exists Already

| Component | Status |
|-----------|--------|
| LHDN config (`src/config/lhdn.js`) | Skeleton with API URLs, endpoints, doc types |
| `.env.example` LHDN variables | Placeholders defined |
| Company model statutory fields | Partial (e_file_no, employer_epf_no, etc.) |
| Payroll data structure | Complete — all salary components available |
| Statutory reports (EA/EPF/SOCSO/PCB) | Complete — existing pattern to follow |
| PDFKit for PDF generation | Installed and used for payslips/reports |
| Invoice model/controller/routes | **NOT STARTED** |

---

## 2. LHDN MyInvois Background

### Invoice Types (per LHDN)

| Code | Type | Use Case |
|------|------|----------|
| `01` | Invoice | Normal invoice (company bills a customer) |
| `01` | Self-Billed Invoice | Company pays employee/contractor (is_self_billed=true) |
| `02` | Credit Note | Reduce amount of a previously issued invoice |
| `03` | Debit Note | Increase amount of a previously issued invoice |
| `04` | Refund Note | Full/partial refund of a previously issued invoice |

### Invoice Lifecycle

```
    ┌─────────┐     ┌─────────┐     ┌───────────┐     ┌─────────┐
    │  Draft  │────▶│ Pending │────▶│ Submitted │────▶│  Valid  │
    └─────────┘     └─────────┘     └───────────┘     └─────────┘
         │               │               │                  │
         │               │               ▼                  ▼
         ▼               ▼          ┌─────────┐      ┌───────────┐
      [Delete]       [Reject→       │ Invalid │      │ Cancelled │
                      Draft]        └─────────┘      └───────────┘
                                         │                  │
                                         ▼                  ▼
                                    [Fix & Re-submit]  [Credit Note]
```

| Status | Description | Allowed Actions |
|--------|-------------|-----------------|
| Draft | Created, not yet approved | Edit, Delete, Approve |
| Pending | Approved, ready for LHDN submission | Submit to LHDN, Reject back to Draft |
| Submitted | Sent to LHDN, awaiting validation | Check Status |
| Valid | LHDN accepted and validated | Cancel (within 72hrs), Record Payment, Download PDF |
| Invalid | LHDN rejected with errors | Edit (fix errors), Re-submit |
| Cancelled | Cancelled after validation | Issue Credit Note |
| Superseded | Replaced by a credit/debit note | View only |

### LHDN API Flow (What We Mock)

```
1. AUTHENTICATE
   POST /connect/token
   Body: { grant_type: "client_credentials", client_id, client_secret, scope: "InvoicingAPI" }
   Response: { access_token, expires_in: 3600 }

2. SUBMIT DOCUMENT
   POST /api/v1.0/documentsubmissions
   Header: Authorization: Bearer {token}
   Body: { documents: [ { format: "JSON", document: {UBL 2.1 payload} } ] }
   Response: { submissionUID, acceptedDocuments: [{ uuid, invoiceCodeNumber }], rejectedDocuments: [] }

3. GET DOCUMENT STATUS
   GET /api/v1.0/documents/{uuid}/details
   Response: { uuid, status: "Valid"|"Invalid", validationResults: { ... } }

4. CANCEL DOCUMENT (within 72 hours of validation)
   PUT /api/v1.0/documents/state/{uuid}/state
   Body: { status: "cancelled", reason: "..." }
   Response: { uuid, status: "Cancelled" }

5. VALIDATE TIN
   GET /api/v1.0/taxpayer/validate/{tin}
   Response: { isValid: true, name: "..." }
```

### Required LHDN Fields Per Invoice

**Supplier (who issues the invoice):**
- Company Name, TIN (Tax ID Number), BRN (Business Registration Number)
- SST Registration Number, MSIC Code (industry classification)
- Address, Phone, Email

**Buyer (who receives the invoice):**
- Name, TIN (or passport number for individuals/foreigners)
- BRN (if business), Address, Phone, Email

**Line Items:**
- Description, Quantity, Unit Price, Discount
- Tax Type (SST/Service Tax/Exempt/Zero Rated), Tax Rate, Tax Amount
- Classification Code (LHDN product/service code), Unit of Measurement
- Subtotal, Total

**Totals:**
- Subtotal, Total Discount, Total Tax, Total Amount

---

## 3. Use Cases & User Flows

### 3.1 Manual Invoice Creation

**Actor:** Admin / Finance Admin
**Flow:**
1. Navigate to `/e-invoices` → Click "Create Invoice"
2. Select invoice type (Invoice / Credit Note / Debit Note / Refund Note)
3. Fill supplier info (auto-populated from company profile if not self-billed)
4. Fill buyer info (search existing contacts or enter manually)
5. Add line items (description, qty, unit price, tax type, tax rate)
6. System auto-calculates subtotals, tax amounts, and grand total
7. Add notes (optional)
8. Click "Save as Draft" or "Save & Approve"

### 3.2 Self-Billed Invoice from Payroll

**Actor:** Admin (auto-triggered or manual)
**Flow:**
1. Payroll is processed and marked as "Paid"
2. System auto-generates a self-billed invoice (if company TIN is configured)
   - OR Admin goes to `/e-invoices` → "Generate from Payroll"
3. Invoice created with:
   - **Supplier** = Employee (name, TIN from IC, address)
   - **Buyer** = Company (name, TIN, BRN, address)
   - **Line items** = Salary components (basic, allowances, overtime, bonus, etc.)
   - `is_self_billed = true`, `source_type = 'payroll'`, `source_id = payroll.id`
4. Invoice status = Draft (needs approval before LHDN submission)

**Payroll → Invoice Line Item Mapping:**

| Payroll Field | Invoice Line Item |
|---------------|-------------------|
| basic_salary | "Basic Salary - {month} {year}" |
| allowances | "Allowances" |
| overtime_pay | "Overtime Payment" |
| bonus | "Performance Bonus" |
| commission | "Sales Commission" |
| epf_employer | "EPF Employer Contribution" |
| socso_employer | "SOCSO Employer Contribution" |
| eis_employer | "EIS Employer Contribution" |

> **Note:** Employee deductions (EPF employee, PCB, SOCSO employee) are NOT invoice line items — they reduce net pay but are reported via existing statutory reports (CP39, Borang A, etc.).

### 3.3 Invoice from Claim Reimbursement

**Actor:** Admin (auto-triggered or manual)
**Flow:**
1. Claim is approved and marked as paid
2. System generates self-billed invoice:
   - **Supplier** = Employee
   - **Buyer** = Company
   - **Line item** = Claim description + amount
   - `source_type = 'claim'`, `source_id = claim.id`

### 3.4 LHDN Submission Workflow

**Actor:** Admin / Finance Admin
**Flow:**
1. Invoice in "Pending" status → Click "Submit to LHDN"
2. System calls `lhdnService.submitDocument()`:
   - Authenticates with MyInvois API
   - Converts invoice to UBL 2.1 format
   - Submits to LHDN
3. LHDN returns `submissionUID` → Status moves to "Submitted"
4. Admin clicks "Check Status" (or system polls automatically):
   - LHDN returns "Valid" → Status moves to "Valid", QR code URL stored
   - LHDN returns "Invalid" → Status moves to "Invalid", validation errors stored
5. If Invalid: Admin edits invoice to fix errors → Re-submits

### 3.5 Bulk LHDN Submission

**Actor:** Admin
**Flow:**
1. On invoice list, select multiple "Pending" invoices via checkboxes
2. Click "Submit Selected to LHDN"
3. System batch-submits all selected invoices
4. Results shown: X accepted, Y rejected

### 3.6 Invoice Cancellation

**Actor:** Admin
**Flow:**
1. Valid invoice → Click "Cancel"
2. Enter cancellation reason (required)
3. System checks: is this within 72 hours of validation?
   - Yes → Call `lhdnService.cancelDocument()` → Status = "Cancelled"
   - No → Must issue a Credit Note instead (creates new invoice of type '02')

### 3.7 Payment Recording

**Actor:** Admin / Finance
**Flow:**
1. Valid invoice → "Record Payment" section
2. Enter: date, amount, method (Bank Transfer/Cash/Cheque/etc.), reference number
3. System updates `amount_paid` and `balance_due`
4. Multiple partial payments allowed until balance = 0

### 3.8 Staff View (Read-Only)

**Actor:** Staff / Employee
**Flow:**
1. Employee can view self-billed invoices where they are the supplier
2. Download PDF with QR code (proof of income for personal tax filing)
3. Cannot create, edit, or submit invoices

### 3.9 Manager View

**Actor:** Manager
**Flow:**
1. View invoices for their company
2. Approve Draft invoices (Draft → Pending)
3. Cannot submit to LHDN or cancel (admin-only)

---

## 4. Data Models

### 4.1 Invoice (Main Table)

```
Table: invoices
```

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | INTEGER | PK, auto-increment | Internal ID |
| public_id | UUID | NOT NULL, DEFAULT uuid_v4, UNIQUE | External-facing ID (IDOR protection) |
| company_id | INTEGER | FK → companies, NOT NULL | Multi-tenant scoping |
| invoice_number | VARCHAR(30) | NOT NULL | Format: INV-2026-00001 |
| invoice_date | DATE | NOT NULL | Date of invoice |
| due_date | DATE | NULL | Payment due date |
| invoice_type | ENUM | NOT NULL | '01' (Invoice), '02' (Credit Note), '03' (Debit Note), '04' (Refund Note) |
| is_self_billed | BOOLEAN | DEFAULT false | True for payroll/claim-generated invoices |
| currency | VARCHAR(3) | DEFAULT 'MYR' | ISO 4217 currency code |
| exchange_rate | DECIMAL(10,6) | DEFAULT 1.000000 | Exchange rate to MYR |
| payment_terms | VARCHAR(50) | NULL | e.g., "Net 30", "Due on Receipt" |
| **Supplier Info** | | | |
| supplier_name | VARCHAR(255) | NOT NULL | |
| supplier_tin | VARCHAR(20) | NULL | Tax ID Number |
| supplier_brn | VARCHAR(30) | NULL | Business Registration Number |
| supplier_sst_no | VARCHAR(30) | NULL | SST Registration Number |
| supplier_address | TEXT | NULL | Full address |
| supplier_phone | VARCHAR(20) | NULL | |
| supplier_email | VARCHAR(255) | NULL | |
| supplier_msic_code | VARCHAR(10) | NULL | Industry classification |
| **Buyer Info** | | | |
| buyer_name | VARCHAR(255) | NOT NULL | |
| buyer_tin | VARCHAR(20) | NULL | |
| buyer_brn | VARCHAR(30) | NULL | |
| buyer_address | TEXT | NULL | |
| buyer_phone | VARCHAR(20) | NULL | |
| buyer_email | VARCHAR(255) | NULL | |
| **Totals** | | | |
| subtotal | DECIMAL(10,2) | DEFAULT 0.00 | Sum of line item subtotals |
| total_discount | DECIMAL(10,2) | DEFAULT 0.00 | Sum of line item discounts |
| total_tax | DECIMAL(10,2) | DEFAULT 0.00 | Sum of line item tax amounts |
| total_amount | DECIMAL(10,2) | DEFAULT 0.00 | subtotal - discount + tax |
| amount_paid | DECIMAL(10,2) | DEFAULT 0.00 | Sum of payments recorded |
| balance_due | DECIMAL(10,2) | DEFAULT 0.00 | total_amount - amount_paid |
| **LHDN Tracking** | | | |
| lhdn_uuid | VARCHAR(50) | NULL, UNIQUE | UUID assigned by LHDN on submission |
| lhdn_long_id | VARCHAR(100) | NULL | Long ID for public QR verification |
| lhdn_submission_uid | VARCHAR(50) | NULL | Batch submission UID |
| lhdn_status | VARCHAR(20) | NULL | LHDN-side status |
| lhdn_submitted_at | TIMESTAMP | NULL | When submitted to LHDN |
| lhdn_validated_at | TIMESTAMP | NULL | When LHDN validated |
| lhdn_qr_url | TEXT | NULL | QR code verification URL |
| lhdn_validation_errors | JSONB | NULL | Array of validation error objects |
| **Status & Workflow** | | | |
| status | ENUM | DEFAULT 'Draft' | Draft, Pending, Submitted, Valid, Invalid, Cancelled, Superseded |
| approved_by | INTEGER | FK → users, NULL | |
| approved_at | TIMESTAMP | NULL | |
| cancelled_by | INTEGER | FK → users, NULL | |
| cancelled_at | TIMESTAMP | NULL | |
| cancellation_reason | TEXT | NULL | Required when cancelling |
| **Source Linkage** | | | |
| source_type | ENUM | NULL | 'manual', 'payroll', 'claim' |
| source_id | INTEGER | NULL | FK to payroll.id or claim.id |
| **Audit** | | | |
| notes | TEXT | NULL | Internal notes |
| created_by | INTEGER | FK → users, NOT NULL | |
| updated_by | INTEGER | FK → users, NULL | |
| created_at | TIMESTAMP | DEFAULT NOW | |
| updated_at | TIMESTAMP | DEFAULT NOW | |

**Indexes:**
- `(company_id, status)` — list filtering
- `(company_id, invoice_number)` — unique constraint
- `(company_id, invoice_date)` — date range queries
- `(lhdn_uuid)` — LHDN lookups
- `(source_type, source_id)` — find invoice by source

### 4.2 InvoiceItem (Line Items)

```
Table: invoice_items
```

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | INTEGER | PK, auto-increment | |
| invoice_id | INTEGER | FK → invoices, NOT NULL, CASCADE | |
| item_number | INTEGER | NOT NULL | Line sequence (1, 2, 3...) |
| description | TEXT | NOT NULL | Item description |
| quantity | DECIMAL(10,3) | DEFAULT 1.000 | Supports fractional quantities |
| unit_price | DECIMAL(10,2) | NOT NULL | Price per unit |
| discount_amount | DECIMAL(10,2) | DEFAULT 0.00 | Flat discount |
| discount_rate | DECIMAL(5,2) | DEFAULT 0.00 | Percentage discount (0-100) |
| tax_type | ENUM | DEFAULT 'Exempt' | 'SST', 'Service Tax', 'Exempt', 'Zero Rated' |
| tax_rate | DECIMAL(5,2) | DEFAULT 0.00 | Tax percentage |
| tax_amount | DECIMAL(10,2) | DEFAULT 0.00 | Calculated tax |
| subtotal | DECIMAL(10,2) | NOT NULL | qty × unit_price - discount |
| total | DECIMAL(10,2) | NOT NULL | subtotal + tax_amount |
| classification_code | VARCHAR(10) | NULL | LHDN product/service classification |
| unit_of_measurement | VARCHAR(10) | DEFAULT 'EA' | UOM code (EA, HR, MTH, etc.) |

**Index:** `(invoice_id)` — join performance

### 4.3 InvoicePayment (Payment Records)

```
Table: invoice_payments
```

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | INTEGER | PK, auto-increment | |
| invoice_id | INTEGER | FK → invoices, NOT NULL, CASCADE | |
| payment_date | DATE | NOT NULL | |
| amount | DECIMAL(10,2) | NOT NULL | Payment amount |
| payment_method | ENUM | NOT NULL | 'Bank Transfer', 'Cash', 'Cheque', 'Credit Card', 'E-Wallet', 'Other' |
| reference_number | VARCHAR(100) | NULL | Transaction ref / cheque number |
| notes | TEXT | NULL | |
| created_by | INTEGER | FK → users, NOT NULL | Who recorded the payment |
| created_at | TIMESTAMP | DEFAULT NOW | |

**Index:** `(invoice_id)` — join performance

### 4.4 Company Model Changes

Add these new columns to the existing `companies` table:

| Column | Type | Default | Description |
|--------|------|---------|-------------|
| tin | VARCHAR(20) | NULL | LHDN Tax Identification Number |
| brn | VARCHAR(30) | NULL | Business Registration Number (SSM) |
| msic_code | VARCHAR(10) | NULL | Malaysia Standard Industrial Classification |
| sst_registration_no | VARCHAR(30) | NULL | SST Registration Number |
| invoice_prefix | VARCHAR(10) | 'INV' | Invoice numbering prefix |
| next_invoice_number | INTEGER | 1 | Auto-increment counter for invoice numbers |

### 4.5 Associations Diagram

```
Company ──┐
           │ hasMany
           ▼
       Invoice ──────────────────┐──────────────┐
           │ hasMany              │ hasMany       │ belongsTo (x3)
           ▼                      ▼               ▼
      InvoiceItem           InvoicePayment     User (creator)
                                               User (approver)
                                               User (canceller)
```

---

## 5. API Endpoints

### 5.1 Invoice CRUD

| Method | Path | Access | Description |
|--------|------|--------|-------------|
| POST | `/api/invoices` | Any authenticated | Create draft invoice with items |
| GET | `/api/invoices` | Any authenticated | List invoices (paginated, filtered, sorted) |
| GET | `/api/invoices/:id` | Any authenticated | Get invoice detail (items + payments) |
| PUT | `/api/invoices/:id` | Any authenticated | Update invoice (Draft/Invalid only) |
| DELETE | `/api/invoices/:id` | Any authenticated | Delete invoice (Draft only) |

### 5.2 Workflow Actions

| Method | Path | Access | Description |
|--------|------|--------|-------------|
| PATCH | `/api/invoices/:id/approve` | Admin, Manager | Draft → Pending |
| POST | `/api/invoices/:id/submit` | Admin | Pending → Submitted (calls LHDN) |
| GET | `/api/invoices/:id/lhdn-status` | Admin | Poll LHDN for status update |
| PATCH | `/api/invoices/:id/cancel` | Admin | Valid → Cancelled (calls LHDN) |

### 5.3 Payments

| Method | Path | Access | Description |
|--------|------|--------|-------------|
| POST | `/api/invoices/:id/payments` | Admin | Record a payment |
| GET | `/api/invoices/:id/payments` | Any authenticated | List payments for invoice |
| DELETE | `/api/invoices/:id/payments/:paymentId` | Admin | Remove a payment record |

### 5.4 Generation & Utilities

| Method | Path | Access | Description |
|--------|------|--------|-------------|
| GET | `/api/invoices/:id/pdf` | Any authenticated | Download invoice PDF |
| GET | `/api/invoices/analytics` | Admin, Manager | Dashboard analytics |
| POST | `/api/invoices/generate/payroll` | Admin | Auto-create from payroll |
| POST | `/api/invoices/generate/claim` | Admin | Auto-create from claim |
| POST | `/api/invoices/bulk-submit` | Admin | Batch submit to LHDN |
| POST | `/api/invoices/validate-tin` | Any authenticated | Validate a TIN number |

### 5.5 Query Parameters for GET /api/invoices

| Param | Type | Description |
|-------|------|-------------|
| page | number | Page number (default: 1) |
| limit | number | Items per page (default: 20) |
| status | string | Filter by status (comma-separated) |
| invoice_type | string | Filter by type ('01','02','03','04') |
| is_self_billed | boolean | Filter self-billed invoices |
| search | string | Search invoice_number, supplier_name, buyer_name |
| date_from | date | Invoice date range start |
| date_to | date | Invoice date range end |
| sort | string | Sort field (default: 'created_at') |
| order | string | Sort direction: 'ASC' or 'DESC' |

### 5.6 Response Format

Follows existing pattern:
```json
{
  "success": true,
  "message": "Invoices retrieved successfully",
  "data": [ ... ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "totalItems": 150,
    "totalPages": 8
  }
}
```

---

## 6. Mock LHDN Service Design

### Architecture

```
invoiceController.js
        │
        ▼
  lhdnService.js  ──── useMock = true (no credentials / sandbox mode)
        │                    │
        │                    ├── authenticate() → fake token
        │                    ├── submitDocument() → fake UUID + submissionUID
        │                    ├── getDocumentStatus() → 90% Valid, 10% Invalid
        │                    ├── cancelDocument() → success if <72hrs
        │                    └── validateTIN() → format check
        │
        │               useMock = false (real credentials)
        │                    │
        │                    ├── authenticate() → POST /connect/token
        │                    ├── submitDocument() → POST /api/v1.0/documentsubmissions
        │                    ├── getDocumentStatus() → GET /api/v1.0/documents/{uuid}/details
        │                    ├── cancelDocument() → PUT /api/v1.0/documents/state/{uuid}/state
        │                    └── validateTIN() → GET /api/v1.0/taxpayer/validate/{tin}
        │
        ▼
  buildSubmissionPayload()  ← Always runs (builds UBL 2.1 XML regardless of mock/real)
```

### Key Design Decisions

1. **Auto-detect mock mode:** If `LHDN_CLIENT_ID` is empty or `LHDN_ENVIRONMENT=sandbox`, mock mode activates. No code changes needed when switching to real API — just set env vars.

2. **Realistic mock responses:** Mock includes:
   - 2-second simulated network delay
   - 90% success / 10% failure rate for validation
   - Realistic error messages on failure (missing TIN, invalid tax calculation, etc.)
   - UUID generation matching LHDN format

3. **XML payload builder is shared:** The `buildSubmissionPayload()` method builds real UBL 2.1 XML format regardless of mode. This ensures the payload is correct when switching to real API.

4. **Swapping to real API:** Only change the HTTP call implementations inside each method. The controller, routes, and business logic remain identical.

---

## 7. Frontend Components

### 7.1 Feature Module Structure

```
src/app/features/e-invoices/
├── e-invoices.routes.ts              # Route definitions
├── models/
│   └── invoice.model.ts              # TypeScript interfaces
├── services/
│   └── e-invoice.service.ts          # HTTP service
└── components/
    ├── invoice-list/                  # List page
    │   ├── invoice-list.component.ts
    │   ├── invoice-list.component.html
    │   └── invoice-list.component.css
    ├── invoice-form/                  # Create/Edit page
    │   ├── invoice-form.component.ts
    │   ├── invoice-form.component.html
    │   └── invoice-form.component.css
    └── invoice-detail/                # Detail/Preview page
        ├── invoice-detail.component.ts
        ├── invoice-detail.component.html
        └── invoice-detail.component.css
```

### 7.2 Invoice List Page

```
┌──────────────────────────────────────────────────────────────────┐
│  e-Invoices                                        [+ Create]   │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────────┐    │
│  │ Total    │  │ Pending  │  │ LHDN     │  │ Outstanding  │    │
│  │ 156      │  │ 12       │  │ Validated │  │ Balance      │    │
│  │ invoices │  │ approval │  │ 98       │  │ RM 45,230    │    │
│  └──────────┘  └──────────┘  └──────────┘  └──────────────┘    │
│                                                                  │
│  [All] [Draft] [Pending] [Submitted] [Valid] [Invalid] [Cancel] │
│                                                                  │
│  Search: [________________]  Type: [All ▼]  Date: [__] to [__] │
│                                                                  │
│  ☐ │ Invoice #      │ Date       │ Supplier/Buyer │ Amount    │ │
│  ──┼────────────────┼────────────┼────────────────┼───────────┤ │
│  ☐ │ INV-2026-00012 │ 2026-03-01 │ ABC Sdn Bhd    │ RM 5,200  │ │
│  ☐ │ INV-2026-00011 │ 2026-03-01 │ John Doe (SB)  │ RM 8,500  │ │
│  ☐ │ INV-2026-00010 │ 2026-02-28 │ XYZ Corp       │ RM 12,000 │ │
│                                                                  │
│  [Submit Selected to LHDN]  [Approve Selected]                  │
│                                                                  │
│  Showing 1-20 of 156            [< 1 2 3 4 5 ... 8 >]          │
└──────────────────────────────────────────────────────────────────┘
```

### 7.3 Invoice Form Page

```
┌──────────────────────────────────────────────────────────────────┐
│  Create Invoice                                                  │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Type: [Invoice ▼]  ☐ Self-Billed    Currency: [MYR ▼]         │
│  Date: [2026-03-08]  Due: [2026-04-07]  Terms: [Net 30 ▼]     │
│                                                                  │
│  ┌─── Supplier ──────────────┐  ┌─── Buyer ─────────────────┐  │
│  │ Name: [________________]  │  │ Name: [________________]   │  │
│  │ TIN:  [________] [✓ Check]│  │ TIN:  [________] [✓ Check] │  │
│  │ BRN:  [________________]  │  │ BRN:  [________________]   │  │
│  │ SST:  [________________]  │  │ Address: [_____________]   │  │
│  │ MSIC: [________________]  │  │ Phone: [_______________]   │  │
│  │ Address: [_____________]  │  │ Email: [_______________]   │  │
│  │ Phone: [_______________]  │  │                            │  │
│  │ Email: [_______________]  │  │                            │  │
│  └───────────────────────────┘  └────────────────────────────┘  │
│                                                                  │
│  Line Items                                          [+ Add Row] │
│  ┌────┬─────────────┬─────┬──────────┬────────┬─────┬─────────┐ │
│  │ #  │ Description │ Qty │ Unit Price│Tax Type│ Tax%│  Total  │ │
│  ├────┼─────────────┼─────┼──────────┼────────┼─────┼─────────┤ │
│  │ 1  │ [_________] │ [1] │ [______] │ [SST▼] │ [6] │ RM 530  │ │
│  │ 2  │ [_________] │ [1] │ [______] │ [Exmt▼]│ [0] │ RM 200  │ │
│  │    │             │     │          │        │     │ [× Del] │ │
│  └────┴─────────────┴─────┴──────────┴────────┴─────┴─────────┘ │
│                                                                  │
│                         Subtotal:    RM   700.00                 │
│                         Discount:   -RM     0.00                 │
│                         Tax (SST):   RM    30.00                 │
│                         ─────────────────────────                │
│                         TOTAL:       RM   730.00                 │
│                                                                  │
│  Notes: [___________________________________________________]   │
│                                                                  │
│  [Save as Draft]  [Save & Approve]                   [Cancel]   │
└──────────────────────────────────────────────────────────────────┘
```

### 7.4 Invoice Detail Page

```
┌──────────────────────────────────────────────────────────────────┐
│  INV-2026-00012                        Status: [Valid ✓]        │
│  ─────────────────────────────────────────────────────────────── │
│  [Edit] [Submit to LHDN] [Download PDF] [Cancel] [Record Pay]  │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌─── LHDN Status ──────────────────────────────────────────┐   │
│  │ Submission UID: abc-123-def-456                           │   │
│  │ LHDN UUID: 78901234-abcd-5678-ef90-123456789012          │   │
│  │ Validated At: 2026-03-01 14:23:45                         │   │
│  │ QR Code: [████████]  ← Links to LHDN verification page   │   │
│  └───────────────────────────────────────────────────────────┘   │
│                                                                  │
│  ┌─── Invoice Preview ──────────────────────────────────────┐   │
│  │  [Company Logo]     INVOICE                               │   │
│  │                     No: INV-2026-00012                     │   │
│  │                     Date: March 1, 2026                    │   │
│  │                     Due: March 31, 2026                    │   │
│  │                                                           │   │
│  │  From: Nextura Sdn Bhd     To: ABC Solutions Sdn Bhd     │   │
│  │  TIN: C12345678900          TIN: C98765432100             │   │
│  │  ...                        ...                           │   │
│  │                                                           │   │
│  │  # │ Description     │ Qty │ Price   │ Tax   │ Total     │   │
│  │  ──┼─────────────────┼─────┼─────────┼───────┼─────────  │   │
│  │  1 │ Consulting      │ 10  │ 500.00  │ 30.00 │ 5,300.00  │   │
│  │  2 │ Travel expense  │ 1   │ 200.00  │  0.00 │   200.00  │   │
│  │                                                           │   │
│  │                    Subtotal: RM  5,200.00                 │   │
│  │                    Tax:      RM    300.00                 │   │
│  │                    TOTAL:    RM  5,500.00                 │   │
│  └───────────────────────────────────────────────────────────┘   │
│                                                                  │
│  ┌─── Payments ─────────────────────────────────────────────┐   │
│  │ Date       │ Amount     │ Method        │ Reference      │   │
│  │ 2026-03-05 │ RM 3,000   │ Bank Transfer │ TXN-789        │   │
│  │ 2026-03-10 │ RM 2,500   │ Bank Transfer │ TXN-812        │   │
│  │                                                           │   │
│  │ Total Paid: RM 5,500.00    Balance Due: RM 0.00          │   │
│  └───────────────────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────────────────┘
```

### 7.5 Routes

| Path | Component | Title |
|------|-----------|-------|
| `/e-invoices` | InvoiceListComponent | e-Invoices |
| `/e-invoices/create` | InvoiceFormComponent | Create Invoice |
| `/e-invoices/:id/edit` | InvoiceFormComponent | Edit Invoice |
| `/e-invoices/:id` | InvoiceDetailComponent | Invoice Detail |

### 7.6 Sidebar Menu Entry

Under **HR Management** group, after "Statutory Reports":
- Icon: `file-badge`
- Title: "e-Invoices"
- Route: `/e-invoices`
- Roles: `super_admin`, `admin`

---

## 8. Implementation Phases

### Phase 1: Backend Data Layer

| Step | Task | File | Dependency |
|------|------|------|------------|
| 1.1 | Add TIN/BRN/MSIC/SST/invoice fields to Company model | `models/Company.js` | None |
| 1.2 | Create Invoice model | `models/Invoice.js` (new) | None |
| 1.3 | Create InvoiceItem model | `models/InvoiceItem.js` (new) | None |
| 1.4 | Create InvoicePayment model | `models/InvoicePayment.js` (new) | None |
| 1.5 | Register models + associations | `models/index.js` | 1.1–1.4 |

### Phase 2: Backend Services

| Step | Task | File | Dependency |
|------|------|------|------------|
| 2.1 | Install qrcode + xml2js packages | `package.json` | None |
| 2.2 | Create mock LHDN service | `services/lhdnService.js` (new) | 2.1 |
| 2.3 | Create invoice business service | `services/invoiceService.js` (new) | 1.5, 2.2 |
| 2.4 | Create invoice PDF service | `services/invoicePdfService.js` (new) | 2.1 |

### Phase 3: Backend Controller & Routes

| Step | Task | File | Dependency |
|------|------|------|------------|
| 3.1 | Create invoice controller (18 endpoints) | `controllers/invoiceController.js` (new) | 2.2–2.4 |
| 3.2 | Create invoice routes with validation | `routes/invoice.routes.js` (new) | 3.1 |
| 3.3 | Register route in app.js | `app.js` | 3.2 |
| 3.4 | Sync database (DB_SYNC=true → false) | `.env` | 3.3 |

### Phase 4: Frontend

| Step | Task | File | Dependency |
|------|------|------|------------|
| 4.1 | Add API endpoints to config | `core/config/api.config.ts` | None |
| 4.2 | Create TypeScript models | `features/e-invoices/models/invoice.model.ts` (new) | None |
| 4.3 | Create e-invoice service | `features/e-invoices/services/e-invoice.service.ts` (new) | 4.1, 4.2 |
| 4.4 | Create invoice list component | `features/e-invoices/components/invoice-list/` (new) | 4.3 |
| 4.5 | Create invoice form component | `features/e-invoices/components/invoice-form/` (new) | 4.3 |
| 4.6 | Create invoice detail component | `features/e-invoices/components/invoice-detail/` (new) | 4.3 |
| 4.7 | Create routes + register in app | `e-invoices.routes.ts` (new), `app.routes.ts`, `menu.config.ts` | 4.4–4.6 |

### Phase 5: Integration

| Step | Task | File | Dependency |
|------|------|------|------------|
| 5.1 | Hook payroll auto-generation (optional) | `controllers/payrollController.js` | 2.3 |

---

## 9. Files Manifest

### New Files (14)

| # | File | Type | Description |
|---|------|------|-------------|
| 1 | `HRMS-API_v1/src/models/Invoice.js` | Model | Invoice header with LHDN fields |
| 2 | `HRMS-API_v1/src/models/InvoiceItem.js` | Model | Line items with tax calculation |
| 3 | `HRMS-API_v1/src/models/InvoicePayment.js` | Model | Payment tracking records |
| 4 | `HRMS-API_v1/src/services/lhdnService.js` | Service | Mock/real LHDN API client |
| 5 | `HRMS-API_v1/src/services/invoiceService.js` | Service | Business logic (numbering, generation, totals) |
| 6 | `HRMS-API_v1/src/services/invoicePdfService.js` | Service | PDF generation with QR code |
| 7 | `HRMS-API_v1/src/controllers/invoiceController.js` | Controller | 18 endpoint handlers |
| 8 | `HRMS-API_v1/src/routes/invoice.routes.js` | Routes | Validation + RBAC |
| 9 | `HRMS_v1/src/app/features/e-invoices/models/invoice.model.ts` | Types | TypeScript interfaces |
| 10 | `HRMS_v1/src/app/features/e-invoices/services/e-invoice.service.ts` | Service | Angular HTTP service |
| 11 | `HRMS_v1/src/app/features/e-invoices/components/invoice-list/` | Component | List page (3 files) |
| 12 | `HRMS_v1/src/app/features/e-invoices/components/invoice-form/` | Component | Create/Edit page (3 files) |
| 13 | `HRMS_v1/src/app/features/e-invoices/components/invoice-detail/` | Component | Detail page (3 files) |
| 14 | `HRMS_v1/src/app/features/e-invoices/e-invoices.routes.ts` | Routes | Angular route definitions |

### Modified Files (6)

| # | File | Change |
|---|------|--------|
| 1 | `HRMS-API_v1/src/models/Company.js` | Add 6 new columns (tin, brn, msic_code, sst_registration_no, invoice_prefix, next_invoice_number) |
| 2 | `HRMS-API_v1/src/models/index.js` | Import 3 models, define associations |
| 3 | `HRMS-API_v1/src/app.js` | Register `/api/invoices` route |
| 4 | `HRMS_v1/src/app/core/config/api.config.ts` | Add invoices endpoint group |
| 5 | `HRMS_v1/src/app/app.routes.ts` | Add e-invoices lazy route |
| 6 | `HRMS_v1/src/app/core/config/menu.config.ts` | Add sidebar menu item |

### Optional Modified (1)

| # | File | Change |
|---|------|--------|
| 1 | `HRMS-API_v1/src/controllers/payrollController.js` | Auto-generate self-billed invoice on payroll paid |

---

## 10. Verification Checklist

### Backend Verification

- [ ] Database tables created: `invoices`, `invoice_items`, `invoice_payments`
- [ ] Company model has new columns: `tin`, `brn`, `msic_code`, `sst_registration_no`, `invoice_prefix`, `next_invoice_number`
- [ ] POST `/api/invoices` — creates draft with items, auto-generates invoice number
- [ ] GET `/api/invoices` — returns paginated list with filters working
- [ ] GET `/api/invoices/:id` — returns invoice with items and payments included
- [ ] PUT `/api/invoices/:id` — updates only Draft/Invalid invoices, replaces items
- [ ] DELETE `/api/invoices/:id` — deletes only Draft invoices with cascade
- [ ] PATCH `/api/invoices/:id/approve` — moves Draft → Pending
- [ ] POST `/api/invoices/:id/submit` — calls mock LHDN, moves Pending → Submitted
- [ ] GET `/api/invoices/:id/lhdn-status` — polls mock, updates Submitted → Valid/Invalid
- [ ] PATCH `/api/invoices/:id/cancel` — moves Valid → Cancelled with reason
- [ ] POST `/api/invoices/:id/payments` — records payment, updates amount_paid/balance_due
- [ ] GET `/api/invoices/:id/pdf` — returns valid PDF buffer
- [ ] GET `/api/invoices/analytics` — returns status counts and monthly totals
- [ ] POST `/api/invoices/generate/payroll` — creates self-billed invoice from payroll
- [ ] POST `/api/invoices/generate/claim` — creates invoice from claim
- [ ] POST `/api/invoices/bulk-submit` — batch submits multiple invoices
- [ ] POST `/api/invoices/validate-tin` — validates TIN format
- [ ] Mock LHDN returns ~90% Valid, ~10% Invalid
- [ ] Audit log entries created for workflow actions
- [ ] company_id scoping works (no cross-company data leaks)

### Frontend Verification

- [ ] `/e-invoices` route loads invoice list page
- [ ] Analytics cards show correct counts
- [ ] Status tabs filter correctly
- [ ] Search, date filter, type filter work
- [ ] Table sorts by all columns
- [ ] Pagination works
- [ ] "Create Invoice" navigates to form
- [ ] Form: invoice type selector works
- [ ] Form: supplier/buyer auto-fill for self-billed
- [ ] Form: dynamic line items (add/remove rows)
- [ ] Form: live calculation of subtotals, tax, grand total
- [ ] Form: TIN validation button
- [ ] Form: save as draft works
- [ ] Form: save & approve works
- [ ] Detail page: shows invoice preview
- [ ] Detail page: LHDN status panel
- [ ] Detail page: action buttons change based on status
- [ ] Detail page: payment recording works
- [ ] Detail page: PDF download works
- [ ] Sidebar: "e-Invoices" appears under HR Management for admin
- [ ] `ng build` completes without errors

---

**Document Version:** 1.0
**Created:** March 8, 2026
**Author:** Development Team
