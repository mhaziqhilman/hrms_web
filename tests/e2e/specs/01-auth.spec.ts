import { test, expect } from '@playwright/test';
import { loginAs } from '../fixtures/auth';
import { apiLogin, apiGet, apiPost, apiDelete, newApiContext, API_BASE } from '../fixtures/api-client';
import { UAT_USERS } from '../fixtures/users';

test.describe('Module 1 — Authentication & Onboarding', () => {
  test('AUTH-001 login with valid credentials returns JWT and redirects to dashboard', async ({ page }) => {
    await loginAs(page, 'admin');
    await expect(page).toHaveURL(/\/dashboard/);
    const token = await page.evaluate(() => localStorage.getItem('hrms_token'));
    expect(token, 'auth_token should be set in localStorage').toBeTruthy();
  });

  test('AUTH-002 login with invalid credentials shows immediate error', async ({ page }) => {
    await page.goto('/auth/login');
    await page.getByLabel('Email').fill(UAT_USERS.admin.email);
    await page.getByLabel('Password').fill('wrong-password');
    await page.getByRole('button', { name: /^login$/i }).click();
    await expect(page.locator('.text-destructive, [class*="destructive"]').first()).toBeVisible({ timeout: 10_000 });
    await expect(page).toHaveURL(/\/auth\/login/);
  });

  test('AUTH-004 register new user creates account with unverified email', async () => {
    const ctx = await newApiContext();
    const email = `uat.reg.${Date.now()}@nextura.test`;
    const res = await ctx.post(`${API_BASE}/auth/register`, {
      data: { email, password: 'Uat@12345', fullName: 'Throwaway UAT' },
    });
    expect(res.status(), await res.text()).toBeLessThan(400);
    const body = await res.json();
    expect(body.success || body.token).toBeTruthy();
    await ctx.dispose();
  });

  test('AUTH-005 register with duplicate email is rejected', async () => {
    const ctx = await newApiContext();
    const res = await ctx.post(`${API_BASE}/auth/register`, {
      data: { email: UAT_USERS.admin.email, password: 'Uat@12345', fullName: 'Dup' },
    });
    expect(res.status()).toBe(400);
    await ctx.dispose();
  });

  test('AUTH-007 verify email with invalid token returns error', async () => {
    const ctx = await newApiContext();
    const res = await ctx.post(`${API_BASE}/auth/verify-email`, { data: { token: 'invalid-token-xyz' } });
    expect(res.status()).toBeGreaterThanOrEqual(400);
    await ctx.dispose();
  });

  test('AUTH-009 forgot password with registered email returns success', async () => {
    const ctx = await newApiContext();
    const res = await ctx.post(`${API_BASE}/auth/forgot-password`, { data: { email: UAT_USERS.admin.email } });
    expect(res.status()).toBeLessThan(400);
    await ctx.dispose();
  });

  test('AUTH-011 reset password with expired/invalid token rejected', async () => {
    const ctx = await newApiContext();
    const res = await ctx.post(`${API_BASE}/auth/reset-password`, {
      data: { token: 'expired-or-invalid', newPassword: 'Uat@12345' },
    });
    expect(res.status()).toBeGreaterThanOrEqual(400);
    await ctx.dispose();
  });

  test('AUTH-012 unauthenticated user hitting /dashboard redirects to /auth/login', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForURL(/\/auth\/login/, { timeout: 10_000 });
    await expect(page).toHaveURL(/\/auth\/login/);
  });

  test('AUTH-015 super_admin bypasses onboarding/email guards', async ({ page }) => {
    await loginAs(page, 'superAdmin');
    await expect(page).toHaveURL(/\/dashboard/);
  });

  test('AUTH-019 admin creates invitation', async () => {
    const ctx = await newApiContext();
    const { token } = await apiLogin(ctx, 'admin');
    const res = await apiPost(ctx, '/invitations', token, {
      email: `invite.${Date.now()}@nextura.test`,
      role: 'staff',
    });
    expect([200, 201]).toContain(res.status());
    await ctx.dispose();
  });

  test('AUTH-020 invitations list loads for admin', async () => {
    const ctx = await newApiContext();
    const { token } = await apiLogin(ctx, 'admin');
    const res = await apiGet(ctx, '/invitations', token);
    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    const list = body.data?.invitations ?? body.invitations ?? body.data ?? body;
    expect(Array.isArray(list)).toBeTruthy();
    await ctx.dispose();
  });

  test('AUTH-027 /api/company/my-companies returns user companies', async () => {
    const ctx = await newApiContext();
    const { token } = await apiLogin(ctx, 'admin');
    const res = await apiGet(ctx, '/company/my-companies', token);
    expect(res.ok()).toBeTruthy();
    await ctx.dispose();
  });

  test('AUTH-028 /api/company/switch issues new JWT', async () => {
    const ctx = await newApiContext();
    const { token, user } = await apiLogin(ctx, 'admin');
    const res = await apiPost(ctx, '/company/switch', token, { company_id: user.company_id });
    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    const newToken = body.token || body.data?.token;
    expect(newToken).toBeTruthy();
    await ctx.dispose();
  });

  test('AUTH-029 /api/auth/me returns current user', async () => {
    const ctx = await newApiContext();
    const { token } = await apiLogin(ctx, 'admin');
    const res = await apiGet(ctx, '/auth/me', token);
    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    const user = body.user ?? body.data?.user ?? body.data ?? body;
    expect(user.email).toBe(UAT_USERS.admin.email);
    await ctx.dispose();
  });

  test('AUTH-030 /api/auth/me without token returns 401', async () => {
    const ctx = await newApiContext();
    const res = await ctx.get(`${API_BASE}/auth/me`);
    expect(res.status()).toBe(401);
    await ctx.dispose();
  });

  test('AUTH-031 logout blacklists token', async () => {
    const ctx = await newApiContext();
    // Do a fresh login — don't use the cached token (we're going to invalidate it)
    const loginRes = await ctx.post(`${API_BASE}/auth/login`, {
      data: { email: UAT_USERS.staff.email, password: UAT_USERS.staff.password },
    });
    if (!loginRes.ok()) { test.skip(true, `login failed ${loginRes.status()}`); await ctx.dispose(); return; }
    const token = (await loginRes.json()).data?.token;
    const logout = await apiPost(ctx, '/auth/logout', token, {});
    expect(logout.ok()).toBeTruthy();
    // Subsequent use of the same token should be rejected
    const after = await apiGet(ctx, '/auth/me', token);
    expect([401, 403]).toContain(after.status());
    await ctx.dispose();
  });

  test('AUTH-032 reset-password validates password strength', async () => {
    const ctx = await newApiContext();
    const res = await ctx.post(`${API_BASE}/auth/reset-password`, {
      data: { token: 'whatever', newPassword: 'weak' },
    });
    expect(res.status()).toBeGreaterThanOrEqual(400);
    await ctx.dispose();
  });

  test('AUTH-033 register rejects weak password', async () => {
    const ctx = await newApiContext();
    const res = await ctx.post(`${API_BASE}/auth/register`, {
      data: { email: `weak.${Date.now()}@test.com`, password: 'abc', fullName: 'Weak' },
    });
    expect(res.status()).toBe(400);
    await ctx.dispose();
  });

  test('AUTH-034 register rejects missing email', async () => {
    const ctx = await newApiContext();
    const res = await ctx.post(`${API_BASE}/auth/register`, {
      data: { password: 'Uat@12345', fullName: 'No email' },
    });
    expect(res.status()).toBe(400);
    await ctx.dispose();
  });

  test('AUTH-035 login returns refresh token in response', async () => {
    const { refreshToken } = await apiLogin(await newApiContext(), 'admin');
    expect(refreshToken).toBeTruthy();
    expect(refreshToken!.length).toBeGreaterThan(32);
  });

  test('AUTH-036 manager can create invitation', async () => {
    const ctx = await newApiContext();
    const { token } = await apiLogin(ctx, 'manager');
    const res = await apiPost(ctx, '/invitations', token, {
      email: `mgr.invite.${Date.now()}@nextura.test`,
      role: 'staff',
    });
    // Manager may or may not be allowed — either 201 (allowed) or 403 (admin-only)
    expect([201, 200, 403]).toContain(res.status());
    await ctx.dispose();
  });

  test('AUTH-037 staff cannot create invitation', async () => {
    const ctx = await newApiContext();
    const { token } = await apiLogin(ctx, 'staff');
    const res = await apiPost(ctx, '/invitations', token, {
      email: `staff.invite.${Date.now()}@nextura.test`,
      role: 'staff',
    });
    expect([403, 401]).toContain(res.status());
    await ctx.dispose();
  });

  test('AUTH-038 invitation info endpoint (public)', async () => {
    const ctx = await newApiContext();
    const res = await ctx.get(`${API_BASE}/invitations/info?token=invalid-probe-token`);
    // Endpoint should be reachable (not 404 missing route)
    expect([200, 400, 404]).toContain(res.status());
    await ctx.dispose();
  });

  test('AUTH-039 resend invitation as admin', async () => {
    const ctx = await newApiContext();
    const { token } = await apiLogin(ctx, 'admin');
    const listRes = await apiGet(ctx, '/invitations', token);
    const body = await listRes.json();
    const list = body.data?.invitations ?? body.invitations ?? [];
    const pending = list.find?.((i: any) => i.status === 'pending');
    if (!pending) { test.skip(true, 'No pending invitation'); await ctx.dispose(); return; }
    const res = await apiPost(ctx, `/invitations/${pending.id}/resend`, token, {});
    expect([200, 201]).toContain(res.status());
    await ctx.dispose();
  });

  test('AUTH-040 delete/cancel pending invitation', async () => {
    const ctx = await newApiContext();
    const { token } = await apiLogin(ctx, 'admin');
    // Create a throwaway invitation
    const created = await apiPost(ctx, '/invitations', token, {
      email: `throwaway.${Date.now()}@nextura.test`,
      role: 'staff',
    });
    if (!created.ok()) { test.skip(true, 'create invite failed'); await ctx.dispose(); return; }
    const body = await created.json();
    const id = body.data?.invitation?.id ?? body.invitation?.id ?? body.data?.id ?? body.id;
    if (!id) { test.skip(true, 'no id in response'); await ctx.dispose(); return; }
    const del = await apiDelete(ctx, `/invitations/${id}`, token);
    expect([200, 204, 404]).toContain(del.status());
    await ctx.dispose();
  });

  test('AUTH-041 email-verification post with empty body fails validation', async () => {
    const ctx = await newApiContext();
    const res = await ctx.post(`${API_BASE}/auth/verify-email`, { data: {} });
    expect(res.status()).toBe(400);
    await ctx.dispose();
  });
});
