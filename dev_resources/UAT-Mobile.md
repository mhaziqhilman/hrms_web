# HRMS User Acceptance Testing (UAT) — Mobile (Android)

> **Document Version:** 1.0
> **Created:** 2026-04-23
> **Application:** Nextura HRMS Mobile (Capacitor wrapper over Angular 21)
> **Build Under Test:** `com.nextura.hrms` — Android `.apk` / `.aab` built from `HRMS_v1/android`
> **Backend:** Same Node.js/Express + Supabase PostgreSQL API as the web app
> **Testing Method:** Manual on real + emulated devices; API-level checks reuse the Playwright suite from UAT-Web
> **Status:** Ready for Execution

---

## 1. Purpose & Scope

This document defines the UAT cases for the **native Android** build of HRMS. The mobile app is a Capacitor shell that reuses the same Angular codebase as the web, but with a distinct shell at `/m/*`, bottom-tab navigation, native plugins (geolocation, camera, biometric, push, network, preferences), and a reduced feature surface aimed at staff/manager self-service.

**In scope:**
- Tier 1 features: login + biometric unlock, attendance clock in/out, leave, claims with receipt camera, WFH, payslip view, push notifications, notifications feed, profile.
- Tier 2 features: announcements/memos feed, team directory, documents (read-only), manager approvals.
- Native concerns: permissions, offline handling, background/foreground lifecycle, deep links from push, back-button behaviour, status bar, haptics.
- Security: anti-impersonation (device binding, geofence, biometric re-auth, selfie) — test what is built; mark pending items as **BLOCKED**.

**Out of scope:**
- iOS build — no `ios/` platform in the repo yet (Mac required).
- Desktop-only modules (payroll processing, user management, analytics, admin settings, statutory reports, audit log, feedback admin, company setup, document verification).
- Play Store listing metadata — covered by `HRMS_App/Store Assets/` review.
- Real FCM delivery against production project keys (use Firebase test project).

---

## 2. Test Environment

| Item | Value |
|---|---|
| App ID | `com.nextura.hrms` |
| App Name | Nextura HRMS |
| Build artefact | `android/app/build/outputs/apk/debug/app-debug.apk` (debug) or `.aab` (release) |
| Web bundle served | `dist/HRMS_v1/browser` (Capacitor `webDir`) |
| Backend (staging) | `https://<staging-api>/api` (Render) |
| Backend (local) | `http://10.0.2.2:3000/api` (emulator) or LAN IP (real device) |
| Database | Supabase PostgreSQL (non-prod schema) |
| Storage | Supabase Storage bucket `hrms-files` |
| Min SDK | 23 (Android 6.0) per Capacitor 6 defaults |
| Target SDK | 34 |
| Java | 17 |
| Device matrix | Android 9 (emulator), Android 12 (Pixel 5), Android 14 (Pixel 7 / real) |
| Automation | Manual on device + Playwright (API only) — reuse `HRMS_v1/tests/e2e/` |

## 3. Test Users

Same seed users as UAT-Web (see `UAT-Web.md §3`). Mobile-only addition:

| Role | Email | Password | Notes |
|---|---|---|---|
| Staff (mobile primary) | `uat.staff@nextura.test` | `Uat@12345` | Will register this device as primary attendance device |
| Manager (mobile) | `uat.manager@nextura.test` | `Uat@12345` | Tests approvals tab |

## 4. Entry & Exit Criteria

**Entry:** `.apk` installs and launches; backend reachable from device; FCM test project configured; `google-services.json` in `android/app/`; camera + location permissions grantable; seed data present.
**Exit:** 100% Critical Passed; ≥95% Major Passed; no Critical defect open; Play Console Internal Testing track accepts the bundle; sign-off signed.

## 5. Severity & Priority

- **Critical** — blocks core mobile journey (login, clock in, leave apply, push delivery)
- **Major** — broken feature with workaround
- **Minor** — UX/cosmetic
- **Enhancement** — improvement, not a defect

## 6. Legend

| Symbol | Meaning |
|---|---|
| ☐ | Not executed |
| ✅ | Passed |
| ❌ | Failed (link to defect) |
| ⚠ | Passed with observation |
| ⏭ | Skipped / Blocked |
| 📝 | Manual only (cannot be automated) |

---

# MODULE 1 — App Install & First Launch

| TC ID | Priority | Precondition | Test Steps | Expected Result | Status |
|---|---|---|---|---|---|
| APP-001 | Critical | Fresh device, no prior install | Install `.apk` via adb / Play Internal Testing | Install completes; app icon "Nextura HRMS" visible in launcher | ☐ |
| APP-002 | Critical | Install complete | Tap icon | Splash screen shows (2s, white background); auto-hides; routes to `/m/login` | ☐ |
| APP-003 | Major | Already logged in previously | Cold launch | Auto-resume to `/m/home` (auth-guard + stored JWT) | ☐ |
| APP-004 | Major | — | Rotate device portrait→landscape on every page | No crash; layout adapts (or locks to portrait if configured) | ☐ |
| APP-005 | Critical | App launched on native | Inspect router state | `Capacitor.isNativePlatform()===true` redirects root to `/m` (not `/auth/login`) | ☐ |
| APP-006 | Major | — | Put app in background 5 min; resume | Resumes to same page; JWT still valid or silently refreshed | ☐ |
| APP-007 | Major | App open | Kill via recent apps | Next cold launch starts clean | ☐ |
| APP-008 | Minor | — | Check app version in Android Settings → Apps | Matches `versionName` from `build.gradle` | ☐ |
| APP-009 | Major | No network | Launch app | Offline-safe splash + friendly "No connection" banner (no hard crash) | ☐ |

---

# MODULE 2 — Authentication & Device Trust

| TC ID | Priority | Test Steps | Expected Result | Status |
|---|---|---|---|---|
| MAUTH-001 | Critical | Open `/m/login` → valid email + password → Sign in | JWT + refresh token stored in `@capacitor/preferences`; redirect to `/m/home` | ☐ |
| MAUTH-002 | Critical | Wrong password 1× | Inline "Invalid credentials" (FIX #12 parity with web) | ☐ |
| MAUTH-003 | Major | 5× wrong password | 6th attempt blocked with "Account locked" | ☐ |
| MAUTH-004 | Major | Tap "Forgot password" | Opens in-app browser (`@capacitor/browser`) to web reset flow | ☐ |
| MAUTH-005 | Major | Tap "Sign in with Google" | Opens in-app browser, completes OAuth, deep-links back to app with JWT | ☐ |
| MAUTH-006 | Major | Tap "Sign in with GitHub" | Same as above | ☐ |
| MAUTH-007 | Critical | First login on this device | Device generates `device_id` (UUID) + calls `POST /api/devices/register` | ⏭ (pending Phase 3.9 backend) |
| MAUTH-008 | Critical | Email OTP received for new device | Enter OTP → `POST /api/devices/verify-otp` → `is_trusted=true` | ⏭ (pending Phase 3.9) |
| MAUTH-009 | Major | After trust confirmed | Prompt "Enable Face ID / Fingerprint?" | ☐ |
| MAUTH-010 | Critical | Biometric enrolled on device | Accept → next launch shows biometric prompt before app loads | ☐ |
| MAUTH-011 | Major | Biometric fails 3× | Falls back to password screen | ☐ |
| MAUTH-012 | Major | No biometric hardware / not enrolled | App skips biometric, goes straight to password | ☐ |
| MAUTH-013 | Major | Tap Logout in More menu | JWT cleared from Preferences; redirect to `/m/login`; next `/api/*` call returns 401 | ☐ |
| MAUTH-014 | Major | Expired JWT | Silent refresh via `refresh_token` (per-device rotation) | ☐ |
| MAUTH-015 | Critical | Revoke device from web Profile → Devices | Mobile app's refresh fails; forces re-login | ⏭ (pending Phase 3.9) |
| MAUTH-016 | Major | Login on 2nd device same account | First device remains logged in (per-device refresh tokens) | ⏭ (pending Phase 3.9) |

---

# MODULE 3 — Shell & Navigation

| TC ID | Priority | Test Steps | Expected Result | Status |
|---|---|---|---|---|
| NAV-001 | Major | Login as staff | Bottom tab bar shows: Home · Attendance · Leave · Claims · More | ☐ |
| NAV-002 | Major | Login as manager | Bottom tab bar shows: Home · Approvals · Attendance · Leave · More | ☐ |
| NAV-003 | Major | Tap each tab | Route changes; active tab highlighted; page renders | ☐ |
| NAV-004 | Major | Hardware back button on root tab | Prompts "Exit app?" (or exits) | ☐ |
| NAV-005 | Major | Hardware back button on sub-page | Returns to previous page (not exit) | ☐ |
| NAV-006 | Minor | Scroll long list, switch tab, return | Scroll position reasonable (acceptable to reset) | ☐ |
| NAV-007 | Major | Top bar shows page title from route `data.title` | Matches `mobile.routes.ts` config | ☐ |
| NAV-008 | Minor | Notification bell in top bar shows unread count | Badge correct | ☐ |
| NAV-009 | Major | Tap notification bell | Navigates to `/m/notifications` | ☐ |
| NAV-010 | Major | Open More menu | Lists: Profile, WFH, Payslip, Directory, Documents, Announcements, Logout | ☐ |

---

# MODULE 4 — Home / Dashboard

| TC ID | Priority | Test Steps | Expected Result | Status |
|---|---|---|---|---|
| HOME-001 | Major | Open `/m/home` as staff | Greeting + avatar + today's status card | ☐ |
| HOME-002 | Major | Attendance status card | Shows current clock status (In/Out/Not yet) | ☐ |
| HOME-003 | Minor | Quick actions row | Apply Leave · Clock In · Claim · WFH visible and tappable | ☐ |
| HOME-004 | Minor | Pull-to-refresh | Refreshes data | ☐ |
| HOME-005 | Minor | Upcoming leave / pending approval card | Renders if data exists | ☐ |

---

# MODULE 5 — Attendance ⭐ flagship

| TC ID | Priority | Test Steps | Expected Result | Status |
|---|---|---|---|---|
| MATT-001 | Critical | Tap hero card → open sheet → Clock In | Native location permission prompt → allow → lat/lng captured | ☐ |
| MATT-002 | Critical | Clock in success | `POST /api/attendance/clock-in` returns 201; hero card flips to emerald "Clocked in" | ☐ |
| MATT-003 | Critical | Tap hero again → Clock Out | Attendance record closed; duration computed | ☐ |
| MATT-004 | Major | Second clock-in same day | Blocked with error message | ☐ |
| MATT-005 | Major | Deny location permission | Show explanatory dialog; re-prompt path available via Android Settings | ☐ |
| MATT-006 | Major | Enable mock location (Developer options) | Android reports `isMock=true` → clock-in blocked | ⏭ (pending Phase 3.9) |
| MATT-007 | Major | Outside `office_radius_m` (simulate GPS) | Clock-in rejected: "Outside office radius" | ⏭ (pending Phase 3.9) |
| MATT-008 | Major | `Company.require_biometric_clockin=true` | Biometric prompt appears before POST; cancel aborts flow | ⏭ (pending Phase 3.9) |
| MATT-009 | Major | `Company.require_selfie_clockin=true` | Front camera opens; photo uploaded to Supabase `attendance/selfies/` | ⏭ (pending Phase 3.9 & UI) |
| MATT-010 | Major | Disable network → tap Clock In | Record queued locally (`offline-queue.service.ts`); banner "Will sync when online" | ☐ |
| MATT-011 | Critical | Re-enable network after offline clock-in | Queue drains; record posted; banner clears | ☐ |
| MATT-012 | Major | Select WFH tab in sheet → submit | `POST /api/wfh-applications` (or equivalent) with Pending status | ☐ |
| MATT-013 | Minor | My attendance list | Shows past records with date, type, duration, status badge | ☐ |
| MATT-014 | Minor | Toggle between "Mine" / "All" (if visible) | Permissioned list changes | ☐ |

---

# MODULE 6 — Leave

| TC ID | Priority | Test Steps | Expected Result | Status |
|---|---|---|---|---|
| MLV-001 | Critical | Open `/m/leave` | Tabs for balances + history; list renders | ☐ |
| MLV-002 | Critical | Tap FAB → `/m/leave/apply` | Form with leave type, start/end date (native picker), half-day, reason | ☐ |
| MLV-003 | Critical | Submit valid leave | 201; back to list; new row Pending | ☐ |
| MLV-004 | Major | Half-day toggle | 0.5 day deducted on approval | ☐ |
| MLV-005 | Major | Upload MC (if Sick type requires doc) | Camera/gallery picker; upload OK | ☐ |
| MLV-006 | Major | Unpaid leave (entitlement=0) | Submission succeeds (FIX #2 parity) | ☐ |
| MLV-007 | Major | Open calendar `/m/leave/calendar` | Month view with leave dots; tap a day shows leaves | ☐ |
| MLV-008 | Major | Cancel own pending leave | Status=Cancelled; balance restored | ☐ |
| MLV-009 | Major | Pull-to-refresh on list | Refreshes from API | ☐ |
| MLV-010 | Minor | Leave type requires document and no file attached | Submit blocked client-side | ☐ |

---

# MODULE 7 — Claims (with Receipt Camera) ⭐

| TC ID | Priority | Test Steps | Expected Result | Status |
|---|---|---|---|---|
| MCLM-001 | Critical | Open `/m/claims` | List renders with status badges | ☐ |
| MCLM-002 | Critical | Tap FAB → `/m/claims/submit` | Form: type, amount, date, description, receipt | ☐ |
| MCLM-003 | Critical | Tap "Add receipt" → Camera | Native camera opens (rear), capture → preview inserted | ☐ |
| MCLM-004 | Major | Tap "Add receipt" → Gallery | Photo picker opens; selected image attached | ☐ |
| MCLM-005 | Major | Submit claim | `POST /api/claims` 201; receipt in Supabase `claims/receipts/` | ☐ |
| MCLM-006 | Major | Submit amount exceeding max | Validation error | ☐ |
| MCLM-007 | Major | Open rejected claim detail | Rejection reason visible (FIX #10 parity) | ☐ |
| MCLM-008 | Minor | Swipe-to-refresh list | Refreshes | ☐ |
| MCLM-009 | Major | Deny camera permission | Graceful fallback; can still use Gallery | ☐ |

---

# MODULE 8 — WFH

| TC ID | Priority | Test Steps | Expected Result | Status |
|---|---|---|---|---|
| MWFH-001 | Major | Open `/m/wfh` | List with status badges | ☐ |
| MWFH-002 | Major | Submit WFH application | 201 Pending | ☐ |
| MWFH-003 | Major | Manager approves (from web or approvals tab) | Notification received on staff device | ☐ |

---

# MODULE 9 — Announcements & Directory

| TC ID | Priority | Test Steps | Expected Result | Status |
|---|---|---|---|---|
| MMEM-001 | Major | Open `/m/announcements` | Card feed renders | ☐ |
| MMEM-002 | Major | Tap a memo | `/m/announcements/:id` shows full Quill content (rendered HTML) | ☐ |
| MMEM-003 | Major | Acknowledge memo | Read receipt recorded | ☐ |
| MDIR-001 | Major | Open `/m/directory` | Employee list with search | ☐ |
| MDIR-002 | Major | Tap row | Profile card with call (`tel:`) + email (`mailto:`) actions | ☐ |
| MDIR-003 | Minor | Tap call | Opens native dialer | ☐ |
| MDIR-004 | Minor | Tap email | Opens native mail composer | ☐ |

---

# MODULE 10 — Documents & Payslip

| TC ID | Priority | Test Steps | Expected Result | Status |
|---|---|---|---|---|
| MDOC-001 | Major | Open `/m/documents` | My files list | ☐ |
| MDOC-002 | Major | Tap PDF file | Opens in native viewer (via signed URL + Filesystem/Share) | ☐ |
| MDOC-003 | Major | Tap image file | Inline preview | ☐ |
| MDOC-004 | Major | Staff cannot see another user's file | 403 enforced | ☐ |
| MPAY-001 | Critical | Open `/m/payslip` | List by month | ☐ |
| MPAY-002 | Critical | Tap payslip | PDF download via `@capacitor/filesystem` + Share sheet / native viewer | ☐ |
| MPAY-003 | Minor | Offline: open previously opened payslip | Cached copy available (if caching implemented) | ☐ |

---

# MODULE 11 — Notifications & Push

| TC ID | Priority | Test Steps | Expected Result | Status |
|---|---|---|---|---|
| MNOT-001 | Critical | First login | Permission prompt for notifications (Android 13+) | ☐ |
| MNOT-002 | Critical | Grant permission | `PushNotifications.register()` succeeds; token POSTed to `/api/notifications/device-token` | ☐ |
| MNOT-003 | Critical | Trigger leave-approved from web as manager | Staff device receives FCM push within 10s | ☐ |
| MNOT-004 | Major | Tap push notification (app closed) | Cold-launch → deep link to related entity | ☐ |
| MNOT-005 | Major | Tap push (app backgrounded) | Resume → navigate to related page | ☐ |
| MNOT-006 | Major | Tap push (app foregrounded) | Toast / in-app banner; entity refreshed | ☐ |
| MNOT-007 | Major | Open `/m/notifications` | List renders with accent bars + icons per type | ☐ |
| MNOT-008 | Major | Tap notification | Marks read; count decrements; deep-link works | ☐ |
| MNOT-009 | Major | Mark all as read | All flagged read | ☐ |
| MNOT-010 | Major | Swipe-to-delete | Notification removed | ☐ |
| MNOT-011 | Minor | Pull-to-refresh | List refreshes | ☐ |
| MNOT-012 | Critical | Revoke notification permission in Android Settings | App detects; graceful state; list-only mode still works | ☐ |
| MNOT-013 | Major | Logout | Device token unregistered on backend | ☐ |
| MNOT-014 | Major | Re-login | New token registered | ☐ |

Push-trigger parity with web `NOT-014..021`:

| TC ID | Priority | Trigger | Expected Push | Status |
|---|---|---|---|---|
| MNOTP-001 | Major | Leave approved | Push received | ☐ |
| MNOTP-002 | Major | Leave rejected | Push received | ☐ |
| MNOTP-003 | Major | Claim manager approved/rejected | Push received | ☐ |
| MNOTP-004 | Major | Claim finance approved/rejected | Push received | ☐ |
| MNOTP-005 | Major | WFH approved/rejected | Push received | ☐ |
| MNOTP-006 | Major | Memo published | Push received | ☐ |
| MNOTP-007 | Major | Policy published | Push received | ☐ |
| MNOTP-008 | Major | Team member joined | Manager push received | ☐ |

---

# MODULE 12 — Manager Approvals

| TC ID | Priority | Test Steps | Expected Result | Status |
|---|---|---|---|---|
| MAPP-001 | Critical | Login as manager → Approvals tab | List of pending leaves/claims/WFH with counts | ☐ |
| MAPP-002 | Major | Badge on Approvals tab | Matches total pending | ☐ |
| MAPP-003 | Critical | Swipe-right on row | Approve confirmation → approved | ☐ |
| MAPP-004 | Critical | Swipe-left on row | Reject modal with reason field → rejected | ☐ |
| MAPP-005 | Major | Tap row | Detail page with full context | ☐ |
| MAPP-006 | Minor | Haptic feedback on swipe | Felt on real device | ☐ |
| MAPP-007 | Major | Approve a leave | Notification fires to staff; balance updated | ☐ |

---

# MODULE 13 — Profile & Settings

| TC ID | Priority | Test Steps | Expected Result | Status |
|---|---|---|---|---|
| MPRF-001 | Major | Open `/m/profile` | Avatar, name, role, employment info | ☐ |
| MPRF-002 | Major | Change password | Current + new + confirm → success | ☐ |
| MPRF-003 | Major | Toggle "Enable biometric unlock" | Setting saved in Preferences; effective next launch | ☐ |
| MPRF-004 | Major | Toggle "Receive push notifications" | FCM topic subscription / user pref respected | ☐ |
| MPRF-005 | Major | My devices list (Tier 2) | Shows all trusted devices with last-seen | ⏭ (pending Phase 3.9) |
| MPRF-006 | Major | Revoke a device from profile | Other device forced re-login | ⏭ (pending Phase 3.9) |
| MPRF-007 | Major | Set primary attendance device | Other devices blocked from clock-in | ⏭ (pending Phase 3.9) |

---

# MODULE 14 — Native Platform Behaviour

| TC ID | Priority | Test Steps | Expected Result | Status |
|---|---|---|---|---|
| NAT-001 | Major | Status bar colour + icons legible | Matches `StatusBar` plugin config (white bg, dark icons) | ☐ |
| NAT-002 | Major | Safe-area insets (notch / gesture bar) | No content hidden on Pixel 7 | ☐ |
| NAT-003 | Major | Hardware back button flow | Honours router history across tabs | ☐ |
| NAT-004 | Major | Haptic feedback on key taps | Light impact on primary actions | ☐ |
| NAT-005 | Major | Toggle airplane mode mid-session | Offline banner; queued writes; no crash | ☐ |
| NAT-006 | Major | Restore network | Banner clears; queued writes flushed (attendance offline queue) | ☐ |
| NAT-007 | Major | Dark mode (system) | UI respects theme if enabled | ☐ |
| NAT-008 | Minor | Font scaling (Android accessibility) | Layout adapts without clipping | ☐ |
| NAT-009 | Minor | TalkBack screen reader | Main actions labelled | ☐ |
| NAT-010 | Major | Install over previous version (upgrade) | Preferences retained; no re-login required | ☐ |
| NAT-011 | Major | Uninstall | All data cleared | ☐ |
| NAT-012 | Minor | App icon adaptive (foreground/background) | Renders correctly on Android 12+ circular masks | ☐ |

---

# MODULE 15 — Security & Anti-Impersonation

| TC ID | Priority | Test Steps | Expected Result | Status |
|---|---|---|---|---|
| MSEC-001 | Critical | Inspect network traffic (`mitmproxy`) | All API calls over HTTPS; certificate pinning optional | ☐ |
| MSEC-002 | Critical | `cleartext=false` in `capacitor.config.ts` enforced | Plain-HTTP request rejected | ☐ |
| MSEC-003 | Critical | JWT + refresh token stored in `@capacitor/preferences` | NOT in localStorage/WebStorage (grep WebView storage) | ☐ |
| MSEC-004 | Critical | Logout | Preferences cleared; backend token blacklisted | ☐ |
| MSEC-005 | Critical | Server rejects clock-in if `X-Device-Id` missing/untrusted | 403 with "Device not trusted" | ⏭ (pending Phase 3.9 middleware) |
| MSEC-006 | Critical | Two devices same account — only one primary | 2nd clock-in attempt 403 "Clock-in locked to primary device" | ⏭ (pending Phase 3.9) |
| MSEC-007 | Major | Mock location detected | Clock-in blocked; audit log entry `mock_location_detected=true` | ⏭ (pending Phase 3.9) |
| MSEC-008 | Major | Biometric auth required but device has none enrolled | Clear error; path to enrol guidance | ☐ |
| MSEC-009 | Major | Selfie capture saved with attendance record | Stored in `attendance/selfies/`; admin can review | ⏭ (pending Phase 3.9 UI) |
| MSEC-010 | Major | Rate-limit on `/m/login` attempts | 20/15min rule applied (same as web) | ☐ |
| MSEC-011 | Major | Android backup excluded from `allowBackup` | `AndroidManifest.xml` sets `android:allowBackup="false"` | ☐ |
| MSEC-012 | Minor | Root/jailbreak detection (v2 roadmap) | Warning shown if detected | ⏭ (v2 backlog) |

---

# MODULE 16 — Build & Release

| TC ID | Priority | Test Steps | Expected Result | Status |
|---|---|---|---|---|
| REL-001 | Critical | `npm run build && npx cap sync android` | Web bundle copied into `android/app/src/main/assets/public/` | ☐ |
| REL-002 | Critical | `cd android && ./gradlew assembleDebug` | `app-debug.apk` produced | ☐ |
| REL-003 | Critical | `./gradlew bundleRelease` with signing config | `.aab` produced; signed with `nextura-hrms.keystore` | ☐ |
| REL-004 | Major | Upload `.aab` to Play Console → Internal Testing | Accepted; no Play policy warnings | ☐ |
| REL-005 | Major | Install from Play Internal Testing | App installs + launches | ☐ |
| REL-006 | Minor | App size (`.aab`) | Under 30MB baseline | ☐ |
| REL-007 | Major | Permissions listed in manifest | CAMERA, ACCESS_FINE_LOCATION, INTERNET, POST_NOTIFICATIONS, USE_BIOMETRIC present; nothing extraneous | ☐ |
| REL-008 | Minor | `google-services.json` present in `android/app/` | Yes | ☐ |
| REL-009 | Minor | ProGuard/R8 enabled for release | Shrink + obfuscate active | ☐ |
| REL-010 | Major | Version bump (`versionCode`, `versionName`) | Consistent with Release Notes | ☐ |

---

# CROSS-CUTTING (Mobile)

| TC ID | Priority | Test Steps | Expected Result | Status |
|---|---|---|---|---|
| MXC-001 | Major | Cold start time (low-end device) | <4s to interactive | ☐ |
| MXC-002 | Minor | Warm start time | <1s | ☐ |
| MXC-003 | Major | API error 401 | Auto-refresh via refresh-token interceptor; if refresh fails → redirect `/m/login` | ☐ |
| MXC-004 | Major | API error 403 | "Access denied" toast | ☐ |
| MXC-005 | Major | API error 500 | Generic error; no stack leak | ☐ |
| MXC-006 | Major | Memory leak check (long session) | Heap stable after 30 min of use | ☐ |
| MXC-007 | Minor | Battery drain after 1h idle | Negligible (no wake locks) | ☐ |
| MXC-008 | Major | Permission matrix (camera/location/notifications) denied individually | Feature degrades gracefully per permission | ☐ |
| MXC-009 | Major | Multi-company switcher on mobile | Active company switchable; all data scopes correctly | ☐ |
| MXC-010 | Minor | Log output clean in `adb logcat` (release build) | No `console.log` noise, no PII | ☐ |

---

# EXECUTION PLAN

### Phase 1 — Setup (est. 60 min)
1. Install Android Studio + SDK 34; install Java 17.
2. Connect real device (USB debugging) **and** launch Pixel 5 / Android 12 emulator.
3. Start backend locally (`DISABLE_AUTH_RATE_LIMIT=true npm run dev`) — for emulator use `http://10.0.2.2:3000/api`; for real device use LAN IP in `environment.ts`.
4. `npm run build && npx cap sync android`.
5. `cd android && ./gradlew installDebug` to push app to device.
6. Seed test users (`npm run seed:uat` from `HRMS-API_v1`).

### Phase 2 — Manual UAT Run
1. Execute Modules 1 → 16 on **Pixel 5 (Android 12)** — primary target.
2. Spot-check Modules 5 (Attendance), 11 (Push), 13 (Profile) on **Android 9 emulator** + **Android 14 real device**.
3. Capture screenshots of every ❌ / ⚠ into `HRMS_v1/dev_resources/uat-mobile-evidence/<run-id>/`.
4. Record `adb logcat` for the duration; archive alongside evidence.

### Phase 3 — API-level Checks (reuse)
1. From `HRMS_v1`: `npx playwright test` — the existing web suite exercises every backend endpoint the mobile app calls, so green = mobile network layer green.
2. Re-run if backend changes land during the UAT window.

### Phase 4 — Results & Triage
1. Update the Status column on every TC.
2. Log defects in Issue Log below with `adb logcat` snippet + screenshot.
3. Share with stakeholder.

---

# EXECUTION RESULTS — Run 1

> _Populate after the first pass. Template matches `UAT-Web.md` for diffability._

## Summary

| Metric | Run 1 |
|---|---|
| Total cases | 183 |
| Passed | — |
| Failed | — |
| Blocked (Phase 3.9 pending) | 14 |
| Manual skipped | — |
| Duration | — |

## Coverage note

The mobile suite is **predominantly manual**. Native APIs (camera, biometric, geolocation, push receipt, offline queue) cannot be driven by Playwright. The API-level backbone is verified indirectly by the web Playwright suite; the mobile-specific value is in the native layer + UX flows.

Items marked ⏭ **(pending Phase 3.9)** depend on the Anti-Impersonation backend work described in `HRMS_App/Mobile App Setup.md §3.9`. They should be executed once `user_devices` + `requireTrustedDevice` + geofence config are deployed.

## Status rollup

_Fill after execution._

---

# ISSUE LOG (Open)

| # | TC ID | Module | Severity | Description | Status |
|---|---|---|---|---|---|
| — | — | — | — | _None yet — awaiting first run_ | — |

---

# SIGN-OFF

| Role | Name | Signature | Date |
|---|---|---|---|
| QA Lead |  |  |  |
| Product Owner |  |  |  |
| Tech Lead |  |  |  |
| Stakeholder |  |  |  |

---

**Document revision history**

| Version | Date | Author | Changes |
|---|---|---|---|
| 1.0 | 2026-04-23 | Generated | Initial mobile UAT derived from `UAT-Web.md` v1.0 + `HRMS_App/Mobile App Setup.md` Tier 1 & Tier 2 scope |
