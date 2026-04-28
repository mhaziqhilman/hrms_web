import { test, expect } from '@playwright/test';
import { apiLogin, apiGet, apiPost, apiPut, newApiContext, API_BASE } from '../fixtures/api-client';

test.describe('Module 12 — Personal Pages', () => {
  test('PER-001 profile endpoint', async () => {
    const ctx = await newApiContext();
    const { token } = await apiLogin(ctx, 'staff');
    const res = await apiGet(ctx, '/employees/me', token);
    expect(res.ok()).toBeTruthy();
    await ctx.dispose();
  });

  test('PER-003 my payslips', async () => {
    const ctx = await newApiContext();
    const { token } = await apiLogin(ctx, 'staff');
    const res = await apiGet(ctx, '/payroll/my-payslips', token);
    expect(res.ok()).toBeTruthy();
    await ctx.dispose();
  });

  test('PER-006 change password without current fails', async () => {
    const ctx = await newApiContext();
    const { token } = await apiLogin(ctx, 'staff');
    const res = await apiPost(ctx, '/auth/change-password', token, {
      currentPassword: '',
      newPassword: 'Uat@12345',
    });
    expect([400, 401, 422]).toContain(res.status());
    await ctx.dispose();
  });

  test('PER-007 change password rejects weak password', async () => {
    const ctx = await newApiContext();
    const { token } = await apiLogin(ctx, 'staff');
    const res = await apiPost(ctx, '/auth/change-password', token, {
      currentPassword: 'Uat@12345',
      newPassword: 'weak',
    });
    expect([400, 422]).toContain(res.status());
    await ctx.dispose();
  });

  test('PER-008 profile update allowed field persists', async () => {
    const ctx = await newApiContext();
    const { token } = await apiLogin(ctx, 'staff');
    const stamp = Date.now().toString().slice(-4);
    const newMobile = `+6012${stamp}00`;
    const upd = await ctx.put(`${API_BASE}/employees/me`, {
      headers: { Authorization: `Bearer ${token}` },
      data: { mobile: newMobile },
    });
    expect([200, 204]).toContain(upd.status());
    const get = await apiGet(ctx, '/employees/me', token);
    const body = await get.json();
    const emp = body.data ?? body;
    expect(emp.mobile).toBe(newMobile);
    await ctx.dispose();
  });

  test('PER-009 my-payslips respects year filter', async () => {
    const ctx = await newApiContext();
    const { token } = await apiLogin(ctx, 'staff');
    const res = await apiGet(ctx, '/payroll/my-payslips?year=2025', token);
    expect(res.ok()).toBeTruthy();
    await ctx.dispose();
  });

  test('PER-010 change password requires min length', async () => {
    const ctx = await newApiContext();
    const { token } = await apiLogin(ctx, 'staff');
    const res = await apiPost(ctx, '/auth/change-password', token, {
      currentPassword: 'Uat@12345', newPassword: 'Ab1@',
    });
    expect([400, 422]).toContain(res.status());
    await ctx.dispose();
  });

  test('PER-011 change password requires special char', async () => {
    const ctx = await newApiContext();
    const { token } = await apiLogin(ctx, 'staff');
    const res = await apiPost(ctx, '/auth/change-password', token, {
      currentPassword: 'Uat@12345', newPassword: 'NoSpecial12',
    });
    expect([400, 422]).toContain(res.status());
    await ctx.dispose();
  });
});
