# Nextura — Logout Returns to Hub (Local Logout)

**Date:** 2026-07-15
**Status:** Design approved, pending implementation
**Scope:** HR (hr.nextura.my, Angular), PM (pm.nextura.my, Next.js), Hub (nextura.my, static)
**Decision:** LOCAL logout (each app logs out independently) + correct redirect to the Hub.

---

## Problem

Post-launch, logging out of HR or PM lands the user on that app's **own** login
page, not the Nextura Hub. This orphans the user from the single front door the
Hub is meant to be.

### Root causes (verified 2026-07-14/15)

- **HR targets a Hub URL that 404s.** `signing-out.component.ts` redirects to
  `${environment.hubUrl}/auth/login`, but the Hub serves login at `/login/` and
  its `netlify.toml` has no SPA fallback → hard 404.
- **HR handoff can be hijacked by a notification poll.** `NotificationService`
  is a root singleton polling `/notifications/unread-count` every 60s and is
  never stopped on logout. After `clearSession()`, the next poll 401s →
  `auth.interceptor.ts` → `clearAndRedirect()` → `router.navigate(['/auth/login'])`,
  destroying `SigningOutComponent` and cancelling its ~1400ms handoff timer
  before it can reach the Hub.
- **PM has no Hub awareness at all.** `components/app-sidebar.tsx` logout does
  `window.location.href = "/login"` (hardcoded), and PM has no Hub URL constant.
  PM's logout route (`app/api/auth/logout/route.ts`) clears only its own cookie
  and does **not** call HRMS `/auth/logout`, so the token stays valid until
  natural expiry.

### Intended behavior (local logout)

Logging out of HR or PM:
1. Clears that app's own session (localStorage / cookie) and **blacklists the
   token server-side** via HRMS `/auth/logout`.
2. Redirects to the Hub at `https://nextura.my/login/`.
3. Because the Hub session is separate and still alive (local logout), the Hub
   login page reconciles its own token and lands the user on the **launcher**
   (`/app/`). Net UX: *log out of HR/PM → back at the Hub, still signed into
   Nextura.* To be logged out everywhere is **global logout** — explicitly out
   of scope for this pass (possible follow-up).

---

## Design

### HR (Angular)

1. **Fix the redirect target.** In `signing-out.component.ts`, change
   `${environment.hubUrl}/auth/login` → `${environment.hubUrl}/login/`.
   Keep the dev fallback (`hubUrl` empty → local `/auth/login`) for localhost.
2. **Stop the notification poll on logout.** In `AuthService.clearSession()` (or
   the logout flow), stop `NotificationService` polling before navigating to
   `/auth/signing-out`. Add a `NotificationService.stop()` that clears its
   interval and in-flight subscription.
3. **Interceptor guard.** In `auth.interceptor.ts`, when a 401 arrives while the
   user is already logging out / on the `/auth/signing-out` route, do **not**
   fire `clearAndRedirect(['/auth/login'])` — let the signing-out handoff win.
   (Guard on a "logging out" flag on `AuthService`, or on current route.)
4. Confirm every other login redirect in HR stays local (guards, interceptor for
   genuine session-expiry). Only the explicit user-initiated logout routes to the
   Hub; involuntary session loss keeps its existing local behavior + `returnUrl`.

### PM (Next.js)

1. **Add `NEXT_PUBLIC_HUB_URL`** (default `https://nextura.my`) to `lib/env.ts`
   and the VPS env.
2. **Redirect logout to the Hub.** In `components/app-sidebar.tsx` `logout()`,
   after the logout POST, `window.location.href = ${HUB_URL}/login/` instead of
   `/login`.
3. **Blacklist the token server-side.** In `app/api/auth/logout/route.ts`, before
   clearing the cookie, call HRMS `POST /auth/logout` with the token so it is
   added to the HRMS blacklist (the route's own comment already notes this gap).
   Best-effort: swallow failures, still clear the cookie.

### Hub (static)

No change required for local logout. The existing `/login/` page already
reconciles its own token and lands on `/app/` when a session is present. (A
`next`/`returnTo` param and global logout are separate future work.)

---

## Verification

- Log out of HR (web) → lands on `nextura.my`, shows the launcher (Hub session
  intact). No flash of HR's own `/auth/login`.
- Log out of PM → same.
- Confirm the token is blacklisted: after logout, reusing the old token against
  HRMS returns 401.
- Confirm involuntary 401 (expired session, not user logout) still routes locally
  with `returnUrl`, unchanged.
- Reproduce the notification-race scenario (logout with a poll in flight) and
  confirm the handoff to the Hub completes.

## Out of scope (future)

- **Global single-logout** (killing HR + PM + Hub sessions together).
- **Hub `next`/`returnTo`** so login returns the user to the app they left.
- HR `JWT_EXPIRES_IN` / PM 24h token TTL review (tracked separately).
