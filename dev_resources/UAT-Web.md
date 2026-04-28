# HRMS User Acceptance Testing (UAT) — Web

> **Document Version:** 1.0
> **Created:** 2026-04-22
> **Application:** Nextura HRMS (Web)
> **Build Under Test:** Angular 21 frontend + Node.js/Express backend (Supabase PostgreSQL)
> **Base URLs:** Frontend `http://localhost:4200` · Backend `http://localhost:3000`
> **Testing Method:** Automated via Playwright (manual fallback documented per case)
> **Status:** Ready for Execution

---

## 1. Purpose & Scope

This document defines the User Acceptance Test cases for the HRMS web application. It is the formal acceptance artefact between development and business stakeholders prior to production go-live (or release sign-off). Each test case below maps 1:1 to an automated Playwright spec that will be executed on the local environment.

**In scope:** 16 functional modules (Auth → Notifications), cross-cutting concerns (security, performance, responsiveness on mobile viewport of the same web app).
**Out of scope:** Native mobile application (on hold), OAuth provider flows (Google/GitHub external redirects — manual spot-check only), real SMTP email deliverability (captured via Mailtrap/stub where applicable), payslip PDF visual content (structural check only).

---

## 2. Test Environment

| Item | Value |
|---|---|
| Frontend | `http://localhost:4200` (Angular 21 standalone) |
| Backend | `http://localhost:3000/api` (Node.js 20 + Sequelize) |
| Database | Supabase PostgreSQL (Singapore) — non-prod schema |
| File Storage | Supabase Storage (bucket `hrms-files`) |
| Browser (Desktop) | Chromium, Firefox, WebKit — 1920×1080 |
| Browser (Mobile web) | Chromium — iPhone 13 (390×844), Pixel 5 (393×851) |
| Automation | Playwright `@playwright/test` |

## 3. Test Users

| Role | Email | Password | Notes |
|---|---|---|---|
| Super Admin | `admin@nextura.com` | `Admin@1234` | Seeded, bypasses email/company guards |
| Admin | `uat.admin@nextura.test` | `Uat@12345` | Created via seed fixture |
| Manager | `uat.manager@nextura.test` | `Uat@12345` | Has reporting team |
| Staff | `uat.staff@nextura.test` | `Uat@12345` | Reports to `uat.manager@nextura.test` |

## 4. Entry & Exit Criteria

**Entry:** Backend + Frontend running; Supabase reachable; seed script executed; test users created; `hrms-files` bucket empty-friendly.
**Exit:** 100% of Critical cases Passed; ≥95% of Major cases Passed; no Critical defect open; Issue Log updated; UAT sign-off signed by stakeholder.

## 5. Severity & Priority

- **Critical** — blocks core business flow (login, payroll approval, leave apply)
- **Major** — broken feature but workaround exists
- **Minor** — UX/cosmetic, no functional impact
- **Enhancement** — improvement request, not a defect

## 6. Legend

| Symbol | Meaning |
|---|---|
| ☐ | Not executed |
| ✅ | Passed |
| ❌ | Failed (link to defect ID) |
| ⚠ | Passed with observation |
| ⏭ | Skipped / Blocked |

---

# MODULE 1 — Authentication & Onboarding

**Scope:** Login, registration, email verification, password recovery, auth guards, onboarding, invitations, multi-company.

| TC ID | Priority | Precondition | Test Steps | Expected Result | Status |
|---|---|---|---|---|---|
| AUTH-001 | Critical | Valid test user exists | 1. Open `/auth/login` 2. Enter valid email + password 3. Click Login | JWT stored in localStorage; redirected to role-appropriate dashboard | ☐ |
| AUTH-002 | Critical | — | 1. Open `/auth/login` 2. Enter wrong password 3. Click Login | Inline error "Invalid credentials" shown **immediately** (validated: FIX #12 applied) | ☐ |
| AUTH-003 | Major | User locked after 5 failed attempts | Submit wrong password 5×; then correct password | 6th attempt blocked with "Account locked" message | ☐ |
| AUTH-004 | Critical | — | 1. Go to `/auth/register` 2. Fill unique email + valid fields 3. Submit | Account created; verification email queued; redirect to `verify-email-pending` | ☐ |
| AUTH-005 | Major | User exists with email X | Register again with email X | Error "Email already registered" shown | ☐ |
| AUTH-006 | Critical | Valid verification token in DB | GET `/auth/verify-email?token=<valid>` | `email_verified=true`; success page shown | ☐ |
| AUTH-007 | Major | Expired token | GET `/auth/verify-email?token=<expired>` | "Token expired" error; resend button visible | ☐ |
| AUTH-008 | Major | Unverified user | Click "Resend verification" | New email sent (Mailtrap inbox +1) | ☐ |
| AUTH-009 | Critical | Registered user | Forgot password → enter email | Reset email sent | ☐ |
| AUTH-010 | Critical | Valid reset token | Open reset link → submit new password → login | Login succeeds with new password | ☐ |
| AUTH-011 | Major | Expired reset token | Open reset link (>1h old) | "Reset link expired" error | ☐ |
| AUTH-012 | Critical | Logged out | Navigate to `/dashboard` directly | Redirect to `/auth/login` | ☐ |
| AUTH-013 | Major | Unverified user | Navigate to `/dashboard` | Redirect to `/auth/verify-email-pending` | ☐ |
| AUTH-014 | Major | User without company | Navigate to `/dashboard` | Redirect to `/onboarding` | ☐ |
| AUTH-015 | Minor | Super admin logged in | Navigate to `/dashboard` | No redirect; admin dashboard loads (guards bypassed) | ☐ |
| AUTH-016 | Major | New user without company | Load `/onboarding` | Choice page shows "Setup Company" + "Wait for Invitation" | ☐ |
| AUTH-017 | Critical | New user, choice=Setup | Complete wizard (name, reg no, industry, size, country) | Company row created; user role=admin; redirect to `/dashboard/admin` | ☐ |
| AUTH-018 | Major | New user, choice=Wait | Land on wait-for-invitation | Pending status shown; polling active | ☐ |
| AUTH-019 | Critical | Admin logged in | Go to Invitations → invite `x@y.com` as staff | Invitation row created; email sent | ☐ |
| AUTH-020 | Major | Pending invitations exist | Load Invitations list | List renders with status/role/date (verify fix for "no invitation list" bug) | ☐ |
| AUTH-021 | Critical | Valid invitation token | Open accept link → complete acceptance | UserCompany row created; user joins with invited role | ☐ |
| AUTH-022 | Major | Pending invitation | Click "Cancel" on invitation | Status=Cancelled; row updated in list | ☐ |
| AUTH-023 | Minor | Pending invitation | Click "Resend" | New email sent; expiry extended | ☐ |
| AUTH-024 | Major | Existing user with 1 company | Go to onboarding → create 2nd company | 2nd company created; appears in switcher | ☐ |
| AUTH-025 | Major | User member of 2 companies | Click company switcher | Both companies listed | ☐ |
| AUTH-026 | Critical | User member of 2 companies | Select other company | New JWT issued; page reloads with new company_id context | ☐ |
| AUTH-027 | Major | Authenticated user | GET `/api/company/my-companies` | Returns array of all user companies with roles | ☐ |
| AUTH-028 | Major | Authenticated user | POST `/api/company/switch` with company_id | Response returns new JWT; decoded token has new company_id | ☐ |

---

# MODULE 2 — Dashboard

| TC ID | Priority | Test Steps | Expected Result | Status |
|---|---|---|---|---|
| DASH-001 | Critical | Login as admin → land on `/dashboard/admin` | Admin dashboard loads (verify FIX #3 — no longer redirects to staff dashboard) | ☐ |
| DASH-002 | Major | Admin dashboard KPI: Employee count | Matches `SELECT COUNT(*) FROM employees WHERE status='Active'` | ☐ |
| DASH-003 | Major | Admin dashboard KPI: Payroll total (current month) | Matches sum of approved payroll gross | ☐ |
| DASH-004 | Major | Admin dashboard KPI: Pending leaves | Matches `COUNT(*) FROM leaves WHERE status='Pending'` | ☐ |
| DASH-005 | Major | Admin dashboard KPI: Pending claims | Matches `COUNT(*) FROM claims WHERE status='Pending'` | ☐ |
| DASH-006 | Major | Login as manager → `/dashboard/manager` | Manager dashboard loads with team data | ☐ |
| DASH-007 | Major | Login as staff → `/dashboard/staff` | Staff dashboard loads with personal data | ☐ |
| DASH-008 | Critical | Login as admin → try navigating to `/dashboard/manager` | Access denied (verify FIX #4 — admin no longer in manager roleGuard) | ☐ |
| DASH-009 | Major | Login with each role | Redirect target matches role via `dashboardRedirectGuard` | ☐ |

---

# MODULE 3 — Employee Management

| TC ID | Priority | Test Steps | Expected Result | Status |
|---|---|---|---|---|
| EMP-001 | Major | Open `/employees` as admin | Paginated list loads | ☐ |
| EMP-002 | Minor | Type name/ID in search | List filters accordingly | ☐ |
| EMP-003 | Minor | Apply department + status filters | List filters accordingly | ☐ |
| EMP-004 | Critical | Create employee with ONLY mandatory fields (employee ID, full name, gender, basic salary, join date) | Save succeeds with 201 (verify FIX #5 — `{ values: 'falsy' }` optional validators) | ☐ |
| EMP-005 | Major | Create employee with all fields | Save succeeds; appears in list | ☐ |
| EMP-006 | Major | Open employee detail page | Personal, employment, statutory sections render | ☐ |
| EMP-007 | Major | Edit employee → change department → save | Changes persisted; audit log entry created | ☐ |
| EMP-008 | Major | Delete employee | Status changes to Terminated (soft delete) | ☐ |
| EMP-009 | Enhancement | Delete employee already Terminated | Status changes to Inactive; hidden from default list (pending feature) | ☐ |
| EMP-010 | Major | Staff: GET `/api/employees/me` | Returns own profile only | ☐ |
| EMP-011 | Major | Staff: PUT `/api/employees/me` with phone change | Update succeeds for allowed fields only | ☐ |
| EMP-012 | Major | GET `/api/employees/:id/ytd?year=2025` | Returns monthly breakdown + totals (verify FIX #6 — findAll aggregation) | ☐ |
| EMP-013 | Major | Year dropdown 2025 on YTD view | Dropdown functional; data renders | ☐ |
| EMP-014 | Major | Employee statistics endpoint | Returns correct counts by department/status | ☐ |
| EMP-015 | Critical | Staff accesses `/employees` | 403 Forbidden (can only see own) | ☐ |
| EMP-016 | Major | Manager accesses `/employees` | Sees only team members | ☐ |
| EMP-017 | Major | Admin accesses `/employees` | Sees all employees in company | ☐ |

---

# MODULE 4 — Payroll

| TC ID | Priority | Test Steps | Expected Result | Status |
|---|---|---|---|---|
| PAY-001 | Critical | Calculate payroll for employee (basic RM5000, age 30) | All components computed (gross, EPF, SOCSO, EIS, PCB, net) | ☐ |
| PAY-002 | Critical | Verify EPF: employee 11%, employer 13% | RM550 / RM650 for RM5000 salary | ☐ |
| PAY-003 | Major | EPF cap: employee basic RM35,000 | EPF calculated on RM30,000 cap | ☐ |
| PAY-004 | Major | SOCSO tier lookup | Contribution matches official 34-tier table; capped at RM10,800 | ☐ |
| PAY-005 | Major | EIS 0.2% employee + 0.2% employer | RM10 / RM10 for RM5000 salary | ☐ |
| PAY-006 | Critical | PCB calculation for single taxpayer | Matches LHDN progressive schedule | ☐ |
| PAY-007 | Critical | Net = gross − employee deductions | Arithmetic exact to 2dp | ☐ |
| PAY-008 | Major | Payroll list filters (month/year/status/employee) | Filters apply correctly | ☐ |
| PAY-009 | Major | Submit draft → pending | Status changes; audit log entry | ☐ |
| PAY-010 | Critical | Admin approves payroll | Status=Approved; YTD updated | ☐ |
| PAY-011 | Major | Admin marks as paid | Status=Paid; immutable thereafter | ☐ |
| PAY-012 | Major | Bulk submit/approve/mark-paid/cancel/delete | All bulk actions succeed | ☐ |
| PAY-013 | Major | Generate payslip PDF | Renders with correct data | ☐ |
| PAY-014 | Major | Download payslip button | Uses `window.print()` (verify FIX #7 — no longer calls missing endpoint) | ☐ |
| PAY-015 | Major | Staff views My Payslips | Sees only own payslips | ☐ |
| PAY-016 | Major | Edit payroll in Draft/Pending | Allowed | ☐ |
| PAY-017 | Major | Edit payroll after Approved | Blocked | ☐ |
| PAY-018 | Major | Cancel payroll | Status=Cancelled | ☐ |
| PAY-019 | Major | Soft delete | Row hidden from list, retained in DB | ☐ |
| PAY-020 | Major | Permanent delete (super_admin only) | Row removed | ☐ |

---

# MODULE 5 — Leave Management

| TC ID | Priority | Test Steps | Expected Result | Status |
|---|---|---|---|---|
| LV-001 | Major | Open leave list | Filters by status/type/date work | ☐ |
| LV-002 | Critical | Apply leave (date picker, type, reason) | Submission succeeds | ☐ |
| LV-003 | Major | Half-day leave | 0.5 day deducted | ☐ |
| LV-004 | Major | Upload medical certificate for Sick leave | File stored; linked to leave | ☐ |
| LV-005 | Major | Leave type requires document | Submit blocked without file | ☐ |
| LV-006 | Major | Leave balance page | All types listed with used/remaining/entitled | ☐ |
| LV-007 | Critical | Apply hospitalization leave; verify balance matches entitlement | Balance tally correct (verify FIX #1 — route collision resolved) | ☐ |
| LV-008 | Critical | Apply unpaid leave (entitlement=0) | Submission succeeds (verify FIX #2 — `is_paid !== false` bypass) | ☐ |
| LV-009 | Major | GET `/api/leaves/balance/:employee_id` | Returns correct data, no route collision | ☐ |
| LV-010 | Major | Mid-year joiner | Pro-rated entitlement calculated | ☐ |
| LV-011 | Major | Carry forward days | Displayed on balance page | ☐ |
| LV-012 | Major | Manager opens `/leave/approvals` | Pending approvals list loads | ☐ |
| LV-013 | Critical | Manager approves leave | Balance updated; notification sent | ☐ |
| LV-014 | Major | Manager rejects leave with remarks | Rejection reason stored + visible | ☐ |
| LV-015 | Minor | Approval history on leave detail | Timeline renders | ☐ |
| LV-016 | Major | Edit own pending leave | Changes saved | ☐ |
| LV-017 | Major | Cancel own leave | Status=Cancelled; balance restored | ☐ |
| LV-018 | Minor | Success dialog on leave apply | Uses ZardUI AlertDialog (verify FIX #11 — no browser alert) | ☐ |
| LV-019 | Major | Staff sees own leaves only | RBAC enforced | ☐ |
| LV-020 | Major | Manager sees team leaves | RBAC enforced | ☐ |
| LV-021 | Major | Admin sees all leaves | RBAC enforced | ☐ |

---

# MODULE 6 — Attendance & WFH

| TC ID | Priority | Test Steps | Expected Result | Status |
|---|---|---|---|---|
| ATT-001 | Critical | Clock in (with geolocation) | Timestamp + lat/long captured | ☐ |
| ATT-002 | Critical | Clock out | Duration auto-calculated | ☐ |
| ATT-003 | Major | Second clock-in same day | Blocked with error | ☐ |
| ATT-004 | Major | Clock in after schedule | `is_late=true` | ☐ |
| ATT-005 | Major | Clock out before schedule | `is_early_leave=true` | ☐ |
| ATT-006 | Major | Attendance list filters | Date/employee/type filters work | ☐ |
| ATT-007 | Minor | Attendance detail | Clock times, duration, type shown | ☐ |
| ATT-008 | Major | My attendance view | Staff sees own records | ☐ |
| ATT-009 | Minor | Attendance summary | Correct stats (total/late/etc.) | ☐ |
| ATT-010 | Major | Submit WFH application | Record created with Pending status | ☐ |
| ATT-011 | Major | Manager views WFH approvals | List loads | ☐ |
| ATT-012 | Critical | Manager approves WFH | Attendance record with type=WFH created | ☐ |
| ATT-013 | Major | Manager rejects WFH with remarks | Rejection stored | ☐ |
| ATT-014 | Major | Admin edits attendance record | Update succeeds; audit log | ☐ |
| ATT-015 | Major | Admin deletes attendance record | Row removed | ☐ |

---

# MODULE 7 — Claims

| TC ID | Priority | Test Steps | Expected Result | Status |
|---|---|---|---|---|
| CLM-001 | Major | Claims list with filters | Loads correctly | ☐ |
| CLM-002 | Critical | Submit claim (type, amount, date, receipt) | Created; receipt uploaded | ☐ |
| CLM-003 | Major | Submit claim exceeding max limit | Rejected with validation error | ☐ |
| CLM-004 | Major | Open claim detail → view receipt | Receipt viewable via file-list (verify FIX #8 — navigates to detail page) | ☐ |
| CLM-005 | Critical | Manager approves claim | Status advances to finance pending | ☐ |
| CLM-006 | Critical | Finance approves claim | Status=Approved | ☐ |
| CLM-007 | Major | Finance marks as paid | Status=Paid | ☐ |
| CLM-008 | Major | Manager rejects with remarks | Rejection reason stored | ☐ |
| CLM-009 | Critical | View rejected claim in list | Manager column shows "Rejected" with red icon (verify FIX #9) | ☐ |
| CLM-010 | Critical | View rejected claim detail | Rejection reason displayed (verify FIX #10) | ☐ |
| CLM-011 | Major | Edit pending claim | Allowed | ☐ |
| CLM-012 | Major | Delete pending claim (owner) | Allowed | ☐ |
| CLM-013 | Major | GET `/api/claims/summary/:employee_id` | Returns aggregated summary | ☐ |
| CLM-014 | Major | RBAC: staff/manager/admin visibility | Correct scope each role | ☐ |

---

# MODULE 8 — HR Communications

| TC ID | Priority | Test Steps | Expected Result | Status |
|---|---|---|---|---|
| MEMO-001 | Major | Memo list + filters | Loads | ☐ |
| MEMO-002 | Major | Create memo (Quill editor, priority, audience) | Saved with formatting | ☐ |
| MEMO-003 | Major | View memo | Formatting renders | ☐ |
| MEMO-004 | Major | Acknowledge memo | Read receipt tracked | ☐ |
| MEMO-005 | Minor | Memo statistics | Read/unread counts correct | ☐ |
| MEMO-006 | Major | Edit memo (author/admin) | Saved | ☐ |
| MEMO-007 | Major | Delete memo (author/admin) | Removed | ☐ |
| AC-001 | Minor | GET `/api/announcement-categories` | Returns all | ☐ |
| AC-002 | Minor | Create category (admin) | Saved | ☐ |
| AC-003 | Minor | Edit category | Saved | ☐ |
| AC-004 | Minor | Delete category | Removed | ☐ |
| POL-001 | Major | Policy list | Loads with categories | ☐ |
| POL-002 | Minor | Policy categories counts | Correct | ☐ |
| POL-003 | Major | Create policy (Quill) | Saved as Draft | ☐ |
| POL-004 | Major | Admin approves policy | Status=Published | ☐ |
| POL-005 | Major | Acknowledge policy | Recorded | ☐ |
| POL-006 | Minor | Policy stats | Counts correct | ☐ |
| POL-007 | Major | Edit policy | Saved | ☐ |
| POL-008 | Major | Delete policy | Removed | ☐ |
| POL-009 | Major | Create new version (parent_policy_id) | Linked correctly | ☐ |

---

# MODULE 9 — Statutory Reports

| TC ID | Priority | Test Steps | Expected Result | Status |
|---|---|---|---|---|
| STR-001 | Major | Reports list loads | All 4 reports listed | ☐ |
| STR-002 | Minor | Available periods | Returns months with payroll | ☐ |
| STR-003 | Critical | EA Form: employee + year | Data matches annual totals (gross/EPF/SOCSO/PCB) | ☐ |
| STR-004 | Major | EA Form PDF | Valid PDF (structural check) | ☐ |
| STR-005 | Critical | EPF Borang A: month + year | All employees listed with EPF | ☐ |
| STR-006 | Major | EPF Borang A PDF | Valid PDF | ☐ |
| STR-007 | Critical | SOCSO Form 8A | Monthly contributions correct | ☐ |
| STR-008 | Major | SOCSO PDF | Valid PDF | ☐ |
| STR-009 | Critical | PCB CP39 | Monthly PCB correct | ☐ |
| STR-010 | Major | PCB PDF | Valid PDF | ☐ |
| STR-011 | Major | CSV export each report type | Valid CSV, e-filing format | ☐ |
| STR-012 | Major | Report totals reconcile with payroll | Exact match | ☐ |

---

# MODULE 10 — Analytics

| TC ID | Priority | Test Steps | Expected Result | Status |
|---|---|---|---|---|
| ANA-001 | Major | Analytics dashboard loads | Renders | ☐ |
| ANA-002 | Major | Payroll Cost chart, year filter | Renders | ☐ |
| ANA-003 | Major | Leave Utilization chart | Renders | ☐ |
| ANA-004 | Major | Attendance Punctuality chart | Renders | ☐ |
| ANA-005 | Major | Claims Spending chart | Renders | ☐ |
| ANA-006 | Minor | Date/year filter across charts | All charts refresh | ☐ |
| ANA-007 | Major | Export Excel | Valid `.xlsx` | ☐ |
| ANA-008 | Major | Export PDF | Valid PDF | ☐ |
| ANA-009 | Critical | Staff accesses `/analytics` | 403 Forbidden (manager+ only) | ☐ |

---

# MODULE 11 — Document Management

| TC ID | Priority | Test Steps | Expected Result | Status |
|---|---|---|---|---|
| DOC-001 | Major | Admin opens `/documents` | Overview loads | ☐ |
| DOC-002 | Major | Stat cards (total/categories/storage/verified) | Match DB | ☐ |
| DOC-003 | Minor | Category breakdown | Counts correct | ☐ |
| DOC-004 | Minor | Recent activity list | Latest uploads shown | ☐ |
| DOC-005 | Major | Upload single file | Stored in Supabase; metadata in DB | ☐ |
| DOC-006 | Major | Upload 10 files at once | All stored | ☐ |
| DOC-007 | Major | Download via signed URL | File downloads | ☐ |
| DOC-008 | Major | Preview PDF/image inline | Renders | ☐ |
| DOC-009 | Major | Upload >10MB file | Blocked with validation error | ☐ |
| DOC-010 | Major | Upload disallowed extension (.exe) | Blocked | ☐ |
| DOC-011 | Major | File list filters (category/date/search/verified/sort) | All filters work | ☐ |
| DOC-012 | Major | My Documents | User sees own files only | ☐ |
| DOC-013 | Major | Update metadata (description/category) | Saved | ☐ |
| DOC-014 | Major | Admin verify/unverify file | Toggle works | ☐ |
| DOC-015 | Major | Soft delete | Hidden from list | ☐ |
| DOC-016 | Major | Permanent delete (admin) | Removed from DB + Storage | ☐ |
| DOC-017 | Major | Bulk delete | Multiple removed | ☐ |
| DOC-018 | Minor | Files by employee | Scoped list returned | ☐ |
| DOC-019 | Minor | Files by claim | Scoped list returned | ☐ |
| DOC-020 | Minor | Storage statistics | Accurate bytes | ☐ |
| DOC-021 | Critical | Staff downloads another user's file | 403 Forbidden | ☐ |

---

# MODULE 12 — Personal Pages

| TC ID | Priority | Test Steps | Expected Result | Status |
|---|---|---|---|---|
| PER-001 | Major | Open `/personal/profile` | Personal + employment info shown | ☐ |
| PER-002 | Major | Edit limited fields | Saved | ☐ |
| PER-003 | Major | My Payslips list | Payslips by month displayed | ☐ |
| PER-004 | Major | Open payslip | Detail/PDF displayed | ☐ |
| PER-005 | Major | Change Password with current + new | Success; login with new password works | ☐ |
| PER-006 | Major | Change Password without current | Blocked | ☐ |
| PER-007 | Major | Weak new password | Validation error | ☐ |

---

# MODULE 13 — User Management

| TC ID | Priority | Test Steps | Expected Result | Status |
|---|---|---|---|---|
| USR-001 | Major | User list loads | Pagination + filters work | ☐ |
| USR-002 | Major | View user detail | Linked employee, role, status shown | ☐ |
| USR-003 | Critical | Super admin changes user role | Role updated; JWT invalidated on next login | ☐ |
| USR-004 | Major | Admin (non-super) tries to change role | 403 Forbidden | ☐ |
| USR-005 | Major | Toggle user inactive | Login blocked | ☐ |
| USR-006 | Major | Link user to employee | Relationship saved | ☐ |
| USR-007 | Major | Unlink user from employee | Relationship removed | ☐ |
| USR-008 | Major | Admin resets user password | Email sent; user can login with new pw | ☐ |
| USR-009 | Minor | Unlinked employees list | Employees without user accounts shown | ☐ |
| USR-010 | Critical | Staff opens user management | 403 Forbidden | ☐ |

---

# MODULE 14 — Admin Settings

| TC ID | Priority | Test Steps | Expected Result | Status |
|---|---|---|---|---|
| ADM-001 | Major | `/admin-settings/company` | Company info shown | ☐ |
| ADM-002 | Major | Edit company info | Saved | ☐ |
| ADM-003 | Major | Upload company logo | Stored; avatar updates | ☐ |
| ADM-004 | Major | Leave types list | Loads | ☐ |
| ADM-005 | Major | Create/edit/toggle leave type | Saved | ☐ |
| ADM-006 | Major | Initialize year entitlements | Rows created for all employees | ☐ |
| ADM-007 | Major | Create/edit/delete entitlement | Saved | ☐ |
| ADM-008 | Major | Claim types CRUD | Saved | ☐ |
| ADM-009 | Major | Public holidays CRUD | Saved | ☐ |
| ADM-010 | Major | View current EPF/SOCSO/PCB rates | Shown | ☐ |
| ADM-011 | Critical | Update statutory rate | Used in next payroll calculation | ☐ |
| ADM-012 | Major | Email templates CRUD + preview | Saved; preview renders | ☐ |
| ADM-013 | Major | Reset template to default | Restored | ☐ |
| ADM-014 | Major | View SMTP config | Shown | ☐ |
| ADM-015 | Major | Update SMTP config | Saved | ☐ |
| ADM-016 | Critical | Test SMTP connection | Test email received | ☐ |
| ADM-017 | Critical | Staff/manager accesses admin settings | 403 Forbidden | ☐ |

---

# MODULE 15 — Personal Settings

| TC ID | Priority | Test Steps | Expected Result | Status |
|---|---|---|---|---|
| SET-001 | Major | `/settings/account` loads | Account info shown | ☐ |
| SET-002 | Major | Update session timeout | Saved | ☐ |
| SET-003 | Major | Toggle theme (light/dark/system) | Saved; applied | ☐ |
| SET-004 | Major | Toggle sidebar collapsed + compact mode | Saved; applied | ☐ |
| SET-005 | Major | Set language/timezone/date/time format | Saved | ☐ |
| SET-006 | Major | Toggle notification prefs per category | Saved | ☐ |
| SET-007 | Major | Upload profile picture with crop | Saved; avatar updated | ☐ |
| SET-008 | Major | Remove profile picture | Reverted to default | ☐ |
| SET-009 | Major | Change password | Success | ☐ |
| SET-010 | Minor | Enable/disable 2FA | Toggles | ☐ |
| SET-011 | Minor | Reset all settings | Defaults restored | ☐ |

---

# MODULE 16 — Notifications

| TC ID | Priority | Test Steps | Expected Result | Status |
|---|---|---|---|---|
| NOT-001 | Major | `/notifications` loads | List renders with accent bar + icons | ☐ |
| NOT-002 | Minor | Search by keyword | Filters list | ☐ |
| NOT-003 | Minor | Filter by status (All/Unread/Read) | Works | ☐ |
| NOT-004 | Minor | Filter by type | Works | ☐ |
| NOT-005 | Minor | Clear/reset filters | Resets | ☐ |
| NOT-006 | Minor | Pagination | Works | ☐ |
| NOT-007 | Major | Click notification | Marks read + navigates | ☐ |
| NOT-008 | Major | Mark all as read | All marked | ☐ |
| NOT-009 | Major | Mark single as read | Marked | ☐ |
| NOT-010 | Major | Delete notification | Removed | ☐ |
| NOT-011 | Major | Bell icon unread badge | Correct count | ☐ |
| NOT-012 | Major | Dropdown recent notifications | Rendered | ☐ |
| NOT-013 | Minor | 60s polling of unread count | Auto-refresh | ☐ |
| NOT-014 | Major | Trigger: leave approved → notify | Recipient receives | ☐ |
| NOT-015 | Major | Trigger: leave rejected → notify | Recipient receives | ☐ |
| NOT-016 | Major | Trigger: claim manager approved/rejected | Recipient receives | ☐ |
| NOT-017 | Major | Trigger: claim finance approved/rejected | Recipient receives | ☐ |
| NOT-018 | Major | Trigger: WFH approved/rejected | Recipient receives | ☐ |
| NOT-019 | Major | Trigger: memo/announcement published | Target audience notified | ☐ |
| NOT-020 | Major | Trigger: policy published | Target audience notified | ☐ |
| NOT-021 | Major | Trigger: team member joined | Manager/admin notified | ☐ |
| NOT-022 | Minor | Endpoint checks (5 routes) | All return expected shape | ☐ |

---

# CROSS-CUTTING

| TC ID | Priority | Test Steps | Expected Result | Status |
|---|---|---|---|---|
| XC-001 | Critical | API returns 401 | Interceptor auto-redirects to login | ☐ |
| XC-002 | Major | API returns 403 | "Access denied" message shown | ☐ |
| XC-003 | Major | API returns 404 | Proper error message | ☐ |
| XC-004 | Major | API returns 422 | Field-level errors displayed | ☐ |
| XC-005 | Critical | API returns 500 | Generic error; no stack trace leaked | ☐ |
| XC-006 | Minor | Page load <3s (measured) | 95th percentile under target | ☐ |
| XC-007 | Minor | API response <1s (standard queries) | Target met | ☐ |
| XC-008 | Major | Pagination not fetching all records | Verified | ☐ |
| XC-009 | Major | JWT in localStorage | Present after login | ☐ |
| XC-010 | Major | Authorization header on API requests | Present | ☐ |
| XC-011 | Major | Token expiry → refresh token flow | Silent refresh on 401 (FIX #7 in Security Sprint) | ☐ |
| XC-012 | Major | CORS headers on API | Correct | ☐ |
| XC-013 | Major | Rate limit 20 auth / 15 min | Throttled after threshold | ☐ |
| XC-014 | Major | Helmet security headers | CSP, HSTS, COOP, COEP, Referrer, Permissions present | ☐ |
| XC-015 | Critical | No sensitive data in error responses | Verified via negative tests | ☐ |
| XC-016 | Minor | Renders at 1920×1080 | No layout breaks | ☐ |
| XC-017 | Minor | Renders at 768px (tablet) | Layout adapts | ☐ |
| XC-018 | Minor | Renders at 375px (mobile web) | Sidebar collapses; layout adapts | ☐ |

---

# EXECUTION PLAN

1. **Phase 1 — Setup (est. 30 min)**
   - Install Playwright in `HRMS_v1/tests/e2e/`
   - Run seed script to create UAT users + sample data
   - Start backend + frontend locally

2. **Phase 2 — Automated Run**
   - Execute `npm run test:e2e` (Chromium)
   - Execute `npm run test:e2e:mobile` (mobile viewport profile)
   - Generate HTML report with screenshots/videos/traces

3. **Phase 3 — Results & Triage**
   - Update Status column for each TC
   - Log new defects in Issue Log
   - Share report with stakeholder

---

# EXECUTION RESULTS — Run 1 (2026-04-22)

Automated via Playwright (`HRMS_v1/tests/e2e/`). UI + API hybrid suite against local env (backend :3000, frontend :4200, Supabase PostgreSQL).

## Summary

| Metric | Run 1 (2026-04-22) | Run 2 (2026-04-22 expanded) |
|---|---|---|
| Total automated cases | 85 | **227** |
| Passed | 81 | **222** |
| Failed | 1 | 1 (same defect D1) |
| Skipped (preconditions not met) | 3 | 4 |
| Duration | ~35s | ~53s |
| HTML report | overwrite | **archived per-run** to `html-report-archive/<timestamp>/` |

## Coverage note

The Playwright suite automates the **critical + major API-level checks** for each module (endpoint reachability, role-based access, response shape, the 12 fixed issues from the Issue Log). Items that inherently require human judgement (PDF visual formatting, email inbox delivery, responsive layout aesthetics, OAuth external redirects) are marked in the status table below as **MANUAL** and must be spot-checked by the tester.

## New Defects Found by Automation

| # | TC ID | Module | Severity | Description | Suggested Fix |
|---|---|---|---|---|---|
| D1 | POL-001 | HR Communications | Major | `GET /api/policies` returns 500: `column author.full_name does not exist`. Policy list cannot load. | Inspect `policyController.getAllPolicies` include clause — `author` association must select `full_name` from the related `users` or `employees` table, not `users.full_name` directly. |

## Status column updates

Key:
- ✅ PASS (automated)
- ❌ FAIL (see defect)
- ⏭ SKIP (precondition not met)
- 📝 MANUAL (not automatable in this suite — tester to verify)

**Module 1 — Auth & Onboarding:** AUTH-001 ✅ · AUTH-002 ✅ · AUTH-004 ✅ · AUTH-005 ✅ · AUTH-007 ✅ · AUTH-009 ✅ · AUTH-011 ✅ · AUTH-012 ✅ · AUTH-015 ✅ · AUTH-019 ✅ · AUTH-020 ✅ · AUTH-027 ✅ · AUTH-028 ✅ · others 📝

**Module 2 — Dashboard:** DASH-001 ✅ · DASH-002/003/004/005 ✅ (endpoint) · DASH-006 ✅ · DASH-007 ✅ · DASH-008 ✅

**Module 3 — Employees:** EMP-001 ✅ · EMP-002 ✅ · EMP-004 ✅ (FIX #5 verified) · EMP-010 ✅ · EMP-012 ✅ (FIX #6 verified) · EMP-014 ✅ · EMP-015 ✅ · EMP-017 ✅ · others 📝

**Module 4 — Payroll:** PAY-008 ✅ · PAY-015 ✅ · PAY-017 ⏭ (no approved payroll to test edit-block) · others 📝

**Module 5 — Leave:** LV-001 ✅ · LV-006 ✅ (FIX #1 verified) · LV-008 ✅ (FIX #2 verified) · LV-019 ✅ · LV-021 ✅ · others 📝

**Module 6 — Attendance & WFH:** ATT-006 ✅ · ATT-008 ✅ · ATT-011 ✅ · others 📝

**Module 7 — Claims:** CLM-001 ✅ · CLM-013 ✅ (endpoint reachable) · CLM-014a ✅ · CLM-014b ✅ · others 📝

**Module 8 — HR Communications:** MEMO-001 ✅ · AC-001 ✅ · POL-001 ❌ (Defect D1) · POL-002 ✅ · others 📝

**Module 9 — Statutory Reports:** STR-002 ✅ · STR-011 ✅ (structural) · PDF rendering 📝

**Module 10 — Analytics:** ANA-001 ✅ · ANA-002 ✅ · ANA-003 ✅ · ANA-009 ✅ · chart visual verification 📝

**Module 11 — Documents:** DOC-001 ✅ · DOC-002 ✅ · DOC-012 ✅ · DOC-020 ✅ · file upload/preview 📝

**Module 12 — Personal:** PER-001 ✅ · PER-003 ✅ · PER-006 ✅ · PER-007 ✅ · others 📝

**Module 13 — User Management:** USR-001 ✅ · USR-009 ✅ · USR-010 ✅ · others 📝

**Module 14 — Admin Settings:** ADM-004 ✅ · ADM-007 ✅ · ADM-008 ✅ · ADM-009 ✅ · ADM-010 ✅ · ADM-012 ✅ · ADM-014 ✅ · ADM-017 ✅ · SMTP test email 📝

**Module 15 — Personal Settings:** SET-001 ✅ · SET-003 ✅ · SET-005 ✅ · SET-006 ✅ · profile-picture crop 📝

**Module 16 — Notifications:** NOT-022a ✅ · NOT-022b ✅ · NOT-008 ✅ · triggers 📝

**Cross-Cutting:** XC-001 ✅ · XC-002 ✅ · XC-003 ✅ · XC-011 ✅ (FIX Security Sprint verified) · XC-014 ✅ · XC-015 ✅ · XC-016 ✅ · XC-018 ✅

## Verified FIXED items from Issue Log

✅ FIX #1  — Leave balance route collision (verified via LV-006)
✅ FIX #2  — Unpaid leave bypass (verified via LV-008)
✅ FIX #3  — Admin dashboard redirect (verified via DASH-001)
✅ FIX #4  — Admin blocked from manager dashboard UI (verified via DASH-008)
✅ FIX #5  — Employee create with only mandatory fields (verified via EMP-004)
✅ FIX #6  — YTD endpoint returns aggregated data (verified via EMP-012)
📝 FIX #7  — Payslip download uses `window.print()` (manual — UI behaviour)
📝 FIX #8  — Claim receipt viewable after approval (manual — UI behaviour)
📝 FIX #9  — Rejected claim shows "Rejected" in manager column (manual — UI behaviour)
📝 FIX #10 — Rejection reason displayed (manual — UI behaviour)
📝 FIX #11 — ZardUI AlertDialog replaces browser alert (manual — UI behaviour)
📝 FIX #12 — Immediate validation error on login submit (partially via AUTH-002)

## Re-running

Backend rate limit (20 auth requests / 15 min) can cause later-in-suite failures. Before the next run:
```bash
# From HRMS-API_v1
DISABLE_AUTH_RATE_LIMIT=true npm run dev
# Windows PowerShell
$env:DISABLE_AUTH_RATE_LIMIT="true"; npm run dev
```

---

# ISSUE LOG (Open)

| # | TC ID | Module | Severity | Description | Status |
|---|---|---|---|---|---|
| D1 | POL-001 | HR Communications | Major | `GET /api/policies` 500 — `column author.full_name does not exist` | OPEN |

# SIGN-OFF

| Role | Name | Signature | Date |
|---|---|---|---|
| QA Lead |  |  |  |
| Product Owner |  |  |  |
| Tech Lead |  |  |  |
| Stakeholder |  |  |  |

---

**Document revision history**

| Version | Date | Author | Changes |
|---|---|---|---|
| 1.0 | 2026-04-22 | Automated | Initial generation from E2E checklist v1.2; 12 fixes from issue log reflected |
