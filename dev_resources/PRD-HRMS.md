# Comprehensive Product Requirements Document (PRD)
# HR Management System (HRMS) - Malaysian Context

**Document Version:** 2.0
**Last Updated:** November 29, 2025
**Project Owner:** Averroes Data Science
**Status:** In Development

---

## Table of Contents
1. [Executive Summary](#1-executive-summary)
2. [User Roles and Personas](#2-user-roles-and-personas)
3. [Functional Requirements](#3-functional-requirements)
4. [User Stories](#4-user-stories)
5. [Feature Specifications](#5-feature-specifications)
6. [File Storage Management](#6-file-storage-management)
7. [Technical Requirements](#7-technical-requirements)
8. [Database Schema](#8-database-schema)
9. [Security and Compliance](#9-security-and-compliance)
10. [Payment Integration](#10-payment-integration)
11. [Future Enhancement Roadmap](#11-future-enhancement-roadmap)

---

## 1. Executive Summary

### 1.1 Vision Statement
To build a comprehensive, user-friendly HR Management System specifically designed for Malaysian SMEs, providing end-to-end HR operations from employee onboarding to payroll processing, while ensuring full compliance with Malaysian statutory requirements (EPF, SOCSO, EIS, PCB) and LHDN e-Invoice regulations.

### 1.2 Business Objectives
- **Primary Objective:** Streamline HR operations for Malaysian companies with 10-500 employees
- **Secondary Objectives:**
  - Reduce payroll processing time by 70%
  - Achieve 100% compliance with Malaysian statutory requirements
  - Eliminate manual paperwork for leave and claims management
  - Provide real-time visibility into HR metrics and costs
  - Enable seamless LHDN e-Invoice integration for service-based businesses

### 1.3 Success Metrics (KPIs)

#### Business Metrics
- **User Adoption Rate:** 80% of employees actively using the system within 3 months
- **Time Savings:** 15+ hours/month saved on HR administrative tasks
- **Error Reduction:** 95% reduction in payroll calculation errors
- **Compliance Rate:** 100% accuracy in statutory calculations (EPF, SOCSO, PCB)
- **Customer Satisfaction:** Net Promoter Score (NPS) > 50

#### Technical Metrics
- **System Uptime:** 99.5% availability
- **Response Time:** < 2 seconds for critical operations
- **Mobile Responsiveness:** 100% mobile-friendly UI
- **API Performance:** < 500ms average response time
- **Error Rate:** < 0.5% failed transactions

#### Adoption Metrics
- **Login Frequency:** 70% of staff login at least weekly
- **Feature Utilization:** 80% adoption of digital leave applications
- **Self-Service Rate:** 60% reduction in HR inquiries through self-service features
- **E-Invoice Adoption:** 90% of invoices processed digitally within 6 months

### 1.4 Target Market
- **Primary:** Malaysian SMEs (10-500 employees)
- **Industries:** Professional Services, IT, Consulting, Trading, Manufacturing
- **Geographic Focus:** Malaysia (Peninsular & East Malaysia)

### 1.5 Project Scope

#### In Scope
- Employee lifecycle management
- Malaysian statutory payroll processing
- Leave and attendance management
- Claims processing and approval workflows
- E-Invoice generation and LHDN compliance
- HR communications and policy management
- Basic reporting and analytics

#### Out of Scope (Phase 1)
- Recruitment and applicant tracking
- Performance management and appraisals
- Learning management system (LMS)
- Advanced workforce analytics
- Multi-country payroll
- Third-party payment gateway integration

---

## 2. User Roles and Personas

### 2.1 Admin Role

#### Persona 1: HR Manager (Sarah)
**Demographics:**
- Age: 32-45
- Role: HR Manager / HR Business Partner
- Experience: 5-10 years in HR
- Company Size: 50-200 employees

**Goals:**
- Process monthly payroll accurately and on time
- Ensure 100% statutory compliance
- Reduce time spent on repetitive administrative tasks
- Have real-time visibility into leave balances and attendance
- Generate reports for management review

**Pain Points:**
- Manual Excel-based payroll is error-prone
- Difficulty tracking YTD statutory contributions
- Time-consuming leave approval process
- Lack of centralized employee records
- Compliance anxiety around LHDN requirements

**Technical Proficiency:** Medium (comfortable with web applications)

**Key Features Used:**
- Employee management
- Payroll processing
- Leave approval workflows
- Attendance reports
- Statutory compliance reports

#### Persona 2: Finance Manager (Ahmad)
**Demographics:**
- Age: 35-50
- Role: Finance Manager / Accountant
- Experience: 8-15 years in finance
- Company Size: 100-300 employees

**Goals:**
- Generate accurate e-Invoices for LHDN compliance
- Track payroll costs and statutory contributions
- Reconcile claims and expenses
- Ensure audit trail for all financial transactions
- Meet LHDN submission deadlines

**Pain Points:**
- Manual invoice generation is time-consuming
- Difficult to track LHDN submission status
- Limited integration between payroll and finance
- Manual verification of TIN and BRN details

**Technical Proficiency:** High (Excel power user, familiar with accounting software)

**Key Features Used:**
- E-Invoice management
- Payroll reports and export
- Claims approval and processing
- Financial dashboards
- Audit logs

### 2.2 Staff Role

#### Persona 3: Regular Employee (Mei Ling)
**Demographics:**
- Age: 25-40
- Role: Various (Sales, Marketing, Operations, IT)
- Experience: 2-8 years
- Tech Savvy: Medium to High

**Goals:**
- Apply for leave easily from mobile
- Check leave balance anytime
- View payslips and download for loans
- Clock in/out efficiently
- Submit claims with photo receipts
- Stay updated on company announcements

**Pain Points:**
- Paper-based leave forms are inconvenient
- Uncertainty about leave balance
- Cannot access payslips after leaving office
- Manual claims submission with physical receipts
- Missing important HR memos

**Technical Proficiency:** Medium to High (smartphone user)

**Key Features Used:**
- Leave application
- Attendance clock in/out
- Payslip viewing and download
- Claims submission
- Memo/policy viewing

#### Persona 4: Remote Worker (Kumar)
**Demographics:**
- Age: 28-35
- Role: Software Developer / Designer / Consultant
- Work Arrangement: Hybrid / Fully Remote
- Location: Various (home, co-working spaces)

**Goals:**
- Apply for WFH arrangements in advance
- Clock in from home location
- Access all HR services remotely
- Receive notifications for approvals
- Submit claims digitally without office visit

**Pain Points:**
- Office-based attendance systems don't support remote work
- Delayed leave approvals when manager is remote
- Need physical presence for HR matters
- Difficulty tracking work hours

**Technical Proficiency:** High (digital native)

**Key Features Used:**
- WFH application and approval
- Remote clock in/out with location tracking
- Mobile-first leave management
- Digital claims with photo uploads
- Push notifications

---

## 3. Functional Requirements

### 3.1 Authentication & Authorization

#### FR-AUTH-001: User Login
**Priority:** High
**Description:** Users must authenticate using email and password
**Acceptance Criteria:**
- Email format validation
- Password strength requirement (min 8 chars, 1 uppercase, 1 number)
- "Remember Me" functionality (30-day session)
- Account lockout after 5 failed attempts
- Password reset via email link
- Session timeout after 60 minutes of inactivity

#### FR-AUTH-002: Role-Based Access Control (RBAC)
**Priority:** High
**Description:** System enforces role-based permissions
**Roles:**
- **Super Admin:** Full system access, user management, settings
- **Admin:** Employee management, payroll, approvals, reports
- **Manager:** Team leave/claims approval, team reports
- **Staff:** Self-service features only

**Acceptance Criteria:**
- Route guards prevent unauthorized access
- API endpoints validate user permissions
- UI elements hide based on role
- Audit log for all permission-based actions

#### FR-AUTH-003: Multi-Factor Authentication (MFA)
**Priority:** Medium (Future)
**Description:** Optional MFA for enhanced security
**Methods:** Email OTP, SMS OTP, Authenticator app

### 3.2 Employee Management

#### FR-EMP-001: Employee Master Data
**Priority:** High
**Description:** Comprehensive employee information management
**Data Categories:**

**Personal Information:**
- Full Name (as per IC/Passport)
- IC Number (MyKad)
- Passport Number (for foreigners)
- Date of Birth
- Gender
- Marital Status
- Nationality
- Race (for EEO reporting)
- Religion
- Contact (Mobile, Email, Emergency Contact)
- Address (Current & Permanent)

**Employment Information:**
- Employee ID (auto-generated or custom)
- Join Date
- Confirmation Date
- Employment Type (Permanent, Contract, Probation, Intern)
- Department
- Position/Job Title
- Reporting Manager
- Work Location (HQ, Branch, Remote)
- Employment Status (Active, Resigned, Terminated)

**Compensation Information:**
- Basic Salary (monthly)
- Allowances (Fixed: Transport, Meal, etc.)
- Currency (default: MYR)
- Payment Method (Bank Transfer)
- Bank Account Details (Account No, Bank Name, Account Holder)

**Statutory Information:**
- EPF Number (KWSP)
- SOCSO Number (PERKESO)
- Income Tax Number (LHDN)
- Tax Relief Category (Individual, Married, Disabled, etc.)
- Tax Exemption Status
- PCB Calculation Method

**Acceptance Criteria:**
- Mandatory field validation
- IC/Passport format validation (Malaysian IC: 12 digits)
- Duplicate detection (IC, Email, Employee ID)
- Photo upload (max 2MB, JPG/PNG)
- Document attachment (certificates, contracts)
- Audit trail for all changes

#### FR-EMP-002: Employee Lifecycle Management
**Priority:** High
**Description:** Track employee status changes
**Workflow:**
- **Onboarding:** New hire setup, document collection
- **Confirmation:** Probation to permanent conversion
- **Transfer:** Department/position changes
- **Resignation:** Exit process, final settlement
- **Termination:** Involuntary exit, settlement

**Acceptance Criteria:**
- Automated email notifications on status changes
- Document checklist for onboarding
- Exit interview form
- Final payroll calculation
- Asset return tracking

#### FR-EMP-003: YTD Statutory Tracking
**Priority:** High
**Description:** Year-to-date statutory contributions
**Tracked Items:**
- Employee EPF contributions
- Employer EPF contributions
- Employee SOCSO contributions
- Employer SOCSO contributions
- Employee EIS contributions
- Employer EIS contributions
- PCB tax deductions
- Total gross salary
- Total net salary

**Acceptance Criteria:**
- Real-time updates after payroll processing
- Monthly breakdown view
- Annual summary report
- Export to Excel/PDF
- Reset on January 1st (new tax year)

#### FR-EMP-004: Employee Invitation & Account Linking
**Priority:** High
**Description:** End-to-end flow for adding employees, inviting them to the system, and automatically linking their user account to their employee profile upon registration.

**Flow Overview:**
The system uses a two-step process where (1) admin creates the employee record with HR details, and (2) admin invites the employee by email. When the invited user registers and accepts the invitation, the system automatically links their user account to the existing employee record by matching email addresses.

**Step-by-Step Flow:**

**Phase 1 — Admin Creates Employee Record:**
1. Admin navigates to Employee Management → Add Employee
2. Admin fills in all HR details: personal info, employment info, compensation, statutory info
3. The employee's **work email** is captured in the `employees.email` field
4. System creates Employee record with `user_id = NULL` (no linked user account yet)
5. Employee appears in the employee list as an active employee without system access

**Phase 2 — Admin Sends Invitation:**
6. Admin opens the Invite User dialog from the Employee List
7. Admin enters the **same email address** used in the employee record and selects a role (staff/manager/admin)
8. System validates:
   - No duplicate pending invitation for this email in this company
   - User with this email is not already a member of this company
9. System generates a 64-character hex invitation token (expires in 7 days)
10. System sends invitation email with link: `{FRONTEND_URL}/auth/accept-invitation?token={TOKEN}`

**Phase 3 — New User Registers:**
11. User clicks invitation link → lands on Accept Invitation page
12. System displays invitation details (company name, role) via public `GET /api/invitations/info?token={TOKEN}`
13. User clicks "Create Account" → redirected to registration with email pre-filled
14. User registers with: full name, email, password
15. System creates User record: `email_verified=false`, `company_id=null`, `role='staff'`
16. System sends email verification link

**Phase 4 — Email Verification & Auto-Linking:**
17. User clicks verification link in email
18. System verifies the token and sets `email_verified=true`
19. **Auto-accept invitation:** System searches `invitations` table for a pending invitation matching the user's email
20. If found:
    a. Updates `users.company_id` and `users.role` from the invitation
    b. Creates `user_companies` record (user_id, company_id, role)
    c. **Auto-links employee profile:** Searches `employees` table for a record where `employees.email = user.email` AND `employees.company_id = invitation.company_id` AND `employees.user_id IS NULL`
    d. If matching employee found:
       - Sets `employees.user_id = user.id` (links the employee profile to the user account)
       - Updates `user_companies.employee_id = employee.employee_id`
       - Includes `employee_id` in the new JWT token
    e. Marks invitation as `status='accepted'`
21. System issues new JWT with `company_id`, `role`, and `employee_id`
22. User is redirected to Dashboard with full system access and their employee profile linked

**Alternative Path — Existing User Accepts Invitation:**
- If the user already has an account (from another company), they click "Log In to Accept"
- Upon login, the system auto-accepts the pending invitation for their email
- The same employee-user linking logic (Step 20c-d) applies
- A new `user_companies` record is created for the additional company

**Alternative Path — Already Authenticated User:**
- If the user is already logged in when clicking the invitation link
- System auto-calls `POST /api/invitations/accept` with the token
- The same employee-user linking logic (Step 20c-d) applies

**What Gets Linked:**

| Table | Field | Before Linking | After Linking |
|-------|-------|----------------|---------------|
| `employees` | `user_id` | `NULL` | User's ID |
| `user_companies` | `employee_id` | `NULL` | Employee's `employee_id` |
| JWT Token | `employee_id` | `NULL` | Employee's ID |

**Edge Cases:**
- **No matching employee record:** User is linked to company but without an employee profile. Admin must manually link later or create a new employee record.
- **Employee email differs from invitation email:** Auto-linking will not match. Admin must manually link the employee record to the user.
- **Multiple employee records with same email:** System links to the first active employee record found (should not occur due to unique email per company).
- **Employee already has a user_id:** System skips linking (already linked to another user).

**Acceptance Criteria:**
- Admin can create employee records independently of user accounts
- Admin can invite employees using their work email
- When invited user registers and verifies email, their account is automatically linked to the matching employee record
- Linked users can access self-service features (view own profile, payslips, apply leave, clock in/out)
- Unlinked users (no matching employee) can still access the system but see "No employee profile linked" on self-service pages
- The employee-user link persists across sessions and company switching
- Audit log records all linking events

**API Endpoints:**
- `POST /api/invitations` — Create and send invitation (admin)
- `GET /api/invitations/info?token={TOKEN}` — Get invitation details (public)
- `POST /api/invitations/accept` — Accept invitation and auto-link (authenticated)
- `POST /api/auth/register` — Register new user
- `POST /api/auth/verify-email` — Verify email, auto-accept invitation, auto-link employee
- `POST /api/auth/login` — Login, auto-accept pending invitation, auto-link employee

### 3.3 Payroll System

#### FR-PAY-001: Malaysian Statutory Calculations
**Priority:** Critical
**Description:** Accurate calculation of EPF, SOCSO, EIS, PCB

**EPF (Employees Provident Fund):**
- Employee: 11% of monthly salary
- Employer:
  - 13% for salary ≤ RM5,000
  - 12% for salary > RM5,000
- Maximum salary cap: RM30,000
- Voluntary additional contribution support

**SOCSO (Social Security Organization):**
- Based on 34-tier contribution table
- Employment Injury Scheme (EIS): Up to age 60
- Invalidity Pension Scheme: Up to age 60, first-time contributor before 55
- Employer: 1.75% (approx)
- Employee: 0.5% (approx)
- Maximum salary cap: RM5,000

**EIS (Employment Insurance System):**
- Employee: 0.2% of monthly salary
- Employer: 0.2% of monthly salary
- Maximum salary cap: RM5,000

**PCB (Monthly Tax Deduction):**
- Based on MTD (Monthly Tax Deduction) method
- Considers:
  - Monthly remuneration
  - Tax relief category
  - EPF deduction
  - Zakat (if applicable)
- PCB table from LHDN
- Bonus PCB calculation (separate method)

**Acceptance Criteria:**
- Calculations match official KWSP/PERKESO tables (verified via unit tests)
- Support for partial month calculations (pro-rated)
- Handle exemptions (e.g., age > 60 for EPF)
- Rounding rules as per regulations
- YTD updates automatically

#### FR-PAY-002: Payroll Processing Workflow
**Priority:** High
**Description:** Monthly payroll processing cycle

**Workflow Steps:**
1. **Input Phase:** Enter/verify attendance, allowances, deductions
2. **Calculation Phase:** Auto-calculate statutory, gross, net salary
3. **Review Phase:** Admin reviews calculations, makes adjustments
4. **Approval Phase:** Finance/Management approval
5. **Lock Phase:** Payroll locked, payslips generated
6. **Payment Phase:** Bank file export for salary transfer
7. **Post-Processing:** YTD update, GL export

**Acceptance Criteria:**
- Bulk processing for all employees
- Department-wise processing support
- Edit before lock
- Unlock with authorization (audit logged)
- Email payslips to employees
- SMS notification option

#### FR-PAY-003: Payslip Management
**Priority:** High
**Description:** Digital payslips accessible to employees

**Payslip Contents:**
- Company details and logo
- Employee details (Name, ID, Department, Position)
- Pay period (Month/Year)
- Earnings breakdown:
  - Basic Salary
  - Allowances (itemized)
  - Overtime pay
  - Bonus/Commission
  - Gross Salary
- Deductions breakdown:
  - EPF (Employee)
  - SOCSO (Employee)
  - EIS (Employee)
  - PCB
  - Other deductions (loan, advance, etc.)
  - Total deductions
- Net Salary
- Bank transfer details
- YTD summary (Gross, EPF, SOCSO, EIS, PCB)

**Acceptance Criteria:**
- Password-protected PDF download
- View in browser (responsive)
- Email to registered email
- Search by month/year
- Print-friendly format
- Watermark for authenticity

#### FR-PAY-004: Statutory Reports
**Priority:** High
**Description:** Generate compliance reports for submissions

**Reports Required:**
- **EPF Monthly Contribution (Borang A):** List of employees with EPF contributions
- **SOCSO Form 8A:** Monthly SOCSO remittance
- **EIS Contribution Statement**
- **PCB CP39:** Monthly tax deduction summary
- **EA Form:** Annual employee remuneration (for income tax filing)
- **E-Filing Support:** Export formats for KWSP, LHDN portals

**Acceptance Criteria:**
- Official format compliance
- Excel/PDF export
- Filter by month/year
- Validation before export
- Submission deadline reminders

### 3.4 Leave Management

#### FR-LEAVE-001: Leave Types and Entitlements
**Priority:** High
**Description:** Manage leave types with configurable rules

**Default Leave Types:**
- **Annual Leave:** 8-20 days (based on service years), carry forward 50% max
- **Medical Leave:** 14-22 days (based on service years), requires MC
- **Hospitalization Leave:** Included in medical leave
- **Unpaid Leave:** Deducts from salary
- **Emergency Leave:** Compassionate leave (death in family)
- **Maternity Leave:** 98 days (eligible women)
- **Paternity Leave:** 7 days (married men)
- **Study Leave:** With approval
- **Replacement Leave:** For public holiday work

**Configurable Parameters:**
- Days per year
- Prorate for new joiners
- Carry forward rules
- Maximum consecutive days
- Advance booking required (days)
- Document requirement (e.g., MC for medical leave)

**Acceptance Criteria:**
- Admin can add/edit leave types
- Auto-calculation of entitlement based on join date
- Prorate for mid-year joiners
- Annual reset on anniversary or calendar year
- Separate counters for each leave type

#### FR-LEAVE-002: Leave Application Workflow
**Priority:** High
**Description:** Staff apply for leave with approval workflow

**Workflow:**
1. **Application:** Staff submits leave request
2. **Manager Approval:** Direct manager approves/rejects
3. **HR Approval:** HR validates (optional for long leaves)
4. **Notification:** Email/SMS to staff on decision
5. **Calendar Update:** Approved leaves block calendar

**Features:**
- Date range selection (single or multiple days)
- Half-day leave support
- Reason/remarks field
- Attachment upload (MC, documents)
- Balance check before submission
- Conflicting leave detection (team calendar)

**Acceptance Criteria:**
- Cannot apply for past dates (> 3 days)
- Block application if insufficient balance
- Email notification to approver
- Push notification to mobile
- Approval via email link (one-click)
- Bulk approval for admin
- Reject with reason (mandatory)

#### FR-LEAVE-003: Leave Calendar and Balance
**Priority:** Medium
**Description:** Visual leave calendar and balance tracking

**Features:**
- **Personal Calendar:** Staff view own leave history
- **Team Calendar:** Manager view team leaves (identify coverage gaps)
- **Company Calendar:** Public holidays, company events
- **Balance Dashboard:** Real-time leave balance per type
- **Projected Balance:** Forecast after pending approvals

**Acceptance Criteria:**
- Color-coded by leave type
- Filter by employee/department
- Export to iCal/Google Calendar
- Mobile-responsive calendar
- Public holiday auto-marking (Malaysian states)

### 3.5 Attendance & Flexible Work

#### FR-ATT-001: Clock In/Out System
**Priority:** High
**Description:** Digital attendance tracking for staff

**Features:**
- **Web-based Clock In/Out:** Single button click
- **Timestamp:** Automatic date/time capture
- **Location Tracking:** GPS coordinates (with consent)
- **Photo Capture:** Selfie for verification (optional)
- **Attendance Type:** Office / Work From Home
- **Late Detection:** Auto-flag if clock-in after office hours
- **Early Leave Detection:** Flag if clock-out before office hours
- **Missing Clock:** Reminder if no clock-out by end of day

**Acceptance Criteria:**
- Cannot clock in twice (unless clocked out)
- Cannot clock out without clock in
- Manual adjustment by admin (with reason)
- Edit grace period (15 minutes)
- Geofence validation (must be within office radius for "Office" type)
- Offline support (sync when online)

#### FR-ATT-002: Work From Home (WFH) Management
**Priority:** Medium
**Description:** WFH application and tracking

**Workflow:**
1. **Application:** Staff applies for WFH (date, reason)
2. **Manager Approval:** Manager approves/rejects
3. **Clock In/Out:** On approved WFH day, clock in tagged as "WFH"
4. **Location Flexibility:** No geofence restriction for WFH

**Features:**
- Advance WFH booking (min 1 day notice)
- Ad-hoc WFH application
- Recurring WFH schedule (e.g., every Friday)
- WFH quota tracking (if company sets limits)

**Acceptance Criteria:**
- WFH attendance differentiated in reports
- Admin can view WFH locations (privacy-compliant)
- Cannot apply WFH for past dates
- Email notification to manager
- WFH days visible in team calendar

#### FR-ATT-003: Attendance Reports
**Priority:** Medium
**Description:** Reports for monitoring and compliance

**Reports:**
- **Daily Attendance:** Who's in, who's out, who's WFH
- **Monthly Attendance Summary:** Attendance rate per employee
- **Late/Early Leave Report:** Identify trends
- **Absenteeism Report:** Track frequent absences
- **WFH Report:** Total WFH days per employee
- **Overtime Hours:** Track extra hours worked

**Acceptance Criteria:**
- Export to Excel/PDF
- Filter by date range, department, employee
- Dashboard visualization (charts)
- Email scheduled reports (weekly/monthly)

### 3.6 Claims Management

#### FR-CLAIM-001: Claim Types and Limits
**Priority:** Medium
**Description:** Manage reimbursable expenses

**Claim Types:**
- **Medical:** Doctor visits, medication (not covered by insurance)
- **Travel:** Mileage, parking, tolls, public transport
- **Entertainment:** Client meals, business entertainment
- **Mobile/Internet:** For role-based allowance
- **Training/Education:** Course fees, books
- **Others:** Miscellaneous expenses

**Limits Configuration:**
- Per-claim limit (e.g., max RM500 per medical claim)
- Monthly limit (e.g., max RM1,000 travel per month)
- Annual limit (e.g., max RM5,000 training per year)
- Role-based limits (e.g., Sales higher travel limit)

**Acceptance Criteria:**
- Admin configures claim types
- System validates against limits before submission
- Warning if approaching monthly/annual limit
- Carry forward unused limits (optional)

#### FR-CLAIM-002: Claims Submission Workflow
**Priority:** Medium
**Description:** Staff submit claims with receipts

**Workflow:**
1. **Submission:** Staff fills claim form
   - Claim type
   - Date of expense
   - Amount (RM)
   - Description/Purpose
   - Receipt upload (photo/PDF)
2. **Manager Approval:** Manager verifies validity
3. **Finance Approval:** Finance validates amount, receipt
4. **Payment Processing:** Finance marks as paid
5. **Notification:** Staff receives payment confirmation

**Features:**
- Multiple receipts per claim
- OCR for receipt scanning (future)
- Claim status tracking
- Reminder for pending claims
- Reject with reason (staff can resubmit)

**Acceptance Criteria:**
- Receipt mandatory (image or PDF, max 5MB)
- Cannot submit future dates
- Duplicate detection (same date, amount, type)
- Email notification at each stage
- Payment reference field
- Batch approval for admin

#### FR-CLAIM-003: Claims Reports
**Priority:** Low
**Description:** Track claims for budgeting

**Reports:**
- **Pending Claims:** All awaiting approval
- **Approved Claims:** Pending payment
- **Paid Claims:** Completed transactions
- **Claims by Type:** Breakdown by category
- **Employee Claims Summary:** Total claims per employee
- **Department Claims:** Budget vs. actual

**Acceptance Criteria:**
- Export to Excel
- Date range filter
- Graphical dashboard
- Finance integration (future: GL export)

### 3.7 HR Memos & Company Policies

#### FR-COMM-001: HR Memos
**Priority:** Medium
**Description:** Company-wide announcements

**Features:**
- **Create Memo:** Admin posts announcement
  - Title
  - Content (rich text editor)
  - Attachment (PDF, images)
  - Target audience (All, Department, Role)
  - Priority (Normal, Urgent)
- **Notification:** Email/SMS to targeted staff
- **Dashboard Alert:** Unread memos highlighted
- **Read Receipt:** Track who read the memo

**Acceptance Criteria:**
- Rich text formatting (bold, italic, lists, links)
- File attachment (max 10MB)
- Schedule publish date (future)
- Archive old memos
- Search memos by keyword
- Push notification for urgent memos

#### FR-COMM-002: Company Policies Repository
**Priority:** Medium
**Description:** Centralized policy documents

**Features:**
- **Policy Categories:**
  - Employee Handbook
  - Code of Conduct
  - IT Security Policy
  - Remote Work Policy
  - Anti-Harassment Policy
  - Leave Policy
  - Claims Policy
- **Version Control:** Track policy revisions
- **Acknowledgment Tracking:** Staff must acknowledge reading critical policies
- **Document Management:** Upload/download PDFs

**Acceptance Criteria:**
- PDF viewer in-browser
- Download option
- "I Acknowledge" button (recorded with timestamp)
- Reminder for unacknowledged policies
- Admin can view acknowledgment status
- Policy update notification

### 3.8 Finance & e-Invoice (LHDN Compliance)

#### FR-FINV-001: e-Invoice Generation
**Priority:** High
**Description:** Generate LHDN-compliant e-Invoices

**e-Invoice Types:**
- **Standard Invoice:** B2B, B2C transactions
- **Consolidated Invoice:** Multiple transactions aggregated
- **Self-Billed Invoice:** Buyer creates invoice (special cases)
- **Credit Note:** Refund/amendment
- **Debit Note:** Additional charges

**Invoice Fields:**
- **Supplier Details:** TIN, BRN, Name, Address, Contact, MSIC Code, SST Registration
- **Buyer Details:** TIN, BRN/ID, Name, Address, Contact
- **Invoice Details:** Invoice No, Date, Currency, Exchange Rate
- **Line Items:**
  - Description
  - Quantity
  - Unit Price
  - Discount
  - Tax Type (Sales Tax, Service Tax, Exempted, Zero-rated)
  - Tax Rate
  - Tax Amount
  - Subtotal
- **Totals:** Subtotal, Total Tax, Total Discount, Total Amount (including tax)
- **Payment Details:** Payment terms, payment method

**Acceptance Criteria:**
- Validation per LHDN e-Invoice schema
- TIN validation (format check)
- BRN validation (12 digits for companies)
- SST calculation accuracy
- Support for multiple currencies (default MYR)
- Draft invoice before submission
- Preview before LHDN submission

#### FR-FINV-002: LHDN MyInvois Integration
**Priority:** High
**Description:** Direct integration with LHDN API

**Integration Points:**
- **Sandbox Testing:** Use LHDN sandbox for development
- **Production Submission:** Submit validated invoices
- **Authentication:** OAuth 2.0 with LHDN credentials
- **Endpoints:**
  - Submit Invoice
  - Get Invoice Status
  - Cancel Invoice
  - Validate TIN/BRN
  - Retrieve QR Code
  - Document Search

**Workflow:**
1. **Generate Invoice:** Create invoice in system
2. **Validate Locally:** Pre-validation before submission
3. **Submit to LHDN:** API call to MyInvois
4. **Receive UUID:** LHDN returns unique identifier
5. **Get QR Code:** Retrieve QR code for invoice
6. **Check Status:** Poll for validation status
7. **Update Status:** Mark as Valid/Invalid/Cancelled
8. **Digital Signature:** Apply for authenticity

**Acceptance Criteria:**
- Real-time status sync
- Error handling (network failures, API errors)
- Retry mechanism for failed submissions
- Status webhook listener (if available)
- Bulk submission support
- API rate limiting compliance

#### FR-FINV-003: Digital Signature & QR Code
**Priority:** High
**Description:** Cryptographic signature and QR code for invoices

**Digital Signature:**
- Use company digital certificate (issued by LHDN-approved CA)
- Sign invoice XML before submission
- Verify signature on retrieval

**QR Code:**
- Generated by LHDN upon successful validation
- Contains: Invoice UUID, Supplier TIN, Invoice No, Total Amount, Date
- Embedded in PDF invoice
- Scannable for verification

**Acceptance Criteria:**
- QR code retrieval after LHDN validation
- Embed QR code in PDF (top-right corner)
- QR code links to LHDN portal for verification
- Print-friendly QR code size

#### FR-FINV-004: Invoice Status Management
**Priority:** Medium
**Description:** Track invoice lifecycle

**Statuses:**
- **Draft:** Created but not submitted
- **Pending:** Submitted to LHDN, awaiting validation
- **Valid:** Approved by LHDN
- **Invalid:** Rejected by LHDN (with error reasons)
- **Cancelled:** Voided after submission (requires justification)
- **Superseded:** Replaced by credit/debit note

**Features:**
- Status dashboard
- Filter by status
- Resubmit invalid invoices after correction
- Cancel invoice workflow (approval required)
- Invoice search by UUID, Invoice No, Date, Buyer

**Acceptance Criteria:**
- Real-time status updates
- Email notification on status change
- Audit trail for cancellations
- Reason mandatory for cancellation
- Export invoice list to Excel

---

## 4. User Stories

### 4.1 Admin User Stories

#### Employee Management
**US-ADM-001:** As an HR Admin, I want to add a new employee with all personal, employment, and statutory details, so that their records are complete for payroll processing.
- **Acceptance Criteria:** All mandatory fields validated, duplicate IC detection, photo upload, email confirmation sent to employee

**US-ADM-002:** As an HR Admin, I want to edit an employee's salary and statutory details, so that payroll reflects the latest changes after a promotion.
- **Acceptance Criteria:** Audit log records change, effective date captured, YTD recalculated if needed

**US-ADM-003:** As an HR Admin, I want to view an employee's YTD statutory summary, so that I can verify contributions before year-end submission.
- **Acceptance Criteria:** Display monthly breakdown, total YTD, export to PDF

#### Employee Invitation & Account Linking
**US-ADM-015:** As an HR Admin, I want to create an employee record first with all HR details, and then invite them to the system separately, so that employee data is complete before they gain system access.
- **Acceptance Criteria:** Employee record created with `user_id=NULL`, invitation sent to employee's work email, employee appears in list as active without system access

**US-ADM-016:** As an HR Admin, I want the system to automatically link a new user's account to their existing employee record when they accept an invitation, so that I don't have to manually associate profiles.
- **Acceptance Criteria:** System matches by email + company_id, sets `employees.user_id`, updates `user_companies.employee_id`, new JWT includes `employee_id`, audit log records the linking event

**US-ADM-017:** As an HR Admin, I want to see which employees have linked user accounts and which don't, so that I can follow up with employees who haven't registered yet.
- **Acceptance Criteria:** Employee list shows linked/unlinked status indicator, filter by link status, resend invitation option for unlinked employees

**US-ADM-018:** As an HR Admin, I want to manually link an employee record to a user account if the auto-linking didn't work (e.g., different emails), so that I can resolve mismatches.
- **Acceptance Criteria:** Admin can search users by email, select user to link, system validates no duplicate links, audit log records manual linking

**US-STF-012:** As a Staff member who received an invitation, I want my employee profile (with salary, department, position, etc.) to be automatically available after I register and verify my email, so that I can immediately use self-service features.
- **Acceptance Criteria:** After registration + email verification, user can view own profile, see payslips, apply for leave, clock in/out — all linked to the correct employee record

#### Payroll Management
**US-ADM-004:** As a Payroll Admin, I want to process monthly payroll for all employees with automatic EPF/SOCSO/EIS/PCB calculations, so that I ensure compliance and save time.
- **Acceptance Criteria:** Bulk calculation, review before lock, error highlighting, YTD auto-update

**US-ADM-005:** As a Payroll Admin, I want to generate EPF Borang A and SOCSO Form 8A for monthly submission, so that I meet statutory deadlines.
- **Acceptance Criteria:** Official format export, validation against employee records, email to finance

**US-ADM-006:** As an HR Admin, I want to unlock a processed payroll to make corrections, so that I can fix errors discovered after locking.
- **Acceptance Criteria:** Unlock requires authorization, audit logged, employees notified of updated payslip

#### Leave & Attendance Management
**US-ADM-007:** As an HR Admin, I want to approve or reject leave applications with remarks, so that employees know the decision reason.
- **Acceptance Criteria:** Email notification, SMS option, remarks mandatory for rejection, balance updated

**US-ADM-008:** As an HR Admin, I want to view a team calendar showing all approved leaves and WFH, so that I can plan for adequate coverage.
- **Acceptance Criteria:** Color-coded calendar, filter by department, export to PDF

**US-ADM-009:** As an HR Admin, I want to generate a monthly attendance report showing late arrivals and early departures, so that I can address attendance issues.
- **Acceptance Criteria:** Filter by department/employee, graphical charts, export to Excel

#### Claims Management
**US-ADM-010:** As a Finance Admin, I want to approve claims and mark them as paid with payment reference, so that employees are reimbursed accurately.
- **Acceptance Criteria:** Batch approval, payment reference field, email confirmation to employee

#### Communications
**US-ADM-011:** As an HR Admin, I want to post an urgent memo to all employees with push notifications, so that critical information reaches everyone immediately.
- **Acceptance Criteria:** Rich text editor, attachment support, push notification sent, read receipt tracked

**US-ADM-012:** As an HR Admin, I want to upload a new company policy and require all employees to acknowledge reading it, so that I ensure policy awareness.
- **Acceptance Criteria:** PDF upload, acknowledgment button, track who acknowledged, reminder emails

#### E-Invoice Management
**US-ADM-013:** As a Finance Admin, I want to generate an e-Invoice and submit it to LHDN MyInvois API, so that I comply with e-Invoice regulations.
- **Acceptance Criteria:** Validation before submission, UUID received, QR code retrieved, status updated

**US-ADM-014:** As a Finance Admin, I want to cancel a submitted e-Invoice with justification, so that I can void incorrect invoices.
- **Acceptance Criteria:** Reason mandatory, approval workflow, LHDN cancellation API called, audit logged

### 4.2 Staff User Stories

#### Self-Service
**US-STF-001:** As a Staff member, I want to view and download my monthly payslips, so that I can access my salary details anytime.
- **Acceptance Criteria:** List of all payslips, PDF download, password-protected, mobile-friendly

**US-STF-002:** As a Staff member, I want to update my contact details and emergency contact, so that HR has my latest information.
- **Acceptance Criteria:** Edit own contact info, approval for bank account changes, confirmation email

#### Leave Management
**US-STF-003:** As a Staff member, I want to apply for annual leave and see my leave balance before submitting, so that I know if I have sufficient balance.
- **Acceptance Criteria:** Real-time balance display, date picker, half-day option, confirmation message

**US-STF-004:** As a Staff member, I want to receive email and SMS notifications when my leave is approved or rejected, so that I can plan accordingly.
- **Acceptance Criteria:** Email within 5 minutes, SMS option, view in notification center

**US-STF-005:** As a Staff member, I want to view my leave history and upcoming approved leaves, so that I can track my leave usage.
- **Acceptance Criteria:** Calendar view, filter by year, export to iCal

#### Attendance
**US-STF-006:** As a Staff member, I want to clock in and out with a single button, so that I can record my attendance quickly.
- **Acceptance Criteria:** Timestamp captured, location recorded, confirmation message, reminder if forgot to clock out

**US-STF-007:** As a Remote Worker, I want to apply for WFH and clock in from home, so that I can work flexibly.
- **Acceptance Criteria:** WFH application, manager approval, WFH clock-in tagged, no geofence restriction

#### Claims
**US-STF-008:** As a Staff member, I want to submit a medical claim with a photo of my receipt, so that I can get reimbursed without physical paperwork.
- **Acceptance Criteria:** Photo upload from mobile, amount input, description field, submission confirmation

**US-STF-009:** As a Staff member, I want to track the status of my submitted claims, so that I know when to expect reimbursement.
- **Acceptance Criteria:** Status tracking (Pending, Approved, Paid), notification on status change

#### Communications
**US-STF-010:** As a Staff member, I want to read HR memos and company announcements on my dashboard, so that I stay informed.
- **Acceptance Criteria:** Unread badge, attachment download, mark as read

**US-STF-011:** As a Staff member, I want to view and download company policies, so that I understand company rules.
- **Acceptance Criteria:** Policy categories, PDF viewer, download button, acknowledgment tracking

### 4.3 Manager User Stories

**US-MGR-001:** As a Manager, I want to approve/reject leave requests from my team members, so that I can ensure adequate team coverage.
- **Acceptance Criteria:** Pending list, one-click approval, reject with reason, team calendar view

**US-MGR-002:** As a Manager, I want to view my team's attendance summary, so that I can identify attendance issues.
- **Acceptance Criteria:** Team list, filter by date, late/early flags, export to Excel

**US-MGR-003:** As a Manager, I want to approve WFH requests from my team, so that I can manage remote work arrangements.
- **Acceptance Criteria:** WFH calendar, reason visibility, bulk approval

---

## 5. Feature Specifications

### 5.1 Employee Management Module

#### 5.1.1 Employee List View
**UI Components:**
- Search bar (by name, IC, employee ID, department)
- Filters: Department, Position, Employment Type, Status
- Sort: Name, Join Date, Department
- Table columns: Photo, Name, Employee ID, Department, Position, Join Date, Status
- Action buttons: View, Edit, Delete (soft delete)
- Export to Excel
- Add Employee button (top-right)

**Behavior:**
- Pagination (50 employees per page)
- Infinite scroll option
- Responsive table (cards on mobile)
- Click row to view details
- Tooltip on hover

#### 5.1.2 Add/Edit Employee Form
**Form Sections:**
1. **Personal Information Tab**
2. **Employment Details Tab**
3. **Compensation Tab**
4. **Statutory Information Tab**
5. **Documents Tab**

**Validation Rules:**
- IC: 12 digits, format: YYMMDD-PB-###G
- Email: Must be unique
- Mobile: Malaysian format (+60)
- Employee ID: Unique, auto-generated option
- Basic Salary: Numeric, min RM1,000
- EPF/SOCSO: Alphanumeric validation

**Success Flow:**
- Save → Confirmation message → Send welcome email → Redirect to employee list

#### 5.1.3 Employee Detail View
**Sections:**
- Personal information card
- Employment timeline
- Current compensation
- YTD statutory summary (chart)
- Leave balance
- Recent attendance (last 30 days)
- Submitted claims
- Documents repository
- Activity log (recent changes)

**Actions:**
- Edit employee
- Generate employment letter
- Download EA form
- View payslips history
- Reset password (if linked user)

#### 5.1.4 Employee Invitation & Account Linking Workflow

**Overview:**
This workflow covers the complete lifecycle from creating an employee record to linking it with a user account via the invitation system. The key innovation is **automatic email-based matching** — when a user accepts an invitation, the system matches their email against existing employee records to create the link.

**Workflow Diagram:**
```
┌──────────────────────────────────────────────────────────────────────┐
│                    ADMIN SIDE                                        │
│                                                                      │
│  ┌─────────────────┐     ┌──────────────────┐                       │
│  │ 1. Add Employee  │────▶│ Employee Record  │                       │
│  │    (HR details)  │     │ user_id = NULL   │                       │
│  └─────────────────┘     │ email = xyz@co   │                       │
│                           └──────────────────┘                       │
│                                   │                                  │
│  ┌─────────────────┐              │                                  │
│  │ 2. Send Invite   │──────────── │ ─── same email ──┐              │
│  │    (xyz@co)      │             │                    │              │
│  └─────────────────┘              │                    ▼              │
│                                   │          ┌─────────────────┐     │
│                                   │          │ Invitation       │     │
│                                   │          │ email = xyz@co   │     │
│                                   │          │ status = pending │     │
│                                   │          └────────┬────────┘     │
└───────────────────────────────────│───────────────────│──────────────┘
                                    │                    │
                                    │                    ▼
┌───────────────────────────────────│───────────────────────────────────┐
│                    EMPLOYEE SIDE  │                                    │
│                                   │                                    │
│  ┌─────────────────┐              │                                    │
│  │ 3. Click Invite  │──────────── │ ─────────────────────────┐        │
│  │    Link in Email │             │                           │        │
│  └─────────────────┘              │                           │        │
│          │                        │                           │        │
│          ▼                        │                           │        │
│  ┌─────────────────┐              │                           │        │
│  │ 4. Register      │             │                           │        │
│  │    Account       │             │                           │        │
│  └────────┬────────┘              │                           │        │
│           │                       │                           │        │
│           ▼                       │                           │        │
│  ┌─────────────────┐              │                           │        │
│  │ 5. Verify Email  │             │                           │        │
│  └────────┬────────┘              │                           │        │
│           │                       │                           │        │
│           ▼                       ▼                           ▼        │
│  ┌──────────────────────────────────────────────────────────────┐     │
│  │                   AUTO-LINKING ENGINE                         │     │
│  │                                                               │     │
│  │  a) Accept invitation → set user.company_id, user.role       │     │
│  │  b) Create user_companies record                              │     │
│  │  c) MATCH: employees.email == user.email                     │     │
│  │           AND employees.company_id == invitation.company_id   │     │
│  │           AND employees.user_id IS NULL                       │     │
│  │  d) LINK:  employees.user_id = user.id                       │     │
│  │            user_companies.employee_id = employee.employee_id  │     │
│  │  e) Issue JWT with employee_id                                │     │
│  └──────────────────────────────────────────────────────────────┘     │
│           │                                                           │
│           ▼                                                           │
│  ┌─────────────────┐                                                  │
│  │ 6. Dashboard     │  ← Full access with linked employee profile    │
│  │    (Self-Service)│                                                  │
│  └─────────────────┘                                                  │
└───────────────────────────────────────────────────────────────────────┘
```

**Auto-Linking Logic (Backend):**

The auto-linking logic executes in three backend entry points to cover all scenarios:

| Entry Point | When It Runs | Scenario |
|-------------|-------------|----------|
| `POST /api/auth/verify-email` | After email verification | New user registered via invitation link |
| `POST /api/auth/login` | After successful login | Existing user with pending invitation |
| `POST /api/invitations/accept` | Explicit invitation acceptance | Already-authenticated user clicks invitation link |

**Linking Algorithm (pseudocode):**
```
function linkEmployeeToUser(userId, userEmail, companyId):
    // Find matching employee record
    employee = Employee.findOne({
        where: {
            email: userEmail,           // Match by email
            company_id: companyId,      // Same company
            user_id: NULL               // Not yet linked
        }
    })

    if employee found:
        // Link employee to user
        employee.user_id = userId

        // Update user_companies with employee reference
        UserCompany.update(
            { employee_id: employee.employee_id },
            { where: { user_id: userId, company_id: companyId } }
        )

        // Log the linking event
        auditLog('employee_linked', userId, employee.id)

        return employee
    else:
        // No matching employee — user joins company without profile
        return null
```

**Employee List — Link Status Indicators:**

| Status | Icon | Description |
|--------|------|-------------|
| Linked | Green check | Employee has an active user account |
| Invited (Pending) | Orange clock | Invitation sent, awaiting registration |
| Not Invited | Grey dash | No invitation sent yet |

**Manual Linking UI (Admin):**
For cases where auto-linking fails (different emails):
1. Admin opens employee detail page
2. Clicks "Link User Account"
3. Search dialog shows registered users without employee links in this company
4. Admin selects the correct user
5. System sets `employee.user_id` and `user_companies.employee_id`
6. Audit log records the manual link

**Post-Linking Access:**

Once an employee record is linked to a user account, the user gains access to:
- **View Own Profile:** See all HR details (personal info, employment, compensation)
- **Update Own Profile:** Edit allowed fields (mobile, email, address, emergency contact, photo)
- **Leave Management:** Apply for leave, view balance, view history
- **Attendance:** Clock in/out, view attendance logs
- **Claims:** Submit claims, track claim status
- **Payslips:** View and download monthly payslips
- **Memos & Policies:** View announcements, acknowledge policies

### 5.2 Payroll System Module

#### 5.2.1 Payroll Processing Dashboard
**UI Layout:**
- Month/Year selector (default: current month)
- Status indicator: Not Started / In Progress / Locked / Paid
- Summary cards:
  - Total employees
  - Total gross salary
  - Total statutory (EPF, SOCSO, EIS)
  - Total PCB
  - Total net salary
- Action buttons:
  - Start Payroll Calculation
  - Review & Lock
  - Unlock (admin only)
  - Generate Payslips
  - Export Reports

**Processing Steps:**
1. **Input Validation:** Check for missing data (attendance, allowances)
2. **Calculation Engine:** Compute statutory, gross, deductions, net
3. **Exception Handling:** Flag errors (negative salary, missing statutory info)
4. **Review Screen:** Display all calculations in table
5. **Adjustment:** Allow manual edits before locking
6. **Lock Confirmation:** Require password confirmation
7. **Payslip Generation:** Auto-generate PDFs
8. **Email Dispatch:** Batch email payslips

#### 5.2.2 Payroll Calculation Engine

**Inputs:**
- Employee master data (basic salary, statutory details)
- Attendance records (working days, absent days, late days)
- Leave records (unpaid leave days)
- Allowances (fixed + variable)
- Deductions (loans, advances)
- Previous YTD totals

**Calculation Steps:**
1. **Gross Salary Calculation:**
   ```
   Gross = Basic Salary + Fixed Allowances + Variable Allowances + Overtime Pay + Bonus
   ```

2. **Attendance Adjustment:**
   ```
   If Unpaid Leave > 0:
       Daily Rate = Basic Salary / Working Days in Month
       Deduction = Daily Rate × Unpaid Leave Days
       Adjusted Basic = Basic Salary - Deduction
   ```

3. **EPF Calculation:**
   ```
   If Employee Age < 60 AND Not Exempted:
       Capped Salary = MIN(Gross, 30000)
       Employee EPF = Capped Salary × 11%
       If Capped Salary <= 5000:
           Employer EPF = Capped Salary × 13%
       Else:
           Employer EPF = Capped Salary × 12%
   ```

4. **SOCSO Calculation:**
   ```
   If Employee Age < 60 AND First Contribution Before Age 55:
       Capped Salary = MIN(Gross, 5000)
       Lookup contribution table for tier
       Employee SOCSO = Table Value (Employee Column)
       Employer SOCSO = Table Value (Employer Column)
   ```

5. **EIS Calculation:**
   ```
   Capped Salary = MIN(Gross, 5000)
   Employee EIS = Capped Salary × 0.2%
   Employer EIS = Capped Salary × 0.2%
   ```

6. **PCB Calculation:**
   ```
   Monthly Remuneration = Gross - EPF Employee
   Lookup PCB table based on:
       - Monthly Remuneration
       - Tax Category (from employee master)
   PCB Amount = Table Value
   If Zakat > 0:
       PCB = MAX(PCB - Zakat, 0)
   ```

7. **Total Deductions:**
   ```
   Total Deductions = Employee EPF + Employee SOCSO + Employee EIS + PCB + Other Deductions
   ```

8. **Net Salary:**
   ```
   Net Salary = Gross Salary - Total Deductions
   ```

9. **YTD Update:**
   ```
   Update ytd_statutory table:
       total_gross += Gross
       total_epf_employee += Employee EPF
       total_epf_employer += Employer EPF
       total_socso_employee += Employee SOCSO
       total_socso_employer += Employer SOCSO
       total_eis_employee += Employee EIS
       total_eis_employer += Employer EIS
       total_pcb += PCB
       total_net += Net Salary
   ```

**Output:**
- Payroll record saved to `payroll` table
- YTD updated in `ytd_statutory` table
- Payslip PDF generated
- Audit log entry

#### 5.2.3 Payslip Template
**Design Specifications:**
- A4 size, portrait orientation
- Company logo (top-left)
- Company name and address (top-center)
- "PAYSLIP" title (centered, bold)
- Payslip period (Month Year)
- Confidential watermark (background)

**Layout:**
```
+----------------------------------------------------------+
| [Company Logo]          COMPANY NAME                     |
|                    Company Address                       |
|                                                          |
|                      PAYSLIP                             |
|                   [Month Year]                           |
+----------------------------------------------------------+
| Employee Name: [Name]               Employee ID: [ID]    |
| Department: [Dept]                  Position: [Title]    |
| Join Date: [Date]                   Bank Acc: [Account]  |
+----------------------------------------------------------+
|                   EARNINGS                               |
+----------------------------------------------------------+
| Basic Salary                              RM [Amount]    |
| Transport Allowance                       RM [Amount]    |
| Meal Allowance                            RM [Amount]    |
| [Other Allowances]                        RM [Amount]    |
| -------------------------------           ----------     |
| GROSS SALARY                              RM [Amount]    |
+----------------------------------------------------------+
|                   DEDUCTIONS                             |
+----------------------------------------------------------+
| EPF (Employee 11%)                        RM [Amount]    |
| SOCSO (Employee)                          RM [Amount]    |
| EIS (Employee 0.2%)                       RM [Amount]    |
| PCB (Income Tax)                          RM [Amount]    |
| [Other Deductions]                        RM [Amount]    |
| -------------------------------           ----------     |
| TOTAL DEDUCTIONS                          RM [Amount]    |
+----------------------------------------------------------+
| NET SALARY                                RM [Amount]    |
+----------------------------------------------------------+
|                   EMPLOYER CONTRIBUTIONS                 |
+----------------------------------------------------------+
| EPF (Employer)                            RM [Amount]    |
| SOCSO (Employer)                          RM [Amount]    |
| EIS (Employer 0.2%)                       RM [Amount]    |
+----------------------------------------------------------+
|               YEAR-TO-DATE SUMMARY                       |
+----------------------------------------------------------+
| Total Gross YTD                           RM [Amount]    |
| Total EPF YTD                             RM [Amount]    |
| Total SOCSO YTD                           RM [Amount]    |
| Total PCB YTD                             RM [Amount]    |
+----------------------------------------------------------+
| This is a computer-generated payslip.                    |
| For inquiries, contact hr@company.com                    |
+----------------------------------------------------------+
```

### 5.3 Leave Management Module

#### 5.3.1 Leave Application Form
**UI Components:**
- Leave type dropdown
- Date range picker (start date, end date)
- Half-day toggle (AM/PM)
- Total days calculator (auto-calculated)
- Current balance display (per leave type)
- Reason text area (max 500 chars)
- Attachment upload (optional, for MC)
- Approver display (auto-populated from reporting manager)
- Submit button

**Validation:**
- Start date cannot be in past (> 3 days tolerance)
- End date must be >= start date
- Cannot apply if balance insufficient
- Check for overlapping applications
- Mandatory fields: Leave type, dates, reason

**Success Flow:**
- Submit → Balance reserved → Email to manager → Confirmation message → Redirect to leave history

#### 5.3.2 Leave Approval Workflow
**Manager View:**
- Pending leave requests list
- Table columns: Employee, Leave Type, Dates, Days, Reason, Attachment
- Quick actions: Approve, Reject
- Bulk approval checkbox
- Team calendar view (to check conflicts)

**Approval Actions:**
- **Approve:** Balance deducted, status updated, email to staff, calendar updated
- **Reject:** Balance released, remarks mandatory, email to staff with reason

**HR View:**
- All pending leaves (across departments)
- Filter by department, leave type, status
- Override approval (for special cases)
- Generate leave reports

#### 5.3.3 Leave Balance Dashboard
**Display:**
- Cards per leave type showing:
  - Total entitlement
  - Used days
  - Pending approval days
  - Available balance
- Progress bar visual
- Carry forward indicator (if applicable)
- Forecast balance (if pending leaves approved)

**Actions:**
- Click card to view history for that leave type
- Export balance summary to PDF

### 5.4 Attendance & WFH Module

#### 5.4.1 Clock In/Out Interface
**UI for Staff:**
- Large "Clock In" / "Clock Out" button (primary color)
- Current time display (real-time clock)
- Status indicator: Not Clocked In / Clocked In Since [Time]
- Attendance type selector: Office / Work From Home (WFH)
- Location display (GPS coordinates or address)
- Today's summary:
  - Clock In time
  - Clock Out time (if done)
  - Total hours worked
  - Status (On Time / Late / Early Leave)

**Behavior:**
- **Clock In:**
  - Capture timestamp
  - Get GPS location (request permission)
  - Optionally capture selfie
  - Validate geofence (if Office type)
  - Save to attendance table
  - Show confirmation message

- **Clock Out:**
  - Capture timestamp
  - Calculate total hours
  - Save to attendance table
  - Show summary (hours worked)

**Validations:**
- Cannot clock in if already clocked in (must clock out first)
- Cannot clock out if not clocked in
- Geofence validation for Office type (within 500m radius)
- WFH type: No geofence restriction

**Edge Cases:**
- Forgot to clock out: Reminder notification at 9 PM
- Manual adjustment: Admin can edit with reason (audit logged)
- Offline mode: Queue clock action, sync when online

#### 5.4.2 WFH Application Form
**UI Components:**
- Date selector (single or multiple dates)
- Recurring WFH option (e.g., every Friday)
- Reason text area
- Manager display (auto-populated)
- Submit button

**Workflow:**
1. Staff applies for WFH
2. Manager receives email notification
3. Manager approves/rejects
4. On approved WFH day, staff clocks in with type = WFH
5. No geofence validation for WFH clock-in

**Rules:**
- Advance notice: Min 1 day before
- Cannot apply WFH for past dates
- Check company WFH policy (max days per month)

#### 5.4.3 Attendance Reports
**Daily Attendance Report:**
- Table: Employee, Clock In, Clock Out, Hours, Type (Office/WFH), Status
- Filters: Department, Date, Type
- Export to Excel
- Real-time updates

**Monthly Summary Report:**
- Table: Employee, Working Days, Present Days, Absent Days, Late Days, WFH Days, Attendance Rate
- Graphical charts
- Department comparison
- Export to PDF

### 5.5 Claims Management Module

#### 5.5.1 Claim Submission Form
**UI Components:**
- Claim type dropdown (Medical, Travel, Entertainment, etc.)
- Date of expense (date picker)
- Amount (RM, numeric input)
- Description/Purpose (text area, max 500 chars)
- Receipt upload (photo from camera or file upload, max 5MB)
- Current limits display:
  - Per-claim limit (e.g., RM500)
  - Monthly used/balance
  - Annual used/balance
- Submit button

**Validation:**
- Amount must not exceed per-claim limit
- Amount + monthly used must not exceed monthly limit
- Date cannot be in future
- Receipt mandatory (image or PDF)
- Description required

**Success Flow:**
- Submit → Upload receipt to cloud → Save claim record → Email to manager → Confirmation message

#### 5.5.2 Claims Approval Dashboard
**Manager View:**
- Pending claims list
- Table: Employee, Type, Date, Amount, Description, Receipt
- Click row to view full details and receipt image
- Actions: Approve, Reject (with remarks)
- Bulk approval option

**Finance View:**
- Approved claims pending payment
- Payment reference input field
- Mark as Paid action
- Export claims for GL posting

**Staff View:**
- My claims list
- Filters: Status (All, Pending, Approved, Rejected, Paid)
- Status badges (color-coded)
- Resubmit option for rejected claims

### 5.6 HR Communications Module

#### 5.6.1 HR Memo Creation
**Form Fields:**
- Title (text, max 200 chars)
- Content (rich text editor: bold, italic, lists, links, images)
- Attachment upload (PDF, images, max 10MB)
- Target audience selector:
  - All employees
  - Specific departments (multi-select)
  - Specific roles (multi-select)
- Priority level: Normal, Urgent
- Publish now or schedule (date/time picker)

**Rich Text Editor:**
- Toolbar: Bold, Italic, Underline, Lists, Links, Images
- Character counter
- Preview mode

**Publish Actions:**
- **Save as Draft:** Not visible to staff
- **Publish Now:** Immediately visible, send notifications
- **Schedule Publish:** Auto-publish at specified time

**Notification:**
- Email to all targeted employees
- SMS for urgent memos (optional)
- Push notification (if mobile app)
- Dashboard badge for unread memos

#### 5.6.2 Memo Viewing Interface
**Staff View:**
- List of memos (latest first)
- Unread badge (red dot)
- Filters: All, Unread, Urgent
- Click to view full memo
- Attachment download button
- Mark as Read (auto-marked on view)

**Memo Detail Page:**
- Title (bold, large)
- Published date and author
- Content (rendered HTML)
- Attachment download links
- Read receipt (optional): "You read this on [Date]"

#### 5.6.3 Company Policies Repository
**Policy Categories:**
- Employee Handbook
- Code of Conduct
- IT Security Policy
- Remote Work Policy
- Leave Policy
- Claims Policy
- Anti-Harassment Policy

**Policy Upload (Admin):**
- Category dropdown
- Title
- Version number
- Effective date
- PDF upload (max 20MB)
- Require acknowledgment toggle

**Policy Viewing (Staff):**
- Category navigation (sidebar)
- Policy list in category
- Click to view PDF (in-browser viewer)
- Download button
- Acknowledgment section:
  - "I have read and understood this policy" checkbox
  - Acknowledge button
  - Acknowledgment recorded with timestamp

**Acknowledgment Tracking (Admin):**
- Policy detail page shows:
  - Total employees
  - Acknowledged count
  - Pending count
- Download acknowledgment report (Excel)
- Send reminder emails to pending employees

### 5.7 Finance & e-Invoice Module

#### 5.7.1 e-Invoice Creation Form
**Form Sections:**

**1. Supplier Details (Auto-populated from Settings):**
- Company Name
- TIN (Tax Identification Number)
- BRN (Business Registration Number)
- Address
- Contact
- MSIC Code
- SST Registration Number

**2. Buyer Details:**
- TIN (with validation API call)
- BRN/ID Number (with validation API call)
- Name (auto-filled if TIN validated)
- Address
- Contact Email
- Contact Phone

**3. Invoice Details:**
- Invoice Number (auto-generated or manual)
- Invoice Date (default: today)
- Currency (default: MYR)
- Exchange Rate (if not MYR)
- Payment Terms (e.g., Net 30)
- Classification Code

**4. Line Items (Dynamic Table):**
- Description
- Quantity
- Unit Price (RM)
- Discount (%)
- Tax Type: Sales Tax (10%), Service Tax (6%), Exempted, Zero-rated
- Tax Amount (auto-calculated)
- Subtotal (auto-calculated)
- Add Row / Delete Row buttons

**5. Summary Panel (Right Sidebar):**
- Subtotal (before tax)
- Total Discount
- Total Tax (Sales + Service)
- Total Amount (including tax)

**Actions:**
- Save as Draft
- Preview Invoice (PDF)
- Submit to LHDN

**Validation:**
- TIN format: 12 digits (company) or 14 digits (individual)
- BRN format: 12 digits for companies
- At least one line item required
- Total amount > 0
- Tax calculations correct

#### 5.7.2 LHDN Submission Workflow
**Step 1: Local Validation**
- Validate all required fields
- Check TIN/BRN format
- Verify tax calculations
- Generate invoice XML (LHDN schema)
- Pre-validation against schema

**Step 2: LHDN API Authentication**
- Obtain OAuth 2.0 access token
- Store token securely (expires in 1 hour)
- Refresh token if expired

**Step 3: Submit Invoice**
- API Call: POST /api/v1.0/invoices
- Request Body: Invoice JSON/XML
- Headers: Authorization, Content-Type
- Timeout: 30 seconds

**Step 4: Receive Response**
- Success: Receive UUID from LHDN
- Error: Display error messages (field-specific)
- Update invoice status: Pending Validation

**Step 5: Check Validation Status**
- API Call: GET /api/v1.0/invoices/{UUID}/status
- Poll every 10 seconds (max 5 attempts)
- Statuses:
  - **Valid:** Invoice approved
  - **Invalid:** Rejected with error reasons
  - **Cancelled:** Voided

**Step 6: Retrieve QR Code (if Valid)**
- API Call: GET /api/v1.0/invoices/{UUID}/qrcode
- Save QR code image
- Embed in invoice PDF

**Step 7: Update Local Status**
- Update invoice table with LHDN status
- Save UUID, QR code URL
- Send email notification to creator

**Error Handling:**
- Network errors: Retry 3 times with exponential backoff
- API errors: Display user-friendly messages
- Invalid data: Highlight fields needing correction
- Timeout: Allow resubmission

#### 5.7.3 Invoice Management Dashboard
**List View:**
- Table columns: Invoice No, Date, Buyer Name, Amount, LHDN Status, Actions
- Filters:
  - Date range
  - Status (Draft, Pending, Valid, Invalid, Cancelled)
  - Buyer name
- Search by Invoice No or UUID
- Sort by date, amount
- Export to Excel

**Actions:**
- View invoice details
- Download PDF (with QR code if validated)
- Resubmit (if invalid)
- Cancel invoice (if valid, requires approval)
- Send invoice via email

**Invoice Detail View:**
- All invoice details (read-only)
- LHDN status badge (color-coded)
- UUID display
- QR code image (if available)
- Submission log (timestamps, statuses)
- Error messages (if invalid)
- Related documents (credit/debit notes)

**Cancel Invoice Workflow:**
- Reason dropdown (Incorrect amount, Duplicate, Customer request, etc.)
- Remarks field (mandatory)
- Approval required (Finance Manager)
- API call to LHDN cancel endpoint
- Update status to Cancelled
- Audit log entry

#### 5.7.4 LHDN Settings Configuration
**Admin Settings Page:**
- **Company Details:**
  - TIN (Tax Identification Number)
  - BRN (Business Registration Number)
  - Company Name (as registered)
  - Address (registered address)
  - Contact Email
  - Contact Phone
  - MSIC Code (Malaysia Standard Industrial Classification)
  - SST Registration Number (if applicable)

- **LHDN API Credentials:**
  - Environment: Sandbox / Production
  - Client ID
  - Client Secret
  - API Base URL
  - Token Endpoint
  - Test Connection button

- **Digital Certificate:**
  - Upload .p12 certificate file
  - Certificate password (encrypted storage)
  - Expiry date display
  - Renewal reminder (30 days before expiry)

- **Invoice Settings:**
  - Invoice number prefix
  - Starting number
  - Number format (e.g., INV-2025-0001)
  - Auto-increment toggle
  - Default payment terms
  - Default currency

**Validation:**
- Test API connection before saving
- Validate TIN/BRN format
- Certificate password verification

---

## 6. File Storage Management

### 6.1 Overview
The File Storage Management module provides a centralized system for uploading, storing, organizing, and managing documents and files across all HRMS modules. This feature enables secure storage and retrieval of employee documents, receipts, invoices, payslips, and other HR-related files.

**Storage Type:** Local file system (Phase 1)
**Future Plans:** Cloud storage integration (AWS S3, Azure Blob, Google Cloud Storage)

### 6.2 Core Functionalities

#### 6.2.1 File Upload
**Supported File Types:**
- Documents: PDF, DOC, DOCX, TXT
- Images: JPG, JPEG, PNG, GIF, WebP
- Spreadsheets: XLS, XLSX, CSV
- Compressed: ZIP, RAR
- Maximum file size: 10MB per file (configurable)

**Upload Methods:**
- Drag and drop interface
- File browser selection
- Multiple file upload (batch upload up to 10 files)
- Mobile camera capture (for receipts and documents)

**Upload Validation:**
- File type validation
- File size validation
- Malware scanning (basic file extension validation)
- Duplicate file detection
- Filename sanitization

#### 6.2.2 File Categories and Context
Files are categorized based on their associated module and purpose:

**Employee Documents:**
- Resume/CV
- Educational certificates
- Professional certifications
- Identity documents (IC copy, passport)
- Employment contracts
- Offer letters
- Resignation letters
- Appraisal forms

**Claims & Receipts:**
- Medical claim receipts
- Travel claim receipts
- Meal allowance receipts
- Parking receipts
- Other expense receipts

**Payroll Documents:**
- Payslips (auto-generated PDFs)
- EA forms
- EPF statements
- SOCSO statements
- Tax documents

**Leave Documents:**
- Medical certificates (MC)
- Supporting documents for special leave
- Leave approval letters

**Company Documents:**
- HR policies
- Employee handbook
- Announcement attachments
- Circular documents
- Training materials

**Invoice Documents:**
- Customer invoices (PDF)
- Invoice attachments
- Supporting documents
- Payment receipts

### 6.3 File Storage Structure

#### 6.3.1 Directory Organization
```
uploads/
├── employees/
│   ├── {employee_id}/
│   │   ├── profile/
│   │   │   └── photo.jpg
│   │   ├── documents/
│   │   │   ├── ic_copy.pdf
│   │   │   ├── resume.pdf
│   │   │   └── certificates/
│   │   ├── contracts/
│   │   └── appraisals/
├── claims/
│   ├── {year}/
│   │   └── {month}/
│   │       └── {claim_id}/
│   │           ├── receipt_1.jpg
│   │           └── receipt_2.pdf
├── payslips/
│   └── {year}/
│       └── {month}/
│           └── {employee_id}_payslip.pdf
├── leaves/
│   └── {leave_id}/
│       └── medical_certificate.pdf
├── company/
│   ├── policies/
│   ├── announcements/
│   └── templates/
├── invoices/
│   └── {year}/
│       └── {invoice_number}.pdf
└── temp/
    └── {upload_session_id}/
```

#### 6.3.2 File Naming Convention
- **Pattern:** `{timestamp}_{original_filename_sanitized}.{extension}`
- **Example:** `20250118143022_medical_receipt.pdf`
- **Sanitization:** Remove special characters, spaces replaced with underscores
- **Collision handling:** Append sequential number if duplicate exists

### 6.4 File Metadata Storage

#### 6.4.1 Database Schema
```sql
CREATE TABLE files (
  id INT PRIMARY KEY AUTO_INCREMENT,
  original_filename VARCHAR(255) NOT NULL,
  stored_filename VARCHAR(255) NOT NULL,
  file_path VARCHAR(500) NOT NULL,
  file_size BIGINT NOT NULL COMMENT 'Size in bytes',
  mime_type VARCHAR(100) NOT NULL,
  file_extension VARCHAR(10) NOT NULL,

  -- Context & Categorization
  category ENUM('employee_document', 'claim_receipt', 'payslip', 'leave_document',
                'company_document', 'invoice', 'other') NOT NULL,
  sub_category VARCHAR(50) NULL COMMENT 'e.g., resume, ic_copy, medical_receipt',

  -- Associations
  uploaded_by INT NOT NULL COMMENT 'User ID',
  related_to_employee_id INT NULL,
  related_to_claim_id INT NULL,
  related_to_leave_id INT NULL,
  related_to_payroll_id INT NULL,
  related_to_invoice_id INT NULL,

  -- File metadata
  description TEXT NULL,
  tags JSON NULL COMMENT 'Array of tags for searching',
  is_public BOOLEAN DEFAULT FALSE COMMENT 'Public access (e.g., company policies)',
  is_verified BOOLEAN DEFAULT FALSE COMMENT 'Admin verified document',

  -- Lifecycle
  status ENUM('active', 'archived', 'deleted') DEFAULT 'active',
  uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL,
  deleted_by INT NULL,

  -- Indexes
  INDEX idx_category (category),
  INDEX idx_employee (related_to_employee_id),
  INDEX idx_claim (related_to_claim_id),
  INDEX idx_uploaded_by (uploaded_by),
  INDEX idx_status (status),

  -- Foreign Keys
  FOREIGN KEY (uploaded_by) REFERENCES users(id),
  FOREIGN KEY (related_to_employee_id) REFERENCES employees(id),
  FOREIGN KEY (related_to_claim_id) REFERENCES claims(id),
  FOREIGN KEY (related_to_leave_id) REFERENCES leaves(id),
  FOREIGN KEY (deleted_by) REFERENCES users(id)
);
```

### 6.5 File Management Features

#### 6.5.1 File Operations
**Upload:**
- Single and batch file upload
- Progress indicator during upload
- Success/error notifications
- Automatic metadata capture
- Auto-association with related entities

**Download:**
- Direct file download
- Inline preview (PDF, images)
- Download as ZIP (multiple files)
- Download history tracking

**View/Preview:**
- Image preview (thumbnail + lightbox)
- PDF inline viewer
- Document preview (limited to supported types)
- File information panel (metadata, size, upload date)

**Delete:**
- Soft delete (moves to deleted status)
- Hard delete (admin only, permanent removal)
- Bulk delete operations
- Delete confirmation dialog
- Audit trail of deletions

**Organize:**
- Rename files
- Add/edit descriptions
- Tag management
- Move files between categories
- Archive old files

#### 6.5.2 Search and Filter
**Search Capabilities:**
- Filename search (full-text)
- Description search
- Tag-based search
- Advanced filters:
  - File type
  - Category
  - Date range (uploaded)
  - File size range
  - Uploaded by user
  - Associated entity (employee, claim, etc.)

**Sort Options:**
- Name (A-Z, Z-A)
- Upload date (newest, oldest)
- File size (largest, smallest)
- Category

### 6.6 Access Control and Permissions

#### 6.6.1 Role-Based Access
**Admin:**
- Full access to all files
- Can upload, view, download, delete any file
- Can manage company documents
- Can verify employee documents

**Manager:**
- View files of team members
- Upload and manage claim receipts (approval process)
- Download payslips for reporting
- View leave documents for team

**Staff:**
- Upload personal documents
- View own files only
- Upload claim receipts
- Upload leave supporting documents
- Download own payslips

#### 6.6.2 File-Level Permissions
- **Private:** Only accessible by owner and admins
- **Department:** Accessible by department members
- **Public:** Accessible by all employees (e.g., company policies)
- **Restricted:** Requires special permission (e.g., confidential contracts)

### 6.7 Integration with HRMS Modules

#### 6.7.1 Employee Module Integration
- **Profile Photo:** Upload and crop profile picture
- **Document Repository:** Centralized employee document storage
- **Contract Management:** Upload and version employment contracts
- **Onboarding:** Bulk upload onboarding documents

#### 6.7.2 Claims Module Integration
- **Receipt Upload:** Attach receipts during claim submission
- **Multiple Receipts:** Support multiple receipts per claim
- **Receipt Validation:** Check if receipt required based on claim type
- **Auto-link:** Automatically associate uploaded receipts with claim

#### 6.7.3 Leave Module Integration
- **Medical Certificate:** Upload MC for sick leave
- **Supporting Documents:** Attach proof for special leave types
- **Auto-validation:** Validate MC date matches leave dates

#### 6.7.4 Payroll Module Integration
- **Payslip Generation:** Auto-generate and store payslip PDFs
- **EA Form Storage:** Store annual EA forms
- **Statutory Reports:** Save EPF/SOCSO submission reports

#### 6.7.5 Communication Module Integration
- **Announcement Attachments:** Upload files to announcements
- **Policy Documents:** Upload and version HR policies
- **Circular Attachments:** Attach documents to company circulars

### 6.8 Technical Implementation

#### 6.8.1 Backend (Node.js/Express)
**File Upload Middleware:**
- Use `multer` for multipart/form-data handling
- Configure storage engine (disk storage for local)
- File filter for type validation
- File size limits
- Error handling

**API Endpoints:**
```
POST   /api/files/upload              - Upload single or multiple files
GET    /api/files                     - List files (with filters)
GET    /api/files/:id                 - Get file metadata
GET    /api/files/:id/download        - Download file
GET    /api/files/:id/preview         - Preview file (inline)
PUT    /api/files/:id                 - Update file metadata
DELETE /api/files/:id                 - Soft delete file
DELETE /api/files/:id/permanent       - Hard delete file (admin)
POST   /api/files/bulk-delete         - Delete multiple files
GET    /api/files/employee/:id        - Get employee files
GET    /api/files/claim/:id           - Get claim files
```

**File Storage Service:**
- File system operations (save, read, delete)
- Path generation and management
- Filename sanitization
- MIME type detection
- File size calculation

#### 6.8.2 Frontend (Angular)
**File Upload Component:**
- Drag-and-drop zone
- File browser button
- Upload progress bar
- File preview before upload
- Validation messages

**File Manager Component:**
- Grid/List view toggle
- Thumbnail preview
- Search and filter UI
- Bulk selection
- Context menu (download, delete, rename)

**File Viewer Component:**
- Image lightbox viewer
- PDF inline viewer
- Document info panel
- Download button

### 6.9 Security Measures

#### 6.9.1 Upload Security
- File type whitelist validation
- File extension verification
- MIME type checking
- File size limits
- Filename sanitization (prevent path traversal)
- Virus scanning integration (future)

#### 6.9.2 Access Security
- Authentication required for all operations
- Authorization checks before file access
- Secure file paths (outside public directory)
- Signed URLs for temporary access (future)
- Rate limiting on upload endpoints

#### 6.9.3 Data Protection
- Encrypt sensitive files at rest (future)
- HTTPS for file transfer
- Access audit logs
- Secure file deletion (overwrite)
- Backup strategy for file storage

### 6.10 Performance Optimization

#### 6.10.1 Upload Optimization
- Chunked upload for large files (future)
- Resume interrupted uploads (future)
- Client-side image compression
- Background processing for file operations

#### 6.10.2 Retrieval Optimization
- Thumbnail generation for images
- Lazy loading in file lists
- Caching frequently accessed files
- CDN integration (future)

### 6.11 Monitoring and Maintenance

#### 6.11.1 Storage Monitoring
- Disk space usage tracking
- Storage quota per user/department
- File count statistics
- Large file alerts
- Storage cleanup recommendations

#### 6.11.2 Maintenance Tasks
- Automatic cleanup of temp files (older than 24 hours)
- Archive old files (older than 3 years)
- Permanent deletion of soft-deleted files (after 30 days)
- Generate storage usage reports
- File integrity checks

### 6.12 User Stories

**As an Employee:**
- I want to upload my educational certificates so that they are stored in my profile
- I want to upload receipts when submitting claims so that my claims can be processed
- I want to view and download my previous payslips anytime

**As a Manager:**
- I want to view uploaded receipts for claims I need to approve
- I want to download medical certificates for leave applications
- I want to upload team-related documents for reference

**As an Admin:**
- I want to upload company policies so that all employees can access them
- I want to organize employee documents by category for easy retrieval
- I want to monitor storage usage to manage disk space effectively
- I want to delete old or irrelevant files to free up storage

### 6.13 Success Metrics

**Adoption Metrics:**
- 80% of claims include receipt uploads within 3 months
- 100% of payslips stored digitally
- 70% of employees upload profile documents

**Performance Metrics:**
- Upload success rate > 99%
- Average upload time < 5 seconds (for 5MB file)
- File retrieval time < 1 second

**Storage Metrics:**
- Storage utilization tracking
- Average file size monitoring
- File type distribution analysis

---

## 7. Technical Requirements

### 6.1 Frontend - Angular 21

#### 6.1.1 Project Structure
```
HRMS_v1/
├── src/
│   ├── app/
│   │   ├── core/                    # Singleton services, guards, interceptors
│   │   │   ├── guards/
│   │   │   │   ├── auth.guard.ts
│   │   │   │   ├── admin.guard.ts
│   │   │   │   └── role.guard.ts
│   │   │   ├── interceptors/
│   │   │   │   ├── auth.interceptor.ts
│   │   │   │   ├── error.interceptor.ts
│   │   │   │   └── loading.interceptor.ts
│   │   │   ├── services/
│   │   │   │   ├── auth.service.ts
│   │   │   │   ├── api.service.ts
│   │   │   │   ├── storage.service.ts
│   │   │   │   └── notification.service.ts
│   │   │   └── models/
│   │   │       ├── user.model.ts
│   │   │       ├── employee.model.ts
│   │   │       └── response.model.ts
│   │   │
│   │   ├── shared/                  # Reusable components, pipes, directives
│   │   │   ├── components/
│   │   │   │   ├── header/
│   │   │   │   ├── sidebar/
│   │   │   │   ├── footer/
│   │   │   │   ├── loader/
│   │   │   │   ├── modal/
│   │   │   │   ├── table/
│   │   │   │   └── form-controls/
│   │   │   ├── pipes/
│   │   │   │   ├── currency-myr.pipe.ts
│   │   │   │   ├── date-format.pipe.ts
│   │   │   │   └── status-badge.pipe.ts
│   │   │   └── directives/
│   │   │       ├── permission.directive.ts
│   │   │       └── tooltip.directive.ts
│   │   │
│   │   ├── features/                # Lazy-loaded feature modules
│   │   │   ├── auth/
│   │   │   │   ├── login/
│   │   │   │   ├── register/
│   │   │   │   ├── forgot-password/
│   │   │   │   └── auth-routing.module.ts
│   │   │   │
│   │   │   ├── dashboard/
│   │   │   │   ├── admin-dashboard/
│   │   │   │   ├── staff-dashboard/
│   │   │   │   └── dashboard-routing.module.ts
│   │   │   │
│   │   │   ├── employee/
│   │   │   │   ├── employee-list/
│   │   │   │   ├── employee-add/
│   │   │   │   ├── employee-edit/
│   │   │   │   ├── employee-detail/
│   │   │   │   ├── services/
│   │   │   │   │   └── employee.service.ts
│   │   │   │   └── employee-routing.module.ts
│   │   │   │
│   │   │   ├── payroll/
│   │   │   │   ├── payroll-process/
│   │   │   │   ├── payroll-review/
│   │   │   │   ├── payslip-list/
│   │   │   │   ├── payslip-view/
│   │   │   │   ├── statutory-reports/
│   │   │   │   ├── services/
│   │   │   │   │   ├── payroll.service.ts
│   │   │   │   │   └── statutory.service.ts
│   │   │   │   └── payroll-routing.module.ts
│   │   │   │
│   │   │   ├── leave/
│   │   │   │   ├── leave-apply/
│   │   │   │   ├── leave-list/
│   │   │   │   ├── leave-approve/
│   │   │   │   ├── leave-calendar/
│   │   │   │   ├── leave-balance/
│   │   │   │   ├── services/
│   │   │   │   │   └── leave.service.ts
│   │   │   │   └── leave-routing.module.ts
│   │   │   │
│   │   │   ├── attendance/
│   │   │   │   ├── clock-in-out/
│   │   │   │   ├── wfh-apply/
│   │   │   │   ├── wfh-approve/
│   │   │   │   ├── attendance-logs/
│   │   │   │   ├── attendance-reports/
│   │   │   │   ├── services/
│   │   │   │   │   └── attendance.service.ts
│   │   │   │   └── attendance-routing.module.ts
│   │   │   │
│   │   │   ├── claims/
│   │   │   │   ├── claim-submit/
│   │   │   │   ├── claim-list/
│   │   │   │   ├── claim-approve/
│   │   │   │   ├── claim-process/
│   │   │   │   ├── services/
│   │   │   │   │   └── claims.service.ts
│   │   │   │   └── claims-routing.module.ts
│   │   │   │
│   │   │   ├── communication/
│   │   │   │   ├── memo-list/
│   │   │   │   ├── memo-create/
│   │   │   │   ├── memo-view/
│   │   │   │   ├── policy-list/
│   │   │   │   ├── policy-upload/
│   │   │   │   ├── policy-view/
│   │   │   │   ├── services/
│   │   │   │   │   └── communication.service.ts
│   │   │   │   └── communication-routing.module.ts
│   │   │   │
│   │   │   └── finance/
│   │   │       ├── invoice-create/
│   │   │       ├── invoice-list/
│   │   │       ├── invoice-detail/
│   │   │       ├── lhdn-settings/
│   │   │       ├── services/
│   │   │       │   ├── invoice.service.ts
│   │   │       │   └── lhdn.service.ts
│   │   │       └── finance-routing.module.ts
│   │   │
│   │   ├── app-routing.module.ts
│   │   ├── app.component.ts
│   │   └── app.module.ts
│   │
│   ├── assets/
│   │   ├── images/
│   │   ├── icons/
│   │   └── scss/
│   │       ├── _variables.scss
│   │       ├── _mixins.scss
│   │       ├── _typography.scss
│   │       └── styles.scss
│   │
│   ├── environments/
│   │   ├── environment.ts          # Development
│   │   └── environment.prod.ts     # Production
│   │
│   ├── index.html
│   ├── main.ts
│   └── styles.scss
│
├── angular.json
├── package.json
├── tsconfig.json
└── README.md
```

#### 6.1.2 Key Dependencies
```json
{
  "dependencies": {
    "@angular/animations": "^21.0.0",
    "@angular/common": "^21.0.0",
    "@angular/compiler": "^21.0.0",
    "@angular/core": "^21.0.0",
    "@angular/forms": "^21.0.0",
    "@angular/platform-browser": "^21.0.0",
    "@angular/platform-browser-dynamic": "^21.0.0",
    "@angular/router": "^21.0.0",
    "@ng-bootstrap/ng-bootstrap": "^17.0.0",
    "bootstrap": "^5.3.0",
    "rxjs": "~7.8.0",
    "tslib": "^2.3.0",
    "zone.js": "~0.14.0",
    "chart.js": "^4.4.0",
    "ng2-charts": "^6.0.0",
    "ngx-pagination": "^6.0.0",
    "ngx-toastr": "^19.0.0",
    "jspdf": "^2.5.0",
    "file-saver": "^2.0.5"
  },
  "devDependencies": {
    "@angular-devkit/build-angular": "^21.0.0",
    "@angular/cli": "^21.0.0",
    "@angular/compiler-cli": "^21.0.0",
    "typescript": "~5.5.0"
  }
}
```

#### 6.1.3 Routing Configuration
```typescript
// app-routing.module.ts
const routes: Routes = [
  { path: '', redirectTo: '/dashboard', pathMatch: 'full' },
  {
    path: 'auth',
    loadChildren: () => import('./features/auth/auth.module').then(m => m.AuthModule)
  },
  {
    path: 'dashboard',
    loadChildren: () => import('./features/dashboard/dashboard.module').then(m => m.DashboardModule),
    canActivate: [AuthGuard]
  },
  {
    path: 'employees',
    loadChildren: () => import('./features/employee/employee.module').then(m => m.EmployeeModule),
    canActivate: [AuthGuard, AdminGuard]
  },
  {
    path: 'payroll',
    loadChildren: () => import('./features/payroll/payroll.module').then(m => m.PayrollModule),
    canActivate: [AuthGuard, AdminGuard]
  },
  {
    path: 'leave',
    loadChildren: () => import('./features/leave/leave.module').then(m => m.LeaveModule),
    canActivate: [AuthGuard]
  },
  {
    path: 'attendance',
    loadChildren: () => import('./features/attendance/attendance.module').then(m => m.AttendanceModule),
    canActivate: [AuthGuard]
  },
  {
    path: 'claims',
    loadChildren: () => import('./features/claims/claims.module').then(m => m.ClaimsModule),
    canActivate: [AuthGuard]
  },
  {
    path: 'communication',
    loadChildren: () => import('./features/communication/communication.module').then(m => m.CommunicationModule),
    canActivate: [AuthGuard]
  },
  {
    path: 'finance',
    loadChildren: () => import('./features/finance/finance.module').then(m => m.FinanceModule),
    canActivate: [AuthGuard, AdminGuard]
  },
  { path: '**', redirectTo: '/dashboard' }
];
```

#### 6.1.4 State Management
**Approach:** Service-based state management with RxJS (no NgRx for simplicity)

**Example: Auth State Service**
```typescript
@Injectable({ providedIn: 'root' })
export class AuthService {
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  login(credentials: LoginRequest): Observable<User> {
    return this.http.post<User>('/api/auth/login', credentials).pipe(
      tap(user => {
        this.storageService.setUser(user);
        this.currentUserSubject.next(user);
      })
    );
  }

  logout(): void {
    this.storageService.clear();
    this.currentUserSubject.next(null);
    this.router.navigate(['/auth/login']);
  }

  get currentUserValue(): User | null {
    return this.currentUserSubject.value;
  }

  isAdmin(): boolean {
    return this.currentUserValue?.role === 'admin';
  }
}
```

#### 6.1.5 UI Framework - Bootstrap 5
**Theme Customization:**
```scss
// _variables.scss
$primary: #0066cc;
$secondary: #6c757d;
$success: #28a745;
$danger: #dc3545;
$warning: #ffc107;
$info: #17a2b8;

$font-family-base: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
$font-size-base: 0.9rem;

$border-radius: 0.375rem;
$box-shadow: 0 0.125rem 0.25rem rgba(0, 0, 0, 0.075);
```

**Responsive Breakpoints:**
- Mobile: < 576px
- Tablet: 576px - 992px
- Desktop: > 992px

### 6.2 Backend - Node.js + Express

#### 6.2.1 Project Structure
```
HRMS_Backend/
├── src/
│   ├── config/
│   │   ├── database.js          # MySQL connection
│   │   ├── jwt.js               # JWT secret, expiry
│   │   ├── email.js             # Email service config
│   │   └── lhdn.js              # LHDN API credentials
│   │
│   ├── models/                  # Sequelize models
│   │   ├── User.js
│   │   ├── Employee.js
│   │   ├── YTDStatutory.js
│   │   ├── Payroll.js
│   │   ├── Leave.js
│   │   ├── Attendance.js
│   │   ├── Claim.js
│   │   ├── Memo.js
│   │   ├── Policy.js
│   │   ├── PolicyAcknowledgment.js
│   │   ├── Invoice.js
│   │   └── InvoiceItem.js
│   │
│   ├── controllers/             # Business logic
│   │   ├── authController.js
│   │   ├── employeeController.js
│   │   ├── payrollController.js
│   │   ├── leaveController.js
│   │   ├── attendanceController.js
│   │   ├── claimController.js
│   │   ├── communicationController.js
│   │   └── invoiceController.js
│   │
│   ├── routes/                  # API routes
│   │   ├── auth.routes.js
│   │   ├── employee.routes.js
│   │   ├── payroll.routes.js
│   │   ├── leave.routes.js
│   │   ├── attendance.routes.js
│   │   ├── claim.routes.js
│   │   ├── communication.routes.js
│   │   └── invoice.routes.js
│   │
│   ├── middleware/
│   │   ├── auth.middleware.js       # JWT verification
│   │   ├── rbac.middleware.js       # Role-based access
│   │   ├── validation.middleware.js # Request validation
│   │   └── error.middleware.js      # Global error handler
│   │
│   ├── services/                # Business services
│   │   ├── emailService.js
│   │   ├── smsService.js
│   │   ├── pdfService.js            # Payslip generation
│   │   ├── statutoryService.js      # EPF/SOCSO/PCB calculations
│   │   ├── lhdnService.js           # LHDN API integration
│   │   └── fileStorageService.js    # Cloud storage
│   │
│   ├── utils/
│   │   ├── logger.js                # Winston logger
│   │   ├── validators.js            # Custom validators
│   │   └── helpers.js               # Utility functions
│   │
│   └── app.js                   # Express app entry point
│
├── tests/
│   ├── unit/
│   └── integration/
│
├── package.json
├── .env                         # Environment variables
├── .env.example
└── README.md
```

#### 6.2.2 Key Dependencies
```json
{
  "dependencies": {
    "express": "^4.18.0",
    "sequelize": "^6.35.0",
    "mysql2": "^3.6.0",
    "bcryptjs": "^2.4.3",
    "jsonwebtoken": "^9.0.0",
    "dotenv": "^16.3.0",
    "cors": "^2.8.5",
    "helmet": "^7.1.0",
    "express-validator": "^7.0.0",
    "multer": "^1.4.5-lts.1",
    "nodemailer": "^6.9.0",
    "winston": "^3.11.0",
    "morgan": "^1.10.0",
    "pdfkit": "^0.14.0",
    "axios": "^1.6.0",
    "date-fns": "^3.0.0"
  },
  "devDependencies": {
    "nodemon": "^3.0.0",
    "jest": "^29.7.0",
    "supertest": "^6.3.0"
  }
}
```

#### 6.2.3 API Endpoints Specification

**Authentication:**
- POST `/api/auth/login` - User login (auto-accepts pending invitation, auto-links employee)
- POST `/api/auth/register` - User registration
- POST `/api/auth/verify-email` - Verify email (auto-accepts invitation, auto-links employee)
- POST `/api/auth/resend-verification` - Resend email verification
- POST `/api/auth/forgot-password` - Request password reset
- POST `/api/auth/reset-password` - Reset password
- POST `/api/auth/logout` - Logout user
- GET `/api/auth/me` - Get current user (with employee & company data)

**Company & Multi-Tenancy:**
- POST `/api/company` - Create new company (onboarding)
- GET `/api/company/my-companies` - List user's company memberships
- POST `/api/company/switch` - Switch active company (issues new JWT)

**Invitations:**
- POST `/api/invitations` - Create and send invitation (admin)
- GET `/api/invitations` - List company invitations (admin)
- GET `/api/invitations/info?token={TOKEN}` - Get invitation details (public, no auth)
- POST `/api/invitations/accept` - Accept invitation, auto-link employee (authenticated)
- POST `/api/invitations/:id/cancel` - Cancel pending invitation (admin)
- POST `/api/invitations/:id/resend` - Resend invitation email (admin)

**Employee Management:**
- GET `/api/employees` - List all employees (admin, scoped to active company)
- GET `/api/employees/:id` - Get employee details
- POST `/api/employees` - Create employee (admin, `user_id` initially NULL)
- PUT `/api/employees/:id` - Update employee (admin)
- DELETE `/api/employees/:id` - Soft delete employee (admin)
- GET `/api/employees/:id/ytd` - Get YTD statutory summary
- GET `/api/employees/me` - Get own employee profile (authenticated, linked via `user_id`)
- PUT `/api/employees/me` - Update own profile (limited fields)

**Payroll:**
- POST `/api/payroll/process/:month/:year` - Process monthly payroll
- GET `/api/payroll/:month/:year` - Get payroll for month
- PUT `/api/payroll/:id` - Update payroll entry (before lock)
- POST `/api/payroll/lock/:month/:year` - Lock payroll
- POST `/api/payroll/unlock/:month/:year` - Unlock payroll (admin)
- GET `/api/payroll/payslip/:employee_id/:month/:year` - Get payslip
- GET `/api/payroll/reports/epf/:month/:year` - EPF Borang A
- GET `/api/payroll/reports/socso/:month/:year` - SOCSO Form 8A
- GET `/api/payroll/reports/pcb/:month/:year` - PCB CP39
- GET `/api/payroll/reports/ea/:employee_id/:year` - EA Form

**Leave Management:**
- POST `/api/leaves` - Apply for leave
- GET `/api/leaves` - List leaves (filtered by role)
- GET `/api/leaves/:id` - Get leave details
- PUT `/api/leaves/:id/approve` - Approve leave (manager/admin)
- PUT `/api/leaves/:id/reject` - Reject leave (manager/admin)
- DELETE `/api/leaves/:id` - Cancel leave (staff, if pending)
- GET `/api/leaves/balance/:employee_id` - Get leave balances
- GET `/api/leaves/calendar/:employee_id` - Get leave calendar

**Attendance:**
- POST `/api/attendance/clock-in` - Clock in
- POST `/api/attendance/clock-out` - Clock out
- GET `/api/attendance/:employee_id/:date` - Get attendance for date
- GET `/api/attendance/logs/:employee_id` - Get attendance history
- GET `/api/attendance/reports/daily/:date` - Daily attendance report
- GET `/api/attendance/reports/monthly/:month/:year` - Monthly summary
- POST `/api/attendance/wfh` - Apply for WFH
- PUT `/api/attendance/wfh/:id/approve` - Approve WFH
- PUT `/api/attendance/wfh/:id/reject` - Reject WFH

**Claims:**
- POST `/api/claims` - Submit claim
- GET `/api/claims` - List claims (filtered by role)
- GET `/api/claims/:id` - Get claim details
- PUT `/api/claims/:id/approve` - Approve claim (manager)
- PUT `/api/claims/:id/reject` - Reject claim (manager)
- PUT `/api/claims/:id/process` - Mark as paid (finance)
- GET `/api/claims/reports/pending` - Pending claims report
- GET `/api/claims/reports/summary/:employee_id` - Employee claims summary

**Communication:**
- POST `/api/memos` - Create memo (admin)
- GET `/api/memos` - List memos
- GET `/api/memos/:id` - Get memo details
- PUT `/api/memos/:id` - Update memo (admin)
- DELETE `/api/memos/:id` - Delete memo (admin)
- POST `/api/policies` - Upload policy (admin)
- GET `/api/policies` - List policies
- GET `/api/policies/:id` - Get policy details
- POST `/api/policies/:id/acknowledge` - Acknowledge policy (staff)
- GET `/api/policies/:id/acknowledgments` - Get acknowledgment status (admin)

**Finance & E-Invoice:**
- POST `/api/invoices` - Create invoice
- GET `/api/invoices` - List invoices
- GET `/api/invoices/:id` - Get invoice details
- PUT `/api/invoices/:id` - Update invoice (if draft)
- DELETE `/api/invoices/:id` - Delete draft invoice
- POST `/api/invoices/:id/submit` - Submit to LHDN
- POST `/api/invoices/:id/cancel` - Cancel invoice
- GET `/api/invoices/:id/status` - Get LHDN status
- GET `/api/invoices/:id/qrcode` - Get QR code
- POST `/api/lhdn/validate-tin` - Validate TIN
- POST `/api/lhdn/validate-brn` - Validate BRN

#### 6.2.4 Database Configuration (Sequelize)
```javascript
// config/database.js
const { Sequelize } = require('sequelize');

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    dialect: 'mysql',
    port: process.env.DB_PORT || 3306,
    logging: false,
    pool: {
      max: 10,
      min: 0,
      acquire: 30000,
      idle: 10000
    },
    timezone: '+08:00' // Malaysia timezone
  }
);

module.exports = sequelize;
```

#### 6.2.5 Authentication Middleware
```javascript
// middleware/auth.middleware.js
const jwt = require('jsonwebtoken');

const authMiddleware = (req, res, next) => {
  const token = req.headers['authorization']?.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid token' });
  }
};

module.exports = authMiddleware;
```

#### 6.2.6 Role-Based Access Control
```javascript
// middleware/rbac.middleware.js
const rbacMiddleware = (allowedRoles) => {
  return (req, res, next) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Access forbidden' });
    }
    next();
  };
};

module.exports = rbacMiddleware;

// Usage in routes:
// router.get('/employees', authMiddleware, rbacMiddleware(['admin']), employeeController.list);
```

---

## 7. Database Schema

### 7.1 Complete Schema Design (PostgreSQL — Supabase)

> **Note:** The production database has been migrated from MySQL to PostgreSQL (Supabase).
> Syntax below uses PostgreSQL conventions. Sequelize ORM handles dialect differences.

```sql
-- Companies Table (Multi-Tenancy)
CREATE TABLE companies (
  id SERIAL PRIMARY KEY,
  name VARCHAR(200) NOT NULL,
  registration_no VARCHAR(50),
  industry VARCHAR(100),
  size VARCHAR(50),
  country VARCHAR(100) DEFAULT 'Malaysia',
  logo_url VARCHAR(255),
  owner_id INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Users Table
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(100) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  role VARCHAR(20) NOT NULL DEFAULT 'staff',  -- super_admin, admin, manager, staff
  company_id INT REFERENCES companies(id),     -- Active company (NULL for new users)
  email_verified BOOLEAN DEFAULT FALSE,
  email_verification_token VARCHAR(255),
  email_verification_expires TIMESTAMP,
  is_active BOOLEAN DEFAULT TRUE,
  last_login_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);

-- User-Company Memberships (Many-to-Many for Multi-Company Support)
CREATE TABLE user_companies (
  id SERIAL PRIMARY KEY,
  user_id INT NOT NULL REFERENCES users(id),
  company_id INT NOT NULL REFERENCES companies(id),
  role VARCHAR(20) NOT NULL DEFAULT 'staff',   -- Role within this specific company
  employee_id VARCHAR(20),                      -- Linked employee_id (set during auto-linking)
  joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, company_id)
);

-- Invitations Table
CREATE TABLE invitations (
  id SERIAL PRIMARY KEY,
  company_id INT NOT NULL REFERENCES companies(id),
  invited_by INT NOT NULL REFERENCES users(id),
  email VARCHAR(100) NOT NULL,
  role VARCHAR(20) NOT NULL DEFAULT 'staff',
  token VARCHAR(255) NOT NULL,
  status VARCHAR(20) DEFAULT 'pending',         -- pending, accepted, expired, cancelled
  expires_at TIMESTAMP NOT NULL,
  accepted_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_invitations_token ON invitations(token);
CREATE INDEX idx_invitations_email ON invitations(email);

-- Employees Table
CREATE TABLE employees (
  id SERIAL PRIMARY KEY,
  user_id INT,                                  -- NULL until user account is linked
  company_id INT REFERENCES companies(id),      -- Scoped to a company
  employee_id VARCHAR(20) NOT NULL,
  full_name VARCHAR(150) NOT NULL,
  ic_no VARCHAR(20) UNIQUE,
  passport_no VARCHAR(20),
  date_of_birth DATE,
  gender ENUM('Male', 'Female') NOT NULL,
  marital_status ENUM('Single', 'Married', 'Divorced', 'Widowed'),
  nationality VARCHAR(50) DEFAULT 'Malaysian',
  race VARCHAR(50),
  religion VARCHAR(50),
  mobile VARCHAR(20),
  email VARCHAR(100),
  emergency_contact_name VARCHAR(100),
  emergency_contact_phone VARCHAR(20),
  current_address TEXT,
  permanent_address TEXT,
  position VARCHAR(100),
  department VARCHAR(100),
  reporting_manager_id INT,
  basic_salary DECIMAL(10, 2) NOT NULL,
  join_date DATE NOT NULL,
  confirmation_date DATE,
  employment_type ENUM('Permanent', 'Contract', 'Probation', 'Intern') DEFAULT 'Probation',
  employment_status ENUM('Active', 'Resigned', 'Terminated') DEFAULT 'Active',
  work_location VARCHAR(100),
  bank_name VARCHAR(100),
  bank_account_no VARCHAR(50),
  bank_account_holder VARCHAR(150),
  epf_no VARCHAR(20),
  socso_no VARCHAR(20),
  tax_no VARCHAR(20),
  tax_category VARCHAR(50) DEFAULT 'Individual',
  photo_url VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY (company_id) REFERENCES companies(id),
  FOREIGN KEY (reporting_manager_id) REFERENCES employees(id) ON DELETE SET NULL,
  UNIQUE(user_id, company_id),              -- One employee record per user per company
  UNIQUE(employee_id, company_id)           -- Employee ID unique within company
);
CREATE INDEX idx_employees_department ON employees(department);
CREATE INDEX idx_employees_status ON employees(employment_status);

-- YTD Statutory Table
CREATE TABLE ytd_statutory (
  id INT PRIMARY KEY AUTO_INCREMENT,
  employee_id INT NOT NULL,
  year INT NOT NULL,
  total_gross DECIMAL(12, 2) DEFAULT 0,
  total_epf_employee DECIMAL(10, 2) DEFAULT 0,
  total_epf_employer DECIMAL(10, 2) DEFAULT 0,
  total_socso_employee DECIMAL(10, 2) DEFAULT 0,
  total_socso_employer DECIMAL(10, 2) DEFAULT 0,
  total_eis_employee DECIMAL(10, 2) DEFAULT 0,
  total_eis_employer DECIMAL(10, 2) DEFAULT 0,
  total_pcb DECIMAL(10, 2) DEFAULT 0,
  total_net DECIMAL(12, 2) DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE,
  UNIQUE KEY unique_employee_year (employee_id, year)
);

-- Payroll Table
CREATE TABLE payroll (
  id INT PRIMARY KEY AUTO_INCREMENT,
  employee_id INT NOT NULL,
  month INT NOT NULL,
  year INT NOT NULL,
  basic_salary DECIMAL(10, 2) NOT NULL,
  allowance DECIMAL(10, 2) DEFAULT 0,
  overtime_pay DECIMAL(10, 2) DEFAULT 0,
  bonus DECIMAL(10, 2) DEFAULT 0,
  gross_salary DECIMAL(10, 2) NOT NULL,
  epf_employee DECIMAL(10, 2) DEFAULT 0,
  epf_employer DECIMAL(10, 2) DEFAULT 0,
  socso_employee DECIMAL(10, 2) DEFAULT 0,
  socso_employer DECIMAL(10, 2) DEFAULT 0,
  eis_employee DECIMAL(10, 2) DEFAULT 0,
  eis_employer DECIMAL(10, 2) DEFAULT 0,
  pcb DECIMAL(10, 2) DEFAULT 0,
  other_deductions DECIMAL(10, 2) DEFAULT 0,
  total_deductions DECIMAL(10, 2) NOT NULL,
  net_salary DECIMAL(10, 2) NOT NULL,
  status ENUM('Draft', 'Locked', 'Paid') DEFAULT 'Draft',
  locked_at DATETIME,
  locked_by INT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE,
  FOREIGN KEY (locked_by) REFERENCES users(id) ON DELETE SET NULL,
  UNIQUE KEY unique_payroll (employee_id, month, year),
  INDEX idx_month_year (month, year)
);

-- Leave Types Table
CREATE TABLE leave_types (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(50) NOT NULL,
  days_per_year INT DEFAULT 0,
  is_paid BOOLEAN DEFAULT TRUE,
  carry_forward_allowed BOOLEAN DEFAULT FALSE,
  carry_forward_max_days INT DEFAULT 0,
  prorate_for_new_joiners BOOLEAN DEFAULT TRUE,
  requires_document BOOLEAN DEFAULT FALSE,
  description TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Leave Entitlements Table
CREATE TABLE leave_entitlements (
  id INT PRIMARY KEY AUTO_INCREMENT,
  employee_id INT NOT NULL,
  leave_type_id INT NOT NULL,
  year INT NOT NULL,
  total_days DECIMAL(5, 2) NOT NULL,
  used_days DECIMAL(5, 2) DEFAULT 0,
  pending_days DECIMAL(5, 2) DEFAULT 0,
  balance_days DECIMAL(5, 2) NOT NULL,
  carry_forward_days DECIMAL(5, 2) DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE,
  FOREIGN KEY (leave_type_id) REFERENCES leave_types(id) ON DELETE CASCADE,
  UNIQUE KEY unique_entitlement (employee_id, leave_type_id, year)
);

-- Leaves Table
CREATE TABLE leaves (
  id INT PRIMARY KEY AUTO_INCREMENT,
  employee_id INT NOT NULL,
  leave_type_id INT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  total_days DECIMAL(5, 2) NOT NULL,
  is_half_day BOOLEAN DEFAULT FALSE,
  half_day_period ENUM('AM', 'PM'),
  reason TEXT NOT NULL,
  attachment_url VARCHAR(255),
  status ENUM('Pending', 'Approved', 'Rejected', 'Cancelled') DEFAULT 'Pending',
  approved_by INT,
  approved_at DATETIME,
  rejection_reason TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE,
  FOREIGN KEY (leave_type_id) REFERENCES leave_types(id) ON DELETE CASCADE,
  FOREIGN KEY (approved_by) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_employee (employee_id),
  INDEX idx_status (status),
  INDEX idx_dates (start_date, end_date)
);

-- Attendance Table
CREATE TABLE attendance (
  id INT PRIMARY KEY AUTO_INCREMENT,
  employee_id INT NOT NULL,
  date DATE NOT NULL,
  clock_in_time DATETIME,
  clock_out_time DATETIME,
  total_hours DECIMAL(5, 2),
  type ENUM('Office', 'WFH') DEFAULT 'Office',
  location_lat DECIMAL(10, 8),
  location_long DECIMAL(11, 8),
  location_address VARCHAR(255),
  is_late BOOLEAN DEFAULT FALSE,
  is_early_leave BOOLEAN DEFAULT FALSE,
  remarks TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE,
  UNIQUE KEY unique_attendance (employee_id, date),
  INDEX idx_employee_date (employee_id, date)
);

-- WFH Applications Table
CREATE TABLE wfh_applications (
  id INT PRIMARY KEY AUTO_INCREMENT,
  employee_id INT NOT NULL,
  date DATE NOT NULL,
  reason TEXT NOT NULL,
  status ENUM('Pending', 'Approved', 'Rejected') DEFAULT 'Pending',
  approved_by INT,
  approved_at DATETIME,
  rejection_reason TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE,
  FOREIGN KEY (approved_by) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_employee (employee_id),
  INDEX idx_date (date),
  INDEX idx_status (status)
);

-- Claim Types Table
CREATE TABLE claim_types (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(50) NOT NULL,
  per_claim_limit DECIMAL(10, 2) DEFAULT 0,
  monthly_limit DECIMAL(10, 2) DEFAULT 0,
  annual_limit DECIMAL(10, 2) DEFAULT 0,
  requires_receipt BOOLEAN DEFAULT TRUE,
  description TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Claims Table
CREATE TABLE claims (
  id INT PRIMARY KEY AUTO_INCREMENT,
  employee_id INT NOT NULL,
  claim_type_id INT NOT NULL,
  date DATE NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  description TEXT NOT NULL,
  receipt_url VARCHAR(255),
  status ENUM('Pending', 'Manager_Approved', 'Finance_Approved', 'Rejected', 'Paid') DEFAULT 'Pending',
  manager_approved_by INT,
  manager_approved_at DATETIME,
  finance_approved_by INT,
  finance_approved_at DATETIME,
  rejection_reason TEXT,
  payment_reference VARCHAR(100),
  paid_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE,
  FOREIGN KEY (claim_type_id) REFERENCES claim_types(id) ON DELETE CASCADE,
  FOREIGN KEY (manager_approved_by) REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY (finance_approved_by) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_employee (employee_id),
  INDEX idx_status (status),
  INDEX idx_date (date)
);

-- Memos Table
CREATE TABLE memos (
  id INT PRIMARY KEY AUTO_INCREMENT,
  title VARCHAR(200) NOT NULL,
  content TEXT NOT NULL,
  attachment_url VARCHAR(255),
  target_audience ENUM('All', 'Department', 'Role') DEFAULT 'All',
  target_departments VARCHAR(255),
  target_roles VARCHAR(255),
  priority ENUM('Normal', 'Urgent') DEFAULT 'Normal',
  publish_at DATETIME,
  created_by INT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_publish_at (publish_at)
);

-- Memo Read Receipts Table
CREATE TABLE memo_read_receipts (
  id INT PRIMARY KEY AUTO_INCREMENT,
  memo_id INT NOT NULL,
  employee_id INT NOT NULL,
  read_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (memo_id) REFERENCES memos(id) ON DELETE CASCADE,
  FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE,
  UNIQUE KEY unique_receipt (memo_id, employee_id)
);

-- Policies Table
CREATE TABLE policies (
  id INT PRIMARY KEY AUTO_INCREMENT,
  category VARCHAR(100) NOT NULL,
  title VARCHAR(200) NOT NULL,
  document_url VARCHAR(255) NOT NULL,
  version VARCHAR(20),
  effective_date DATE,
  require_acknowledgment BOOLEAN DEFAULT FALSE,
  uploaded_by INT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (uploaded_by) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_category (category)
);

-- Policy Acknowledgments Table
CREATE TABLE policy_acknowledgments (
  id INT PRIMARY KEY AUTO_INCREMENT,
  policy_id INT NOT NULL,
  employee_id INT NOT NULL,
  acknowledged_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  ip_address VARCHAR(45),
  FOREIGN KEY (policy_id) REFERENCES policies(id) ON DELETE CASCADE,
  FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE,
  UNIQUE KEY unique_acknowledgment (policy_id, employee_id)
);

-- Invoices Table
CREATE TABLE invoices (
  id INT PRIMARY KEY AUTO_INCREMENT,
  invoice_no VARCHAR(50) UNIQUE NOT NULL,
  invoice_type ENUM('Standard', 'Consolidated', 'Self-Billed', 'Credit Note', 'Debit Note') DEFAULT 'Standard',
  invoice_date DATE NOT NULL,
  supplier_tin VARCHAR(20),
  supplier_brn VARCHAR(20),
  supplier_name VARCHAR(200),
  supplier_address TEXT,
  buyer_tin VARCHAR(20),
  buyer_brn VARCHAR(20),
  buyer_id_no VARCHAR(20),
  buyer_name VARCHAR(200) NOT NULL,
  buyer_address TEXT,
  buyer_email VARCHAR(100),
  buyer_phone VARCHAR(20),
  currency VARCHAR(3) DEFAULT 'MYR',
  exchange_rate DECIMAL(10, 6) DEFAULT 1.000000,
  subtotal DECIMAL(12, 2) NOT NULL,
  total_discount DECIMAL(12, 2) DEFAULT 0,
  total_tax DECIMAL(12, 2) DEFAULT 0,
  total_amount DECIMAL(12, 2) NOT NULL,
  payment_terms VARCHAR(100),
  lhdn_uuid VARCHAR(100),
  lhdn_status ENUM('Draft', 'Pending', 'Valid', 'Invalid', 'Cancelled') DEFAULT 'Draft',
  lhdn_submitted_at DATETIME,
  lhdn_validated_at DATETIME,
  lhdn_error_message TEXT,
  qr_code_url VARCHAR(255),
  created_by INT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_invoice_no (invoice_no),
  INDEX idx_lhdn_status (lhdn_status),
  INDEX idx_invoice_date (invoice_date)
);

-- Invoice Items Table
CREATE TABLE invoice_items (
  id INT PRIMARY KEY AUTO_INCREMENT,
  invoice_id INT NOT NULL,
  line_number INT NOT NULL,
  description VARCHAR(500) NOT NULL,
  quantity DECIMAL(10, 3) NOT NULL,
  unit_price DECIMAL(12, 2) NOT NULL,
  discount_percent DECIMAL(5, 2) DEFAULT 0,
  discount_amount DECIMAL(12, 2) DEFAULT 0,
  tax_type ENUM('Sales Tax', 'Service Tax', 'Exempted', 'Zero-rated') DEFAULT 'Exempted',
  tax_rate DECIMAL(5, 2) DEFAULT 0,
  tax_amount DECIMAL(12, 2) DEFAULT 0,
  subtotal DECIMAL(12, 2) NOT NULL,
  total DECIMAL(12, 2) NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE CASCADE,
  INDEX idx_invoice (invoice_id)
);

-- Audit Logs Table
CREATE TABLE audit_logs (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT,
  action VARCHAR(100) NOT NULL,
  table_name VARCHAR(100),
  record_id INT,
  old_values JSON,
  new_values JSON,
  ip_address VARCHAR(45),
  user_agent TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_user (user_id),
  INDEX idx_table (table_name, record_id),
  INDEX idx_created_at (created_at)
);
```

### 7.2 Entity Relationship Diagram (ERD)

```
companies (1) ----< (N) employees
companies (1) ----< (N) invitations
companies (1) ----< (N) user_companies

users (1) ----< (N) user_companies >---- (N) companies    [Many-to-Many via user_companies]
users (1) ----< (N) employees                               [user_id FK, set during auto-linking]
users (1) ----  (1) companies                               [active company_id FK]

invitations (N) >---- (1) companies                         [invitation scoped to company]
invitations (N) >---- (1) users                             [invited_by FK]

employees (1) ----< (N) ytd_statutory
employees (1) ----< (N) payroll
employees (1) ----< (N) leaves
employees (1) ----< (N) leave_entitlements
leave_types (1) ----< (N) leaves
leave_types (1) ----< (N) leave_entitlements
employees (1) ----< (N) attendance
employees (1) ----< (N) wfh_applications
employees (1) ----< (N) claims
claim_types (1) ----< (N) claims
employees (1) ----< (N) policy_acknowledgments
policies (1) ----< (N) policy_acknowledgments
memos (1) ----< (N) memo_read_receipts
employees (1) ----< (N) memo_read_receipts
invoices (1) ----< (N) invoice_items
users (1) ----< (N) audit_logs
```

**Key Linking Relationships:**
```
User ──── user_id ────▶ Employee         (set when user accepts invitation)
User ──── company_id ──▶ Company          (active company, updated on switch)
UserCompany ── employee_id ──▶ Employee   (per-company employee reference)
Invitation ── email ── ▶ Employee.email   (matched during auto-linking)
```

### 7.3 Database Indexes Strategy
- **Primary Keys:** Auto-increment INT on all tables
- **Foreign Keys:** All relationships properly indexed
- **Composite Indexes:** For frequently queried combinations (employee_id + date, month + year)
- **Status Indexes:** For workflow tables (leaves, claims, invoices)
- **Date Indexes:** For time-based queries (attendance, payroll)

### 7.4 Data Retention Policy
- **Active Records:** Indefinite retention
- **Resigned/Terminated Employees:** 7 years (Malaysian tax law)
- **Payroll Records:** 7 years minimum
- **Audit Logs:** 3 years rolling window
- **Soft Deletes:** Implemented for employees, leave types, claim types

---

## 8. Security and Compliance

### 8.1 Authentication & Authorization

#### 8.1.1 Password Security
- **Hashing Algorithm:** bcrypt (12 rounds)
- **Password Requirements:**
  - Minimum 8 characters
  - At least 1 uppercase letter
  - At least 1 lowercase letter
  - At least 1 number
  - At least 1 special character (optional but recommended)
- **Password Reset:** Secure token valid for 1 hour
- **Account Lockout:** 5 failed attempts, 30-minute lockout

#### 8.1.2 JWT Token Management
- **Access Token:** 1 hour expiry
- **Refresh Token:** 7 days expiry (future enhancement)
- **Token Payload:**
  ```json
  {
    "userId": 123,
    "email": "user@example.com",
    "role": "admin",
    "iat": 1234567890,
    "exp": 1234571490
  }
  ```
- **Secret Rotation:** Quarterly rotation recommended

#### 8.1.3 Role-Based Access Control Matrix

| Feature | Super Admin | Admin | Manager | Staff |
|---------|-------------|-------|---------|-------|
| User Management | ✓ | ✗ | ✗ | ✗ |
| Employee CRUD | ✓ | ✓ | ✗ | View Own |
| Payroll Processing | ✓ | ✓ | ✗ | ✗ |
| Payslip View | ✓ | ✓ | Team | Own |
| Leave Approval | ✓ | ✓ | Team | ✗ |
| Leave Application | ✓ | ✓ | ✓ | ✓ |
| Attendance View | ✓ | ✓ | Team | Own |
| Clock In/Out | ✓ | ✓ | ✓ | ✓ |
| Claims Approval (Manager) | ✓ | ✓ | Team | ✗ |
| Claims Approval (Finance) | ✓ | ✓ | ✗ | ✗ |
| Claims Submit | ✓ | ✓ | ✓ | ✓ |
| Memo Create | ✓ | ✓ | ✗ | ✗ |
| Policy Upload | ✓ | ✓ | ✗ | ✗ |
| E-Invoice Create | ✓ | ✓ | ✗ | ✗ |
| LHDN Settings | ✓ | ✗ | ✗ | ✗ |
| Audit Logs | ✓ | ✓ (view) | ✗ | ✗ |

### 8.2 Data Protection

#### 8.2.1 Sensitive Data Encryption
- **At Rest:**
  - Database encryption using MySQL TDE (Transparent Data Encryption)
  - Encrypted fields: Passwords (bcrypt), Bank Account Numbers, IC Numbers
  - File storage encryption (AES-256)
- **In Transit:**
  - HTTPS/TLS 1.3 for all communications
  - Certificate from trusted CA (Let's Encrypt or commercial)
  - HSTS headers enabled

#### 8.2.2 Personal Data Protection Act (PDPA) Compliance
Malaysia's PDPA requires:
- **Consent:** Obtain employee consent for data collection
- **Notice:** Inform employees about data usage
- **Access:** Employees can request their data
- **Correction:** Employees can request data correction
- **Retention:** Retain data only as long as necessary (7 years for tax purposes)
- **Security:** Implement appropriate security measures

**Implementation:**
- Consent form during onboarding
- Privacy policy accessible in system
- Self-service data view/download for employees
- Data retention policy (7 years)
- Encryption and access controls

#### 8.2.3 Data Backup and Recovery
- **Backup Frequency:** Daily automated backups (3 AM Malaysia time)
- **Retention:** 30 daily, 12 monthly, 7 yearly
- **Storage:** Off-site cloud storage (encrypted)
- **Recovery Time Objective (RTO):** 4 hours
- **Recovery Point Objective (RPO):** 24 hours
- **Testing:** Quarterly backup restore tests

### 8.3 Malaysian Statutory Compliance

#### 8.3.1 EPF (KWSP) Compliance
- Accurate contribution calculations per official tables
- Monthly submission deadline: 15th of following month
- Borang A generation
- EPF number validation (format: A12345678)
- Age exemption (> 60 years)

#### 8.3.2 SOCSO (PERKESO) Compliance
- 34-tier contribution table implementation
- Employment Injury Scheme (all ages up to 60)
- Invalidity Pension Scheme (first contributor before age 55)
- Monthly submission deadline: Last day of following month
- Form 8A generation

#### 8.3.3 EIS (Employment Insurance System) Compliance
- 0.2% employee + 0.2% employer
- Maximum salary cap: RM5,000
- Integrated with SOCSO submission

#### 8.3.4 PCB (Income Tax) Compliance
- Monthly Tax Deduction (MTD) method
- PCB tables from LHDN (updated annually)
- Zakat deduction support
- Bonus PCB calculation
- CP39 monthly submission
- EA Form annual generation (for employee income tax filing)

#### 8.3.5 LHDN e-Invoice Compliance
- **Effective Date:** Phased rollout (2024-2025)
  - Phase 1: Companies with revenue > RM100M (Aug 2024)
  - Phase 2: Companies with revenue > RM25M (Jan 2025)
  - Phase 3: All companies (July 2025)
- **Mandatory Requirements:**
  - Digital signature using LHDN-approved certificate
  - QR code on all invoices
  - Real-time submission to MyInvois portal
  - Invoice retention for 7 years
  - Unique Invoice Reference Number (IRN)
- **Penalties:**
  - Late submission: RM200 - RM20,000 per offense
  - Non-compliance: RM200 - RM100,000 and/or imprisonment

### 8.4 Application Security

#### 8.4.1 OWASP Top 10 Mitigation

1. **Injection (SQL, NoSQL):**
   - Parameterized queries (Sequelize ORM)
   - Input validation and sanitization

2. **Broken Authentication:**
   - Strong password policy
   - JWT token expiry
   - Secure session management

3. **Sensitive Data Exposure:**
   - HTTPS/TLS encryption
   - Database encryption
   - Secure file storage

4. **XML External Entities (XXE):**
   - Disable XML external entity processing
   - Input validation

5. **Broken Access Control:**
   - RBAC implementation
   - Route guards (frontend)
   - API middleware (backend)

6. **Security Misconfiguration:**
   - Remove default credentials
   - Disable directory listing
   - Secure headers (Helmet.js)

7. **Cross-Site Scripting (XSS):**
   - Input sanitization
   - Content Security Policy (CSP) headers
   - Angular built-in XSS protection

8. **Insecure Deserialization:**
   - Validate all serialized data
   - Use JSON schema validation

9. **Using Components with Known Vulnerabilities:**
   - Regular dependency updates
   - npm audit checks
   - Automated vulnerability scanning

10. **Insufficient Logging & Monitoring:**
    - Winston logger for all actions
    - Audit logs for critical operations
    - Error tracking (Sentry or similar)

#### 8.4.2 API Security
- **Rate Limiting:** 100 requests/minute per IP
- **CORS:** Whitelist allowed origins
- **API Versioning:** /api/v1/ prefix
- **Request Validation:** express-validator middleware
- **File Upload Security:**
  - Max file size: 10MB
  - Allowed types: PDF, JPG, PNG
  - Virus scanning (ClamAV or cloud service)
  - Secure file storage (S3 or equivalent)

#### 8.4.3 Frontend Security
- **Content Security Policy (CSP):**
  ```
  default-src 'self';
  script-src 'self' 'unsafe-inline';
  style-src 'self' 'unsafe-inline';
  img-src 'self' data: https:;
  ```
- **X-Content-Type-Options:** nosniff
- **X-Frame-Options:** DENY
- **Strict-Transport-Security:** max-age=31536000; includeSubDomains

### 8.5 Audit Trail

#### 8.5.1 Logged Events
- User login/logout
- Employee CRUD operations
- Payroll processing/locking/unlocking
- Leave approval/rejection
- Claims approval/payment
- Invoice submission/cancellation
- Settings changes
- Password resets

#### 8.5.2 Audit Log Details
- User ID and email
- Timestamp (Malaysia timezone)
- Action performed
- Table and record ID affected
- Old and new values (JSON)
- IP address
- User agent (browser info)

#### 8.5.3 Audit Log Retention
- 3 years rolling window
- Archived logs stored securely
- Access restricted to Super Admin

---

## 9. Payment Integration

### 9.1 Current Scope (Phase 1)
**No Direct Payment Gateway Integration**

Phase 1 focuses on:
- Payroll calculation and payslip generation
- Bank file export (CSV/text format) for manual upload to bank portal
- Payment reference tracking for claims

**Bank File Export Format:**
```csv
Employee Name,Bank Account No,Bank Name,Amount,Reference
John Doe,1234567890,Maybank,3500.00,Salary-Jan-2025
Jane Smith,9876543210,CIMB,4200.00,Salary-Jan-2025
```

**Supported Banks (Standard formats):**
- Maybank
- CIMB
- Public Bank
- RHB
- Hong Leong Bank

### 9.2 Future Payment Enhancements (Phase 2+)

#### 9.2.1 FPX (Financial Process Exchange) Integration
**Use Case:** Direct salary payment to employees

**Features:**
- Automated salary transfer
- Real-time payment status
- Payment confirmation receipts
- Reconciliation reports

**Requirements:**
- FPX merchant account
- API credentials
- Bank partnership

#### 9.2.2 Payroll Card Integration
**Use Case:** Alternative to bank transfer for unbanked employees

**Features:**
- Prepaid payroll cards
- Instant salary loading
- ATM withdrawal support
- Transaction history

**Potential Partners:**
- Touch 'n Go eWallet
- Boost
- GrabPay

#### 9.2.3 Claims Reimbursement Automation
**Use Case:** Direct reimbursement to employee bank accounts

**Features:**
- One-click payment after finance approval
- Batch payment processing
- Payment status tracking
- Auto-reconciliation

**Implementation:**
- Integrate with company bank's API (e.g., Maybank2u API, CIMB API)
- Support for instant transfer (IBG, FAST)

### 9.3 Payment Security (Future)
- PCI-DSS compliance for card data
- Two-factor authentication for payment approval
- Payment limit controls
- Fraud detection
- Payment encryption (end-to-end)

---

## 10. Future Enhancement Roadmap

### 10.1 Phase 2 Enhancements (6-12 months)

#### 10.1.1 Performance Management
- Goal setting and tracking (OKRs/KPIs)
- Mid-year and annual performance reviews
- 360-degree feedback
- Performance improvement plans (PIP)
- Competency matrix
- Performance-based bonus calculations

#### 10.1.2 Recruitment & Onboarding
- Applicant Tracking System (ATS)
- Job posting management
- Resume parsing
- Interview scheduling
- Candidate evaluation and scoring
- Offer letter generation
- Digital onboarding workflow
- E-signature for contracts

#### 10.1.3 Learning Management System (LMS)
- Training course catalog
- Online course delivery
- Training enrollment and tracking
- Certification management
- Training budget tracking
- Skill gap analysis
- Mandatory compliance training tracking

#### 10.1.4 Mobile Application
- Native iOS and Android apps
- Offline clock in/out
- Push notifications
- Mobile-optimized leave application
- Photo claims submission
- Payslip download
- Biometric authentication

### 10.2 Phase 3 Enhancements (12-18 months)

#### 10.2.1 Advanced Analytics & Reporting
- HR dashboard with KPIs:
  - Headcount trends
  - Attrition rate
  - Absenteeism rate
  - Leave utilization
  - Payroll cost trends
  - Claims analysis
- Predictive analytics:
  - Attrition prediction
  - Hiring demand forecasting
- Custom report builder
- Data export to BI tools (Power BI, Tableau)

#### 10.2.2 Employee Self-Service Portal
- Personal information updates (pending HR approval)
- Dependent management
- Document repository (contracts, appraisals)
- Benefits enrollment
- Tax relief declaration (for PCB optimization)
- Loan/advance request
- Shift swap requests

#### 10.2.3 Manager Self-Service
- Team org chart visualization
- Team analytics (attendance, leave, performance)
- Budget tracking (headcount, payroll)
- Approval delegation
- Bulk approvals

#### 10.2.4 Workflow Automation
- Customizable approval workflows
- Multi-level approvals
- Conditional routing (e.g., amount > RM1,000 → Finance approval)
- Email/SMS notifications at each stage
- Escalation for pending approvals

### 10.3 Phase 4 Enhancements (18-24 months)

#### 10.3.1 Multi-Company Support
- Multiple legal entities in one system
- Consolidated reporting across companies
- Inter-company transfers
- Separate payroll processing per entity
- Consolidated e-Invoice management

#### 10.3.2 Regional Expansion
- Support for Singapore, Indonesia, Thailand payroll
- Multi-currency payroll
- Country-specific statutory compliance
- Multi-language UI (English, Malay, Chinese, Tamil)

#### 10.3.3 AI-Powered Features
- **Chatbot for HR Queries:**
  - "What's my leave balance?"
  - "How do I apply for medical leave?"
  - "When is my next payday?"
- **Smart Leave Recommendations:**
  - Suggest optimal leave dates based on team calendar
- **Payroll Anomaly Detection:**
  - Flag unusual salary changes
  - Identify potential payroll errors
- **Resume Screening (for recruitment module):**
  - Auto-rank candidates based on job requirements

#### 10.3.4 Integration with Third-Party Systems
- **Accounting Software:**
  - SQL Accounting, AutoCount, Xero, QuickBooks
  - Auto-export GL entries for payroll
- **Biometric Devices:**
  - Fingerprint/face recognition attendance
  - Real-time sync with attendance table
- **Email Systems:**
  - Microsoft 365, Google Workspace integration
  - Calendar sync for leave and WFH
- **Payment Gateways:**
  - FPX, eWallet integration for salary payment
- **Government Portals:**
  - Direct submission to KWSP, PERKESO, LHDN portals (if APIs available)

### 10.4 Technical Debt & Optimization

#### 10.4.1 Performance Optimization
- Database query optimization (indexing, query caching)
- Frontend lazy loading and code splitting (already planned)
- CDN for static assets
- Redis caching for frequently accessed data (leave balances, employee lists)
- Background job processing (email sending, report generation) using Bull or similar

#### 10.4.2 Code Quality
- Unit test coverage > 80%
- Integration tests for critical workflows
- End-to-end tests using Cypress
- Code linting and formatting (ESLint, Prettier)
- Continuous Integration/Continuous Deployment (CI/CD) pipeline

#### 10.4.3 Scalability
- Microservices architecture (if scaling beyond 1000 employees)
- Load balancing
- Database sharding (if needed)
- Containerization (Docker)
- Kubernetes orchestration (for enterprise deployment)

### 10.5 Compliance & Security Updates

#### 10.5.1 Annual Compliance Updates
- EPF/SOCSO contribution rate changes (government announces annually)
- PCB tax table updates (LHDN announces annually)
- Minimum wage adjustments
- Public holiday updates (state-specific)

#### 10.5.2 Security Enhancements
- Penetration testing (annual)
- Vulnerability scanning (quarterly)
- Security patch management
- SOC 2 Type II certification (for enterprise clients)

---

## Appendix

### A. Glossary of Terms

| Term | Description |
|------|-------------|
| **EPF (KWSP)** | Employees Provident Fund - mandatory retirement savings |
| **SOCSO (PERKESO)** | Social Security Organization - social security protection |
| **EIS** | Employment Insurance System - unemployment insurance |
| **PCB** | Potongan Cukai Bawah Gaji - Monthly Tax Deduction |
| **MTD** | Monthly Tax Deduction - method for calculating PCB |
| **LHDN** | Lembaga Hasil Dalam Negeri - Inland Revenue Board |
| **TIN** | Tax Identification Number |
| **BRN** | Business Registration Number |
| **EA Form** | Annual employee remuneration statement for tax filing |
| **CP39** | PCB monthly remittance form |
| **Borang A** | EPF monthly contribution form |
| **Form 8A** | SOCSO monthly contribution form |
| **WFH** | Work From Home |
| **YTD** | Year-To-Date |
| **RBAC** | Role-Based Access Control |
| **JWT** | JSON Web Token |
| **ORM** | Object-Relational Mapping |

### B. Reference Links

**Malaysian Government Portals:**
- KWSP: https://www.kwsp.gov.my
- PERKESO: https://www.perkeso.gov.my
- LHDN: https://www.hasil.gov.my
- MyInvois Portal: https://myinvois.hasil.gov.my

**Technical Documentation:**
- Angular: https://angular.io/docs
- Node.js: https://nodejs.org/docs
- Express: https://expressjs.com
- Sequelize: https://sequelize.org/docs
- Bootstrap 5: https://getbootstrap.com/docs

**Compliance Resources:**
- PDPA Malaysia: https://www.pdp.gov.my
- E-Invoice Guidelines: https://www.hasil.gov.my/en/e-invoice

### C. Document Change Log

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2025-01-01 | Initial Team | Initial PRD draft |
| 2.0 | 2025-11-29 | Comprehensive Update | Complete PRD with all sections |
| 2.1 | 2026-02-11 | Update | Added FR-EMP-004 (Employee Invitation & Account Linking), multi-tenancy schema (companies, invitations, user_companies tables), updated ERD, invitation/company API endpoints, user stories US-ADM-015 through US-ADM-018 and US-STF-012, feature spec 5.1.4 with workflow diagram and auto-linking algorithm |

---

**End of Document**

This comprehensive PRD serves as the single source of truth for the HRMS project. All stakeholders should refer to this document for feature specifications, technical requirements, and project roadmap.

**Document Owner:** Averroes Data Science
**Review Cycle:** Quarterly
**Next Review Date:** 2026-02-28
