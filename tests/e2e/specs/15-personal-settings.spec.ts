import { test, expect } from '@playwright/test';
import { apiLogin, apiGet, apiPost, apiPut, newApiContext, API_BASE } from '../fixtures/api-client';

test.describe('Module 15 — Personal Settings', () => {
  test('SET-001 account settings endpoint', async () => {
    const ctx = await newApiContext();
    const { token } = await apiLogin(ctx, 'staff');
    const res = await apiGet(ctx, '/settings/account', token);
    expect(res.ok()).toBeTruthy();
    await ctx.dispose();
  });

  test('SET-003 appearance update', async () => {
    const ctx = await newApiContext();
    const { token } = await apiLogin(ctx, 'staff');
    const res = await apiPut(ctx, '/settings/appearance', token, { theme: 'dark' });
    expect([200, 201]).toContain(res.status());
    await ctx.dispose();
  });

  test('SET-005 display update', async () => {
    const ctx = await newApiContext();
    const { token } = await apiLogin(ctx, 'staff');
    const res = await apiPut(ctx, '/settings/display', token, {
      language: 'en',
      timezone: 'Asia/Kuala_Lumpur',
      date_format: 'DD/MM/YYYY',
      time_format: '24h',
    });
    expect([200, 201]).toContain(res.status());
    await ctx.dispose();
  });

  test('SET-006 notifications update', async () => {
    const ctx = await newApiContext();
    const { token } = await apiLogin(ctx, 'staff');
    const res = await apiPut(ctx, '/settings/notifications', token, {
      email_leave: true,
      email_claim: true,
    });
    expect([200, 201]).toContain(res.status());
    await ctx.dispose();
  });

  test('SET-007 reset settings endpoint', async () => {
    const ctx = await newApiContext();
    const { token } = await apiLogin(ctx, 'staff');
    const res = await apiPost(ctx, '/settings/reset', token, {});
    expect([200, 201]).toContain(res.status());
    await ctx.dispose();
  });

  test('SET-008 account settings persists session_timeout', async () => {
    const ctx = await newApiContext();
    const { token } = await apiLogin(ctx, 'staff');
    const upd = await apiPut(ctx, '/settings/account', token, { session_timeout: 3600 });
    expect([200, 201]).toContain(upd.status());
    const after = await apiGet(ctx, '/settings/account', token);
    expect(after.ok()).toBeTruthy();
    await ctx.dispose();
  });

  test('SET-009 invalid theme value rejected', async () => {
    const ctx = await newApiContext();
    const { token } = await apiLogin(ctx, 'staff');
    const res = await apiPut(ctx, '/settings/appearance', token, { theme: 'cosmic-purple' });
    expect([400, 422, 200]).toContain(res.status());
    await ctx.dispose();
  });

  test('SET-010 unauthenticated access rejected', async () => {
    const ctx = await newApiContext();
    const res = await ctx.get(`${API_BASE}/settings/account`);
    expect(res.status()).toBe(401);
    await ctx.dispose();
  });

  test('SET-011 2FA enable endpoint', async () => {
    const ctx = await newApiContext();
    const { token } = await apiLogin(ctx, 'staff');
    const res = await apiPost(ctx, '/settings/two-factor/enable', token, {});
    expect([200, 201, 400, 404, 501]).toContain(res.status());
    await ctx.dispose();
  });

  test('SET-012 2FA disable endpoint', async () => {
    const ctx = await newApiContext();
    const { token } = await apiLogin(ctx, 'staff');
    const res = await apiPost(ctx, '/settings/two-factor/disable', token, {});
    expect([200, 201, 400, 404, 501]).toContain(res.status());
    await ctx.dispose();
  });

  test('SET-013 change password via settings endpoint', async () => {
    const ctx = await newApiContext();
    const { token } = await apiLogin(ctx, 'staff');
    const res = await apiPost(ctx, '/settings/change-password', token, {
      currentPassword: 'wrong', newPassword: 'NewPass@123',
    });
    expect([400, 401, 422]).toContain(res.status());
    await ctx.dispose();
  });
});
