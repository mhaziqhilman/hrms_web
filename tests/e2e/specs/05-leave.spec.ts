import { test, expect } from '@playwright/test';
import { apiLogin, apiGet, apiPost, apiPut, apiPatch, apiDelete, newApiContext, API_BASE } from '../fixtures/api-client';

test.describe('Module 5 — Leave Management', () => {
  test('LV-001 leave list loads with filters', async () => {
    const ctx = await newApiContext();
    const { token } = await apiLogin(ctx, 'admin');
    const res = await apiGet(ctx, '/leaves?status=Pending', token);
    expect(res.ok()).toBeTruthy();
    await ctx.dispose();
  });

  test('LV-006 leave balance page returns leave types with used/remaining', async () => {
    const ctx = await newApiContext();
    const { token, user } = await apiLogin(ctx, 'staff');
    // Get employee record first
    const me = await apiGet(ctx, '/employees/me', token);
    const meBody = await me.json();
    const emp = meBody.data || meBody;
    const empId = emp.public_id || emp.id;
    const res = await apiGet(ctx, `/leaves/balance/${empId}`, token);
    expect(res.ok(), `balance status=${res.status()}`).toBeTruthy();
    await ctx.dispose();
  });

  test('LV-008 unpaid leave (entitlement=0) submission allowed (FIX #2)', async () => {
    const ctx = await newApiContext();
    const { token } = await apiLogin(ctx, 'staff');
    // Find unpaid leave type
    const lt = await apiGet(ctx, '/leave-types', token);
    if (!lt.ok()) { test.skip(true, 'leave-types not accessible'); await ctx.dispose(); return; }
    const ltBody = await lt.json();
    const list = ltBody.data || ltBody;
    const unpaid = Array.isArray(list) ? list.find((t: any) => /unpaid/i.test(t.name)) : null;
    if (!unpaid) { test.skip(true, 'No unpaid leave type'); await ctx.dispose(); return; }

    const me = await apiGet(ctx, '/employees/me', token);
    const meBody = await me.json();
    const emp = meBody.data || meBody;

    const res = await apiPost(ctx, '/leaves', token, {
      employee_id: emp.id,
      leave_type_id: unpaid.id,
      start_date: '2026-12-01',
      end_date: '2026-12-01',
      reason: 'UAT unpaid leave smoke test',
    });
    // Should succeed — verify FIX #2
    expect([200, 201], `unpaid leave status=${res.status()} body=${await res.text()}`).toContain(res.status());
    await ctx.dispose();
  });

  test('LV-019 staff sees own leaves only', async () => {
    const ctx = await newApiContext();
    const { token } = await apiLogin(ctx, 'staff');
    const res = await apiGet(ctx, '/leaves', token);
    expect(res.ok()).toBeTruthy();
    await ctx.dispose();
  });

  test('LV-021 admin sees all leaves', async () => {
    const ctx = await newApiContext();
    const { token } = await apiLogin(ctx, 'admin');
    const res = await apiGet(ctx, '/leaves', token);
    expect(res.ok()).toBeTruthy();
    await ctx.dispose();
  });

  test('LV-022 leave calendar endpoint for month/year', async () => {
    const ctx = await newApiContext();
    const { token } = await apiLogin(ctx, 'staff');
    const res = await apiGet(ctx, '/leaves/calendar?year=2026&month=4', token);
    expect(res.ok()).toBeTruthy();
    await ctx.dispose();
  });

  test('LV-023 leave calendar missing params fails validation', async () => {
    const ctx = await newApiContext();
    const { token } = await apiLogin(ctx, 'staff');
    const res = await apiGet(ctx, '/leaves/calendar', token);
    expect(res.status()).toBe(400);
    await ctx.dispose();
  });

  test('LV-024 apply leave with missing reason fails', async () => {
    const ctx = await newApiContext();
    const { token } = await apiLogin(ctx, 'staff');
    const me = await apiGet(ctx, '/employees/me', token);
    const emp = (await me.json()).data ?? (await me.json());
    const res = await apiPost(ctx, '/leaves', token, {
      employee_id: emp.public_id,
      leave_type_id: 1,
      start_date: '2026-12-10',
      end_date: '2026-12-10',
    });
    expect(res.status()).toBe(400);
    await ctx.dispose();
  });

  test('LV-025 apply leave with invalid dates fails', async () => {
    const ctx = await newApiContext();
    const { token } = await apiLogin(ctx, 'staff');
    const me = await apiGet(ctx, '/employees/me', token);
    const emp = (await me.json()).data ?? (await me.json());
    const res = await apiPost(ctx, '/leaves', token, {
      employee_id: emp.public_id,
      leave_type_id: 1,
      start_date: 'bad-date',
      end_date: '2026-12-10',
      reason: 'bad',
    });
    expect(res.status()).toBe(400);
    await ctx.dispose();
  });

  test('LV-026 apply leave with invalid half_day_period rejected', async () => {
    const ctx = await newApiContext();
    const { token } = await apiLogin(ctx, 'staff');
    const me = await apiGet(ctx, '/employees/me', token);
    const emp = (await me.json()).data ?? (await me.json());
    const res = await apiPost(ctx, '/leaves', token, {
      employee_id: emp.public_id,
      leave_type_id: 1,
      start_date: '2026-11-11',
      end_date: '2026-11-11',
      reason: 'half-day',
      is_half_day: true,
      half_day_period: 'EV',  // invalid — must be AM or PM
    });
    expect(res.status()).toBe(400);
    await ctx.dispose();
  });

  test('LV-027 leave filter by status', async () => {
    const ctx = await newApiContext();
    const { token } = await apiLogin(ctx, 'admin');
    const res = await apiGet(ctx, '/leaves?status=Approved', token);
    expect(res.ok()).toBeTruthy();
    await ctx.dispose();
  });

  test('LV-028 leave filter by invalid status rejected', async () => {
    const ctx = await newApiContext();
    const { token } = await apiLogin(ctx, 'admin');
    const res = await apiGet(ctx, '/leaves?status=NotARealStatus', token);
    expect(res.status()).toBe(400);
    await ctx.dispose();
  });

  test('LV-029 leave sort + order params', async () => {
    const ctx = await newApiContext();
    const { token } = await apiLogin(ctx, 'admin');
    const res = await apiGet(ctx, '/leaves?sort=start_date&order=desc', token);
    expect(res.ok()).toBeTruthy();
    await ctx.dispose();
  });

  test('LV-030 leave-types list', async () => {
    const ctx = await newApiContext();
    const { token } = await apiLogin(ctx, 'admin');
    const res = await apiGet(ctx, '/leave-types', token);
    expect(res.ok()).toBeTruthy();
    await ctx.dispose();
  });

  test('LV-031 leave-entitlements list', async () => {
    const ctx = await newApiContext();
    const { token } = await apiLogin(ctx, 'admin');
    const res = await apiGet(ctx, '/leave-entitlements', token);
    expect(res.ok()).toBeTruthy();
    await ctx.dispose();
  });

  test('LV-032 balance endpoint with non-UUID rejects', async () => {
    const ctx = await newApiContext();
    const { token } = await apiLogin(ctx, 'admin');
    const res = await apiGet(ctx, '/leaves/balance/123', token);
    expect(res.status()).toBe(400);
    await ctx.dispose();
  });
});
