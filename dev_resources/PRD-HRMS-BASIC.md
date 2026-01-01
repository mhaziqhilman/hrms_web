# Product Requirements Document (PRD) - HR Management System (HRMS)

## 1. Introduction
**Project Name:** HRMS (Malaysian Context)
**Goal:** Build a comprehensive HR Management System tailored for Malaysian companies, featuring Employee Management, Payroll (EPF, SOCSO, PCB), Leave Management, and Attendance.
**Target Users:**
-   **Admin**: Full access to all modules, payroll processing, and system settings.
-   **Staff**: Access to personal profile, leave application, payslip viewing, and attendance clock-in/out.

## 2. Technology Stack
-   **Frontend**: Angular 21 (Enterprise Standard)
    -   **Language**: TypeScript
    -   **Styling**: ZardUI (shadcn/ui alternative for Angular) + Tailwind CSS
    -   **Architecture**: Modular with Lazy Loading
    -   **Routing**: Guard-protected routes
-   **Backend**: Node.js + Express
    -   **Language**: JavaScript
    -   **Entry Point**: `app.js`
    -   **Database**: MySQL (via Laragon)
    -   **ORM**: Sequelize (JavaScript)
-   **Tools**:
    -   **Package Manager**: npm
    -   **Version Control**: Git

## 3. Functional Requirements

### 3.1 Authentication & Authorization
-   **Login**: Email & Password.
-   **Role-Based Access Control (RBAC)**:
    -   `Admin`: Can manage employees, payroll, settings.
    -   `Staff`: Can view own data, apply leave.
-   **Guards**: Protect routes based on roles (e.g., `AdminGuard`, `AuthGuard`).

### 3.2 Employee Management
-   **Personal Details**: Name, IC, Passport, Address, Contact.
-   **Employment Details**: Position, Department, Basic Salary, Join Date.
-   **Statutory Details**:
    -   EPF No (KWSP)
    -   SOCSO No (PERKESO)
    -   Tax No (LHDN)
-   **YTD (Year-to-Date) Statutory**:
    -   **Employee**: Total EPF, SOCSO, EIS, PCB paid so far.
    -   **Employer**: Total EPF, SOCSO, EIS paid so far.

### 3.3 Payroll System (Malaysian Context)
-   **Monthly Calculation**: Basic + Allowances - Deductions.
-   **Statutory Deductions Logic**:
    -   **EPF**: Employer (13% for salary < RM5k, 12% for > RM5k), Employee (11%).
    -   **SOCSO**: Based on contribution table (Employment Injury & Invalidity).
    -   **EIS**: 0.2% Employee, 0.2% Employer.
    -   **PCB**: Monthly Tax Deduction based on MTD calculation.
-   **Payslip Generation**: Viewable by Staff.

### 3.4 Leave Management
-   **Leave Types**: Annual, Medical, Unpaid, Emergency.
-   **Workflow**: Staff applies -> Admin approves/rejects.
-   **Balance Tracking**: Auto-deduct from entitlement.

### 3.5 Attendance & Flexible Work
-   **Clock In/Out**: Simple button for staff.
-   **Flexible Work (WFH)**:
    -   Apply for WFH (Date, Reason).
    -   Approval Workflow.
    -   Clock In/Out tagged as "WFH".
-   **Logs**: Admin can view daily attendance logs with location/type (Office/WFH).

### 3.6 Claims Management
-   **Types**: Medical, Travel, Entertainment, Others.
-   **Workflow**: Submit Claim -> Attach Receipt -> Admin Approval -> Finance Processing.
-   **Limits**: Set limits per claim type or role.

### 3.7 HR Memos & Company Policies
-   **HR Memo**: Admin posts announcements (Text + Attachments). Staff receives notification/dashboard alert.
-   **Company Policies**: Repository of PDF/Docs (Employee Handbook, IT Policy).
    -   Admin uploads.
    -   Staff views/downloads.
    -   Tracking: "Acknowledge Read" button for critical policies.

### 3.8 Finance & e-Invoice (LHDN Compliance)
-   **Scope**: Issuing invoices to clients (B2B/B2C) or Self-billed invoices.
-   **LHDN Integration**: Direct integration with MyInvois API (Sandbox/Production).
-   **Features**:
    -   Generate e-Invoice (Standard/Consolidated).
    -   Validate TIN, BRN, SST details.
    -   Digital Signature & QR Code generation.
    -   Sync status (Valid, Invalid, Cancelled).

## 4. Technical Architecture & Implementation Plan

### 4.1 Database Schema (MySQL)
-   `users`: id, email, password, role (admin/staff).
-   `employees`: user_id, full_name, ic_no, passport, address, position, department, basic_salary, epf_no, socso_no, tax_no.
-   `ytd_statutory`: employee_id, year, total_epf_employee, total_epf_employer, total_socso_employee, total_socso_employer, total_eis_employee, total_eis_employer, total_pcb.
-   `payroll`: employee_id, month, year, basic, allowance, deduction, epf_employee, epf_employer, socso_employee, socso_employer, eis_employee, eis_employer, pcb, net_salary.
-   `leaves`: employee_id, type, start_date, end_date, reason, status (pending/approved/rejected).
-   `attendance`: employee_id, date, clock_in_time, clock_out_time, type (office/wfh), location_lat, location_long.
-   `claims`: employee_id, type, amount, date, description, receipt_url, status.
-   `memos`: id, title, content, attachment_url, created_at, created_by.
-   `policies`: id, title, document_url, version, required_acknowledgment.
-   `policy_acknowledgments`: policy_id, employee_id, acknowledged_at.
-   `invoices`: id, invoice_no, type, buyer_tin, buyer_name, total_amount, lhdn_uuid, lhdn_status, qr_code_url.
-   `invoice_items`: invoice_id, description, quantity, price, tax_rate, total.

### 4.2 Backend Structure (`HRMS_Backend`)
-   `app.js` (Entry)
-   `config/` (DB connection)
-   `routes/` (API endpoints)
-   `controllers/` (Logic)
-   `models/` (Sequelize models)
-   `middleware/` (Auth, RBAC)

### 4.3 Frontend Structure (`HRMS_v1`)
-   **Core Module** (`src/app/core/`): Singleton services, guards, interceptors, models.
-   **Shared Module** (`src/app/shared/`): Reusable components, pipes, directives.
-   **Features** (Lazy Loaded):
    -   `src/app/features/auth/` (Login)
    -   `src/app/features/dashboard/` (Admin/Staff Dashboard)
    -   `src/app/features/employee/` (List, Add, Edit, View)
    -   `src/app/features/payroll/` (Process, Payslips)
    -   `src/app/features/leave/` (Apply, Approve)
    -   `src/app/features/attendance/` (Clock In/Out, WFH)
    -   `src/app/features/claims/` (Submit, Approve)
    -   `src/app/features/communication/` (Memos, Policies)
    -   `src/app/features/finance/` (e-Invoice, LHDN Sync)

## 5. Verification Plan
-   **Backend**: Test API endpoints with Postman/Insomnia.
-   **Frontend**: Verify Lazy Loading works (check network tab).
-   **Calculation**: Verify EPF/SOCSO calculations against official tables.
