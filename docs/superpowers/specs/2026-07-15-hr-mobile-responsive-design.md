# HRMS — Responsive Desktop Shell for Mobile Browsers

**Date:** 2026-07-15
**Status:** Design approved, pending implementation
**Scope:** HRMS frontend (hr.nextura.my, Angular 21, TailwindCSS 4, ZardUI)
**Decision:** Path B — make the desktop shell responsive. **Hard constraint: zero
change to the desktop (≥768px) view.** Every change is `md:`-prefixed or only
active below `md:`, so it is inert at desktop widths.

---

## Problem

On a phone browser, hr.nextura.my is unusable while the Hub and PM look good. The
viewport meta tag is present and correct — the app is not un-scaled, it is
laid out for desktop only in the shell.

### Root cause (verified 2026-07-14)

The sidebar is an unconditional, inline-styled, non-shrinking 250px column:

- `shared/layouts/main-layout/main-layout.component.html` renders
  `<z-sidebar [zWidth]="250" ...>`; `shared/components/layout/sidebar.component.ts`
  emits `<aside [style.width.px]="currentWidth()">` and `layout.variants.ts`
  `sidebarVariants` includes `shrink-0`.
- Width is an **inline style** (Tailwind can't override without `!important`), it
  **won't shrink**, and there is **no mobile handling** (no drawer, no hamburger,
  no `hidden md:block`). On a 390px phone: 250px sidebar + ~140px of content.

The rest of the app is already substantially responsive — 61% of templates and
78% of `grid-cols` declarations use breakpoints; dialogs are already mobile-safe
(`max-w-[calc(100%-2rem)] sm:max-w-[425px]`); no monster fixed widths; global CSS
is clean (no `min-width` on html/body). So this is a **small central fix, not a
70-template sweep.**

### Why not Path A (route to /m)

A complete 16-page mobile app exists at `/m` but only Capacitor-native reaches
it. Routing phone browsers there was considered and rejected: `/m` covers only
employee self-service, so admin/manager functions would still hit the desktop
shell on a phone. Path B covers all pages.

---

## Design

All items are additive at `< md:` or `md:`-prefixed; desktop rendering is
byte-for-byte unchanged.

### 1. Sidebar → off-canvas drawer below `md:`

- **≥ md:** unchanged — the 250px `z-sidebar` renders exactly as today.
- **< md:** hide the inline sidebar; render it inside the existing
  `shared/components/sheet/` (off-canvas drawer) instead.
- Add a **hamburger button in the top nav, visible only `< md:`**
  (`md:hidden`), that opens the drawer. Close on nav/route change and on
  backdrop tap.
- The drawer reuses the same sidebar content/nav so there is one source of truth.

### 2. Central padding — one line

- In `main-layout.component.ts` `contentWrapperClass()`, change `p-6` → `p-4 md:p-6`
  across the `wide`/`reading`/`full` tiers. `max-w-[1600px]` etc. are maximums,
  already inert below 1600px. Improves every page at once; desktop identical.

### 3. Popover widths that overflow small phones

- Notification dropdown (`main-layout.component.html`) and feedback FAB
  (`shared/components/feedback-widget/feedback-widget.component.html`):
  `w-[380px]` → `w-[min(380px,calc(100vw-2rem))]`. Desktop identical (380px wins
  above ~412px viewport).

### 4. Table overflow — fix once, centrally

- The shared table is an attribute directive on `<table>`
  (`shared/components/table/table.component.ts`, `selector: 'table[z-table]'`)
  and `tableVariants` starts `w-full` with no scroll container, so all 25 list
  pages can overflow horizontally on a phone.
- **Fix `tableVariants` (or the directive host) once** to emit/scroll inside an
  `overflow-x-auto` container, rather than wrapping 25 call sites by hand.
  Desktop unaffected (content fits, nothing to scroll).

### 5. Collapse multi-column grids on phones

- 39 bare `grid-cols-3..6` declarations (~20 files; worst: leave-dashboard,
  leave-calendar, manager-dashboard, admin-dashboard, settings-page) → prefix
  with `grid-cols-1` (or `2`) and keep the existing count behind `md:`, e.g.
  `grid-cols-3` → `grid-cols-1 md:grid-cols-3`. Mechanical; desktop identical.

---

## Phasing (single spec, internal order)

- **Phase 1 (usable):** items 1–3 — drawer, padding, popover widths (~4 files).
- **Phase 2 (good):** items 4–5 — table scroll fix and grid collapse.

---

## Verification

- On a 390px viewport (device emulation): the sidebar is hidden, a hamburger
  opens the drawer, content uses the full width, list pages scroll their tables
  horizontally instead of blowing out the layout, dashboards stack to one column.
- On a ≥768px viewport: pixel-diff against current — **no visual change**
  (sidebar 250px, `p-6`, 380px popovers, multi-column grids, tables as today).
- Spot-check the heaviest pages: employee-list, payroll-list, claim-list,
  leave-dashboard, admin-dashboard, settings-page.

## Non-goals

- No change to the desktop layout, spacing, or component sizing.
- No change to the native `/m` mobile app or its routing.
- Not adopting `/m` for browser mobile (Path A rejected — coverage gap).
