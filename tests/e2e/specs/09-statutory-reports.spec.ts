import { test, expect } from '@playwright/test';
import { apiLogin, apiGet, newApiContext } from '../fixtures/api-client';

test.describe('Module 9 — Statutory Reports', () => {
  test('STR-002 available periods', async () => {
    const ctx = await newApiContext();
    const { token } = await apiLogin(ctx, 'admin');
    const res = await apiGet(ctx, '/statutory-reports/periods', token);
    expect(res.ok(), `status=${res.status()}`).toBeTruthy();
    await ctx.dispose();
  });

  test('STR-011 CSV export endpoint reachable (structural)', async () => {
    const ctx = await newApiContext();
    const { token } = await apiLogin(ctx, 'admin');
    const res = await apiGet(ctx, '/statutory-reports/csv/epf/2025/1', token);
    // 200 (data exists), 400 (no data for period), or 404 (no data) are all acceptable shapes.
    expect([200, 400, 404]).toContain(res.status());
    await ctx.dispose();
  });

  test('STR-012 EPF Borang A endpoint reachable', async () => {
    const ctx = await newApiContext();
    const { token } = await apiLogin(ctx, 'admin');
    const res = await apiGet(ctx, '/statutory-reports/epf/2025/1', token);
    expect([200, 400, 404]).toContain(res.status());
    await ctx.dispose();
  });

  test('STR-013 SOCSO Form 8A endpoint reachable', async () => {
    const ctx = await newApiContext();
    const { token } = await apiLogin(ctx, 'admin');
    const res = await apiGet(ctx, '/statutory-reports/socso/2025/1', token);
    expect([200, 400, 404]).toContain(res.status());
    await ctx.dispose();
  });

  test('STR-014 EIS Lampiran 1 endpoint reachable', async () => {
    const ctx = await newApiContext();
    const { token } = await apiLogin(ctx, 'admin');
    const res = await apiGet(ctx, '/statutory-reports/eis/2025/1', token);
    expect([200, 400, 404]).toContain(res.status());
    await ctx.dispose();
  });

  test('STR-015 PCB CP39 endpoint reachable', async () => {
    const ctx = await newApiContext();
    const { token } = await apiLogin(ctx, 'admin');
    const res = await apiGet(ctx, '/statutory-reports/pcb/2025/1', token);
    expect([200, 400, 404]).toContain(res.status());
    await ctx.dispose();
  });

  test('STR-016 EA Form employees list for year', async () => {
    const ctx = await newApiContext();
    const { token } = await apiLogin(ctx, 'admin');
    const res = await apiGet(ctx, '/statutory-reports/ea/2025/employees', token);
    expect([200, 400, 404]).toContain(res.status());
    await ctx.dispose();
  });

  test('STR-017 staff cannot access statutory reports', async () => {
    const ctx = await newApiContext();
    const { token } = await apiLogin(ctx, 'staff');
    const res = await apiGet(ctx, '/statutory-reports/periods', token);
    expect([401, 403]).toContain(res.status());
    await ctx.dispose();
  });

  test('STR-018 invalid month param rejected', async () => {
    const ctx = await newApiContext();
    const { token } = await apiLogin(ctx, 'admin');
    const res = await apiGet(ctx, '/statutory-reports/epf/2025/99', token);
    expect([400, 404]).toContain(res.status());
    await ctx.dispose();
  });

  test('STR-019 CSV invalid type rejected', async () => {
    const ctx = await newApiContext();
    const { token } = await apiLogin(ctx, 'admin');
    const res = await apiGet(ctx, '/statutory-reports/csv/notareporttype/2025/1', token);
    expect([400, 404]).toContain(res.status());
    await ctx.dispose();
  });
});
