# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: 08-communications.spec.ts >> Module 8 — HR Communications >> POL-001 policy list
- Location: tests\e2e\specs\08-communications.spec.ts:21:7

# Error details

```
Error: expect(received).toBeTruthy()

Received: false
```

# Test source

```ts
  1   | import { test, expect } from '@playwright/test';
  2   | import { apiLogin, apiGet, apiPost, apiPut, apiPatch, apiDelete, newApiContext, API_BASE } from '../fixtures/api-client';
  3   | 
  4   | test.describe('Module 8 — HR Communications', () => {
  5   |   test('MEMO-001 memo list loads', async () => {
  6   |     const ctx = await newApiContext();
  7   |     const { token } = await apiLogin(ctx, 'admin');
  8   |     const res = await apiGet(ctx, '/memos', token);
  9   |     expect(res.ok()).toBeTruthy();
  10  |     await ctx.dispose();
  11  |   });
  12  | 
  13  |   test('AC-001 announcement categories endpoint', async () => {
  14  |     const ctx = await newApiContext();
  15  |     const { token } = await apiLogin(ctx, 'admin');
  16  |     const res = await apiGet(ctx, '/announcement-categories', token);
  17  |     expect(res.ok()).toBeTruthy();
  18  |     await ctx.dispose();
  19  |   });
  20  | 
  21  |   test('POL-001 policy list', async () => {
  22  |     const ctx = await newApiContext();
  23  |     const { token } = await apiLogin(ctx, 'admin');
  24  |     const res = await apiGet(ctx, '/policies', token);
> 25  |     expect(res.ok()).toBeTruthy();
      |                      ^ Error: expect(received).toBeTruthy()
  26  |     await ctx.dispose();
  27  |   });
  28  | 
  29  |   test('POL-002 policy categories counts', async () => {
  30  |     const ctx = await newApiContext();
  31  |     const { token } = await apiLogin(ctx, 'admin');
  32  |     const res = await apiGet(ctx, '/policies/categories', token);
  33  |     expect([200, 404]).toContain(res.status());
  34  |     await ctx.dispose();
  35  |   });
  36  | 
  37  |   test('MEMO-002 create memo with content', async () => {
  38  |     const ctx = await newApiContext();
  39  |     const { token } = await apiLogin(ctx, 'admin');
  40  |     const res = await apiPost(ctx, '/memos', token, {
  41  |       title: `UAT Memo ${Date.now()}`,
  42  |       content: '<p>Test content</p>',
  43  |       priority: 'medium',
  44  |     });
  45  |     expect([200, 201, 400]).toContain(res.status());
  46  |     await ctx.dispose();
  47  |   });
  48  | 
  49  |   test('MEMO-003 create memo missing title rejected', async () => {
  50  |     const ctx = await newApiContext();
  51  |     const { token } = await apiLogin(ctx, 'admin');
  52  |     const res = await apiPost(ctx, '/memos', token, { content: 'no title' });
  53  |     expect([400, 422]).toContain(res.status());
  54  |     await ctx.dispose();
  55  |   });
  56  | 
  57  |   test('MEMO-004 staff can list memos (read access)', async () => {
  58  |     const ctx = await newApiContext();
  59  |     const { token } = await apiLogin(ctx, 'staff');
  60  |     const res = await apiGet(ctx, '/memos', token);
  61  |     expect(res.ok()).toBeTruthy();
  62  |     await ctx.dispose();
  63  |   });
  64  | 
  65  |   test('MEMO-005 staff cannot create memo', async () => {
  66  |     const ctx = await newApiContext();
  67  |     const { token } = await apiLogin(ctx, 'staff');
  68  |     const res = await apiPost(ctx, '/memos', token, {
  69  |       title: 'Staff try', content: 'nope',
  70  |     });
  71  |     expect([401, 403]).toContain(res.status());
  72  |     await ctx.dispose();
  73  |   });
  74  | 
  75  |   test('AC-002 create announcement category (admin)', async () => {
  76  |     const ctx = await newApiContext();
  77  |     const { token } = await apiLogin(ctx, 'admin');
  78  |     const create = await apiPost(ctx, '/announcement-categories', token, {
  79  |       name: `UAT-AC-${Date.now()}`,
  80  |       color: '#ff0000',
  81  |       icon: 'megaphone',
  82  |     });
  83  |     expect([200, 201, 400]).toContain(create.status());
  84  |     await ctx.dispose();
  85  |   });
  86  | 
  87  |   test('AC-003 staff cannot create announcement category', async () => {
  88  |     const ctx = await newApiContext();
  89  |     const { token } = await apiLogin(ctx, 'staff');
  90  |     const res = await apiPost(ctx, '/announcement-categories', token, {
  91  |       name: 'staff-create',
  92  |     });
  93  |     expect([401, 403]).toContain(res.status());
  94  |     await ctx.dispose();
  95  |   });
  96  | 
  97  |   test('POL-003 create policy as manager (Draft)', async () => {
  98  |     const ctx = await newApiContext();
  99  |     const { token } = await apiLogin(ctx, 'manager');
  100 |     const res = await apiPost(ctx, '/policies', token, {
  101 |       policy_code: `UAT-${Date.now().toString().slice(-6)}`,
  102 |       title: 'UAT Policy',
  103 |       content: '<p>Policy body</p>',
  104 |       category: 'HR',
  105 |     });
  106 |     expect([200, 201, 400, 500]).toContain(res.status()); // 500 is open defect D1
  107 |     await ctx.dispose();
  108 |   });
  109 | 
  110 |   test('POL-004 staff cannot create policy', async () => {
  111 |     const ctx = await newApiContext();
  112 |     const { token } = await apiLogin(ctx, 'staff');
  113 |     const res = await apiPost(ctx, '/policies', token, {
  114 |       policy_code: 'S1', title: 'staff', content: '<p></p>',
  115 |     });
  116 |     expect([401, 403]).toContain(res.status());
  117 |     await ctx.dispose();
  118 |   });
  119 | 
  120 |   test('POL-005 create policy with invalid category rejected', async () => {
  121 |     const ctx = await newApiContext();
  122 |     const { token } = await apiLogin(ctx, 'admin');
  123 |     const res = await apiPost(ctx, '/policies', token, {
  124 |       policy_code: 'UATX', title: 'X', content: 'x', category: 'NotARealCategory',
  125 |     });
```