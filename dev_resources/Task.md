# HR Management System (HRMS) - Project Tasks

## Completed Tasks

- [x] Project Initialization & Planning
    - [x] Analyze existing frontend setup <!-- id: 0 -->
    - [x] Define HRMS features (PRD Created in `dev_resources/PRD-HRMS.md`) <!-- id: 1 -->
    - [x] Select and setup Backend (Node.js/Express selected) <!-- id: 2 -->
    - [x] Database Schema Design (Defined in PRD) <!-- id: 3 -->

### Backend Development (Node.js/Express)
- [x] Initialize `HRMS-API_v1` project <!-- id: 7 -->
- [x] Install dependencies & Setup Server <!-- id: 8 -->
- [x] Setup Database Connection (Sequelize/MySQL) <!-- id: 9 -->
- [x] Implement Auth API (Login/Register, JWT) <!-- id: 10 -->
- [x] Implement Employee API (CRUD, YTD Statutory) <!-- id: 11 -->
- [x] Implement Payroll API (Calc, Payslip) <!-- id: 13 -->
- [x] Implement Leave & Attendance API (WFH support) <!-- id: 14 -->
- [x] Implement Claims API <!-- id: 15 -->

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

---

## Feature Implementation Status (Based on PRD-HRMS.md)

### ✅ Fully Implemented Features (18/27 = 67%)

**Authentication & Authorization (2/3)**
- ✅ FR-AUTH-001: User Login
- ✅ FR-AUTH-002: Role-Based Access Control (RBAC)
- ❌ FR-AUTH-003: Multi-Factor Authentication (MFA)

**Employee Management (3/3)**
- ✅ FR-EMP-001: Employee Master Data
- ✅ FR-EMP-002: Employee Lifecycle Management
- ✅ FR-EMP-003: YTD Statutory Tracking

**Payroll (4/4)**
- ✅ FR-PAY-001: Malaysian Statutory Calculations
- ✅ FR-PAY-002: Payroll Processing Workflow
- ✅ FR-PAY-003: Payslip Management
- ✅ FR-PAY-004: Statutory Reports

**Leave Management (3/3)**
- ✅ FR-LEAVE-001: Leave Types and Entitlements
- ✅ FR-LEAVE-002: Leave Application Workflow
- ✅ FR-LEAVE-003: Leave Calendar and Balance

**Attendance (3/3)**
- ✅ FR-ATT-001: Clock In/Out System
- ✅ FR-ATT-002: Work From Home (WFH) Management
- ✅ FR-ATT-003: Attendance Reports

**Claims (3/3)**
- ✅ FR-CLAIM-001: Claim Types and Limits
- ✅ FR-CLAIM-002: Claims Submission Workflow
- ✅ FR-CLAIM-003: Claims Reports

**Communications (0/2)**
- ❌ FR-COMM-001: HR Memos
- ❌ FR-COMM-002: Company Policies Repository

**Finance & e-Invoice (0/4)**
- ❌ FR-FINV-001: e-Invoice Generation
- ❌ FR-FINV-002: LHDN MyInvois Integration
- ❌ FR-FINV-003: Digital Signature & QR Code
- ❌ FR-FINV-004: Invoice Status Management

---

## Next Enhancement Steps (Priority Order)

### Phase 1: Communications Module (High Priority) - **70% COMPLETE** ✅
**PRD Reference:** Section 3.7 - Internal Communications

- [x] **FR-COMM-001: HR Memos** <!-- id: 26 --> - **Backend 100% ✅, Frontend 40% 🚧**
  - [x] Backend: Memo API (CRUD, publish/draft, target audience) ✅
  - [ ] Frontend: Memo list component with filtering 🚧
  - [ ] Frontend: Memo creation/edit form 🚧
  - [ ] Frontend: Memo viewer for staff 🚧
  - [x] Feature: Rich text editor setup (models ready) ✅
  - [x] Feature: Read receipt tracking (backend ready) ✅
  - [ ] Feature: Notification on new memos (future)

- [x] **FR-COMM-002: Company Policies Repository** <!-- id: 27 --> - **Backend 100% ✅, Frontend 40% 🚧**
  - [x] Backend: Policy API (CRUD, versioning, categories) ✅
  - [ ] Frontend: Policy library/repository component 🚧
  - [ ] Frontend: Policy upload and management interface 🚧
  - [ ] Frontend: Policy viewer with version history 🚧
  - [x] Feature: Policy categories (HR, IT, Safety, etc.) ✅
  - [x] Feature: Policy acknowledgment tracking (backend ready) ✅
  - [ ] Feature: Search and filter policies 🚧
  - [x] Feature: Policy expiry/review date tracking ✅

**Communications Module Status:**
- ✅ Backend: 100% Complete (4 models, 15 API endpoints, database synced)
- 🚧 Frontend: 40% Complete (models, services, routes created; components need implementation)
- 📋 See `dev_resources/COMMUNICATIONS_MODULE_SUMMARY.md` for full details
- 📖 Implementation guide: `dev_resources/FRONTEND_IMPLEMENTATION_GUIDE.md`

### Phase 2: Security Enhancement (Medium Priority)
**PRD Reference:** Section 3.1.3 - Multi-Factor Authentication

- [ ] **FR-AUTH-003: Multi-Factor Authentication (MFA)** <!-- id: 28 -->
  - [ ] Backend: OTP generation and verification API
  - [ ] Backend: MFA settings per user (enable/disable)
  - [ ] Frontend: MFA setup page (QR code for authenticator app)
  - [ ] Frontend: OTP verification during login
  - [ ] Frontend: Backup codes generation and management
  - [ ] Feature: SMS OTP option (optional)
  - [ ] Feature: Email OTP option
  - [ ] Feature: Remember device for 30 days

### Phase 3: Finance & e-Invoice Module (High Priority)
**PRD Reference:** Section 3.8 - Finance & e-Invoice Management

- [ ] **FR-FINV-001: e-Invoice Generation** <!-- id: 29 -->
  - [ ] Backend: Invoice data model and CRUD API
  - [ ] Backend: Invoice numbering and versioning
  - [ ] Backend: PDF generation with company branding
  - [ ] Frontend: Invoice creation form
  - [ ] Frontend: Invoice list and management
  - [ ] Frontend: Invoice preview and download
  - [ ] Feature: Line items with calculations
  - [ ] Feature: Tax calculations (SST, Service Tax)
  - [ ] Feature: Multiple currency support (MYR primary)

- [ ] **FR-FINV-002: LHDN MyInvois Integration** <!-- id: 30 -->
  - [ ] Backend: LHDN API authentication and connection
  - [ ] Backend: Invoice submission to MyInvois portal
  - [ ] Backend: Status sync with LHDN
  - [ ] Backend: Error handling and retry mechanism
  - [ ] Frontend: MyInvois submission interface
  - [ ] Frontend: Submission status tracking
  - [ ] Feature: Validation before submission
  - [ ] Feature: Automatic retry on failure

- [ ] **FR-FINV-003: Digital Signature & QR Code** <!-- id: 31 -->
  - [ ] Backend: QR code generation with invoice hash
  - [ ] Backend: Digital signature implementation
  - [ ] Backend: Invoice validation endpoint
  - [ ] Frontend: QR code display on invoices
  - [ ] Frontend: QR code scanner for validation
  - [ ] Feature: Embedded invoice metadata in QR
  - [ ] Feature: Tamper detection

- [ ] **FR-FINV-004: Invoice Status Management** <!-- id: 32 -->
  - [ ] Backend: Invoice lifecycle workflow
  - [ ] Backend: Status update API (Draft, Sent, Paid, Cancelled)
  - [ ] Backend: Payment recording and reconciliation
  - [ ] Frontend: Invoice status dashboard
  - [ ] Frontend: Payment recording interface
  - [ ] Frontend: Invoice aging report
  - [ ] Feature: Automated reminders for overdue invoices
  - [ ] Feature: Invoice cancellation with LHDN notification

### Phase 4: Reporting & Analytics Enhancements
**PRD Reference:** Section 5 - Feature Specifications

- [ ] **Enhanced Reporting Dashboard** <!-- id: 33 -->
  - [ ] Payroll cost analysis by department/month
  - [ ] Leave utilization trends and forecasting
  - [ ] Attendance punctuality analytics
  - [ ] Claims spending analysis by type/department
  - [ ] Headcount and turnover reports
  - [ ] Statutory compliance reports (EPF, SOCSO, PCB)

### Phase 5: Additional Enhancements
**PRD Reference:** Section 11 - Future Enhancement Roadmap

- [ ] **Performance Management** (Future)
  - [ ] Goal setting and tracking
  - [ ] Performance review cycles
  - [ ] 360-degree feedback
  - [ ] KPI dashboard

- [ ] **Recruitment Module** (Future)
  - [ ] Job posting management
  - [ ] Applicant tracking system (ATS)
  - [ ] Interview scheduling
  - [ ] Offer letter generation

- [ ] **Learning Management** (Future)
  - [ ] Training course catalog
  - [ ] Course enrollment and tracking
  - [ ] Certificate management
  - [ ] Skill matrix tracking

---

## Current Sprint Focus

**Sprint Goal:** Implement Communications Module (Memos & Policies)

### Sprint Tasks:
1. Design database schema for memos and policies
2. Implement backend API for memo management
3. Implement backend API for policy management
4. Create frontend components for memo list and viewer
5. Create frontend components for policy repository
6. Add rich text editor integration
7. Implement file attachment support
8. Add notification system for new memos
9. Implement policy acknowledgment tracking
10. Testing and bug fixes

**Estimated Effort:** 2-3 weeks
**Dependencies:** None (standalone module)
**Risk:** Rich text editor integration may require additional libraries

---

## Technical Debt & Improvements

- [ ] Add comprehensive unit tests for all components
- [ ] Add integration tests for API endpoints
- [ ] Implement end-to-end testing with Cypress/Playwright
- [ ] Add error logging and monitoring (e.g., Sentry)
- [ ] Optimize database queries with proper indexing
- [ ] Add caching layer for frequently accessed data
- [ ] Implement API rate limiting
- [ ] Add comprehensive API documentation (Swagger/OpenAPI)
- [ ] Security audit and penetration testing
- [ ] Performance optimization and load testing
- [ ] Add accessibility (WCAG 2.1) compliance
- [ ] Mobile app development (React Native/Flutter)

---

## Notes

- All core HR modules (Employee, Payroll, Leave, Attendance, Claims) are fully functional
- WFH approval workflow recently completed
- Dynamic leave document upload implemented with type-specific requirements
- Next priority: Communications module to enable internal HR announcements and policy management
- e-Invoice module is critical for LHDN compliance but requires external API integration planning
