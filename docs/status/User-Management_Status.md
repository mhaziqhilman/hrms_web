# User Management Module - Implementation Documentation

> **Date:** February 9, 2026
> **Module:** User Management (Super Admin)
> **Status:** Complete
> **Access:** `super_admin` role only

---

## Overview

The User Management module provides super administrators with the ability to manage user accounts, assign roles, link users to employee records, and control account access. This module bridges the gap between the `users` table (authentication) and the `employees` table (HR records).

### Key Features
- List all user accounts with search, filter, and pagination
- Change user roles (super_admin, admin, manager, staff) via inline dropdown
- Activate/deactivate user accounts
- Link/unlink user accounts to employee records
- Admin password reset
- Role-based sidebar visibility (super_admin only)

---

## Backend Implementation

### Files Created

| File | Path | Description |
|------|------|-------------|
| Service | `HRMS-API_v1/src/services/userManagementService.js` | Core business logic - 8 service functions |
| Controller | `HRMS-API_v1/src/controllers/userManagementController.js` | Request handlers with error handling |
| Routes | `HRMS-API_v1/src/routes/userManagement.routes.js` | Express routes with validation |

### Files Modified

| File | Path | Change |
|------|------|--------|
| App Entry | `HRMS-API_v1/src/app.js` | Added route import and `app.use('/api/users', userManagementRoutes)` |

### API Endpoints

All endpoints require `verifyToken` + `requireRole(['super_admin'])`.

| Method | Endpoint | Description | Request Body |
|--------|----------|-------------|--------------|
| `GET` | `/api/users` | List users (paginated) | Query: `page`, `limit`, `search`, `role`, `is_active` |
| `GET` | `/api/users/:id` | Get single user | - |
| `GET` | `/api/users/unlinked-employees` | Get employees without user accounts | - |
| `PUT` | `/api/users/:id/role` | Change user role | `{ role: "admin" }` |
| `PUT` | `/api/users/:id/toggle-active` | Activate/deactivate | `{ is_active: true/false }` |
| `PUT` | `/api/users/:id/link-employee` | Link to employee record | `{ employee_id: 5 }` |
| `PUT` | `/api/users/:id/unlink-employee` | Remove employee link | - |
| `PUT` | `/api/users/:id/reset-password` | Admin password reset | `{ password: "newpass123" }` |

### Service Functions

```
userManagementService.js
├── getUsers({ page, limit, search, role, is_active })
│   └── Returns paginated users with linked employee data
├── getUserById(userId)
│   └── Returns single user with full employee association
├── updateUserRole(userId, newRole)
│   └── Validates role enum, updates user.role
├── toggleUserActive(userId, isActive)
│   └── Sets is_active, resets lockout if activating
├── linkUserToEmployee(userId, employeeId)
│   └── Sets employee.user_id, validates no duplicate links
├── unlinkUserFromEmployee(userId)
│   └── Sets employee.user_id = null
├── getUnlinkedEmployees()
│   └── Returns active employees where user_id IS NULL
└── resetUserPassword(userId, newPassword)
    └── Updates password (auto-hashed by beforeUpdate hook)
```

### Validation Rules

All routes use `express-validator`:
- `role` must be one of: `super_admin`, `admin`, `manager`, `staff`
- `is_active` must be boolean
- `employee_id` must be positive integer
- `password` must be at least 8 characters
- All `:id` params must be positive integers

### Business Rules

1. **Role Change:** Any valid role can be assigned. Confirmation dialog on frontend prevents accidental changes.
2. **Account Activation:** Activating a user resets `failed_login_attempts` to 0 and clears `locked_until`.
3. **Employee Linking:**
   - One user can only be linked to one employee (and vice versa)
   - Validates that the employee is not already linked to another user
   - Validates that the user is not already linked to another employee
4. **Unlinked Employees:** Only returns employees with `employment_status = 'Active'` and `user_id = NULL`.
5. **Password Reset:** Uses Sequelize `beforeUpdate` hook to auto-hash with bcrypt.

---

## Frontend Implementation

### Files Created

| File | Path | Description |
|------|------|-------------|
| Service | `HRMS_v1/src/app/features/user-management/services/user-management.service.ts` | Angular HTTP service with TypeScript interfaces |
| Component TS | `HRMS_v1/src/app/features/user-management/components/user-list/user-list.component.ts` | Main list component with all actions |
| Component HTML | `HRMS_v1/src/app/features/user-management/components/user-list/user-list.component.html` | Table UI, modals, filters |
| Component CSS | `HRMS_v1/src/app/features/user-management/components/user-list/user-list.component.css` | (empty - uses Tailwind) |
| Routes | `HRMS_v1/src/app/features/user-management/user-management.routes.ts` | Lazy-loaded feature routes |

### Files Modified

| File | Path | Change |
|------|------|--------|
| API Config | `HRMS_v1/src/app/core/config/api.config.ts` | Added `users` endpoint group |
| App Routes | `HRMS_v1/src/app/app.routes.ts` | Added `user-management` lazy route |
| Main Layout TS | `HRMS_v1/src/app/shared/layouts/main-layout/main-layout.component.ts` | Added "User Management" sidebar item + `isItemVisible()` method |
| Main Layout HTML | `HRMS_v1/src/app/shared/layouts/main-layout/main-layout.component.html` | Systems group items now role-filtered |

### TypeScript Interfaces

```typescript
interface UserRecord {
  id: number;
  email: string;
  role: 'super_admin' | 'admin' | 'manager' | 'staff';
  is_active: boolean;
  failed_login_attempts: number;
  locked_until: string | null;
  last_login_at: string | null;
  created_at: string;
  updated_at: string;
  employee: UserEmployee | null;
}

interface UserEmployee {
  id: number;
  employee_id: string;
  full_name: string;
  position: string;
  department: string;
  employment_status: string;
}

interface UnlinkedEmployee {
  id: number;
  employee_id: string;
  full_name: string;
  position: string;
  department: string;
  email: string;
}
```

### UI Components & Features

#### User List Table
- **Columns:** User (avatar + email), Role, Linked Employee, Status, Last Login, Actions
- **Sorting:** Click column headers to sort by email, role, status, last login
- **Pagination:** Previous/Next with page numbers

#### Filters
- **Search:** Filter by email (real-time)
- **Role Filter:** Dropdown for super_admin / admin / manager / staff
- **Active Status:** Dropdown for Active / Inactive
- **Reset:** Clear all filters button

#### Inline Role Change
- Click on the role badge in the table row
- Dropdown menu appears with all 4 roles
- Current role shown with a checkmark
- Confirmation dialog before applying change

#### Toggle Active/Inactive
- Available in the "More Actions" (ellipsis) menu per row
- Confirmation dialog with warning about login access
- Deactivated users shown with red "Inactive" badge

#### Link Employee Modal
- Triggered by the link icon button on unlinked user rows
- Shows list of active employees without user accounts
- Searchable by name, employee ID, or department
- Click an employee to link them

#### Unlink Employee
- Triggered by the unlink icon button on linked user rows
- Confirmation dialog showing both user email and employee name

#### Reset Password Modal
- Available in the "More Actions" menu per row
- Input field with minimum 8 character validation
- Inline validation message shown

### Sidebar Navigation

```
Systems
├── User Management  ← NEW (super_admin only)
└── Settings
    ├── Account
    ├── Appearance
    ├── Notifications
    └── Display
```

The `isItemVisible()` method on `MainLayoutComponent` checks `item.roles` against `currentUser.role`. Items without `roles` are visible to all users.

### Route Configuration

```
/user-management → UserListComponent (lazy-loaded)
```

Protected by `authGuard` at the layout level. Backend additionally enforces `super_admin` role on all API endpoints.

---

## API Config Endpoints

```typescript
users: {
  base: '/users',
  detail: (id: number) => `/users/${id}`,
  updateRole: (id: number) => `/users/${id}/role`,
  toggleActive: (id: number) => `/users/${id}/toggle-active`,
  linkEmployee: (id: number) => `/users/${id}/link-employee`,
  unlinkEmployee: (id: number) => `/users/${id}/unlink-employee`,
  resetPassword: (id: number) => `/users/${id}/reset-password`,
  unlinkedEmployees: '/users/unlinked-employees'
}
```

---

## Database Dependencies

### Tables Used
- `users` - User accounts (read/update)
- `employees` - Employee records (read/update `user_id` column)

### Key Relationships
```
Employee.belongsTo(User, { foreignKey: 'user_id', as: 'user' })
User.hasOne(Employee, { foreignKey: 'user_id', as: 'employee' })
```

### Column: `employees.user_id`
- Type: `INTEGER`, nullable, unique
- FK → `users.id`
- This is the bridge between authentication and HR records
- Managed exclusively through the User Management module

---

## Security

- All API endpoints restricted to `super_admin` role via `requireRole(['super_admin'])`
- JWT token required for all requests via `verifyToken` middleware
- Password hashing handled by Sequelize `beforeUpdate` hook (bcrypt, 10 rounds)
- Sidebar item hidden from non-super_admin users via `isItemVisible()` check
- Input validation on all endpoints via `express-validator`
- User's own `toJSON()` method excludes `password` and `remember_token` from API responses

---

## Testing Checklist

- [ ] List users with pagination
- [ ] Search users by email
- [ ] Filter by role
- [ ] Filter by active status
- [ ] Change user role (all 4 roles)
- [ ] Activate a deactivated user
- [ ] Deactivate an active user
- [ ] Link user to unlinked employee
- [ ] Unlink user from employee
- [ ] Reset user password
- [ ] Verify non-super_admin cannot access `/user-management` page
- [ ] Verify non-super_admin cannot see sidebar item
- [ ] Verify non-super_admin gets 403 on API endpoints
- [ ] Verify employee link uniqueness (no double-linking)
