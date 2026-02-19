# HRMS E2E Testing Checklist

> **Created:** February 15, 2026
> **Purpose:** Module-by-module verification before production go-live
> **Status:** Pending Testing
> **Test Users:** Super Admin (`admin@nextura.com` / `Admin@1234`), + create Manager & Staff test users
> **Backend:** 22 route groups, 220+ endpoints, 24 models
> **Frontend:** 15 feature modules, 69 components

---

## Pre-Testing Setup

- [ ] Backend running locally (`localhost:3000`)
- [ ] Frontend running locally (`localhost:4200`)
- [ ] Connected to Supabase PostgreSQL
- [ ] Supabase Storage bucket `hrms-files` accessible
- [ ] Super admin account accessible
- [ ] Browser DevTools open (Network tab for API monitoring)

---

## Module 1: Authentication & Onboarding

**Backend:** `auth.routes.js`, `company.routes.js`, `invitation.routes.js`
**Frontend:** `features/auth/*`, `features/onboarding/*`
**Endpoints:** 9 auth + 7 company + 7 invitation = 23 endpoints

### Login & Registration
- [ ] Login with valid credentials → JWT returned, redirected to dashboard
- [ ] Login with invalid credentials → proper error message shown
- [ ] Login with locked account → account lockout message
- [ ] Register new user → account created, verification email sent
- [ ] Register with duplicate email → proper error

### Email Verification
- [ ] Verify email with valid token → `email_verified` flag set to true
- [ ] Verify email with invalid/expired token → error message
- [ ] Resend verification email → new email sent

### Password Recovery
- [ ] Forgot password → reset email sent to registered email
- [ ] Reset password with valid token → password changed, can login with new password
- [ ] Reset password with expired token → error message

### Auth Guards
- [ ] Unauthenticated user accessing `/dashboard` → redirected to `/auth/login`
- [ ] Unverified email user → redirected to `/auth/verify-email-pending`
- [ ] User without company → redirected to `/onboarding`
- [ ] Super admin bypasses email/company checks

### Onboarding Flow
- [ ] Onboarding choice page loads → "Setup Company" or "Wait for Invitation"
- [ ] Company setup wizard → company created, user assigned admin role
- [ ] Wait for invitation → shows pending status

### Invitation System
- [ ] Admin invites user by email → invitation email sent
- [ ] Invitation list loads for admin
- [ ] Accept invitation with valid token → user joins company with assigned role
- [ ] Cancel pending invitation
- [ ] Resend invitation

### Multi-Company
- [ ] Existing user can create additional company via onboarding
- [ ] Company switcher in sidebar shows all companies
- [ ] Switch company → new JWT issued, data reloads for new company
- [ ] `GET /api/company/my-companies` returns all user companies
- [ ] `POST /api/company/switch` issues new token with updated company_id

**Issues Found:**
```
(document issues here during testing)
```

---

## Module 2: Dashboard

**Backend:** `dashboard.routes.js` (3 endpoints)
**Frontend:** `features/dashboard/*` (admin, manager, staff dashboards)

- [ ] Admin dashboard (`/dashboard/admin`) loads with correct KPIs
  - [ ] Employee count accurate
  - [ ] Payroll summary accurate
  - [ ] Leave requests pending count
  - [ ] Claims pending count
- [ ] Manager dashboard (`/dashboard/manager`) loads with team data
- [ ] Staff dashboard (`/dashboard/staff`) loads with personal data
- [ ] Role-based redirect works (admin→admin dashboard, staff→staff dashboard)
- [ ] Dashboard data matches actual database records

**Issues Found:**
```

```

---

## Module 3: Employee Management

**Backend:** `employee.routes.js` (9 endpoints)
**Frontend:** `features/employees/*` (list, form, detail)

### CRUD Operations
- [ ] Employee list loads with pagination
- [ ] Search by name/employee ID works
- [ ] Filter by department/status works
- [ ] Create new employee → form validation, save, appears in list
- [ ] View employee detail → all sections render (personal, employment, statutory)
- [ ] Edit employee → changes saved correctly
- [ ] Delete employee → soft delete, removed from active list

### Self-Service
- [ ] `GET /api/employees/me` → returns own profile for authenticated user
- [ ] `PUT /api/employees/me` → staff can update own limited fields

### Statistics & YTD
- [ ] Employee statistics endpoint → correct counts by department/status
- [ ] YTD statutory data (`GET /api/employees/:id/ytd`) displays correctly

### Role Access
- [ ] Staff can only see own profile
- [ ] Manager sees team members
- [ ] Admin sees all employees

**Issues Found:**
```

```

---

## Module 4: Payroll

**Backend:** `payroll.routes.js` (16 endpoints)
**Frontend:** `features/payroll/*` (list, form, payslip-view)

### Calculation
- [ ] Calculate payroll for an employee → all components computed
- [ ] EPF: Employee 11% / Employer 13% (verify with age/salary variations)
- [ ] EPF caps at RM30,000 monthly salary
- [ ] SOCSO: 34-tier contribution table applied correctly (cap: RM10,800)
- [ ] EIS: 0.2% employee + 0.2% employer (verify)
- [ ] PCB: Progressive tax rates applied correctly
- [ ] Net pay = Gross - Employee deductions

### Workflow
- [ ] Payroll list loads with filters (month, year, status, employee)
- [ ] Draft payroll created after calculation
- [ ] Submit for approval → status changes to Pending
- [ ] Approve payroll (admin) → status changes to Approved
- [ ] Mark as paid (admin) → status changes to Paid
- [ ] YTD auto-updates after payroll approval

### Bulk Operations
- [ ] Bulk submit for approval
- [ ] Bulk approve
- [ ] Bulk mark as paid
- [ ] Bulk cancel
- [ ] Bulk delete

### Payslip
- [ ] Generate payslip PDF → correct data, proper format
- [ ] Download payslip works
- [ ] My payslips → staff sees own payslips only (`GET /api/payroll/my-payslips`)

### Edit & Delete
- [ ] Edit payroll (only in draft/pending status)
- [ ] Cancel payroll
- [ ] Soft delete payroll
- [ ] Permanent delete payroll (admin only)

**Issues Found:**
```

```

---

## Module 5: Leave Management

**Backend:** `leave.routes.js` (7 endpoints), `leave-type.routes.js` (5), `leave-entitlement.routes.js` (6)
**Frontend:** `features/leave/*` (list, form, approval, balance, details)

### Application
- [ ] Leave list loads with filters (status, type, date range)
- [ ] Apply leave → date picker, leave type dropdown, reason field
- [ ] Half-day leave option works
- [ ] Document upload for specific leave types (e.g., medical certificate)
- [ ] Leave type document requirements enforced

### Balance & Entitlements
- [ ] Leave balance page shows all leave types with used/remaining
- [ ] `GET /api/leaves/balance/:employee_id` returns correct data
- [ ] Pro-rated calculation for mid-year joiner
- [ ] Carry forward days display correctly

### Approval Workflow
- [ ] Manager sees pending approvals (`/leave/approvals`)
- [ ] Approve leave → balance updated
- [ ] Reject leave with remarks
- [ ] Approval history shown in leave details

### CRUD
- [ ] Edit pending leave application
- [ ] Cancel own leave
- [ ] Leave details page shows full info + timeline

### Role Access
- [ ] Staff sees own leaves
- [ ] Manager sees team leaves
- [ ] Admin sees all leaves

**Issues Found:**
```

```

---

## Module 6: Attendance & WFH

**Backend:** `attendance.routes.js` (10 endpoints)
**Frontend:** `features/attendance/*` (list, clock-in-out, wfh, detail, my-attendance)

### Clock In/Out
- [ ] Clock in → timestamp captured + location (lat/long)
- [ ] Clock out → duration calculated automatically
- [ ] Cannot clock in twice on same day
- [ ] Late detection (`is_late` flag set correctly)
- [ ] Early leave detection (`is_early_leave` flag)

### Attendance Records
- [ ] Attendance list with filters (date range, employee, type)
- [ ] Attendance detail shows clock times, duration, type (Office/WFH)
- [ ] My attendance view → staff sees own records
- [ ] Attendance summary → correct stats (total days, late count, etc.)

### WFH Management
- [ ] WFH application → submit with date + reason
- [ ] WFH approval list loads for managers
- [ ] Manager approve WFH → creates attendance record with type=WFH
- [ ] Manager reject WFH with remarks

### Admin Operations
- [ ] Edit attendance record (admin/manager)
- [ ] Delete attendance record (admin)

**Issues Found:**
```

```

---

## Module 7: Claims

**Backend:** `claim.routes.js` (8 endpoints), `claim-type.routes.js` (5 endpoints)
**Frontend:** `features/claims/*` (list, form, approval)

### Submission
- [ ] Claims list loads with filters (status, type, date)
- [ ] Submit claim → type, amount, date, description, receipt upload
- [ ] Claim amount validated against claim type max limit
- [ ] Receipt file attached and viewable

### Multi-Level Approval
- [ ] Manager approval → `PATCH /api/claims/:id/manager-approval`
- [ ] Finance approval → `PATCH /api/claims/:id/finance-approval`
- [ ] Mark as paid (finance/admin)
- [ ] Rejection with remarks at each level

### CRUD & Reports
- [ ] Edit pending claim
- [ ] Delete pending claim (staff can delete own)
- [ ] Claims summary per employee (`GET /api/claims/summary/:employee_id`)

### Role Access
- [ ] Staff sees own claims
- [ ] Manager sees team claims + approval interface
- [ ] Admin sees all claims + finance approval

**Issues Found:**
```

```

---

## Module 8: HR Communications

**Backend:** `memo.routes.js` (7 endpoints), `policy.routes.js` (9 endpoints)
**Frontend:** `features/communication/*` (memo-form/list/viewer, policy-form/list/viewer)

### Memos
- [ ] Memo list loads with filters (priority, status)
- [ ] Create memo → rich text editor (Quill), priority, target audience
- [ ] Memo viewer → content renders correctly with formatting
- [ ] Acknowledge memo → read receipt tracked
- [ ] Memo statistics → read/unread counts
- [ ] Edit memo (author/admin)
- [ ] Delete memo (author/admin)

### Policies
- [ ] Policy list loads with categories
- [ ] Policy categories endpoint returns grouped counts
- [ ] Create policy → category, version, content (Quill editor)
- [ ] Policy approval workflow (admin approves draft policy)
- [ ] Acknowledge policy → acknowledgment recorded
- [ ] Policy statistics → acknowledgment counts
- [ ] Edit policy (author/admin)
- [ ] Delete policy (admin)
- [ ] Policy versioning (parent_policy_id for new versions)

**Issues Found:**
```

```

---

## Module 9: Statutory Reports

**Backend:** `statutory-reports.routes.js` (11 endpoints)
**Frontend:** `features/statutory-reports/*` (reports-list)

### Reports Generation
- [ ] Reports list page loads
- [ ] Available periods → returns months with payroll data
- [ ] **EA Form:**
  - [ ] Select employee + year → data loads correctly
  - [ ] Data matches annual payroll totals (gross, EPF, SOCSO, PCB)
  - [ ] PDF download → valid PDF with correct layout
- [ ] **EPF Borang A:**
  - [ ] Select month/year → all employees listed with EPF amounts
  - [ ] Employee + employer contributions correct
  - [ ] PDF download works
- [ ] **SOCSO Form 8A:**
  - [ ] Monthly SOCSO contributions for all employees
  - [ ] Tier amounts match payroll records
  - [ ] PDF download works
- [ ] **PCB CP39:**
  - [ ] Monthly tax deductions for all employees
  - [ ] Amounts match payroll PCB calculations
  - [ ] PDF download works

### Export
- [ ] CSV export for each report type (`GET /api/statutory-reports/csv/:type/:year/:month`)
- [ ] CSV format matches e-filing requirements

### Data Accuracy
- [ ] Report totals match sum of individual payroll records
- [ ] Year-to-date figures accurate in EA form

**Issues Found:**
```

```

---

## Module 10: Analytics

**Backend:** `analytics.routes.js` (7 endpoints)
**Frontend:** `features/analytics/*` (dashboard + 4 chart components)

- [ ] Analytics dashboard loads (`/analytics`)
- [ ] **Payroll Cost Chart:** renders with monthly cost data, filters by year
- [ ] **Leave Utilization Chart:** shows usage by leave type
- [ ] **Attendance Punctuality Chart:** shows on-time vs late percentages
- [ ] **Claims Spending Chart:** shows spending by claim type
- [ ] Date range / year filter works across all charts
- [ ] Export to Excel → valid `.xlsx` with all analytics data
- [ ] Export to PDF → valid report document
- [ ] Role access: only manager+ can access analytics page

**Issues Found:**
```

```

---

## Module 11: File Management

**Backend:** `file.routes.js` (12 endpoints)
**Frontend:** shared components (`file-upload`, `file-list`, `file-viewer`)

### Upload & Download
- [ ] Upload single file → stored in Supabase Storage, metadata in DB
- [ ] Upload multiple files (up to 10)
- [ ] Download file → signed URL generated, file downloads
- [ ] Preview file inline (PDF, images)
- [ ] File size limit enforced (10MB max)
- [ ] File type validation (only allowed extensions)

### File Management
- [ ] File list with filters (category, employee, date)
- [ ] File metadata update (description, category)
- [ ] Soft delete file
- [ ] Permanent delete file (admin only)
- [ ] Bulk delete multiple files

### Relationships
- [ ] Files by employee (`GET /api/files/employee/:employee_id`)
- [ ] Files by claim (`GET /api/files/claim/:claim_id`)
- [ ] Storage statistics (`GET /api/files/stats/storage`)

### Access Control
- [ ] File owner can access own files
- [ ] Admin can access all files
- [ ] Manager can access team files
- [ ] Staff cannot access others' files

**Issues Found:**
```

```

---

## Module 12: Personal Pages

**Backend:** `GET/PUT /api/employees/me`, `GET /api/payroll/my-payslips`, `POST /api/auth/change-password`
**Frontend:** `features/personal/*` (my-profile, my-payslips, change-password)

- [ ] **My Profile** (`/personal/profile`)
  - [ ] Page loads with personal info (name, email, phone, IC)
  - [ ] Employment info shown (department, position, join date)
  - [ ] Edit limited fields → changes saved
- [ ] **My Payslips** (`/personal/payslips` or via payroll/my-payslips)
  - [ ] Payslip history loads with list of months
  - [ ] Click payslip → detail view / PDF download
- [ ] **Change Password** (`/personal/change-password`)
  - [ ] Current password required
  - [ ] New password validation (strength rules)
  - [ ] Password changed successfully → can login with new password
- [ ] All authenticated users can access own personal pages

**Issues Found:**
```

```

---

## Module 13: User Management

**Backend:** `user.routes.js` (8 endpoints)
**Frontend:** `features/user-management/*` (user-list)

- [ ] User list loads with pagination/filters
- [ ] View user details (linked employee, role, status)
- [ ] Update user role → only super_admin can change roles
- [ ] Toggle user active/inactive → deactivated user cannot login
- [ ] Link user to employee record
- [ ] Unlink user from employee
- [ ] Admin reset user password
- [ ] Unlinked employees list → shows employees without user accounts
- [ ] Role access: admin+ only can access user management

**Issues Found:**
```

```

---

## Module 14: Admin Settings

**Backend:** `leave-type.routes.js` (5), `leave-entitlement.routes.js` (6), `claim-type.routes.js` (5), `public-holiday.routes.js` (5), `statutory-config.routes.js` (2), `email-template.routes.js` (5), `company.routes.js` (7)
**Frontend:** `features/admin-settings/*` (admin-settings-page with sections)

### Company Profile
- [ ] Admin settings page loads (`/admin-settings/company`)
- [ ] View company info (name, reg no, industry, size, country)
- [ ] Edit company info → changes saved
- [ ] Upload company logo

### Leave Types
- [ ] Leave types list (`/admin-settings/leave-types`)
- [ ] Create new leave type (name, days, carry forward rules)
- [ ] Edit existing leave type
- [ ] Toggle leave type active/inactive

### Leave Entitlements
- [ ] Entitlements list (`/admin-settings/leave-entitlements`)
- [ ] Initialize year entitlements for all employees
- [ ] Create individual entitlement
- [ ] Edit entitlement (total days, carry forward)
- [ ] Delete entitlement

### Claim Types
- [ ] Claim types list (`/admin-settings/claim-types`)
- [ ] Create new claim type (name, max amount)
- [ ] Edit claim type
- [ ] Toggle claim type active/inactive

### Public Holidays
- [ ] Public holidays list (`/admin-settings/public-holidays`)
- [ ] Create new holiday (name, date)
- [ ] Edit holiday
- [ ] Delete holiday

### Payroll Configuration
- [ ] Statutory config page (`/admin-settings/payroll-config`)
- [ ] View current EPF/SOCSO/PCB rates
- [ ] Update statutory rates → saved to `statutory_configs` table
- [ ] Updated rates used in next payroll calculation

### Email Templates
- [ ] Email templates list (`/admin-settings/email-templates`)
- [ ] View template (subject + body)
- [ ] Edit template with variables
- [ ] Preview template with sample data
- [ ] Reset template to system default

### Access Control
- [ ] Only admin+ can access admin settings
- [ ] Staff/manager redirected away

**Issues Found:**
```

```

---

## Module 15: Personal Settings

**Backend:** `settings.routes.js` (9 endpoints)
**Frontend:** `features/settings/*` (settings-page with sections)

- [ ] Settings page loads (`/settings/account`)
- [ ] **Account:** view/update account info
- [ ] **Appearance:** toggle theme (light/dark), sidebar collapsed
- [ ] **Display:** language, timezone settings
- [ ] **Notifications:** toggle email/push notification preferences
- [ ] **Change Password:** (within settings) change password flow
- [ ] **Two-Factor:** enable/disable 2FA toggle (UI only, MFA not fully implemented)
- [ ] **Reset:** reset all settings to defaults
- [ ] All authenticated users can access personal settings

**Issues Found:**
```

```

---

## Cross-Cutting Concerns

### API Error Handling
- [ ] 401 Unauthorized → auto-redirect to login (interceptor)
- [ ] 403 Forbidden → proper "access denied" message
- [ ] 404 Not Found → proper error message
- [ ] 422 Validation Error → field-level error messages shown
- [ ] 500 Server Error → generic error message (no stack trace exposed)

### Performance
- [ ] Page load times < 3 seconds
- [ ] API response times < 1 second for standard queries
- [ ] Pagination works correctly (not loading all records at once)
- [ ] No infinite loops or memory leaks in browser

### Security
- [ ] JWT token stored in localStorage
- [ ] Token included in all API requests (Authorization header)
- [ ] Token expiry handled gracefully (redirect to login)
- [ ] CORS properly configured
- [ ] Rate limiting active (1000 req/15min general, 20/15min auth)
- [ ] Helmet headers present in responses
- [ ] No sensitive data in error responses

### Responsive Design
- [ ] Pages render correctly on desktop (1920x1080)
- [ ] Pages render correctly on tablet (768px)
- [ ] Pages render correctly on mobile (375px)
- [ ] Sidebar collapses on mobile

---

## Testing Summary

| Module | Total Tests | Passed | Failed | Blocked |
|--------|-------------|--------|--------|---------|
| 1. Auth & Onboarding | 25 | | | |
| 2. Dashboard | 5 | | | |
| 3. Employee Management | 11 | | | |
| 4. Payroll | 20 | | | |
| 5. Leave Management | 15 | | | |
| 6. Attendance & WFH | 14 | | | |
| 7. Claims | 11 | | | |
| 8. HR Communications | 15 | | | |
| 9. Statutory Reports | 14 | | | |
| 10. Analytics | 8 | | | |
| 11. File Management | 14 | | | |
| 12. Personal Pages | 5 | | | |
| 13. User Management | 9 | | | |
| 14. Admin Settings | 18 | | | |
| 15. Personal Settings | 8 | | | |
| Cross-Cutting | 14 | | | |
| **TOTAL** | **206** | | | |

---

## Issue Log

| # | Module | Severity | Description | Status |
|---|--------|----------|-------------|--------|
| 1 | | | | |
| 2 | | | | |
| 3 | | | | |

**Severity Levels:** Critical (blocks usage) | Major (broken feature) | Minor (cosmetic/UX) | Enhancement

---

**Document Version:** 1.0
**Created:** February 15, 2026
**Testing Start Date:** ___
**Testing End Date:** ___
**Tested By:** ___
