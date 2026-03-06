# HR Management System (HRMS) - Project Tasks

> **Last Updated:** March 5, 2026
> **Overall Project Completion:** 97%+
> **Status:** Production-deployed & hardened - All HR modules operational, OAuth login, notifications, document management, feedback system, security hardening complete
> **Database:** Supabase PostgreSQL (migrated from MySQL)
> **Deployment:** Frontend → Netlify | Backend → Azure App Service | Storage → Supabase Storage

---

## Executive Summary

The HRMS project has achieved **near-complete implementation** with approximately **97%+ completion** of Phase 1 requirements. The project demonstrates solid architecture with Angular 21 frontend and Node.js/Express backend on Supabase PostgreSQL, with production deployment and security hardening done.

**Key Highlights:**
- 11 out of 12 major modules are 95-100% complete
- All core HR operations (Employee, Payroll, Leave, Attendance, Claims) fully functional
- Sophisticated Malaysian statutory calculations AND reports implemented (EA, EPF, SOCSO, PCB)
- OAuth login (Google + GitHub) with social buttons on login/register
- Real-time notification system with 60s polling and in-app dropdown
- Document management module with admin overview and verification workflow
- Feedback system with FAB widget, screenshot upload, admin management
- **Security hardening complete:** IDOR protection (public_id UUIDs), token blacklist, refresh token rotation, CSP/HTTPS/Helmet headers, audit logging
- Full analytics module with chart visualizations and Excel/PDF export
- Production deployed and operational (Supabase PostgreSQL, Supabase Storage, Netlify + Azure)

**Remaining Gaps:**
- E-Invoice module (80% incomplete) - Only config exists, deferred
- MFA implementation (2FA toggle exists in UI, backend not wired)
- End-to-end verification and testing of all modules
- Performance testing with production-like data

---

## Completed Tasks

- [x] Project Initialization & Planning
    - [x] Analyze existing frontend setup <!-- id: 0 -->
    - [x] Define HRMS features (PRD Created in `dev_resources/PRD-HRMS.md`) <!-- id: 1 -->
    - [x] Select and setup Backend (Node.js/Express selected) <!-- id: 2 -->
    - [x] Database Schema Design (Defined in PRD) <!-- id: 3 -->

### Backend Development (Node.js/Express)
- [x] Initialize `HRMS-API_v1` project <!-- id: 7 -->
- [x] Install dependencies & Setup Server <!-- id: 8 -->
- [x] Setup Database Connection (Sequelize/PostgreSQL via Supabase) <!-- id: 9 -->
- [x] Implement Auth API (Login/Register, JWT) <!-- id: 10 -->
- [x] Implement Employee API (CRUD, YTD Statutory) <!-- id: 11 -->
- [x] Implement Payroll API (Calc, Payslip) <!-- id: 13 -->
- [x] Implement Leave & Attendance API (WFH support) <!-- id: 14 -->
- [x] Implement Claims API <!-- id: 15 -->
- [x] Implement Memo & Policy API (Communications) <!-- id: 20 -->
- [x] Implement File Management API (Supabase Storage) <!-- id: 21 -->
- [x] Implement Statutory Reports API (EA, EPF, SOCSO, PCB) <!-- id: 34 -->
- [x] Implement Analytics API (payroll, leave, attendance, claims analytics) <!-- id: 33 -->
- [x] Implement Dashboard API (admin, manager, staff) <!-- id: 36 -->
- [x] Implement Settings API <!-- id: 45 -->
- [x] Implement User Management API <!-- id: 46 -->
- [x] Migrate MySQL → PostgreSQL (Supabase) <!-- id: 47 -->
- [x] Migrate file storage → Supabase Storage <!-- id: 48 -->
- [x] Implement Company API (CRUD, setup wizard) <!-- id: 54 -->
- [x] Implement Invitation System (invite, accept, token-based) <!-- id: 55 -->
- [x] Implement Email Verification (verify-email, resend-verification) <!-- id: 56 -->
- [x] Implement Multi-Company Support (user_companies, company switch) <!-- id: 57 -->
- [x] Production Deployment (Azure App Service + Netlify + Supabase) <!-- id: 58 -->
- [x] Implement Notification API (CRUD, unread count, mark read, triggers in leave/claim/attendance/memo/invitation) <!-- id: 63 -->
- [x] Implement OAuth Login (Google + GitHub via Passport.js, findOrCreateOAuthUser, JWT redirect) <!-- id: 64 -->
- [x] Implement Feedback API (CRUD, screenshot upload, admin stats, status workflow) <!-- id: 65 -->
- [x] Security Hardening: IDOR protection with public_id UUIDs on 7 models <!-- id: 66 -->
- [x] Security Hardening: Token blacklist (SHA-256, 15-min cleanup) <!-- id: 67 -->
- [x] Security Hardening: Refresh token rotation (7d expiry, one-time-use) <!-- id: 68 -->
- [x] Security Hardening: CSP/HTTPS/Helmet headers (app.js + netlify.toml) <!-- id: 69 -->
- [x] Security Hardening: Audit log system (fire-and-forget, integrated into leave/claim/payroll/employee) <!-- id: 70 -->
- [x] Implement Document Management API (overview, verification, search/filter, company_id scoping) <!-- id: 71 -->

### Frontend Development (Angular 21)
- [x] Setup Tailwind CSS & SCSS <!-- id: 4 -->
- [x] Configure Enterprise Structure (Core, Shared, Lazy Loading) <!-- id: 5 -->
- [x] Implement Landing Page (Home, Login Nav, Logo) <!-- id: 23 -->
- [x] Implement Auth Feature (Login Page, Guards) <!-- id: 6 -->
- [x] Implement Dashboard & Layout <!-- id: 12 -->
- [x] Implement Employee Management <!-- id: 17 -->
- [x] Implement Payroll & Leave <!-- id: 18 -->
- [x] Implement Claims & Attendance (WFH) <!-- id: 19 -->
- [x] WFH Approval Management (Manager approval interface) <!-- id: 24 -->
- [x] Dynamic Leave Document Upload (Type-specific document requirements) <!-- id: 25 -->
- [x] Implement Memo & Policy Components <!-- id: 26 -->
- [x] Implement Statutory Reports Module (reports-list component) <!-- id: 49 -->
- [x] Implement Analytics Module (5 chart components, dashboard, Excel/PDF export) <!-- id: 50 -->
- [x] Implement Personal Pages (my-profile, my-payslips, change-password) <!-- id: 51 -->
- [x] Implement Settings Page (account, appearance, notifications, 2FA) <!-- id: 52 -->
- [x] Implement User Management Module <!-- id: 53 -->
- [x] Implement Onboarding Flow (onboarding-choice, company-setup-wizard, wait-for-invitation, verify-email) <!-- id: 59 -->
- [x] Implement Company Switcher in sidebar <!-- id: 60 -->
- [x] Implement Document Management Module (overview page, filterable table, verification toggle) <!-- id: 61 -->
- [x] Implement Notification UI (dropdown in top nav, unread badge, /notifications page, 60s polling) <!-- id: 62 -->
- [x] Implement OAuth Callback & Social Buttons (login + register pages, OAuthCallbackComponent) <!-- id: 72 -->
- [x] Implement Feedback Widget & Admin Page (FAB + modal, admin list with detail panel, status management) <!-- id: 73 -->
- [x] Implement Audit Log Page (super_admin, /audit-log route, sidebar under Administration) <!-- id: 74 -->
- [x] Security: Frontend updated all routes to use public_id instead of integer IDs <!-- id: 75 -->

---

## Module-by-Module Completion Status

### ✅ Module 1: Authentication & Authorization - **100% COMPLETE**

**PRD Reference:** Section 3.1

**Implementation:**
- ✅ FR-AUTH-001: User Login (email/password, JWT-based)
- ✅ FR-AUTH-002: Role-Based Access Control (Super Admin, Admin, Manager, Staff)
- ✅ Password reset & forgot password flows
- ✅ Auth guard & interceptor (checks email_verified + company_id, super_admin bypassed)
- ✅ Account lockout after failed attempts
- ✅ Email verification flow (`/auth/verify-email`, `/auth/resend-verification`)
- ✅ First-time user onboarding (onboarding-choice, company-setup-wizard, wait-for-invitation)
- ✅ Invitation system (invite by email, token-based accept, role assignment)
- ✅ OAuth login: Google + GitHub (Passport.js strategies, social buttons on login/register)
- ✅ Token blacklist on logout (SHA-256 hashed, 15-min cleanup)
- ✅ Refresh token rotation (7d expiry, one-time-use, silent 401 refresh via interceptor)
- ❌ FR-AUTH-003: Multi-Factor Authentication (MFA) - **NOT IMPLEMENTED** (2FA toggle exists in settings UI)

**Files:**
- Frontend: `src/app/features/auth/` (login, register, forgot-password, reset-password, oauth-callback)
- Frontend: Onboarding pages (onboarding-choice, company-setup-wizard, wait-for-invitation, verify-email)
- Backend: `authController.js`, `auth.routes.js`, `invitationController.js`, `invitation.routes.js`
- Backend: `oauthController.js`, `src/config/passport.js` (Google + GitHub strategies)
- Middleware: `authMiddleware.js` (token blacklist check), `rbacMiddleware.js`
- Utils: `src/utils/tokenBlacklist.js`

**Status:** Comprehensive auth with email/password + OAuth (Google/GitHub) + refresh tokens + token blacklist. MFA remains as future enhancement.

---

### ✅ Module 2: Employee Management - **95% COMPLETE**

**PRD Reference:** Section 3.2

**Implementation:**
- ✅ FR-EMP-001: Employee Master Data (personal, employment, compensation, statutory)
- ✅ FR-EMP-002: Employee Lifecycle Management (onboarding, transfers, termination)
- ✅ FR-EMP-003: YTD Statutory Tracking (EPF, SOCSO, EIS, PCB)
- ✅ Employee CRUD with comprehensive validation
- ✅ Search, filter, pagination
- ✅ Statistics dashboard endpoint
- ⚠️ Document attachment management (partial integration)

**Files:**
- Frontend: `employee-list`, `employee-form`, `employee-detail` components
- Backend: `employeeController.js`, `Employee.js`, `YTDStatutory.js` models
- Database: `employees` table, `ytd_statutory` table

**Status:** Fully functional. Document management integration needs verification.

---

### ✅ Module 3: Payroll System - **98% COMPLETE**

**PRD Reference:** Section 3.3

**Implementation:**
- ✅ FR-PAY-001: Malaysian Statutory Calculations (EPF, SOCSO, EIS, PCB)
- ✅ FR-PAY-002: Payroll Processing Workflow (Draft → Approved → Paid)
- ✅ FR-PAY-003: Payslip Management (generation, viewing, download)
- ✅ FR-PAY-004: Statutory Reports (EA Form, EPF Borang A, SOCSO Form 8A, PCB CP39)
- ✅ EPF calculations with age/salary caps (cap: RM30,000)
- ✅ SOCSO 34-tier contribution table support (cap: RM10,800)
- ✅ EIS calculation (0.5%)
- ✅ PCB tax deduction logic (progressive rates)
- ✅ YTD automatic updates
- ✅ CSV export for e-filing format
- ✅ PDF report generation (via reportGeneratorService)
- ⚠️ Bulk payroll processing (implementation unclear)

**Files:**
- Frontend: `payroll-form`, `payroll-list`, `payslip-view` components
- Frontend: `statutory-reports/reports-list` component
- Backend: `payrollController.js`, `statsController.js`, `statutoryCalculations.js`, `statutoryService.js`
- Backend: `reportGeneratorService.js`, `excelExportService.js`
- Database: `payroll` table with comprehensive fields

**Key Endpoints:**
- `POST /api/payroll/calculate` - Calculate payroll
- `PUT /api/payroll/:id/approve` - Approve payroll
- `PUT /api/payroll/:id/mark-paid` - Mark as paid
- `GET /api/payroll/:id/payslip` - Generate payslip
- `GET /api/statutory-reports/ea/:employee_id/:year` - EA Form (annual)
- `GET /api/statutory-reports/epf/:year/:month` - EPF Borang A (monthly)
- `GET /api/statutory-reports/socso/:year/:month` - SOCSO Form 8A (monthly)
- `GET /api/statutory-reports/pcb/:year/:month` - PCB CP39 (monthly)
- `GET /api/statutory-reports/csv/:type/:year/:month` - CSV e-filing export
- `GET /api/statutory-reports/periods` - Available payroll periods

**Status:** Fully operational including statutory reports with PDF/CSV generation.

---

### ✅ Module 4: Leave Management - **100% COMPLETE**

**PRD Reference:** Section 3.4

**Implementation:**
- ✅ FR-LEAVE-001: Leave Types and Entitlements (configurable, carry forward)
- ✅ FR-LEAVE-002: Leave Application Workflow (apply, approve, reject)
- ✅ FR-LEAVE-003: Leave Calendar and Balance (dashboard, tracking)
- ✅ Pro-rated calculations for new joiners
- ✅ Half-day leave support
- ✅ Manager approval workflow
- ✅ Leave history and reporting

**Files:**
- Frontend: `leave-form`, `leave-list`, `leave-approval`, `leave-balance`, `leave-details`
- Backend: `leaveController.js`, `Leave.js`, `LeaveType.js`, `LeaveEntitlement.js`
- Database: `leave_types`, `leave_entitlements`, `leaves` tables

**Status:** Fully complete and operational.

---

### ✅ Module 5: Attendance & WFH - **95% COMPLETE**

**PRD Reference:** Section 3.5

**Implementation:**
- ✅ FR-ATT-001: Clock In/Out System (location tracking)
- ✅ FR-ATT-002: Work From Home Management (application, approval)
- ✅ FR-ATT-003: Attendance Reports (history, details)
- ✅ Attendance type tracking (Office/WFH)
- ✅ GPS location capture (lat/long fields)
- ✅ Late/early leave tracking
- ⚠️ Geofencing validation (frontend implementation unclear)
- ⚠️ Attendance reports (components exist, completeness unclear)

**Files:**
- Frontend: `clock-in-out`, `wfh-application`, `wfh-approval-list`, `attendance-list`, `attendance-detail`
- Backend: `attendanceController.js`, `Attendance.js`, `WFHApplication.js`
- Database: `attendance`, `wfh_applications` tables

**Status:** Core functionality complete. Geofencing needs verification.

---

### ✅ Module 6: Claims Management - **100% COMPLETE**

**PRD Reference:** Section 3.6

**Implementation:**
- ✅ FR-CLAIM-001: Claim Types and Limits (configurable types)
- ✅ FR-CLAIM-002: Claims Submission Workflow (submit, approve, payment)
- ✅ FR-CLAIM-003: Claims Reports (history, filtering)
- ✅ Receipt upload support
- ✅ Multi-level approval (Manager → Finance)
- ✅ Payment tracking
- ✅ Rejection with remarks

**Files:**
- Frontend: `claim-form`, `claim-list`, `claim-approval` components
- Dialogs: `approval-confirmation-dialog`, `payment-dialog`, `rejection-dialog`
- Backend: `claimController.js`, `Claim.js`, `ClaimType.js`
- Database: `claim_types`, `claims` tables

**Status:** Fully complete and operational.

---

### ✅ Module 7: HR Communications - **100% COMPLETE**

**PRD Reference:** Section 3.7

**Implementation:**
- ✅ FR-COMM-001: HR Memos (creation, publishing, read receipts)
- ✅ FR-COMM-002: Company Policies Repository (versioning, acknowledgment)
- ✅ Memo list, viewer, creation form
- ✅ Policy list, viewer, creation form
- ✅ Read receipt tracking
- ✅ Policy acknowledgment system
- ✅ Targeted audience support

**Files:**
- Frontend: `memo-form`, `memo-list`, `memo-viewer`, `policy-form`, `policy-list`, `policy-viewer`
- Backend: `memoController.js`, `policyController.js`
- Models: `Memo.js`, `Policy.js`, `MemoReadReceipt.js`, `PolicyAcknowledgment.js`
- Database: `memos`, `memo_read_receipts`, `policies`, `policy_acknowledgments` tables

**Status:** Fully implemented with comprehensive features.

---

### ❌ Module 8: Finance & e-Invoice - **20% COMPLETE** ⚠️ CRITICAL GAP

**PRD Reference:** Section 3.8

**Implementation:**
- ❌ FR-FINV-001: e-Invoice Generation - **NOT IMPLEMENTED**
- ❌ FR-FINV-002: LHDN MyInvois Integration - **NOT IMPLEMENTED**
- ❌ FR-FINV-003: Digital Signature & QR Code - **NOT IMPLEMENTED**
- ❌ FR-FINV-004: Invoice Status Management - **NOT IMPLEMENTED**
- ✅ LHDN config file exists (`lhdn.js`) with sandbox/production endpoints
- ❌ No invoice controller, routes, models
- ❌ No invoice database tables
- ❌ No frontend invoice components

**Files Found:**
- Config only: `HRMS-API_v1/src/config/lhdn.js`

**Status:** **MOST INCOMPLETE MODULE** - Only scaffolding exists. Entire module needs implementation.

**Required Implementation:**
- Invoice data model & database schema
- Invoice CRUD API endpoints
- LHDN MyInvois API integration
- Invoice creation & management UI
- QR code generation
- Digital signature implementation
- Invoice submission workflow
- Status tracking & reconciliation

---

### ✅ Module 9: Dashboard & Analytics - **90% COMPLETE**

**PRD Reference:** Section 3.9

**Implementation:**
- ✅ Dashboard components (`admin-dashboard`, `manager-dashboard`, `staff-dashboard`)
- ✅ Dashboard layout component with role-based views
- ✅ Employee statistics endpoint (`/api/employees/statistics`)
- ✅ Dedicated analytics module with 5 components
- ✅ Payroll cost analytics (chart + data)
- ✅ Leave utilization analytics (chart + data)
- ✅ Attendance punctuality analytics (chart + data)
- ✅ Claims spending analytics (chart + data)
- ✅ Excel export functionality (via excelExportService)
- ✅ PDF export functionality (via reportGeneratorService)
- ✅ Backend analytics service with Sequelize aggregations
- ✅ Backend dashboard service
- ⚠️ Custom report builder (not implemented)
- ⚠️ Scheduled reports / email delivery (not implemented)

**Files:**
- Frontend: `analytics-dashboard`, `payroll-cost-chart`, `leave-utilization-chart`, `attendance-analytics-chart`, `claims-spending-chart`
- Frontend Service: `analytics.service.ts` (getPayrollCostAnalytics, getLeaveUtilizationAnalytics, etc.)
- Backend: `analyticsController.js`, `dashboardController.js`
- Backend Services: `analyticsService.js`, `dashboardService.js`, `reportGeneratorService.js`, `excelExportService.js`
- Charts: Chart.js + ng2-charts integration

**Key Endpoints:**
- `GET /api/analytics/payroll-cost` - Payroll cost analysis
- `GET /api/analytics/leave-utilization` - Leave usage trends
- `GET /api/analytics/attendance-punctuality` - Attendance analytics
- `GET /api/analytics/claims-spending` - Claims spending
- `GET /api/dashboard/*` - Dashboard summary data
- `GET /api/analytics/export/excel` - Excel export
- `GET /api/analytics/export/pdf` - PDF export

**Status:** Comprehensive analytics implemented with chart visualizations and export. Advanced features (custom report builder, scheduled reports) remain as future enhancements.

---

### ✅ Module 10: File Management - **95% COMPLETE**

**PRD Reference:** Cross-cutting feature

**Implementation:**
- ✅ File service (frontend & backend)
- ✅ Supabase Storage integration (private bucket: `hrms-files`)
- ✅ Multer memory storage → Supabase Storage pipeline
- ✅ File model with metadata tracking
- ✅ File categorization with organized path structure:
  - `employees/{id}/{sub_category}/` - Employee documents
  - `claims/{year}/{month}/{claim_id}/` - Claim receipts
  - `payslips/{year}/{month}/` - Payslips
  - `leaves/{leave_id}/` - Leave documents
  - `company/{sub_category}/` - Company documents
- ✅ Signed URLs for secure temporary access (1hr expiry)
- ✅ File viewer, list, and upload components
- ✅ File size limit: 10MB, max 10 files per upload
- ✅ Supported types: PDF, DOC, DOCX, TXT, JPG, PNG, GIF, WEBP, XLS, XLSX, CSV, ZIP, RAR
- ⚠️ File access control by role (needs verification)

**Files:**
- Frontend: `file.service.ts`, `file-viewer`, `file-list`, `file-upload` shared components
- Backend: `fileController.js`, `fileService.js`, `supabaseStorageService.js`, `File.js` model, `upload.config.js`
- Config: `supabase.js` (Supabase client init)
- Database: `files` table

**Status:** Fully operational with Supabase Storage. Role-based access control needs verification.

---

### ✅ Module 11: Personal Pages - **85% COMPLETE**

**PRD Reference:** Employee self-service

**Implementation:**
- ✅ My Profile page (view personal/employment info)
- ✅ My Payslips page (view personal payslip history)
- ✅ Change Password page
- ✅ Personal service (`personal.service.ts`)
- ✅ Backend endpoints for personal data access
- ✅ Routes configured (`/personal/profile`, `/personal/payslips`, `/personal/change-password`)
- ⚠️ My Documents (dedicated personal document management) - needs verification
- ⚠️ Profile photo upload with preview/crop - needs verification

**Files:**
- Frontend: `my-profile`, `my-payslips`, `change-password` components
- Frontend Service: `personal.service.ts`
- Routes: `/personal/*` (lazy-loaded, auth-guarded)

**Status:** Core personal pages implemented. Document management and profile photo features need verification.

---

### ✅ Module 12: System Settings - **95% COMPLETE**

**PRD Reference:** Admin configuration

**Implementation:**
- ✅ Settings page component with multiple sections
- ✅ Settings service (`settings.service.ts`)
- ✅ Backend settings controller, service, and routes
- ✅ Account settings section
- ✅ Appearance settings section
- ✅ Display settings section
- ✅ Notification preferences section
- ✅ Change password (within settings)
- ✅ Two-factor authentication enable/disable endpoints
- ✅ Company profile settings (name, address, reg numbers)
- ✅ Payroll rate configuration (EPF, SOCSO, PCB rates) - configurable admin UI
- ✅ Leave type/entitlement admin configuration
- ✅ Email template management
- ✅ Public holidays calendar management

**Files:**
- Frontend: `settings-page` component (sections: account, appearance, display, notifications, change-password, two-factor, reset)
- Frontend Service: `settings.service.ts`
- Backend: `settingsController.js`, `settings.routes.js`
- Routes: `/settings/:section`

**Key Endpoints:**
- `GET/PUT /api/settings/account` - Account settings
- `GET/PUT /api/settings/appearance` - Appearance preferences
- `GET/PUT /api/settings/notifications` - Notification preferences
- `POST /api/settings/two-factor/enable` - Enable 2FA
- `POST /api/settings/two-factor/disable` - Disable 2FA
- `POST /api/settings/change-password` - Change password

**Status:** Fully functional. Personal settings and admin-level system configuration (company profile, statutory rates, leave policies, email templates, public holidays) all implemented.

---

### ✅ Module 13: Document Management - **100% COMPLETE**

**Implementation:**
- ✅ Document overview page with stat cards, category breakdown, recent activity
- ✅ Filterable document table with search, sort, verification status filter
- ✅ Admin document verification toggle (`PATCH /api/files/:id/verify`)
- ✅ Admin overview stats endpoint (`GET /api/files/overview`)
- ✅ Multi-tenant scoping via `company_id` on File model
- ✅ Uploader info included in file listings

**Files:**
- Frontend: `src/app/features/documents/` module, route `/documents`
- Backend: Enhanced `fileController.js` with overview + verify endpoints
- Sidebar: Under HR Management (admin-only)

---

### ✅ Module 14: Notifications - **100% COMPLETE**

**Implementation:**
- ✅ Notification model (`notifications` table) with type, title, message, metadata, is_read
- ✅ Full CRUD API: list, unread count, mark read, mark all read, delete
- ✅ 11 notification types: leave/claim/wfh approved/rejected, announcement, team join, policy published
- ✅ Triggers integrated into: leaveController, claimController, attendanceController, memoController, invitationController
- ✅ Frontend: Signal-based NotificationService with 60s polling
- ✅ Bell icon dropdown in top nav with unread count badge
- ✅ Full `/notifications` page with TimeAgoPipe

**Files:**
- Frontend: `NotificationService`, notification dropdown in top nav, `/notifications` page
- Backend: `notificationController.js`, `notificationService.js`, `notification.routes.js`, `Notification.js`

---

### ✅ Module 15: Feedback System - **100% COMPLETE**

**Implementation:**
- ✅ Feedback model (`feedbacks` table) with category, rating, description, screenshot_url, page_url, admin_notes
- ✅ Categories: bug, feature_request, ui_ux, performance, general
- ✅ Status workflow: new → in_review → resolved → closed
- ✅ Screenshot upload via Supabase Storage (`feedback/screenshots/`)
- ✅ Auto-captured page_url for context
- ✅ Global scope: all feedback visible to super_admin regardless of company
- ✅ FAB widget (fixed bottom-right) on all authenticated pages
- ✅ Admin list page with filterable table, detail panel, status management

**Files:**
- Frontend: `src/app/shared/components/feedback-widget/` (FAB + modal), `src/app/features/feedback/` (admin page)
- Backend: `feedbackController.js`, `feedback.routes.js`, `Feedback.js`
- Route: `/feedback` (super_admin only), sidebar under Administration

---

### ✅ Module 16: Security Hardening & Audit Log - **100% COMPLETE**

**Implementation (7 fixes):**
- ✅ **FIX 1 - IDOR Protection:** `public_id` UUID column on 7 models (Payroll, Claim, Leave, Attendance, Employee, Memo, Policy). Controllers look up by public_id; frontend uses public_id in all routes.
- ✅ **FIX 2 - Token Blacklist:** SHA-256 hashed tokens in memory Map with 15-min cleanup. Checked in auth middleware; logout adds token.
- ✅ **FIX 3 - Refresh Tokens:** 7-day expiry, one-time-use rotation, stored in DB. Frontend interceptor silently refreshes on 401.
- ✅ **FIX 4+5+6 - CSP/HTTPS/Helmet:** Enhanced Helmet config (CSP, HSTS, CORP, COOP, COEP, Referrer-Policy, Permissions-Policy) + HTTP→HTTPS redirect. `netlify.toml` security headers.
- ✅ **FIX 7 - Audit Log:** AuditLog model (`audit_logs` table), non-blocking fire-and-forget `auditService.js`. Integrated into leave/claim/payroll/employee controllers. Admin page at `/audit-log` (super_admin only).

**Files:**
- Backend: `tokenBlacklist.js`, `auditService.js`, `AuditLog.js`, migration script `database/seeds/add-public-ids.js`
- Frontend: `src/app/features/audit-log/` page
- Route: `/audit-log` (super_admin), sidebar under Administration

---

## Completion Summary by Module

| Module | Completion % | Status | Critical Gaps |
|--------|--------------|--------|---------------|
| 1. Authentication & Authorization | 100% | ✅ Complete | MFA (future enhancement) |
| 2. Employee Management | 95% | ✅ Complete | Document integration verification |
| 3. Payroll System | 98% | ✅ Complete | Bulk payroll processing verification |
| 4. Leave Management | 100% | ✅ Complete | None |
| 5. Attendance & WFH | 95% | ✅ Complete | Geofencing validation |
| 6. Claims Management | 100% | ✅ Complete | None |
| 7. HR Communications | 100% | ✅ Complete | None |
| 8. Finance & e-Invoice | 20% | ⏸️ Deferred | Entire module (deferred) |
| 9. Dashboard & Analytics | 90% | ✅ Complete | Custom report builder, scheduled reports |
| 10. File Management | 95% | ✅ Complete | Access control verification |
| 11. Personal Pages | 85% | ✅ Mostly Complete | Documents, profile photo verification |
| 12. System Settings | 95% | ✅ Complete | Fully configured |
| 13. Document Management | 100% | ✅ Complete | None |
| 14. Notifications | 100% | ✅ Complete | None |
| 15. Feedback System | 100% | ✅ Complete | None |
| 16. Security Hardening & Audit | 100% | ✅ Complete | None |
| **OVERALL PROJECT** | **97%+** | ✅ **Production-Deployed & Hardened** | e-Invoice (deferred), MFA, E2E testing |

---

## Technology Stack Implementation Status

### Frontend Stack ✅
- ✅ Angular 21 (`@angular/core` ^21.0.0) with standalone components
- ✅ TailwindCSS 4 for styling
- ✅ ZardUI (`@ngzard/ui` ^1.0.0-beta.31) component library
- ✅ Chart.js + ng2-charts for analytics visualizations
- ✅ Quill rich text editor (ngx-quill) for memos/policies
- ✅ Lucide icons
- ✅ Lazy loading routes (15 feature modules)
- ✅ HTTP interceptors & auth guards
- ✅ Shared components library (25+ reusable components)
- ✅ Feature-based modular architecture

### Backend Stack ✅
- ✅ Node.js/Express REST API
- ✅ PostgreSQL with Sequelize ORM (migrated from MySQL)
- ✅ Supabase Storage for file management (private bucket)
- ✅ JWT authentication with bcryptjs
- ✅ express-validator for validation
- ✅ Winston logging
- ✅ Nodemailer for emails
- ✅ Multer (memory storage) → Supabase Storage pipeline
- ✅ PDFKit for report/payslip PDF generation
- ✅ SheetJS (xlsx) for Excel export
- ✅ Helmet, CORS, rate limiting, compression

### Database ✅
- ✅ Supabase PostgreSQL (Singapore region)
- ✅ Complete schema with 18 tables
- ✅ Proper foreign keys and indexes
- ✅ SSL connection support
- ✅ Connection pooling (max: 10)
- ❌ Invoice-related tables missing (deferred)

---

## Remaining Gaps (Priority Order)

### 1. E-Invoice Module - **80% MISSING** ⏸️ DEFERRED
**Impact:** Required for LHDN compliance (when mandated)
**Status:** Deferred to future phase - only LHDN config file exists

**Missing Components:**
- Invoice data model & database schema
- Invoice controller & routes
- LHDN MyInvois API integration
- Invoice creation & management UI
- QR code generation
- Digital signature implementation
- Invoice submission workflow
- Status tracking & reconciliation

**Estimated Effort:** 4-6 weeks
**Dependencies:** LHDN API credentials, digital certificate

---

### ~~2. Admin System Configuration~~ - ✅ **COMPLETED**
~~Payroll rate config, leave policies, email templates, public holidays~~ → All implemented

---

### ~~3. Statutory Reports~~ - ✅ **COMPLETED**
~~EA Form, EPF Borang A, SOCSO Form 8A, PCB CP39~~ → All implemented with PDF/CSV export

### ~~4. Reports & Analytics~~ - ✅ **COMPLETED**
~~Payroll, leave, attendance, claims analytics~~ → All implemented with Chart.js visualizations and Excel/PDF export

---

## Strengths of Current Implementation

### Architecture & Design ✅
- Clean separation of concerns (MVC pattern)
- Modular feature-based structure
- Proper authentication/authorization flow
- Comprehensive database design with relationships
- RESTful API design principles

### Core HR Operations ✅
- **Employee Management:** Robust with comprehensive data tracking
- **Payroll Engine:** Sophisticated Malaysian statutory calculations
- **Leave System:** Complete with pro-rating and carry forward
- **Attendance System:** GPS tracking and WFH support
- **Claims System:** Multi-level approval workflow
- **Communications:** Full memo and policy management

### Code Quality ✅
- Validation middleware on all endpoints
- Error handling and logging
- Security features (Helmet, CORS, rate limiting)
- Password hashing and JWT tokens
- RBAC implementation

---

## Enhancement Steps & Roadmap

### Phase 1: Statutory Reports Implementation - ✅ **COMPLETED** 📊
**PRD Reference:** Section 3.3.4 - Payroll Statutory Reports

- [x] **FR-PAY-004: Statutory Reports** <!-- id: 34 -->
  - [x] Backend: EA Form generation API (annual) - `GET /api/statutory-reports/ea/:employee_id/:year`
  - [x] Backend: EPF Borang A generation API (monthly) - `GET /api/statutory-reports/epf/:year/:month`
  - [x] Backend: SOCSO Form 8A generation API (monthly) - `GET /api/statutory-reports/socso/:year/:month`
  - [x] Backend: PCB CP39 generation API (monthly) - `GET /api/statutory-reports/pcb/:year/:month`
  - [x] Backend: E-filing format exports (CSV) - `GET /api/statutory-reports/csv/:type/:year/:month`
  - [x] Frontend: Reports module (`statutory-reports/reports-list` component)
  - [x] Feature: PDF export for all reports (reportGeneratorService)
  - [ ] Feature: Email reports to authorities (optional - future)
  - [ ] Testing: Validation against official formats (recommended before production)

---

### Phase 2: Reports & Analytics Enhancement - ✅ **COMPLETED** 📈
**PRD Reference:** Section 3.9 - Dashboard & Reporting

- [x] **Enhanced Reporting Dashboard** <!-- id: 33 -->
  - [x] Backend: Payroll cost analysis endpoint
  - [x] Backend: Leave utilization analytics endpoint
  - [x] Backend: Attendance punctuality analytics endpoint
  - [x] Backend: Claims spending analytics endpoint
  - [x] Frontend: Analytics module with Chart.js charts (5 components)
  - [x] Frontend: Export to PDF functionality
  - [x] Frontend: Export to Excel functionality (SheetJS)
  - [ ] Backend: Headcount and turnover reports endpoint (future)
  - [ ] Feature: Scheduled reports / email delivery (future)
  - [ ] Feature: Custom report builder (future)
  - [ ] Feature: Dashboard customization per role (future)

---

### Phase 3: Personal Pages - ✅ **MOSTLY COMPLETED** 👤
**Business Impact:** Employee self-service capabilities

- [x] **My Profile** <!-- id: 38 -->
  - [x] Frontend: Profile view page (my-profile component)
  - [x] Backend: Personal service endpoints
  - [ ] Profile photo upload with preview/crop (needs verification)
  - [ ] Change history audit log (future)

- [x] **My Payslips** <!-- id: 39 -->
  - [x] Frontend: Payslip history view (my-payslips component)
  - [x] Backend: Personal payslip endpoints
  - [ ] YTD summary view (needs verification)

- [ ] **My Documents** <!-- id: 40 -->
  - ⚠️ Needs verification - dedicated personal document management may need enhancement
  - [ ] Document list with categories (IC, certs, bank, etc.)
  - [ ] Document expiry reminders (passport, visa, etc.)

- [x] **Change Password** <!-- id: 41 -->
  - [x] Frontend: Change password form (change-password component)
  - [x] Backend: Change password endpoint
  - [ ] Password strength indicator (needs verification)
  - [ ] Force logout from other sessions after change (future)

---

### Phase 4: System Settings - ✅ **COMPLETED** ⚙️
**Business Impact:** Admin configuration capabilities

- [x] **User Settings (Personal)** <!-- id: 52 -->
  - [x] Account settings
  - [x] Appearance/display settings
  - [x] Notification preferences
  - [x] Two-factor authentication toggle
  - [x] Change password (within settings)

- [x] **Company Profile Settings** <!-- id: 42 -->
  - [x] Company table exists (name, registration_no, industry, size, country, owner_id)
  - [x] Company CRUD endpoints (`/api/company/*`)
  - [x] Company setup wizard (onboarding flow)
  - [x] Multi-company support (user_companies table, company switcher, `/api/company/switch`)
  - [ ] Company logo upload (future)
  - [ ] Company letterhead template (future)

- [x] **Payroll Settings** <!-- id: 43 -->
  - [x] EPF rate configuration
  - [x] SOCSO table configuration
  - [x] PCB tax bracket configuration
  - [x] Pay period and cutoff date settings

- [x] **Leave Settings** <!-- id: 44 -->
  - [x] Leave types management (add/edit/delete)
  - [x] Entitlement configuration by tenure/grade
  - [x] Public holidays calendar management

- [x] **Email/Notification Settings** <!-- id: 45 -->
  - [x] Email template management
  - [ ] SMTP configuration UI (future)
  - [ ] Test email functionality (future)

---

### Phase 5: E-Invoice Module Implementation - **DEFERRED** 📄
**PRD Reference:** Section 3.8 - Finance & e-Invoice Management
**Business Impact:** LHDN compliance (when required)
**Status:** Deferred to later phase

- [ ] **FR-FINV-001: e-Invoice Generation** <!-- id: 29 -->
  - [ ] Backend: Invoice data model (Sequelize)
  - [ ] Backend: Invoice database schema & migration
  - [ ] Backend: Invoice CRUD API endpoints
  - [ ] Backend: Invoice numbering logic (auto-increment with prefix)
  - [ ] Backend: PDF generation with company branding (PDFKit)
  - [ ] Frontend: Invoice creation form with line items
  - [ ] Frontend: Invoice list with search/filter
  - [ ] Frontend: Invoice preview and download
  - [ ] Feature: Tax calculations (SST 6%, Service Tax)
  - [ ] Feature: Multi-currency support (MYR primary)
  - [ ] Feature: Invoice templates

- [ ] **FR-FINV-002: LHDN MyInvois Integration** <!-- id: 30 -->
  - [ ] Backend: LHDN API client implementation
  - [ ] Backend: OAuth2 authentication with MyInvois
  - [ ] Backend: Invoice submission to LHDN portal
  - [ ] Backend: Status sync mechanism (polling/webhook)
  - [ ] Backend: Error handling and retry logic
  - [ ] Frontend: MyInvois submission interface
  - [ ] Frontend: Submission status tracking dashboard
  - [ ] Feature: Pre-submission validation
  - [ ] Feature: Automatic retry on transient failures
  - [ ] Testing: Sandbox environment testing

- [ ] **FR-FINV-003: Digital Signature & QR Code** <!-- id: 31 -->
  - [ ] Backend: QR code generation library integration
  - [ ] Backend: Invoice hash calculation (SHA-256)
  - [ ] Backend: Digital signature implementation (PKI)
  - [ ] Backend: QR validation endpoint
  - [ ] Frontend: QR code display on invoices
  - [ ] Frontend: QR scanner for validation (optional)
  - [ ] Feature: Embedded invoice metadata in QR
  - [ ] Feature: Tamper detection mechanism

- [ ] **FR-FINV-004: Invoice Status Management** <!-- id: 32 -->
  - [ ] Backend: Invoice lifecycle state machine
  - [ ] Backend: Status update API (Draft → Submitted → Validated → Cancelled)
  - [ ] Backend: Payment recording and reconciliation
  - [ ] Frontend: Invoice status dashboard with filters
  - [ ] Frontend: Payment recording interface
  - [ ] Frontend: Invoice aging report (30/60/90 days)
  - [ ] Feature: Email notifications for status changes
  - [ ] Feature: Invoice cancellation with LHDN notification
  - [ ] Feature: Credit note generation

---

### Phase 6: Security Enhancement - **MOSTLY COMPLETE** 🔒
**PRD Reference:** Section 3.1.3 - Multi-Factor Authentication
**Status:** Security hardening done (IDOR, token blacklist, refresh tokens, CSP/Helmet, audit log). Only MFA remains.

- [ ] **FR-AUTH-003: Multi-Factor Authentication (MFA)** <!-- id: 28 -->
  - [ ] Backend: OTP generation library (speakeasy)
  - [ ] Backend: OTP verification API
  - [ ] Backend: MFA settings per user (enable/disable)
  - [ ] Backend: Backup codes generation (10 codes)
  - [ ] Frontend: MFA setup page with QR code
  - [ ] Frontend: OTP verification during login
  - [ ] Frontend: Backup codes display and download
  - [ ] Feature: Email OTP option
  - [ ] Feature: SMS OTP option (Twilio integration)
  - [ ] Feature: Remember device for 30 days (cookie)
  - [ ] Feature: Force MFA for Admin/Super Admin roles

---

### Phase 7: Verification & Enhancement Tasks

- [ ] **File Management Verification** <!-- id: 35 -->
  - [ ] Verify file upload storage structure
  - [ ] Implement/verify file access control by role
  - [ ] Test file download permissions
  - [ ] Implement file versioning (optional)
  - [ ] Add virus scanning integration (ClamAV)

- [ ] **Dashboard Content Verification** <!-- id: 36 -->
  - [ ] Verify admin dashboard displays correct KPIs
  - [ ] Verify manager dashboard shows team data
  - [ ] Verify staff dashboard shows personal data
  - [ ] Add real-time data refresh
  - [ ] Add dashboard export functionality

- [ ] **Geofencing for Attendance** <!-- id: 37 -->
  - [ ] Implement geofencing validation on clock in
  - [ ] Configure office location coordinates
  - [ ] Add radius configuration (e.g., 100m)
  - [ ] Display location error messages
  - [ ] Add override capability for admins

---

## Recommended Development Roadmap

### ~~Sprint 1: Statutory Reports~~ - ✅ DONE
### ~~Sprint 2-3: Reports, Analytics, Personal Pages~~ - ✅ DONE

### Immediate Focus (Next 1-2 weeks)
**Sprint: Polish & Verification**
1. Verify all recently implemented modules work end-to-end
2. Test statutory reports against official Malaysian formats
3. Verify personal pages completeness (profile edit, payslip download)
4. Verify admin settings scope and completeness
5. ~~Deploy to production~~ ✅ DONE (`nextura-hrms-api.azurewebsites.net` + `nextura-hrms.netlify.app`)

### ~~Short-term: Admin Configuration~~ - ✅ DONE
~~Admin-level system settings, configurable statutory rates, email templates, public holidays~~ → All implemented

### Medium-term (Next 4-6 weeks)
**Sprint: E-Invoice & Security**
1. E-Invoice module (when LHDN compliance required)
2. MFA implementation
3. File access control verification
4. Geofencing for attendance
5. Performance optimization

### Future Phase
**Sprint: Advanced Features**
1. Custom report builder
2. Scheduled reports / email delivery
3. Performance management module
4. Recruitment module
5. Mobile app

---

## Future Enhancement Roadmap

### Phase 6: Additional HR Modules (Future)
**PRD Reference:** Section 11 - Future Enhancement Roadmap

- [ ] **Performance Management Module**
  - [ ] Goal setting and tracking
  - [ ] Performance review cycles
  - [ ] 360-degree feedback
  - [ ] KPI dashboard
  - [ ] Performance improvement plans

- [ ] **Recruitment Module**
  - [ ] Job posting management
  - [ ] Applicant tracking system (ATS)
  - [ ] Interview scheduling
  - [ ] Candidate evaluation scorecards
  - [ ] Offer letter generation
  - [ ] Onboarding workflow integration

- [ ] **Learning Management System**
  - [ ] Training course catalog
  - [ ] Course enrollment and tracking
  - [ ] Certificate management
  - [ ] Skill matrix tracking
  - [ ] Competency framework
  - [ ] Training budget management

- [ ] **Asset Management**
  - [ ] IT asset tracking
  - [ ] Asset assignment to employees
  - [ ] Maintenance scheduling
  - [ ] Asset depreciation tracking

---

## Quality Assurance & Testing Requirements

### Pre-Production Testing Checklist
- [ ] **Unit Testing**
  - [ ] Backend: Controller unit tests (80%+ coverage)
  - [ ] Backend: Service layer unit tests
  - [ ] Backend: Statutory calculation tests (critical)
  - [ ] Frontend: Component unit tests
  - [ ] Frontend: Service unit tests

- [ ] **Integration Testing**
  - [ ] API endpoint integration tests
  - [ ] Database transaction tests
  - [ ] Authentication flow tests
  - [ ] RBAC permission tests
  - [ ] File upload/download tests

- [ ] **End-to-End Testing**
  - [ ] Employee lifecycle workflow (Cypress/Playwright)
  - [ ] Payroll processing workflow
  - [ ] Leave approval workflow
  - [ ] Claims submission and approval
  - [ ] e-Invoice generation and LHDN submission

- [ ] **Performance Testing**
  - [ ] Load testing (100+ concurrent users)
  - [ ] Database query optimization
  - [ ] API response time benchmarking
  - [ ] File upload performance
  - [ ] Report generation performance

- [ ] **Security Testing**
  - [ ] Security audit and vulnerability assessment
  - [ ] Penetration testing
  - [ ] SQL injection prevention verification
  - [ ] XSS prevention verification
  - [ ] CSRF protection verification
  - [ ] File upload security (malware scanning)

---

## Technical Debt & Improvements

### Code Quality
- [ ] Add comprehensive unit tests for all components
- [ ] Add integration tests for API endpoints
- [ ] Implement end-to-end testing with Cypress/Playwright
- [ ] Code review and refactoring
- [ ] Remove unused dependencies
- [ ] Update deprecated packages

### Performance
- [ ] Optimize database queries with proper indexing
- [ ] Add caching layer for frequently accessed data (Redis)
- [ ] Implement pagination for large datasets
- [ ] Optimize bundle size (lazy loading, tree shaking)
- [ ] Image optimization and CDN integration

### Monitoring & Observability
- [ ] Add error logging and monitoring (Sentry/LogRocket)
- [ ] Implement application performance monitoring (APM)
- [ ] Add user analytics (Google Analytics/Mixpanel)
- [ ] Set up uptime monitoring
- [ ] Create alerting system for critical errors

### Documentation
- [ ] Add comprehensive API documentation (Swagger/OpenAPI)
- [ ] Create user manual with screenshots
- [ ] Write admin configuration guide
- [ ] Document deployment procedures
- [ ] Create developer onboarding guide
- [ ] Add inline code documentation (JSDoc)

### Infrastructure & DevOps
- [ ] Set up CI/CD pipeline (GitHub Actions/Jenkins)
- [ ] Implement automated testing in pipeline
- [ ] Configure staging environment
- [ ] Set up database backup and recovery procedures
- [ ] Implement zero-downtime deployment
- [ ] Add health check endpoints

### Accessibility & UX
- [ ] Add accessibility (WCAG 2.1) compliance
- [ ] Keyboard navigation support
- [ ] Screen reader optimization
- [ ] Mobile responsiveness verification
- [ ] Dark mode support (optional)

### Future Platform Expansion
- [ ] Mobile app development (React Native/Flutter)
- [ ] Desktop app (Electron) - optional
- [ ] API versioning strategy
- [x] Multi-tenancy support ✅ (multi-company via user_companies table)
- [ ] Internationalization (i18n) - multiple languages

---

## Project Statistics

### Codebase Metrics
- **Frontend Components:** 75+ Angular components (standalone)
- **Feature Modules:** 19 lazy-loaded modules
- **Shared Components:** 30+ reusable ZardUI components (incl. feedback widget)
- **Frontend Services:** 20+ services (3 core + 17 feature-specific)
- **Backend Controllers:** 18 controllers
- **Backend Services:** 12 services (incl. auditService, notificationService, supabaseStorageService)
- **Backend Routes:** 19 API route groups (80+ endpoints)
- **Database Tables:** 22+ Sequelize models (PostgreSQL) — added notifications, feedbacks, audit_logs, user_companies
- **Key Libraries:** Chart.js, PDFKit, SheetJS, Quill, Supabase, Passport.js, Helmet

### Team & Effort
- **Modules Completed:** 15 out of 16 at 85%+ completion (e-Invoice deferred)
- **Backend Completion:** ~98%
- **Frontend Completion:** ~97%
- **Remaining Effort:** MFA, E2E testing & verification, then e-Invoice when needed

---

## Production Readiness Assessment

### Ready for Production ✅
- Authentication & Authorization (email/password + OAuth Google/GitHub)
- Employee Management
- Payroll System (including statutory reports)
- Leave Management
- Attendance & WFH
- Claims Management
- HR Communications
- Dashboard & Analytics
- File Management (Supabase Storage)
- Personal Pages (profile, payslips, change password)
- Document Management (admin overview, verification workflow)
- Notifications (bell dropdown, full page, 11 trigger types)
- Feedback System (FAB widget, admin management)
- Security Hardening (IDOR, token blacklist, refresh tokens, CSP/Helmet, audit log)

### Needs Verification Before Production ⚠️
- File access control (role-based permissions)
- Statutory report format accuracy (against official Malaysian formats)

### NOT Ready for Production / Deferred ❌
- Finance & e-Invoice Module (deferred - 80% incomplete)
- MFA (2FA toggle in UI, backend not wired yet)

### Critical Pre-Production Requirements
1. ~~Implement statutory reports~~ ✅ DONE
2. ~~Implement analytics & reporting~~ ✅ DONE
3. ~~Deploy to production infrastructure~~ ✅ DONE (Backend: `nextura-hrms-api.azurewebsites.net` | Frontend: `nextura-hrms.netlify.app`)
4. ~~Set env vars on Azure~~ ✅ DONE (17 env vars: NODE_ENV, DATABASE_URL, SUPABASE_*, JWT_*, FRONTEND_URL, etc.)
5. ~~Create `hrms-files` bucket in Supabase Storage~~ ✅ DONE (private bucket)
6. ~~CORS configuration~~ ✅ DONE (FRONTEND_URL=https://nextura-hrms.netlify.app)
7. Comprehensive security testing
8. Performance testing with production-like data
9. User acceptance testing (UAT)
10. Validate statutory report formats against LHDN/EPF/SOCSO requirements

---

## Key Decisions & Considerations

### Technology Choices
- **Why Angular 21?** Modern framework with enterprise-grade features, strong typing
- **Why Node.js/Express?** JavaScript full-stack, fast development, large ecosystem
- **Why Supabase PostgreSQL?** Managed database with built-in auth, storage, real-time (migrated from MySQL for production)
- **Why Sequelize?** ORM simplifies database operations, migration support, dialect-agnostic
- **Why Supabase Storage?** Integrated with database, signed URLs, no separate S3 config needed

### Architectural Patterns
- **Feature-based structure:** Better organization and scalability
- **Standalone components:** Angular best practice, lazy loading benefits
- **RESTful API:** Industry standard, easy to consume
- **JWT authentication:** Stateless, scalable, mobile-friendly
- **ZardUI components:** Consistent design system across all modules

### Malaysian Compliance Focus
- ✅ EPF, SOCSO, EIS, PCB calculations implemented
- ✅ YTD statutory tracking for audit purposes
- ✅ Statutory reports: EA Form, EPF Borang A, SOCSO Form 8A, PCB CP39
- ✅ CSV e-filing export format
- ⏸️ LHDN MyInvois integration (deferred)

---

## Notes & Reminders

### Project Highlights
- All core HR modules (Employee, Payroll, Leave, Attendance, Claims) are fully functional
- Sophisticated Malaysian statutory calculations implemented and tested
- WFH approval workflow completed with location tracking
- Dynamic leave document upload with type-specific requirements
- Comprehensive communications module (memos & policies) operational
- Solid architecture with proper security and RBAC

### Critical Next Steps
1. ~~**Priority 1:** Implement statutory reports~~ ✅ DONE
2. ~~**Priority 2:** Enhanced reporting and analytics~~ ✅ DONE
3. ~~**Priority 3:** Personal pages~~ ✅ MOSTLY DONE
4. ~~**Priority 4:** Deploy to production~~ ✅ DONE (Azure + Netlify + Supabase)
5. ~~**Priority 5:** Admin system settings~~ ✅ DONE
6. ~~**Priority 6:** Document management, notifications, feedback~~ ✅ DONE
7. ~~**Priority 7:** OAuth login (Google + GitHub)~~ ✅ DONE
8. ~~**Priority 8:** Security hardening (IDOR, tokens, CSP, audit log)~~ ✅ DONE
9. **Priority 1 (NOW):** End-to-end testing & verification of all modules
10. **Priority 2:** MFA implementation (speakeasy OTP, QR code setup)
11. **Priority 3:** E-Invoice module (when LHDN compliance required)
12. **Priority 4:** Performance testing with production-like data

### Known Limitations
- No mobile app (web responsive only)
- ~~No real-time notifications (polling-based)~~ ✅ Notification system DONE (60s polling, bell dropdown, /notifications page)
- ~~No multi-tenancy support~~ ✅ Multi-company support DONE (user_companies table, company switcher, `/api/company/switch`)
- ~~No advanced HR analytics~~ ✅ Analytics module DONE (4 chart types, Excel/PDF export)
- No offline mode for attendance
- No WebSocket/SSE for true real-time push (currently 60s polling)

### Success Metrics for v1.0 Release
- [ ] All Phase 1 PRD features implemented (90%+)
- [ ] All statutory compliance requirements met
- [ ] Security audit passed
- [ ] Load testing passed (100+ concurrent users)
- [ ] User acceptance testing completed
- [ ] All critical bugs resolved
- [ ] Documentation completed
- [ ] Deployment procedures tested

---

**Document Version:** 5.0
**Last Comprehensive Update:** March 5, 2026
**Previous Major Updates:** February 13 (v4.2), February 10 (v4.0), February 5 (v3.0)
**Key Changes in v5.0:**
- Added 4 new modules: Document Management (13), Notifications (14), Feedback System (15), Security Hardening & Audit (16)
- Added OAuth login (Google + GitHub) to Module 1
- Added security hardening details: IDOR (public_id), token blacklist, refresh tokens, CSP/Helmet, audit log
- Updated codebase metrics: 75+ components, 22+ tables, 19 route groups, 80+ endpoints
- Revised overall completion from 90-95% → 97%+
- Updated module count from 12 → 16
**Key Changes in v4.2:**
- Marked Admin System Settings (Phase 4) as COMPLETED
**Next Review:** After MFA implementation or E2E testing
**Maintained By:** Development Team
