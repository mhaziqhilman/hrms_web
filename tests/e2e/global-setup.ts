import { FullConfig, request } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';
import { API_BASE } from './fixtures/api-client';
import { UAT_USERS, UatRole } from './fixtures/users';

const CACHE_FILE = path.join(__dirname, '.token-cache.json');

/**
 * Pre-login all 4 UAT roles ONCE and write to cache file.
 * Reduces the number of auth requests per test-run to exactly 4,
 * avoiding the backend auth rate limit (20 / 15 min).
 */
export default async function globalSetup(_config: FullConfig) {
  const ctx = await request.newContext({ ignoreHTTPSErrors: true });
  const roles: UatRole[] = ['superAdmin', 'admin', 'manager', 'staff'];
  const cache: Record<string, any> = {};

  for (const role of roles) {
    const u = UAT_USERS[role];
    const res = await ctx.post(`${API_BASE}/auth/login`, {
      data: { email: u.email, password: u.password },
    });
    if (!res.ok()) {
      console.warn(`[global-setup] Login failed for ${role}: ${res.status()}`);
      continue;
    }
    const body = await res.json();
    cache[role] = {
      token: body.token || body.data?.token,
      refreshToken: body.refreshToken || body.data?.refreshToken,
      user: body.user || body.data?.user,
    };
    console.log(`[global-setup] ✓ logged in ${role}`);
  }

  fs.writeFileSync(CACHE_FILE, JSON.stringify(cache, null, 2));
  await ctx.dispose();
}
