# HRMS Subscription Package System — Implementation Plan

> **Status:** DRAFT — pending review
> **Author:** Architecture draft
> **Last Updated:** 2026-04-27
> **Scope:** Add a 3-tier subscription package system to the HRMS platform with per-user package assignment, feature gating, and usage limits (number of companies a user can create).

---

## 1. Executive Summary

This document proposes a **per-user subscription package system** with three tiers — **Basic**, **Professional**, and **Enterprise** — that controls (a) which HRMS features each user can access, and (b) how many companies a user can create / be the owner of.

The system is designed to run as **internal tier control first** (no payments), with the data model and APIs prepared so a payment gateway (Stripe / Billplz / iPay88) can be plugged in later without schema changes.

### Key Design Decisions (confirmed with stakeholder)

| # | Decision | Choice |
|---|----------|--------|
| 1 | Scope of package | **Per-user** (each user has their own package; company creation count is tier-limited) |
| 2 | Billing | **Internal tier control now**, payment gateway integration later |
| 3 | Who can change a user's plan | **Super Admin** (global) and **Admin** (within company context, for their own users — TBD scope) |
| 4 | Existing users on rollout | **Auto-assigned Enterprise** (grandfathered) — recommended Option A from review |
| 5 | Storage limit | **No app-level limit** — follows current Supabase Storage allocation |
| 6 | Trial period | **Yes** — 14-day trial on Professional for new signups |

---

## 2. The Three Tiers

### 2.1 Tier Comparison Table

| Feature / Limit | **Basic** (Tier 1) | **Professional** (Tier 2) | **Enterprise** (Tier 3) |
|---|---|---|---|
| **Max companies a user can create/own** | 1 | 3 | Unlimited |
| **Max employees per company** | 10 | 100 | Unlimited |
| **Storage** | Per Supabase allocation | Per Supabase allocation | Per Supabase allocation |
| **Trial available** | — | 14 days | — |
| Employee Management | ✅ | ✅ | ✅ |
| Leave Management | ✅ | ✅ | ✅ |
| Attendance & WFH | ✅ | ✅ | ✅ |
| HR Communications (Memos / Policies) | ✅ | ✅ | ✅ |
| Personal Pages (Profile / Payslips) | ✅ | ✅ | ✅ |
| Notifications | ✅ | ✅ | ✅ |
| Feedback Widget | ✅ | ✅ | ✅ |
| Claims Management | ❌ | ✅ | ✅ |
| Payroll System | ❌ | ✅ | ✅ |
| Statutory Reports (EA / EPF / SOCSO / PCB) | ❌ | ✅ | ✅ |
| Analytics & Charts | ❌ | ✅ | ✅ |
| Document Management (admin overview) | ❌ | ✅ | ✅ |
| OAuth Login (Google / GitHub) | ❌ | ✅ | ✅ |
| Multi-Company Switcher | ❌ | ✅ | ✅ |
| Custom Email Templates | ❌ | ✅ | ✅ |
| Audit Log | ❌ | ❌ | ✅ |
| E-Invoice (when built) | ❌ | ❌ | ✅ |
| Advanced Analytics / Custom Reports | ❌ | ❌ | ✅ |
| Scheduled Reports & Email Delivery | ❌ | ❌ | ✅ |
| Priority Support | ❌ | ❌ | ✅ |
| API Access (future) | ❌ | ❌ | ✅ |

> **Note:** Feature-to-tier mapping is a starting point. Adjust before sign-off.

### 2.2 Tier Pricing (placeholder)

Prices are placeholders — to be finalised before payment gateway integration.

| Tier | Monthly | Yearly (~17% off) |
|------|---------|-------------------|
| Basic | RM 0 | RM 0 |
| Professional | RM 49 | RM 490 |
| Enterprise | RM 149 | RM 1,490 |

---

## 3. Data Model

### 3.1 New Tables

#### `packages`
Catalog of available plans. Seeded once, rarely changed.

| Column | Type | Notes |
|--------|------|-------|
| id | INTEGER PK | Auto-increment |
| public_id | UUID | For external references |
| name | VARCHAR(100) | "Basic", "Professional", "Enterprise" |
| slug | VARCHAR(50) UNIQUE | "basic", "professional", "enterprise" |
| tier | INTEGER | 1, 2, 3 (used for ordering / comparisons) |
| description | TEXT | Marketing description |
| price_monthly | DECIMAL(10,2) | In MYR |
| price_yearly | DECIMAL(10,2) | In MYR |
| currency | VARCHAR(3) | Default "MYR" |
| features | JSONB | `{ payroll: true, claims: true, analytics: false, ... }` |
| limits | JSONB | `{ max_companies: 1, max_employees_per_company: 10 }` |
| trial_days | INTEGER | Default 0; 14 for Professional |
| is_active | BOOLEAN | Soft-disable a plan |
| sort_order | INTEGER | Display order on pricing page |
| created_at, updated_at | TIMESTAMP | |

#### `subscriptions`
One **active** row per user. Historical changes go in `subscription_history`.

| Column | Type | Notes |
|--------|------|-------|
| id | INTEGER PK | Auto-increment |
| public_id | UUID | For external references |
| user_id | INTEGER FK → users.id | UNIQUE (one active subscription per user) |
| package_id | INTEGER FK → packages.id | |
| status | ENUM | `trialing`, `active`, `past_due`, `canceled`, `expired` |
| billing_cycle | ENUM | `monthly`, `yearly`, `none` (for Basic / internal grants) |
| started_at | TIMESTAMP | When this subscription began |
| current_period_start | TIMESTAMP | |
| current_period_end | TIMESTAMP | NULL for free / non-expiring |
| trial_ends_at | TIMESTAMP NULL | If currently trialing |
| cancel_at | TIMESTAMP NULL | Scheduled cancellation date |
| canceled_at | TIMESTAMP NULL | When canceled |
| payment_provider | VARCHAR(50) NULL | Future: "stripe", "billplz", etc. |
| payment_provider_subscription_id | VARCHAR(255) NULL | External ID |
| created_at, updated_at | TIMESTAMP | |

**Indexes:** `user_id` (unique), `status`, `current_period_end`.

#### `subscription_history`
Full audit trail of all plan changes (upgrades, downgrades, cancellations, renewals).

| Column | Type | Notes |
|--------|------|-------|
| id | INTEGER PK | |
| public_id | UUID | |
| user_id | INTEGER FK → users.id | |
| from_package_id | INTEGER FK → packages.id NULL | NULL on first subscription |
| to_package_id | INTEGER FK → packages.id | |
| action | ENUM | `created`, `upgraded`, `downgraded`, `renewed`, `canceled`, `trial_started`, `trial_ended`, `admin_override` |
| changed_by | INTEGER FK → users.id | Who triggered the change (self / admin / super_admin) |
| reason | TEXT | Optional note |
| metadata | JSONB | Provider response, prorate amount, etc. |
| created_at | TIMESTAMP | |

### 3.2 Schema Changes to Existing Tables

#### `users` table — minor additions
- No structural changes required; package is read via `subscriptions` join.
- (Optional cache column) `current_package_slug VARCHAR(50) NULL` — denormalised for fast filtering. Updated by trigger or in-application after subscription change.

#### `companies` table — no change
- Company creation is gated at the controller layer using the user's active subscription `limits.max_companies`.

### 3.3 Seed Data

```js
// HRMS-API_v1/database/seeds/seed-packages.js
[
  {
    slug: 'basic',
    tier: 1,
    name: 'Basic',
    price_monthly: 0,
    price_yearly: 0,
    trial_days: 0,
    features: {
      employee_management: true,
      leave_management: true,
      attendance: true,
      wfh: true,
      memos: true,
      policies: true,
      personal_pages: true,
      notifications: true,
      feedback: true,
      claims: false,
      payroll: false,
      statutory_reports: false,
      analytics: false,
      document_management: false,
      oauth_login: false,
      multi_company: false,
      custom_email_templates: false,
      audit_log: false,
      e_invoice: false,
      advanced_analytics: false,
      scheduled_reports: false,
      priority_support: false,
      api_access: false,
    },
    limits: {
      max_companies: 1,
      max_employees_per_company: 10,
    },
  },
  {
    slug: 'professional',
    tier: 2,
    name: 'Professional',
    price_monthly: 49,
    price_yearly: 490,
    trial_days: 14,
    features: {
      // all Basic features +
      claims: true,
      payroll: true,
      statutory_reports: true,
      analytics: true,
      document_management: true,
      oauth_login: true,
      multi_company: true,
      custom_email_templates: true,
      // remaining false
    },
    limits: {
      max_companies: 3,
      max_employees_per_company: 100,
    },
  },
  {
    slug: 'enterprise',
    tier: 3,
    name: 'Enterprise',
    price_monthly: 149,
    price_yearly: 1490,
    trial_days: 0,
    features: {
      // all features true
    },
    limits: {
      max_companies: -1, // -1 = unlimited
      max_employees_per_company: -1,
    },
  },
]
```

---

## 4. Backend Implementation

### 4.1 New Models

```
HRMS-API_v1/src/models/
├── Package.js              # New
├── Subscription.js         # New
└── SubscriptionHistory.js  # New
```

Standard Sequelize models with associations:
- `User.hasOne(Subscription, { foreignKey: 'user_id' })`
- `Subscription.belongsTo(User)` and `Subscription.belongsTo(Package)`
- `Package.hasMany(Subscription)`
- `User.hasMany(SubscriptionHistory)`

### 4.2 New Service: `subscriptionService.js`

```
HRMS-API_v1/src/services/subscriptionService.js
```

Public methods:
- `getActiveSubscription(userId)` — returns current subscription with package eager-loaded
- `getUserFeatures(userId)` — returns merged feature object
- `getUserLimits(userId)` — returns merged limit object
- `hasFeature(userId, featureKey)` — boolean
- `checkLimit(userId, limitKey, currentValue)` — returns `{ allowed: boolean, limit, current }`
- `subscribe(userId, packageSlug, options)` — create subscription (with optional trial)
- `changePlan(userId, newPackageSlug, changedBy)` — upgrade / downgrade
- `cancelSubscription(userId, options)` — schedule or immediate cancel
- `expireTrials()` — cron job: move trialing → active or downgrade if no payment

### 4.3 New Middleware: `packageMiddleware.js`

```
HRMS-API_v1/src/middlewares/packageMiddleware.js
```

```js
// Usage examples
router.post('/payroll/calculate', requireFeature('payroll'), payrollController.calculate);
router.post('/companies', enforceLimit('max_companies', companyOwnedCounter), companyController.create);
router.post('/employees', enforceLimit('max_employees_per_company', employeeCounter), employeeController.create);
```

**`requireFeature(featureKey)`**
- Reads `req.user.id`
- Calls `subscriptionService.hasFeature(userId, featureKey)`
- On miss: `403 { code: 'FEATURE_LOCKED', feature: 'payroll', required_tier: 'professional', message: 'This feature requires the Professional plan' }`

**`enforceLimit(limitKey, currentValueResolver)`**
- `currentValueResolver(req)` — async function that returns the current usage count
- Calls `subscriptionService.checkLimit(userId, limitKey, current)`
- On exceed: `403 { code: 'LIMIT_REACHED', limit: 1, current: 1, upgrade_to: 'professional' }`

### 4.4 New Controller & Routes

```
HRMS-API_v1/src/controllers/subscriptionController.js
HRMS-API_v1/src/routes/subscription.routes.js
```

Endpoints:

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/packages` | Public | List all active packages (for pricing page) |
| GET | `/api/subscription/me` | User | Current user's subscription + package + usage |
| GET | `/api/subscription/usage` | User | Live usage snapshot vs limits |
| POST | `/api/subscription/subscribe` | User | Subscribe to a plan (currently internal — picks a slug) |
| POST | `/api/subscription/change` | User | Upgrade / downgrade self |
| POST | `/api/subscription/cancel` | User | Cancel own subscription |
| GET | `/api/subscription/history` | User | Own subscription history |
| GET | `/api/admin/subscriptions` | Super Admin | List all users' subscriptions (paginated, filterable) |
| GET | `/api/admin/subscriptions/:userPublicId` | Super Admin / Admin | Get a user's subscription |
| PATCH | `/api/admin/subscriptions/:userPublicId` | Super Admin | Manually override a user's plan (writes `admin_override` to history) |
| POST | `/api/admin/subscriptions/:userPublicId/grant-trial` | Super Admin | Manually grant a trial |

Mounted in `app.js`:
```js
app.use('/api/packages', packageRoutes);
app.use('/api/subscription', subscriptionRoutes);
app.use('/api/admin/subscriptions', adminSubscriptionRoutes);
```

### 4.5 Feature Gating — Routes to Update

Apply `requireFeature(...)` or `enforceLimit(...)` to existing routes:

| Route | Middleware |
|-------|------------|
| `POST /api/companies` | `enforceLimit('max_companies')` |
| `POST /api/employees` | `enforceLimit('max_employees_per_company')` |
| `/api/payroll/*` (all writes & reads) | `requireFeature('payroll')` |
| `/api/claims/*` | `requireFeature('claims')` |
| `/api/analytics/*` | `requireFeature('analytics')` |
| `/api/statutory-reports/*` | `requireFeature('statutory_reports')` |
| `/api/files/overview`, `/api/files/:id/verify` | `requireFeature('document_management')` |
| `/api/audit-logs/*` | `requireFeature('audit_log')` |
| `/api/auth/google`, `/api/auth/github` | `requireFeature('oauth_login')` (TBD — login flow may need exception) |
| `/api/company/switch`, `/api/company/my-companies` | `requireFeature('multi_company')` |

### 4.6 Cron Jobs

A daily scheduled job in `HRMS-API_v1/src/jobs/subscriptionJobs.js`:
- Move trials past `trial_ends_at` to `active` (if payment) or `expired` (if not paid in future) — for now, downgrade to Basic.
- Mark subscriptions past `current_period_end` as `expired`.
- Send reminder emails (3 days before trial ends, 7 days before period ends — future).

### 4.7 Environment Variables

```
PACKAGE_ENFORCEMENT=true            # Master switch — when false, all checks pass
DEFAULT_PACKAGE_SLUG=basic          # New signup default
GRANDFATHER_PACKAGE_SLUG=enterprise # Existing users on migration
TRIAL_DAYS_PROFESSIONAL=14
```

---

## 5. Frontend Implementation

### 5.1 New Service

```
src/app/core/services/subscription.service.ts
```

Signal-based, singleton:
```ts
class SubscriptionService {
  currentSubscription = signal<Subscription | null>(null);
  currentPackage = computed(() => this.currentSubscription()?.package ?? null);
  features = computed(() => this.currentPackage()?.features ?? {});
  limits = computed(() => this.currentPackage()?.limits ?? {});
  usage = signal<UsageSnapshot | null>(null);

  hasFeature(key: string): boolean;
  isWithinLimit(key: string): boolean;
  loadSubscription(): Observable<Subscription>;
  loadUsage(): Observable<UsageSnapshot>;
  subscribe(slug: string): Observable<Subscription>;
  changePlan(slug: string): Observable<Subscription>;
  cancel(): Observable<void>;
}
```

Loaded on app init (after login) and on company switch.

### 5.2 New Guard

```
src/app/core/guards/package-feature.guard.ts
```

```ts
export const packageFeatureGuard = (featureKey: string): CanActivateFn => {
  return () => {
    const subService = inject(SubscriptionService);
    const router = inject(Router);
    if (subService.hasFeature(featureKey)) return true;
    router.navigate(['/upgrade'], { queryParams: { feature: featureKey } });
    return false;
  };
};
```

### 5.3 New Structural Directive

```
src/app/shared/directives/has-feature.directive.ts
```

```html
<button *hasFeature="'payroll'" (click)="runPayroll()">Run Payroll</button>
<a *hasFeature="'analytics'" routerLink="/analytics">Analytics</a>
```

Hides the element when the feature is locked.

### 5.4 New Components / Pages

| Path | Description | Access |
|------|-------------|--------|
| `/billing` | Current plan, usage meters, change-plan button, billing history | Logged-in user |
| `/upgrade` | Pricing comparison table + CTA — shown when hitting a feature wall | Logged-in user |
| `/admin/subscriptions` | All-users subscription management table | Super Admin only |
| Pricing page (public) | Marketing-friendly tier comparison (optional, can reuse `/upgrade`) | Public |

Components live in:
```
src/app/features/billing/
├── billing-page.component.ts          # /billing
├── upgrade-page.component.ts          # /upgrade
├── plan-card.component.ts             # Reusable per-tier card
├── usage-meter.component.ts           # Bar showing X / Y companies, X / Y employees
└── change-plan-dialog.component.ts    # Confirm upgrade / downgrade

src/app/features/admin-subscriptions/
└── admin-subscriptions-page.component.ts   # /admin/subscriptions
```

### 5.5 Route Updates

Apply `packageFeatureGuard(...)` in `app.routes.ts`:

```ts
{
  path: 'payroll',
  canActivate: [authGuard, packageFeatureGuard('payroll')],
  loadChildren: () => import('./features/payroll/...'),
},
// repeat for: claims, analytics, statutory-reports, documents, audit-log
```

### 5.6 Sidebar / Top Nav Updates

- Show **"PRO"** / **"ENTERPRISE"** badges next to locked menu items.
- Either hide locked items entirely (cleaner) or show with badge → click goes to `/upgrade`.
- Add a **"Plan: Professional"** chip to user dropdown showing current plan.
- Add **"Billing"** entry to user dropdown.

### 5.7 In-App Upgrade Prompts

When backend returns `403 { code: 'FEATURE_LOCKED' }`:
- HTTP interceptor catches it → opens an upgrade modal with the feature name and a CTA to `/upgrade`.

When backend returns `403 { code: 'LIMIT_REACHED' }`:
- Show modal: "You've reached the limit of 1 company on the Basic plan. Upgrade to Professional for up to 3 companies." → CTA.

---

## 6. Migration & Rollout Plan

### Phase 0 — Schema (Day 1)
- [ ] Create `packages`, `subscriptions`, `subscription_history` tables (DB_SYNC=true → false after).
- [ ] Run `seed-packages.js` to insert the 3 tiers.

### Phase 1 — Backend Foundation (Days 2-4)
- [ ] Sequelize models (`Package`, `Subscription`, `SubscriptionHistory`).
- [ ] `subscriptionService.js` with all methods.
- [ ] `subscriptionController.js` + routes (user-facing endpoints).
- [ ] Admin subscription endpoints.
- [ ] Migration script: backfill all existing users with **Enterprise** subscription (grandfather).
- [ ] Cron job for trial / period expiry.
- [ ] `PACKAGE_ENFORCEMENT=false` (off by default).

### Phase 2 — Backend Enforcement (Days 5-6)
- [ ] `packageMiddleware.js` (`requireFeature`, `enforceLimit`).
- [ ] Apply middleware to all routes from §4.5.
- [ ] Manually test each route with each tier.

### Phase 3 — Frontend Foundation (Days 7-9)
- [ ] `SubscriptionService` with signals.
- [ ] `packageFeatureGuard` + `*hasFeature` directive.
- [ ] HTTP interceptor for `FEATURE_LOCKED` / `LIMIT_REACHED` responses.
- [ ] `/billing` page (current plan + usage).
- [ ] `/upgrade` page (pricing table + CTA).

### Phase 4 — Frontend Gating (Days 10-11)
- [ ] Apply guards to all gated routes.
- [ ] Update sidebar with badges / hidden items.
- [ ] Test full-stack on each tier.

### Phase 5 — Admin UI (Days 12-13)
- [ ] `/admin/subscriptions` page for Super Admin.
- [ ] Plan override dialog.
- [ ] Trial granting.

### Phase 6 — Soft Launch (Day 14)
- [ ] Deploy with `PACKAGE_ENFORCEMENT=false` to verify no regressions.
- [ ] Communicate to existing users: "Your account is on Enterprise; here's how to view your plan."
- [ ] Switch `PACKAGE_ENFORCEMENT=true`.

### Phase 7 (Future) — Payment Gateway Integration
- [ ] Pick provider (Stripe / Billplz / iPay88).
- [ ] Implement webhook handler (`/api/webhooks/stripe`).
- [ ] Wire `subscriptionService.changePlan` to provider checkout.
- [ ] Handle `payment_provider_subscription_id`.

---

## 7. Edge Cases & Considerations

### 7.1 Downgrades
- **Downgrade with violation:** A user on Enterprise with 5 companies tries to downgrade to Basic (max 1). Options:
  - Block downgrade until usage is within limit (recommended).
  - Allow downgrade and freeze excess companies (read-only).
- **Decision needed:** which to implement?

### 7.2 Existing Companies vs New User on Basic
- A user on Basic owns 1 company already. They get invited to a 2nd company by another admin. Does that count toward `max_companies`?
  - **Recommendation:** `max_companies` counts only companies the user **created** (i.e. `companies.owner_id = user.id`), not invited memberships.

### 7.3 Trial Expiry Without Payment
- Trial ends → status moves to `expired`. What plan do they fall back to?
  - **Recommendation:** Auto-fall back to **Basic**. They keep their data but lose Pro features. They must explicitly re-subscribe.

### 7.4 Multi-Company Switcher When Downgrading from Pro to Basic
- Multi-company is a Pro feature. If a user with 3 companies downgrades to Basic, what happens?
  - **Recommendation:** Block downgrade until they reduce to 1 company (consistent with §7.1).

### 7.5 Super Admin
- The platform-level `super_admin` (e.g. `admin@nextura.com`) should be **bypassed entirely** by all package checks. Same pattern as `authGuard` already does.

### 7.6 Race Conditions
- Two parallel `POST /api/companies` calls when user is at 1 / 1: both pass the limit check before either commits. Solution:
  - Use a database transaction with `SELECT ... FOR UPDATE` on the count, or a unique partial index.

### 7.7 Cache Invalidation
- After plan change, frontend signal needs to refresh. Solution:
  - `subscriptionService.changePlan()` re-fetches subscription on success and updates the signal. All `*hasFeature` directives re-evaluate automatically.

---

## 8. Open Questions for Final Review

Before implementation begins, please confirm or adjust:

1. **Tier feature mapping (§2.1):** Are the listed feature-to-tier assignments correct? Anything to move?
2. **Pricing (§2.2):** Are the placeholder prices acceptable, or should we leave price columns NULL until decided?
3. **Trial duration:** 14 days on Professional — adjust?
4. **Grandfather choice:** Confirm Enterprise auto-assignment for existing users (§1, recommended Option A).
5. **Admin scope:** Can a company-level **Admin** change subscriptions for users in their company, or is plan management strictly **the user themselves + Super Admin**? (Cleaner is "self + Super Admin only".)
6. **Downgrade with limit violation (§7.1):** Block, or allow with frozen excess?
7. **Invited-company counting (§7.2):** Confirm `max_companies` only counts owned (created) companies.
8. **Multi-company feature on Basic:** A Basic user can only own 1 company, but can they still **be a member** of other companies (via invite)? If yes, do they need the `multi_company` feature flag to use the company switcher?

---

## 9. Out of Scope (for this phase)

- Payment gateway integration (deferred to Phase 7).
- Proration on mid-cycle upgrades.
- Dunning / failed-payment retry logic.
- Coupons / discount codes.
- Annual-vs-monthly plan switching mid-cycle.
- Per-feature add-ons (pay-as-you-go modules on top of Basic).
- Reseller / white-label plans.

---

## 10. Sign-off

- [ ] Stakeholder reviewed feature-tier mapping
- [ ] Stakeholder confirmed pricing structure (or deferred)
- [ ] Stakeholder approved data model
- [ ] Stakeholder answered open questions in §8
- [ ] Engineering scoped effort (estimated 14 working days, see §6)

**Once signed off, implementation begins at Phase 0.**

---

**Document Version:** 1.0 (DRAFT)
**Next Review:** After stakeholder feedback on §8 questions
