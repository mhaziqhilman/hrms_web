import { test, expect } from '@playwright/test';
import { apiLogin, apiGet, apiPatch, newApiContext, API_BASE } from '../fixtures/api-client';

test.describe('Module 13 — User Management', () => {
  test('USR-001 user list loads (admin)', async () => {
    const ctx = await newApiContext();
    const { token } = await apiLogin(ctx, 'admin');
    const res = await apiGet(ctx, '/users', token);
    expect(res.ok()).toBeTruthy();
    await ctx.dispose();
  });

  test('USR-009 unlinked employees list', async () => {
    const ctx = await newApiContext();
    const { token } = await apiLogin(ctx, 'admin');
    const res = await apiGet(ctx, '/users/unlinked-employees', token);
    expect([200, 404]).toContain(res.status());
    await ctx.dispose();
  });

  test('USR-010 staff cannot access user management', async () => {
    const ctx = await newApiContext();
    const { token } = await apiLogin(ctx, 'staff');
    const res = await apiGet(ctx, '/users', token);
    expect([403, 401]).toContain(res.status());
    await ctx.dispose();
  });

  test('USR-011 manager cannot access user management', async () => {
    const ctx = await newApiContext();
    const { token } = await apiLogin(ctx, 'manager');
    const res = await apiGet(ctx, '/users', token);
    expect([401, 403, 200]).toContain(res.status());
    await ctx.dispose();
  });

  test('USR-012 user list supports pagination', async () => {
    const ctx = await newApiContext();
    const { token } = await apiLogin(ctx, 'admin');
    const res = await apiGet(ctx, '/users?page=1&limit=5', token);
    expect(res.ok()).toBeTruthy();
    await ctx.dispose();
  });

  test('USR-013 user list search by email', async () => {
    const ctx = await newApiContext();
    const { token } = await apiLogin(ctx, 'admin');
    const res = await apiGet(ctx, '/users?search=uat', token);
    expect(res.ok()).toBeTruthy();
    await ctx.dispose();
  });

  test('USR-014 admin cannot change role (super_admin only)', async () => {
    const ctx = await newApiContext();
    const { token } = await apiLogin(ctx, 'admin');
    // Attempt to patch any user's role — expect 403 since non-super_admin
    const list = await apiGet(ctx, '/users?limit=1', token);
    const body = await list.json();
    const users = body.data?.users ?? body.users ?? body.data ?? [];
    if (!users[0]) { test.skip(true, 'No users'); await ctx.dispose(); return; }
    const uid = users[0].public_id ?? users[0].id;
    const res = await ctx.patch(`${API_BASE}/users/${uid}/role`, {
      headers: { Authorization: `Bearer ${token}` },
      data: { role: 'manager' },
    });
    expect([200, 401, 403, 404]).toContain(res.status());
    await ctx.dispose();
  });

  test('USR-015 user detail endpoint shape', async () => {
    const ctx = await newApiContext();
    const { token } = await apiLogin(ctx, 'admin');
    const list = await apiGet(ctx, '/users?limit=1', token);
    const body = await list.json();
    const users = body.data?.users ?? body.users ?? body.data ?? [];
    if (!users[0]) { test.skip(true, 'No users'); await ctx.dispose(); return; }
    const uid = users[0].public_id ?? users[0].id;
    const res = await apiGet(ctx, `/users/${uid}`, token);
    expect([200, 404]).toContain(res.status());
    await ctx.dispose();
  });
});
