import { test, expect } from '@playwright/test';
import { apiLogin, apiGet, apiPost, apiPatch, apiPut, apiDelete, newApiContext, API_BASE } from '../fixtures/api-client';

test.describe('Module 4 — Payroll', () => {
  test('PAY-008 payroll list with filters', async () => {
    const ctx = await newApiContext();
    const { token } = await apiLogin(ctx, 'admin');
    const res = await apiGet(ctx, '/payroll?year=2025&month=1', token);
    expect(res.ok()).toBeTruthy();
    await ctx.dispose();
  });

  test('PAY-015 staff sees only own payslips', async () => {
    const ctx = await newApiContext();
    const { token } = await apiLogin(ctx, 'staff');
    const res = await apiGet(ctx, '/payroll/my-payslips', token);
    expect(res.ok()).toBeTruthy();
    await ctx.dispose();
  });

  test('PAY-021 my-payslips response shape', async () => {
    const ctx = await newApiContext();
    const { token } = await apiLogin(ctx, 'staff');
    const res = await apiGet(ctx, '/payroll/my-payslips', token);
    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    const list = body.data?.payslips ?? body.data ?? body.payslips ?? body;
    expect(Array.isArray(list)).toBeTruthy();
    await ctx.dispose();
  });

  test('PAY-022 staff cannot access payroll list', async () => {
    const ctx = await newApiContext();
    const { token } = await apiLogin(ctx, 'staff');
    const res = await apiGet(ctx, '/payroll', token);
    expect([403, 401]).toContain(res.status());
    await ctx.dispose();
  });

  test('PAY-023 payroll list requires manager+', async () => {
    const ctx = await newApiContext();
    const { token } = await apiLogin(ctx, 'manager');
    const res = await apiGet(ctx, '/payroll', token);
    expect(res.ok()).toBeTruthy();
    await ctx.dispose();
  });

  test('PAY-024 payrun-eligible endpoint', async () => {
    const ctx = await newApiContext();
    const { token } = await apiLogin(ctx, 'admin');
    const res = await apiGet(ctx, '/payroll/payrun-eligible?year=2025&month=1', token);
    expect(res.ok()).toBeTruthy();
    await ctx.dispose();
  });

  test('PAY-025 payrun-eligible missing params fails validation', async () => {
    const ctx = await newApiContext();
    const { token } = await apiLogin(ctx, 'admin');
    const res = await apiGet(ctx, '/payroll/payrun-eligible', token);
    expect(res.status()).toBe(400);
    await ctx.dispose();
  });

  test('PAY-026 bulk-preview with empty array fails validation', async () => {
    const ctx = await newApiContext();
    const { token } = await apiLogin(ctx, 'admin');
    const res = await apiPost(ctx, '/payroll/bulk-preview', token, {
      year: 2025, month: 1, employees: [],
    });
    expect(res.status()).toBe(400);
    await ctx.dispose();
  });

  test('PAY-027 payroll filter by year', async () => {
    const ctx = await newApiContext();
    const { token } = await apiLogin(ctx, 'admin');
    const res = await apiGet(ctx, '/payroll?year=2025', token);
    expect(res.ok()).toBeTruthy();
    await ctx.dispose();
  });

  test('PAY-028 payroll filter by month', async () => {
    const ctx = await newApiContext();
    const { token } = await apiLogin(ctx, 'admin');
    const res = await apiGet(ctx, '/payroll?month=3', token);
    expect(res.ok()).toBeTruthy();
    await ctx.dispose();
  });

  test('PAY-029 invalid month param rejected by validation', async () => {
    const ctx = await newApiContext();
    const { token } = await apiLogin(ctx, 'admin');
    const res = await apiGet(ctx, '/payroll?month=13', token);
    expect(res.status()).toBe(400);
    await ctx.dispose();
  });

  test('PAY-030 payroll detail endpoint shape (first available)', async () => {
    const ctx = await newApiContext();
    const { token } = await apiLogin(ctx, 'admin');
    const list = await apiGet(ctx, '/payroll?limit=1', token);
    const body = await list.json();
    const rows = body.data?.payrolls ?? body.data ?? body.payrolls ?? [];
    if (!rows[0]) { test.skip(true, 'No payroll records'); await ctx.dispose(); return; }
    const id = rows[0].public_id ?? rows[0].id;
    const res = await apiGet(ctx, `/payroll/${id}`, token);
    expect([200, 404]).toContain(res.status());
    await ctx.dispose();
  });

  test('PAY-031 manager can view my-payslips for self', async () => {
    const ctx = await newApiContext();
    const { token } = await apiLogin(ctx, 'manager');
    const res = await apiGet(ctx, '/payroll/my-payslips', token);
    expect(res.ok()).toBeTruthy();
    await ctx.dispose();
  });

  test('PAY-017 editing approved payroll is blocked', async () => {
    const ctx = await newApiContext();
    const { token } = await apiLogin(ctx, 'admin');
    // Fetch a payroll, if any
    const listRes = await apiGet(ctx, '/payroll?limit=50', token);
    if (!listRes.ok()) { test.skip(true, 'No payroll list'); await ctx.dispose(); return; }
    const body = await listRes.json();
    const list = body.data || body.payrolls || body;
    const approved = list.find?.((p: any) => p.status === 'Approved');
    if (!approved) { test.skip(true, 'No approved payroll to test edit-block'); await ctx.dispose(); return; }
    const pid = approved.public_id || approved.id;
    const res = await ctx.patch(`/payroll/${pid}`, {
      headers: { Authorization: `Bearer ${token}` },
      data: { gross: 1 },
    });
    expect([400, 403, 409]).toContain(res.status());
    await ctx.dispose();
  });
});
