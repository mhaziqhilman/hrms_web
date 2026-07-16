# Company Creation Role Gate — Design Spec

**Date:** 2026-07-16
**Status:** Approved for implementation (Phase 1)
**Author:** Brainstorming session (Haziq + Claude)

---

## 1. Problem

Today, **any authenticated user can create an unlimited number of companies**, regardless of
their role. The "Create a Company" card on the onboarding screen is shown to everyone, and
there is no server-side restriction on who may call `POST /api/company/setup` beyond
authentication.

This is wrong for a multi-tenant HRMS:

- An employee invited into a company as **staff** or **manager** should not be nudged to spin
  up their own separate organization from inside the product.
- There is no differentiation of "point of view" between an org **owner/admin** and an ordinary
  **staff** member when it comes to creating tenants.
- Company creation should eventually be governed by the **subscription plan** (how many companies
  a customer may own), but that billing layer is not yet live.

We want to introduce a **role/ownership barrier now** (no billing dependency), and keep the
**plan-limit barrier** ready to switch on later.

## 2. Goals

- **G1.** A brand-new user (no company yet) can always create their **first** company.
- **G2.** Creating an **additional** company is allowed **only** for users whose active role is
  `admin` or `super_admin`.
- **G3.** Users whose active role is `manager` or `staff` (i.e. pure invitees) never see, reach,
  or can invoke the "Create Company" flow for an additional company.
- **G4.** The barrier is enforced on **both** the frontend (UX: hide/redirect) and the backend
  (authoritative: reject the API call) so it cannot be bypassed by deep-linking or direct POST.
- **G5.** Nothing about the existing **plan-limit** barrier (`enforceLimit('max_companies', …)`)
  is removed or altered — Phase 2 remains a pure configuration flip.

## 3. Non-Goals

- **NG1.** No billing/subscription enforcement in this phase. `PACKAGE_ENFORCEMENT` stays `false`;
  Basic tier keeps `max_companies: -1`.
- **NG2.** No change to the invitation flow, company switching, or multi-company feature gating
  (`requireFeature('multi_company')`).
- **NG3.** No new database columns or migrations.
- **NG4.** No change to how a founder is promoted to `admin` on first company creation.

## 4. Key Facts About the Current System

These facts drive the design and were verified against the codebase:

| Fact | Source | Implication |
|------|--------|-------------|
| A fresh signup defaults to `role: 'staff'` with `company_id: null`. | `HRMS-API_v1/src/controllers/authController.js:73` | **The gate cannot be role-only** — a first-time user is `staff`. First-company creation must be allowed by an *absence-of-membership* signal, not by role. |
| Creating the first company promotes a non-super_admin owner to `role: 'admin'` and sets their `company_id`. | `HRMS-API_v1/src/services/companyService.js:33-44` | After founding, the owner is `admin`, so the role-based rule lets them add more. Pure invitees stay `staff`/`manager` → blocked. |
| Each membership is recorded in `user_companies` (`UserCompany`), `status: 'active'`. | `companyService.js:67-73`, `getUserCompanies` at `:148` | Membership **count** is the authoritative "does this user already belong to a company" signal. |
| `req.user.role` in the JWT is the user's **active-company** role (updated on switch). | `companyService.switchCompany:205-212` | Role-based gating is evaluated against the *currently active* company. |
| `POST /api/company/setup` already has `enforceLimit('max_companies', countOwnedCompanies)`, inert while `PACKAGE_ENFORCEMENT !== 'true'`. | `HRMS-API_v1/src/routes/company.routes.js:31`, `packageMiddleware.js` | Phase 2 barrier already wired; do not touch. |
| `super_admin` stays company-agnostic (`company_id` may be null) and bypasses gating. | `companyService.js:29-33`, `packageMiddleware.js:14` | The new guard must always allow `super_admin`. |
| Onboarding routes sit under a single parent guard `onboardingGuard`; individual child routes (`''`, `setup`, `waiting`) currently have no per-route guard. | `HRMS_v1/src/app/app.routes.ts:25-27`, `onboarding.routes.ts` | We add a per-route guard to `setup` only; `''` (choice) and `waiting` stay reachable for invitees. |
| `onboarding-choice` shows the Create card to everyone; distinguishes only "first" vs "additional" via `hasExistingCompany`. | `onboarding-choice.component.ts/html` | This is the UX surface to gate. |

## 5. The Rule (single source of truth)

> **Eligibility to create a company**
> 1. If the user's active role is `super_admin` → **allow** (company-agnostic platform admin).
> 2. Else if the user has **zero** active company memberships → **allow** (this is their first company).
> 3. Else (user already belongs to ≥1 company):
>    - If active role ∈ {`admin`} → **allow** (an owner/admin adding another company).
>    - Otherwise (`manager`, `staff`) → **deny.**

The frontend and backend implement the *same* rule. The frontend uses `company_id != null`
(via `authService.hasCompany()`) as the "already belongs to a company" signal; the backend uses
the authoritative `UserCompany` active-membership count. For a normal user these agree
(`company_id` is set iff a membership exists). `super_admin` is allowed in both regardless of
`company_id`.

### Accepted edge case (consequence of the role-based choice)

A founder of Company A (admin there) who was also invited into Company B as **staff**, and who
has **switched their active company to B**, has active role `staff` and will be **blocked** from
creating a new Company C until they switch back to a company where they are `admin`. This is the
accepted behavior of the role-based model. (The alternative — ownership-based, keyed on
`owner_id` — would allow it but is deferred; see §9.)

## 6. Backend Design

### 6.1 New middleware: `requireCanCreateCompany`

Add to `HRMS-API_v1/src/middleware/packageMiddleware.js` (it already owns company-related
gating helpers and imports `UserCompany`'s siblings), or a small dedicated module — implementer's
choice; keeping it beside `enforceLimit`/`countOwnedCompanies` is preferred for cohesion.

```js
// Gate the CREATE-company action by role/ownership (Phase 1 — always active, not billing-gated).
// Rule: super_admin allowed; first company (no active membership) allowed;
// additional company requires active role 'admin'. Others → 403 CREATE_COMPANY_FORBIDDEN.
const { UserCompany } = require('../models');

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

### 6.2 Route wiring

In `HRMS-API_v1/src/routes/company.routes.js`, insert the new guard on `/setup`
**before** the existing `enforceLimit` (role/ownership is checked first; the plan limit — when
enabled later — is the second gate):

```js
router.post(
  '/setup',
  verifyToken,
  requireCanCreateCompany,                         // NEW — Phase 1 role/ownership gate
  enforceLimit('max_companies', countOwnedCompanies), // existing — Phase 2, inert for now
  [ /* validators unchanged */ ],
  companyController.setupCompany
);
```

No change to `companyController.setupCompany` or `companyService.createCompany`.

### 6.3 Error contract

- **403** `{ success: false, code: 'CREATE_COMPANY_FORBIDDEN', message }`.
- The frontend keys off `code === 'CREATE_COMPANY_FORBIDDEN'` (distinct from the Phase 2
  `LIMIT_REACHED`) to show the right message.

## 7. Frontend Design

### 7.1 New route guard: `canCreateCompanyGuard`

Add to `HRMS_v1/src/app/core/guards/auth.guard.ts` (co-located with `authGuard`/`onboardingGuard`):

```ts
// Gate the /onboarding/setup route: first company always allowed;
// additional company only for admin / super_admin. Others → redirect to dashboard.
export const canCreateCompanyGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  const user = authService.getCurrentUserValue();
  if (!user) { router.navigate(['/auth/login']); return false; }

  // First company (no active company) — always allowed.
  if (!authService.hasCompany()) return true;

  // Additional company — admin / super_admin only.
  if (authService.hasAnyRole(['admin', 'super_admin'])) return true;

  router.navigate(['/dashboard']);
  return false;
};
```

Wire it on the `setup` child route in `HRMS_v1/src/app/features/onboarding/onboarding.routes.ts`:

```ts
{ path: 'setup', component: CompanySetupWizardComponent, canActivate: [canCreateCompanyGuard] },
```

`''` (choice) and `waiting` remain ungated so invitees can still reach the choice screen and the
"Wait for Invitation" path.

### 7.2 Onboarding choice screen

In `onboarding-choice.component.ts`, add a computed eligibility flag mirroring the rule:

```ts
canCreateCompany = false; // set in constructor/ngOnInit
// eligible if no company yet OR active role is admin/super_admin
this.canCreateCompany =
  !this.authService.hasCompany() ||
  this.authService.hasAnyRole(['admin', 'super_admin']);
```

In `onboarding-choice.component.html`, when `hasExistingCompany` is true:

- If `canCreateCompany` → show the "Create New Company" card as today.
- Else → replace the card with a short, non-alarming notice, e.g.:
  > "Only company owners or admins can create additional companies. If you need your own
  > workspace, ask an admin to grant access or invite you."
  …plus the existing "Back to Dashboard" action.

The first-time user branch (`!hasExistingCompany`) is unchanged — the Create + Wait cards both
show, because a brand-new user must be able to create their first company.

### 7.3 Setup-wizard submit error handling

In the company setup wizard's submit handler, handle the new backend code defensively (in case a
user reaches submit through a race, e.g. role changed after page load):

- On `403` with `code === 'CREATE_COMPANY_FORBIDDEN'` → show the message from the response and
  route back to `/dashboard` (or `/onboarding`), rather than a generic error toast.

## 8. Data Flow (additional-company attempt by a staff user)

```
Staff user (has company, role=staff) tries to add a company
      │
      ▼
Frontend: command palette / deep link → /onboarding/setup
      │  canCreateCompanyGuard: hasCompany() && !admin  → redirect /dashboard   ✗ blocked (UX)
      │
      │  (if somehow bypassed / stale client) POST /api/company/setup
      ▼
Backend: verifyToken → requireCanCreateCompany
      │  memberships ≥ 1 && role !== admin/super_admin → 403 CREATE_COMPANY_FORBIDDEN  ✗ blocked (authoritative)
```

Founder / admin path: guard passes → wizard renders → POST passes `requireCanCreateCompany`
(role `admin`) → passes `enforceLimit` (inert) → company created.

First-time user path: `hasCompany()` false → guard passes → POST: `memberships === 0` → allowed.

## 9. Phase 2 (documented, NOT built here)

When paid tiers launch, no code changes are required for the company-count limit:

1. Set Basic's `max_companies` to the allowed free number (e.g. `1`) in
   `HRMS-API_v1/database/seeds/seed-packages.js` and re-run it.
2. Set `PACKAGE_ENFORCEMENT=true`.

`enforceLimit('max_companies', countOwnedCompanies)` (already on the route, after our new guard)
then returns `403 LIMIT_REACHED`, and the existing upgrade-prompt plumbing
(`upgrade-prompt.service.ts`, billing pages) surfaces the upgrade nudge.

**Optional future switch — ownership-based eligibility:** If we later prefer "only actual
founders may add companies" over "any active-company admin," change the backend rule from
`role === 'admin'` to `Company.count({ where: { owner_id: req.user.id } }) > 0` and the frontend
guard correspondingly. This is a rule swap in one place each; deferred by decision.

## 10. Testing Plan

**Backend (`requireCanCreateCompany`):**
- super_admin → allowed (memberships irrelevant).
- New user, 0 memberships → allowed.
- Founder (1 membership, active role `admin`) → allowed.
- Staff invitee (1 membership, active role `staff`) → 403 `CREATE_COMPANY_FORBIDDEN`.
- Manager invitee (active role `manager`) → 403.
- Guard runs **before** `enforceLimit` (order asserted in route wiring).

**Frontend (`canCreateCompanyGuard` + choice screen):**
- No company → `/onboarding/setup` reachable.
- Has company + admin → reachable; Create card shown on choice.
- Has company + staff → `/onboarding/setup` redirects to `/dashboard`; choice screen shows the
  notice instead of the Create card.

**Manual E2E:**
- Log in as a staff invitee, attempt to reach the create flow via command palette and via direct
  URL → both blocked with the correct message.
- Log in as an admin/owner → can add a second company end-to-end.
- Register a brand-new account → can create the first company.

## 11. Files Touched (summary)

| File | Change |
|------|--------|
| `HRMS-API_v1/src/middleware/packageMiddleware.js` | Add `requireCanCreateCompany`; export it. |
| `HRMS-API_v1/src/routes/company.routes.js` | Wire `requireCanCreateCompany` on `/setup` before `enforceLimit`. |
| `HRMS_v1/src/app/core/guards/auth.guard.ts` | Add `canCreateCompanyGuard`. |
| `HRMS_v1/src/app/features/onboarding/onboarding.routes.ts` | Apply guard to `setup` route. |
| `HRMS_v1/src/app/features/onboarding/components/onboarding-choice/onboarding-choice.component.ts` | Add `canCreateCompany` flag. |
| `HRMS_v1/src/app/features/onboarding/components/onboarding-choice/onboarding-choice.component.html` | Conditionally render Create card vs notice. |
| `HRMS_v1/src/app/features/onboarding/components/company-setup-wizard/company-setup-wizard.component.ts` | Handle `CREATE_COMPANY_FORBIDDEN` on submit. |

No migrations. No changes to billing/subscription code. No changes to invitation or switch flows.
