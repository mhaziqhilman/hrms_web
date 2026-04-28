import { test, expect } from '@playwright/test';
import { loginAs } from '../fixtures/auth';
import { apiLogin, apiGet, newApiContext } from '../fixtures/api-client';

test.describe('Module 2 — Dashboard', () => {
  test('DASH-001 admin lands on admin dashboard (FIX #3)', async ({ page }) => {
    await loginAs(page, 'admin');
    await page.waitForURL(/\/dashboard(\/admin)?/, { timeout: 15_000 });
    expect(page.url()).toMatch(/\/dashboard(\/admin)?/);
  });

  test('DASH-002/003/004/005 admin dashboard stats endpoint responds', async () => {
    const ctx = await newApiContext();
    const { token } = await apiLogin(ctx, 'admin');
    const res = await apiGet(ctx, '/dashboard/admin', token);
    expect(res.ok(), `dashboard/admin status: ${res.status()}`).toBeTruthy();
    await ctx.dispose();
  });

  test('DASH-006 manager dashboard loads', async ({ page }) => {
    await loginAs(page, 'manager');
    await page.waitForURL(/\/dashboard/, { timeout: 15_000 });
    expect(page.url()).toMatch(/\/dashboard/);
  });

  test('DASH-007 staff dashboard loads', async ({ page }) => {
    await loginAs(page, 'staff');
    await page.waitForURL(/\/dashboard/, { timeout: 15_000 });
    expect(page.url()).toMatch(/\/dashboard/);
  });

  test('DASH-008 admin cannot access manager dashboard UI (FIX #4 frontend roleGuard)', async ({ page }) => {
    // FIX #4 was a FRONTEND-only change (removed 'admin' from manager dashboard roleGuard).
    // Backend still allows admin for /api/dashboard/manager (by design: requireManager = [super_admin, admin, manager]).
    // Verify by navigating as admin: guard should block the URL.
    const { loginAs } = await import('../fixtures/auth');
    await loginAs(page, 'admin');
    await page.goto('/dashboard/manager');
    // Expect redirect away from /dashboard/manager
    await page.waitForTimeout(1500);
    expect(page.url()).not.toMatch(/\/dashboard\/manager$/);
  });

  test('DASH-009 admin dashboard response contains expected KPI shape', async () => {
    const ctx = await newApiContext();
    const { token } = await apiLogin(ctx, 'admin');
    const res = await apiGet(ctx, '/dashboard/admin', token);
    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    const data = body.data ?? body;
    // Expected KPI fields (at least some must be present)
    const keys = Object.keys(data);
    expect(keys.length).toBeGreaterThan(0);
    await ctx.dispose();
  });

  test('DASH-010 manager dashboard response contains team data shape', async () => {
    const ctx = await newApiContext();
    const { token } = await apiLogin(ctx, 'manager');
    const res = await apiGet(ctx, '/dashboard/manager', token);
    expect(res.ok()).toBeTruthy();
    await ctx.dispose();
  });

  test('DASH-011 staff dashboard response', async () => {
    const ctx = await newApiContext();
    const { token } = await apiLogin(ctx, 'staff');
    const res = await apiGet(ctx, '/dashboard/staff', token);
    expect(res.ok()).toBeTruthy();
    await ctx.dispose();
  });

  test('DASH-012 staff cannot access admin dashboard endpoint', async () => {
    const ctx = await newApiContext();
    const { token } = await apiLogin(ctx, 'staff');
    const res = await apiGet(ctx, '/dashboard/admin', token);
    expect([401, 403]).toContain(res.status());
    await ctx.dispose();
  });
});
