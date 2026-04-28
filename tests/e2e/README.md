# HRMS E2E Tests (Playwright)

Automates the UAT cases in [`dev_resources/UAT-Web.md`](../../dev_resources/UAT-Web.md).

## Setup (one-time)

1. **Install Playwright browsers** (already done):
   ```bash
   npx playwright install chromium
   ```
2. **Seed UAT users** (from `HRMS-API_v1/`):
   ```bash
   npm run seed:uat
   ```
   Creates:
   - Company: `UAT Test Company` (registration `UAT-2026-001`)
   - Users: `uat.admin@nextura.test`, `uat.manager@nextura.test`, `uat.staff@nextura.test` — all password `Uat@12345`
   - Employees with reporting line `uat.staff → uat.manager`

3. **Start backend with rate-limit bypass** (required — auth limiter is 20/15min):
   ```bash
   cd HRMS-API_v1
   DISABLE_AUTH_RATE_LIMIT=true npm run dev
   ```
   Or on Windows PowerShell:
   ```powershell
   $env:DISABLE_AUTH_RATE_LIMIT="true"; npm run dev
   ```

4. **Start frontend:**
   ```bash
   cd HRMS_v1
   npm start
   ```

## Run

```bash
cd HRMS_v1
npm run test:e2e              # headless, full suite
npm run test:e2e:headed       # watch browser
npm run test:e2e:ui           # interactive UI mode
npm run test:e2e:report       # open last HTML report
```

## Structure

- `fixtures/` — shared helpers (login, API client, users, token cache)
- `global-setup.ts` — pre-logs in all 4 roles once to reduce auth requests
- `specs/01-auth.spec.ts` … `specs/17-cross-cutting.spec.ts` — one spec file per module
- `html-report/` — generated HTML report (not committed)
- `test-results/` — raw artefacts (traces, screenshots) — not committed

## Artefacts on failure

- **Screenshot** — `test-results/<test-name>/test-failed-1.png`
- **Video** — `test-results/<test-name>/video.webm`
- **Trace** — `test-results/<test-name>/trace.zip` — open with `npx playwright show-trace <path>`
