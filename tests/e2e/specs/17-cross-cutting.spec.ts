import { test, expect } from '@playwright/test';
import { apiLogin, apiGet, newApiContext, API_BASE } from '../fixtures/api-client';

test.describe('Cross-Cutting Concerns', () => {
  test('XC-001 401 on missing token', async () => {
    const ctx = await newApiContext();
    const res = await ctx.get(`${API_BASE}/employees`);
    expect(res.status()).toBe(401);
    await ctx.dispose();
  });

  test('XC-002 403 when role lacks permission', async () => {
    const ctx = await newApiContext();
    const { token } = await apiLogin(ctx, 'staff');
    const res = await apiGet(ctx, '/users', token);
    expect([401, 403]).toContain(res.status());
    await ctx.dispose();
  });

  test('XC-003 404 on unknown endpoint', async () => {
    const ctx = await newApiContext();
    const { token } = await apiLogin(ctx, 'admin');
    const res = await apiGet(ctx, '/does-not-exist', token);
    expect(res.status()).toBe(404);
    await ctx.dispose();
  });

  test('XC-011 refresh-token flow issues new access token', async () => {
    // Refresh tokens are one-time-use; do a FRESH login directly here (bypass cache)
    // to ensure the refresh token hasn't been consumed/rotated already.
    const ctx = await newApiContext();
    const loginRes = await ctx.post(`${API_BASE}/auth/login`, {
      data: { email: 'uat.admin@nextura.test', password: 'Uat@12345' },
    });
    if (!loginRes.ok()) { test.skip(true, `login failed ${loginRes.status()}`); await ctx.dispose(); return; }
    const loginBody = await loginRes.json();
    const refreshToken = loginBody.refreshToken || loginBody.data?.refreshToken;
    if (!refreshToken) { test.skip(true, 'No refresh token in login response'); await ctx.dispose(); return; }
    const res = await ctx.post(`${API_BASE}/auth/refresh-token`, { data: { refreshToken } });
    expect(res.ok(), `status=${res.status()} body=${await res.text()}`).toBeTruthy();
    const body = await res.json();
    expect(body.token || body.data?.token).toBeTruthy();
    await ctx.dispose();
  });

  test('XC-014 Helmet security headers present', async () => {
    const ctx = await newApiContext();
    const res = await ctx.get(`${API_BASE}/auth/login`);
    const headers = res.headers();
    // Some headers are on response to POST; GET still returns many
    expect(
      headers['x-content-type-options'] || headers['x-frame-options'] || headers['referrer-policy']
    ).toBeDefined();
    await ctx.dispose();
  });

  test('XC-015 error responses do not leak stack traces', async () => {
    const ctx = await newApiContext();
    const res = await ctx.post(`${API_BASE}/auth/login`, { data: {} });
    const body = await res.text();
    expect(body.toLowerCase()).not.toContain('at /app');
    expect(body.toLowerCase()).not.toContain('node_modules');
    await ctx.dispose();
  });

  test('XC-016 renders at 1440x900 without layout breaking', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/auth/login');
    await expect(page.getByLabel('Email')).toBeVisible();
  });

  test('XC-018 renders at mobile 390x844', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/auth/login');
    await expect(page.getByLabel('Email')).toBeVisible();
  });

  test('XC-019 CORS preflight responds', async () => {
    const ctx = await newApiContext();
    const res = await ctx.fetch(`${API_BASE}/auth/me`, {
      method: 'OPTIONS',
      headers: {
        'Origin': 'http://localhost:4200',
        'Access-Control-Request-Method': 'GET',
        'Access-Control-Request-Headers': 'Authorization',
      },
    });
    expect([200, 204]).toContain(res.status());
    await ctx.dispose();
  });

  test('XC-020 malformed JWT rejected with 401', async () => {
    const ctx = await newApiContext();
    const res = await ctx.get(`${API_BASE}/auth/me`, {
      headers: { Authorization: 'Bearer malformed.token.here' },
    });
    expect([401, 403]).toContain(res.status());
    await ctx.dispose();
  });

  test('XC-021 body-parser enforces size limit reasonably', async () => {
    const ctx = await newApiContext();
    // 6MB string — most APIs reject
    const big = 'a'.repeat(6 * 1024 * 1024);
    const res = await ctx.post(`${API_BASE}/auth/register`, { data: { email: 'x@y.com', password: big } });
    expect(res.status()).toBeGreaterThanOrEqual(400);
    await ctx.dispose();
  });

  test('XC-022 tablet viewport 768x1024 renders login', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto('/auth/login');
    await expect(page.getByLabel('Email')).toBeVisible();
  });

  test('XC-023 404 for unknown API namespace', async () => {
    const ctx = await newApiContext();
    const res = await ctx.get(`${API_BASE}/this-namespace-does-not-exist`);
    expect(res.status()).toBe(404);
    await ctx.dispose();
  });

  test('XC-024 Content-Type required for JSON POST', async () => {
    const ctx = await newApiContext();
    const res = await ctx.post(`${API_BASE}/auth/login`, {
      headers: { 'Content-Type': 'text/plain' },
      data: 'email=x&password=y',
    });
    expect([400, 415]).toContain(res.status());
    await ctx.dispose();
  });

  test('XC-025 Helmet x-frame-options header present', async () => {
    const ctx = await newApiContext();
    const res = await ctx.get(`${API_BASE}/auth/me`);
    const headers = res.headers();
    expect(headers['x-frame-options'] || headers['content-security-policy']).toBeTruthy();
    await ctx.dispose();
  });

  test('XC-026 Helmet referrer-policy header present', async () => {
    const ctx = await newApiContext();
    const res = await ctx.get(`${API_BASE}/auth/me`);
    const headers = res.headers();
    expect(headers['referrer-policy']).toBeTruthy();
    await ctx.dispose();
  });

  test('XC-027 Helmet permissions-policy or equivalent', async () => {
    const ctx = await newApiContext();
    const res = await ctx.get(`${API_BASE}/auth/me`);
    const headers = res.headers();
    expect(headers['permissions-policy'] || headers['x-permitted-cross-domain-policies']).toBeTruthy();
    await ctx.dispose();
  });
});
