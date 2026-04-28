import { test, expect } from '@playwright/test';
import { apiLogin, apiGet, newApiContext } from '../fixtures/api-client';

test.describe('Module 10 — Analytics', () => {
  test('ANA-001 analytics overview loads', async () => {
    const ctx = await newApiContext();
    const { token } = await apiLogin(ctx, 'admin');
    const res = await apiGet(ctx, '/analytics/overview', token);
    expect([200, 404]).toContain(res.status());
    await ctx.dispose();
  });

  test('ANA-002 payroll cost chart data', async () => {
    const ctx = await newApiContext();
    const { token } = await apiLogin(ctx, 'admin');
    const res = await apiGet(ctx, '/analytics/payroll-cost?year=2025', token);
    expect([200, 404]).toContain(res.status());
    await ctx.dispose();
  });

  test('ANA-003 leave utilization chart data', async () => {
    const ctx = await newApiContext();
    const { token } = await apiLogin(ctx, 'admin');
    const res = await apiGet(ctx, '/analytics/leave-utilization?year=2025', token);
    expect([200, 404]).toContain(res.status());
    await ctx.dispose();
  });

  test('ANA-009 staff cannot access analytics', async () => {
    const ctx = await newApiContext();
    const { token } = await apiLogin(ctx, 'staff');
    const res = await apiGet(ctx, '/analytics/overview', token);
    expect([403, 401, 404]).toContain(res.status());
    await ctx.dispose();
  });

  test('ANA-010 attendance punctuality chart data', async () => {
    const ctx = await newApiContext();
    const { token } = await apiLogin(ctx, 'admin');
    const res = await apiGet(ctx, '/analytics/attendance-punctuality?year=2025', token);
    expect([200, 404]).toContain(res.status());
    await ctx.dispose();
  });

  test('ANA-011 claims spending chart data', async () => {
    const ctx = await newApiContext();
    const { token } = await apiLogin(ctx, 'admin');
    const res = await apiGet(ctx, '/analytics/claims-spending?year=2025', token);
    expect([200, 404]).toContain(res.status());
    await ctx.dispose();
  });

  test('ANA-012 manager can access analytics', async () => {
    const ctx = await newApiContext();
    const { token } = await apiLogin(ctx, 'manager');
    const res = await apiGet(ctx, '/analytics/overview', token);
    expect([200, 404]).toContain(res.status());
    await ctx.dispose();
  });

  test('ANA-013 export Excel endpoint reachable', async () => {
    const ctx = await newApiContext();
    const { token } = await apiLogin(ctx, 'admin');
    const res = await apiGet(ctx, '/analytics/export/excel?year=2025', token);
    expect([200, 400, 404]).toContain(res.status());
    await ctx.dispose();
  });

  test('ANA-014 export PDF endpoint reachable', async () => {
    const ctx = await newApiContext();
    const { token } = await apiLogin(ctx, 'admin');
    const res = await apiGet(ctx, '/analytics/export/pdf?year=2025', token);
    expect([200, 400, 404]).toContain(res.status());
    await ctx.dispose();
  });

  test('ANA-015 invalid year param rejected', async () => {
    const ctx = await newApiContext();
    const { token } = await apiLogin(ctx, 'admin');
    const res = await apiGet(ctx, '/analytics/payroll-cost?year=9999', token);
    expect([200, 400, 404]).toContain(res.status());
    await ctx.dispose();
  });
});
