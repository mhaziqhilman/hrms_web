# Company Creation Role Gate — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restrict creating an *additional* company to `admin`/`super_admin` users (invited `staff`/`manager` are blocked), while any first-time user can still create their first company — enforced on both the API and the Angular client.

**Architecture:** A backend Express middleware (`requireCanCreateCompany`) guards `POST /api/company/setup`, placed *before* the existing (inert) `enforceLimit` plan-limit guard. On the client, a single source-of-truth method `AuthService.canCreateCompany()` drives both a route guard (`canCreateCompanyGuard` on `/onboarding/setup`) and the onboarding-choice screen (Create card vs. a "contact your admin" notice). No database changes.

**Tech Stack:** Backend — Node.js/Express, Sequelize, Jest + Supertest (`HRMS-API_v1/`). Frontend — Angular 21 standalone, functional guards, Vitest via `ng test`, ZardUI (`HRMS_v1/`).

## Global Constraints

- **Two separate git repos:** run backend `git`/`npm` from `HRMS-API_v1/`, frontend from `HRMS_v1/`. There is **no** repo at the `Codes/` parent.
- **The eligibility rule is fixed and identical on both tiers** (spec §5): `super_admin` → allow; **0 active memberships** → allow (first company); else active role `admin` → allow; `manager`/`staff` → deny.
- **First-company detection is by membership, never by role** — a fresh signup defaults to `role: 'staff'` (`HRMS-API_v1/src/controllers/authController.js:73`), so a role-only gate would lock out new users.
- **Do NOT touch** the existing `enforceLimit('max_companies', countOwnedCompanies)` on `/setup`, the `requireFeature('multi_company')` guards, the invitation flow, or `companyService.createCompany`. Phase 2 (billing) stays a pure config flip.
- **No migrations, no new DB columns.**
- **Membership signal:** `UserCompany.count({ where: { user_id, status: 'active' } })`. `status` defaults to `'active'` and is the same filter used by `getUserCompanies` (`HRMS-API_v1/src/services/companyService.js:150`).
- **Error code:** backend rejects with HTTP `403` and body `{ success: false, code: 'CREATE_COMPANY_FORBIDDEN', message }` — distinct from the Phase-2 `LIMIT_REACHED`.
- **Spec reference:** `HRMS_v1/docs/superpowers/specs/2026-07-16-company-creation-role-gate-design.md`.

---

## File Structure

| File | Repo | Responsibility | Change |
|------|------|----------------|--------|
| `src/middleware/packageMiddleware.js` | HRMS-API_v1 | Add `requireCanCreateCompany`; extend the `../models` import with `UserCompany`; export the new guard. | Modify |
| `src/routes/company.routes.js` | HRMS-API_v1 | Import + mount `requireCanCreateCompany` on `/setup` before `enforceLimit`. | Modify |
| `tests/unit/requireCanCreateCompany.test.js` | HRMS-API_v1 | Jest unit tests for the middleware decision table. | Create |
| `src/app/core/services/auth.service.ts` | HRMS_v1 | Add `canCreateCompany(): boolean` (single source of truth). | Modify |
| `src/app/core/services/auth.canCreateCompany.spec.ts` | HRMS_v1 | Vitest tests for `canCreateCompany()`. | Create |
| `src/app/core/guards/auth.guard.ts` | HRMS_v1 | Add `canCreateCompanyGuard`. | Modify |
| `src/app/core/guards/can-create-company.guard.spec.ts` | HRMS_v1 | Vitest tests for the guard's branching. | Create |
| `src/app/features/onboarding/onboarding.routes.ts` | HRMS_v1 | Apply `canCreateCompanyGuard` to the `setup` route. | Modify |
| `src/app/features/onboarding/components/onboarding-choice/onboarding-choice.component.ts` | HRMS_v1 | Compute `canCreateCompany` from `AuthService`. | Modify |
| `src/app/features/onboarding/components/onboarding-choice/onboarding-choice.component.html` | HRMS_v1 | Render Create card when eligible, notice otherwise. | Modify |
| `src/app/features/onboarding/components/company-setup-wizard/company-setup-wizard.component.ts` | HRMS_v1 | Handle `CREATE_COMPANY_FORBIDDEN` on submit. | Modify |

---

## Task 1: Backend middleware `requireCanCreateCompany` + route wiring

**Files:**
- Create: `HRMS-API_v1/tests/unit/requireCanCreateCompany.test.js`
- Modify: `HRMS-API_v1/src/middleware/packageMiddleware.js` (line 79 import; add function; add export at the `module.exports` block)
- Modify: `HRMS-API_v1/src/routes/company.routes.js` (import line 6; `/setup` route ~line 28-48)

**Interfaces:**
- Produces: `requireCanCreateCompany(req, res, next)` — async Express middleware. Calls `next()` when allowed; sends `403 { success:false, code:'CREATE_COMPANY_FORBIDDEN', message }` when denied; `next(error)` on failure. Reads `req.user.id` and `req.user.role`.
- Consumes: `UserCompany.count` from `../models`; `req.user` populated by `verifyToken`.

- [ ] **Step 1: Write the failing test**

Create `HRMS-API_v1/tests/unit/requireCanCreateCompany.test.js`:

```js
// Unit tests for the Phase-1 company-creation role gate.
// Models + subscriptionService are mocked so the middleware is tested in isolation (no DB).
jest.mock('../../src/models', () => ({
  UserCompany: { count: jest.fn() },
  Company: {},
  Employee: {},
}));
jest.mock('../../src/services/subscriptionService', () => ({}));

const { UserCompany } = require('../../src/models');
const { requireCanCreateCompany } = require('../../src/middleware/packageMiddleware');

const mockRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe('requireCanCreateCompany', () => {
  beforeEach(() => jest.clearAllMocks());

  it('allows super_admin without checking memberships', async () => {
    const req = { user: { id: 1, role: 'super_admin' } };
    const res = mockRes();
    const next = jest.fn();
    await requireCanCreateCompany(req, res, next);
    expect(next).toHaveBeenCalledWith();
    expect(UserCompany.count).not.toHaveBeenCalled();
  });

  it('allows a user with zero active memberships (first company)', async () => {
    UserCompany.count.mockResolvedValue(0);
    const req = { user: { id: 2, role: 'staff' } };
    const res = mockRes();
    const next = jest.fn();
    await requireCanCreateCompany(req, res, next);
    expect(next).toHaveBeenCalledWith();
  });

  it('allows an admin who already has a company (additional company)', async () => {
    UserCompany.count.mockResolvedValue(1);
    const req = { user: { id: 3, role: 'admin' } };
    const res = mockRes();
    const next = jest.fn();
    await requireCanCreateCompany(req, res, next);
    expect(next).toHaveBeenCalledWith();
  });

  it('rejects a staff invitee who already has a company', async () => {
    UserCompany.count.mockResolvedValue(1);
    const req = { user: { id: 4, role: 'staff' } };
    const res = mockRes();
    const next = jest.fn();
    await requireCanCreateCompany(req, res, next);
    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ success: false, code: 'CREATE_COMPANY_FORBIDDEN' })
    );
    expect(next).not.toHaveBeenCalled();
  });

  it('rejects a manager invitee who already has a company', async () => {
    UserCompany.count.mockResolvedValue(2);
    const req = { user: { id: 5, role: 'manager' } };
    const res = mockRes();
    const next = jest.fn();
    await requireCanCreateCompany(req, res, next);
    expect(res.status).toHaveBeenCalledWith(403);
    expect(next).not.toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `cd HRMS-API_v1 && npx jest tests/unit/requireCanCreateCompany.test.js`
Expected: FAIL — `requireCanCreateCompany` is `undefined` (not exported yet), e.g. `TypeError: requireCanCreateCompany is not a function`.

- [ ] **Step 3: Add `UserCompany` to the models import**

In `HRMS-API_v1/src/middleware/packageMiddleware.js`, line 79 currently reads:

```js
const { Company, Employee } = require('../models');
```

Change it to:

```js
const { Company, Employee, UserCompany } = require('../models');
```

- [ ] **Step 4: Implement the middleware**

In `HRMS-API_v1/src/middleware/packageMiddleware.js`, add this function just below the `countEmployeesInActiveCompany` resolver (before `module.exports`):

```js
/**
 * Phase-1 company-creation role gate. ALWAYS active (not billing-gated).
 *
 * Rule (spec §5): super_admin allowed; a user with zero active company
 * memberships is creating their FIRST company (allowed); a user who already
 * belongs to a company may create another ONLY if their active role is 'admin'.
 * manager/staff → 403 CREATE_COMPANY_FORBIDDEN.
 */
const requireCanCreateCompany = async (req, res, next) => {
  try {
    if (req.user.role === 'super_admin') return next();

    const memberships = await UserCompany.count({
      where: { user_id: req.user.id, status: 'active' }
    });
    if (memberships === 0) return next(); // first company — always allowed

    if (req.user.role === 'admin') return next(); // owner/admin adding another

    return res.status(403).json({
      success: false,
      code: 'CREATE_COMPANY_FORBIDDEN',
      message: 'Only company owners or admins can create additional companies. '
             + 'Ask your company admin to invite you, or switch to a company you administer.'
    });
  } catch (error) {
    return next(error);
  }
};
```

Then add it to the exports. The `module.exports` block currently is:

```js
module.exports = {
  requireFeature,
  enforceLimit,
  countOwnedCompanies,
  countEmployeesInActiveCompany
};
```

Change it to:

```js
module.exports = {
  requireFeature,
  enforceLimit,
  countOwnedCompanies,
  countEmployeesInActiveCompany,
  requireCanCreateCompany
};
```

- [ ] **Step 5: Run the test to verify it passes**

Run: `cd HRMS-API_v1 && npx jest tests/unit/requireCanCreateCompany.test.js`
Expected: PASS — 5 passing tests.

- [ ] **Step 6: Wire the middleware onto the `/setup` route**

In `HRMS-API_v1/src/routes/company.routes.js`, line 6 currently reads:

```js
const { requireFeature, enforceLimit, countOwnedCompanies } = require('../middleware/packageMiddleware');
```

Change it to:

```js
const { requireFeature, enforceLimit, countOwnedCompanies, requireCanCreateCompany } = require('../middleware/packageMiddleware');
```

Then in the `POST /setup` route (around line 28), add `requireCanCreateCompany` **immediately after `verifyToken` and before `enforceLimit`**:

```js
router.post(
  '/setup',
  verifyToken,
  requireCanCreateCompany,
  enforceLimit('max_companies', countOwnedCompanies),
  [
    body('company.name').notEmpty().withMessage('Company name is required'),
    // ...all existing validators unchanged...
    validate
  ],
  companyController.setupCompany
);
```

Leave every validator and `companyController.setupCompany` exactly as-is.

- [ ] **Step 7: Verify the app still boots and the route file loads**

Run: `cd HRMS-API_v1 && node -e "require('./src/routes/company.routes.js'); console.log('routes OK')"`
Expected: prints `routes OK` with no throw (confirms the import/wiring has no syntax or resolution error).

- [ ] **Step 8: Commit**

```bash
cd HRMS-API_v1
git add src/middleware/packageMiddleware.js src/routes/company.routes.js tests/unit/requireCanCreateCompany.test.js
git commit -m "feat(company): gate additional-company creation to admins (Phase 1 role gate)"
```

---

## Task 2: `AuthService.canCreateCompany()` — client source of truth

**Files:**
- Create: `HRMS_v1/src/app/core/services/auth.canCreateCompany.spec.ts`
- Modify: `HRMS_v1/src/app/core/services/auth.service.ts` (add method near `hasAnyRole`, ~line 265)

**Interfaces:**
- Consumes: existing `AuthService.hasCompany(): boolean` (line 225) and `AuthService.hasAnyRole(roles: string[]): boolean` (line 262).
- Produces: `AuthService.canCreateCompany(): boolean` — `true` when the user has no company yet OR holds an `admin`/`super_admin` active role. Used by Task 3 (guard) and Task 4 (component).

- [ ] **Step 1: Write the failing test**

Create `HRMS_v1/src/app/core/services/auth.canCreateCompany.spec.ts`:

```ts
import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { Router } from '@angular/router';
import { AuthService } from './auth.service';

describe('AuthService.canCreateCompany', () => {
  let service: AuthService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: Router, useValue: { navigate: vi.fn() } },
      ],
    });
    service = TestBed.inject(AuthService);
  });

  it('allows a user with no company (first company), regardless of role', () => {
    vi.spyOn(service, 'hasCompany').mockReturnValue(false);
    vi.spyOn(service, 'hasAnyRole').mockReturnValue(false);
    expect(service.canCreateCompany()).toBe(true);
  });

  it('allows a user who has a company and is admin/super_admin', () => {
    vi.spyOn(service, 'hasCompany').mockReturnValue(true);
    vi.spyOn(service, 'hasAnyRole').mockReturnValue(true);
    expect(service.canCreateCompany()).toBe(true);
  });

  it('blocks a user who has a company and is not admin/super_admin', () => {
    vi.spyOn(service, 'hasCompany').mockReturnValue(true);
    vi.spyOn(service, 'hasAnyRole').mockReturnValue(false);
    expect(service.canCreateCompany()).toBe(false);
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `cd HRMS_v1 && npx ng test --include=src/app/core/services/auth.canCreateCompany.spec.ts --watch=false`
Expected: FAIL — `service.canCreateCompany is not a function`.

- [ ] **Step 3: Implement the method**

In `HRMS_v1/src/app/core/services/auth.service.ts`, immediately after `hasAnyRole` (ends ~line 265), add:

```ts
  /**
   * Can this user create a company?
   * First company (no active company) is always allowed; creating an
   * ADDITIONAL company requires an admin / super_admin active role.
   */
  canCreateCompany(): boolean {
    return !this.hasCompany() || this.hasAnyRole(['admin', 'super_admin']);
  }
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `cd HRMS_v1 && npx ng test --include=src/app/core/services/auth.canCreateCompany.spec.ts --watch=false`
Expected: PASS — 3 passing tests.

- [ ] **Step 5: Commit**

```bash
cd HRMS_v1
git add src/app/core/services/auth.service.ts src/app/core/services/auth.canCreateCompany.spec.ts
git commit -m "feat(auth): add canCreateCompany() eligibility helper"
```

---

## Task 3: `canCreateCompanyGuard` + apply to the setup route

**Files:**
- Create: `HRMS_v1/src/app/core/guards/can-create-company.guard.spec.ts`
- Modify: `HRMS_v1/src/app/core/guards/auth.guard.ts` (add guard after `onboardingGuard`, ~line 68)
- Modify: `HRMS_v1/src/app/features/onboarding/onboarding.routes.ts` (import + `setup` route)

**Interfaces:**
- Consumes: `AuthService.getCurrentUserValue()`, `AuthService.canCreateCompany()` (Task 2), the existing `loginRoute()` helper in `auth.guard.ts` (line 6).
- Produces: `canCreateCompanyGuard: CanActivateFn` — returns `true` when eligible; navigates to `/dashboard` and returns `false` when a logged-in user is ineligible; navigates to the login route and returns `false` when there is no current user.

- [ ] **Step 1: Write the failing test**

Create `HRMS_v1/src/app/core/guards/can-create-company.guard.spec.ts`:

```ts
import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { canCreateCompanyGuard } from './auth.guard';
import { AuthService } from '../services/auth.service';

describe('canCreateCompanyGuard', () => {
  let authService: { getCurrentUserValue: any; canCreateCompany: any };
  let router: { navigate: any };

  const run = () =>
    TestBed.runInInjectionContext(() =>
      canCreateCompanyGuard(null as any, null as any)
    );

  beforeEach(() => {
    authService = { getCurrentUserValue: vi.fn(), canCreateCompany: vi.fn() };
    router = { navigate: vi.fn() };
    TestBed.configureTestingModule({
      providers: [
        { provide: AuthService, useValue: authService },
        { provide: Router, useValue: router },
      ],
    });
  });

  it('allows an eligible user', () => {
    authService.getCurrentUserValue.mockReturnValue({ id: 1, role: 'admin' });
    authService.canCreateCompany.mockReturnValue(true);
    expect(run()).toBe(true);
    expect(router.navigate).not.toHaveBeenCalled();
  });

  it('blocks an ineligible user and redirects to dashboard', () => {
    authService.getCurrentUserValue.mockReturnValue({ id: 2, role: 'staff' });
    authService.canCreateCompany.mockReturnValue(false);
    expect(run()).toBe(false);
    expect(router.navigate).toHaveBeenCalledWith(['/dashboard']);
  });

  it('redirects to login when there is no current user', () => {
    authService.getCurrentUserValue.mockReturnValue(null);
    expect(run()).toBe(false);
    expect(router.navigate).toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `cd HRMS_v1 && npx ng test --include=src/app/core/guards/can-create-company.guard.spec.ts --watch=false`
Expected: FAIL — `canCreateCompanyGuard` is not exported / undefined.

- [ ] **Step 3: Implement the guard**

In `HRMS_v1/src/app/core/guards/auth.guard.ts`, add after the `onboardingGuard` definition (after line 68):

```ts
/**
 * Can-Create-Company Guard
 * Guards /onboarding/setup. First company (no active company) is always
 * allowed; an ADDITIONAL company requires an admin / super_admin role.
 * Ineligible logged-in users are sent to the dashboard.
 */
export const canCreateCompanyGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  const user = authService.getCurrentUserValue();
  if (!user) {
    router.navigate([loginRoute()]);
    return false;
  }

  if (authService.canCreateCompany()) {
    return true;
  }

  router.navigate(['/dashboard']);
  return false;
};
```

(`inject`, `Router`, `CanActivateFn`, `AuthService`, and `loginRoute` are already imported at the top of this file.)

- [ ] **Step 4: Run the test to verify it passes**

Run: `cd HRMS_v1 && npx ng test --include=src/app/core/guards/can-create-company.guard.spec.ts --watch=false`
Expected: PASS — 3 passing tests.

- [ ] **Step 5: Apply the guard to the `setup` route**

In `HRMS_v1/src/app/features/onboarding/onboarding.routes.ts`, add the import at the top:

```ts
import { canCreateCompanyGuard } from '../../core/guards/auth.guard';
```

Then change the `setup` route line from:

```ts
  { path: 'setup', component: CompanySetupWizardComponent },
```

to:

```ts
  { path: 'setup', component: CompanySetupWizardComponent, canActivate: [canCreateCompanyGuard] },
```

Leave `''` (choice) and `waiting` unguarded — invitees must still reach the choice and waiting screens.

- [ ] **Step 6: Verify the frontend build compiles**

Run: `cd HRMS_v1 && npx ng build --configuration development`
Expected: build succeeds (exit code 0), no TS errors referencing `canCreateCompanyGuard`.

- [ ] **Step 7: Commit**

```bash
cd HRMS_v1
git add src/app/core/guards/auth.guard.ts src/app/core/guards/can-create-company.guard.spec.ts src/app/features/onboarding/onboarding.routes.ts
git commit -m "feat(onboarding): guard /onboarding/setup by company-creation eligibility"
```

---

## Task 4: Onboarding-choice — show Create card only when eligible

**Files:**
- Modify: `HRMS_v1/src/app/features/onboarding/components/onboarding-choice/onboarding-choice.component.ts`
- Modify: `HRMS_v1/src/app/features/onboarding/components/onboarding-choice/onboarding-choice.component.html`

**Interfaces:**
- Consumes: `AuthService.canCreateCompany()` (Task 2), existing `hasExistingCompany` field.
- Produces: `canCreateCompany: boolean` field bound in the template.

This task is UI/template work verified by build + manual check (matching this codebase's frontend verification style); the underlying boolean is already unit-tested in Task 2.

- [ ] **Step 1: Add the `canCreateCompany` field**

In `onboarding-choice.component.ts`, add the field beside `hasExistingCompany` (line 24):

```ts
  hasExistingCompany = false;
  canCreateCompany = false;
```

In the constructor, after `this.hasExistingCompany = this.authService.hasCompany();` (line 31), add:

```ts
    this.canCreateCompany = this.authService.canCreateCompany();
```

- [ ] **Step 2: Update the template to branch on eligibility**

In `onboarding-choice.component.html`, replace the Create Company card block (lines 23-43, the `<!-- Create Company Card -->` comment through its closing `</z-card>`) with:

```html
      <!-- Create Company Card (only when the user may create a company) -->
      @if (canCreateCompany) {
        <z-card
          class="border shadow-lg cursor-pointer transition-all hover:border-primary hover:shadow-xl group"
          (click)="createCompany()"
        >
          <div z-card-content class="p-8 text-center">
            <div class="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-6 group-hover:bg-primary/20 transition-colors">
              <z-icon [zType]="$any('building-2')" class="w-8 h-8 text-primary" />
            </div>
            <h2 class="text-xl font-medium text-foreground mb-3">
              {{ hasExistingCompany ? 'Create New Company' : 'Create a Company' }}
            </h2>
            <p class="text-sm text-muted-foreground mb-6">
              Set up your company profile and start managing your team with our HRMS platform.
            </p>
            <button z-button type="button" zFull>
              <span>Get Started</span>
              <z-icon [zType]="$any('arrow-right')" class="w-4 h-4 ml-2" />
            </button>
          </div>
        </z-card>
      } @else {
        <!-- Ineligible (staff/manager with an existing company): explain instead of offering creation -->
        <z-card class="border shadow-lg">
          <div z-card-content class="p-8 text-center">
            <div class="mx-auto w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-6">
              <z-icon [zType]="$any('lock')" class="w-8 h-8 text-muted-foreground" />
            </div>
            <h2 class="text-xl font-medium text-foreground mb-3">Company creation is admin-only</h2>
            <p class="text-sm text-muted-foreground mb-6">
              Only company owners or admins can create additional companies. If you need your own
              workspace, ask an admin to invite you or grant you admin access.
            </p>
          </div>
        </z-card>
      }
```

Leave the "Wait for Invitation" card (`@if (!hasExistingCompany)`) and the footer actions unchanged.

- [ ] **Step 3: Verify the build compiles**

Run: `cd HRMS_v1 && npx ng build --configuration development`
Expected: build succeeds (exit code 0).

- [ ] **Step 4: Manual visual check**

Confirm the `lock` icon exists in the ZardUI icon set. If `lock` is not available, substitute an available icon (e.g. `shield` or `info`) — grep the icon registry: `cd HRMS_v1 && grep -rl "'lock'" src/app/shared/components/icon` (or open the icon component's type list). Use whichever lock-like icon is registered.

Then run the dev server (`cd HRMS_v1 && npx ng serve`) and verify by logging in as:
- a brand-new account (no company) → "Create a Company" card shows.
- a staff invitee viewing `/onboarding/choice` (via command palette "Switch Company" when in multiple companies) → the admin-only notice shows, no Create card.

- [ ] **Step 5: Commit**

```bash
cd HRMS_v1
git add src/app/features/onboarding/components/onboarding-choice/onboarding-choice.component.ts src/app/features/onboarding/components/onboarding-choice/onboarding-choice.component.html
git commit -m "feat(onboarding): hide Create Company card from ineligible users"
```

---

## Task 5: Setup wizard — handle `CREATE_COMPANY_FORBIDDEN` on submit

**Files:**
- Modify: `HRMS_v1/src/app/features/onboarding/components/company-setup-wizard/company-setup-wizard.component.ts`

**Interfaces:**
- Consumes: the backend `403 { code: 'CREATE_COMPANY_FORBIDDEN', message }` from Task 1, via the existing setup HTTP call's error branch.
- Produces: user-facing handling — show the server message and redirect to `/dashboard` — so a client that reaches submit despite the guard (e.g. role changed after page load) fails gracefully rather than showing a generic error.

- [ ] **Step 1: Locate the submit error handler**

Run: `cd HRMS_v1 && grep -n "error" src/app/features/onboarding/components/company-setup-wizard/company-setup-wizard.component.ts`
Identify the `.subscribe({ ... error: (err) => { ... } })` (or `catchError`) block that handles the company-setup API response. Note the exact variable name used for the error (e.g. `err` / `error`) and how the component currently surfaces messages (toast service, an inline `errorMessage` signal/field, etc.).

- [ ] **Step 2: Add a specific branch for the forbidden code**

At the **start** of that existing error handler, before the current generic handling, insert a branch that matches the code from either `err.error?.code` (HttpErrorResponse shape) and routes back to the dashboard. Use the component's existing message mechanism (replace `this.showError(...)` and `this.router` below with whatever the component already uses — do not introduce a new toast system):

```ts
        const code = err?.error?.code;
        if (code === 'CREATE_COMPANY_FORBIDDEN') {
          // Guard should prevent reaching here; handle race (role changed after load).
          this.showError(err.error?.message || 'You are not allowed to create a company.');
          this.router.navigate(['/dashboard']);
          return;
        }
```

If the component does not already inject `Router`, add `private router: Router` to its constructor and import `Router` from `@angular/router`. If it has no `showError`/message helper, reuse the exact pattern already present in this file for displaying the generic setup error (mirror it — do not invent a new one).

- [ ] **Step 3: Verify the build compiles**

Run: `cd HRMS_v1 && npx ng build --configuration development`
Expected: build succeeds (exit code 0).

- [ ] **Step 4: Commit**

```bash
cd HRMS_v1
git add src/app/features/onboarding/components/company-setup-wizard/company-setup-wizard.component.ts
git commit -m "feat(onboarding): handle CREATE_COMPANY_FORBIDDEN on setup submit"
```

---

## Task 6: End-to-end verification matrix

**Files:** none (verification only).

Run the backend (`cd HRMS-API_v1 && npm run dev`) and frontend (`cd HRMS_v1 && npx ng serve`) together, then walk the matrix. This confirms the two tiers agree and nothing regressed.

- [ ] **Step 1: New user → first company (allow)**

Register a brand-new account, verify email, reach `/onboarding` → Create card visible → complete the wizard → company created, you become `admin`. Expected: success.

- [ ] **Step 2: Admin/owner → additional company (allow)**

As the account from Step 1 (now `admin`), open the command palette → nothing blocks; navigate to `/onboarding/setup` directly → wizard loads → create a second company. Expected: success.

- [ ] **Step 3: Staff invitee → blocked (UX)**

Log in as a `staff` user who belongs to a company. Navigate to `/onboarding/setup` directly in the URL bar. Expected: redirected to `/dashboard` (guard). On `/onboarding/choice` (if reachable via "Switch Company"), the admin-only notice shows instead of a Create card.

- [ ] **Step 4: Staff invitee → blocked (API, authoritative)**

With the staff user's JWT, call the API directly:

```bash
curl -i -X POST "$API_BASE/api/company/setup" \
  -H "Authorization: Bearer <staff_jwt>" \
  -H "Content-Type: application/json" \
  -d '{"company":{"name":"Sneaky Co"}}'
```

Expected: `HTTP/1.1 403` with body `{"success":false,"code":"CREATE_COMPANY_FORBIDDEN", ...}`.

- [ ] **Step 5: Regression — super_admin unaffected**

Log in as `admin@nextura.com` (super_admin). Confirm company creation still works and nothing about company switching / clear-context changed.

- [ ] **Step 6: Run the full backend unit suite**

Run: `cd HRMS-API_v1 && npm test`
Expected: the new `requireCanCreateCompany` suite passes (5 tests); no other suite breaks.

---

## Self-Review

**Spec coverage** (spec §2 goals → tasks):
- G1 (first company always allowed) → Task 1 Step 4 (`memberships === 0`), Task 2 (`!hasCompany()`), Task 3 guard, Task 6 Step 1. ✅
- G2 (additional company admin/super_admin only) → Task 1, Task 2, Task 3, Task 6 Steps 2/3. ✅
- G3 (manager/staff never see/reach/invoke) → Task 3 (guard redirect), Task 4 (hide card), Task 1 (API 403), Task 6 Steps 3/4. ✅
- G4 (enforced both tiers) → backend Task 1 + frontend Tasks 3-4. ✅
- G5 (plan-limit barrier untouched) → Task 1 Step 6 inserts *before* `enforceLimit`, leaves it intact; Global Constraints forbid touching it. ✅
- Spec §7.3 (wizard submit error handling) → Task 5. ✅
- Spec §10 testing plan → Tasks 1-3 unit tests + Task 6 E2E matrix. ✅

**Placeholder scan:** No "TBD/TODO". Task 5 intentionally references the component's *existing* message mechanism rather than inventing one — Step 1 makes the implementer read it first, and gives the exact branch code; this is adaptation to unknown local code, not a placeholder.

**Type/name consistency:** `requireCanCreateCompany(req,res,next)`, `CREATE_COMPANY_FORBIDDEN`, `canCreateCompany()`, `canCreateCompanyGuard` are used identically across Tasks 1-5. Backend membership filter `{ status: 'active' }` matches `getUserCompanies`. Guard/component both consume `AuthService.canCreateCompany()` (defined once in Task 2 — DRY).

**No migrations, no billing changes** — confirmed against Global Constraints.
