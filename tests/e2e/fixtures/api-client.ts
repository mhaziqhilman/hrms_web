import { APIRequestContext, request } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';
import { UAT_USERS, UatRole } from './users';

const CACHE_FILE = path.join(__dirname, '..', '.token-cache.json');

function loadCache(): Partial<Record<UatRole, LoginResult>> {
  try {
    if (fs.existsSync(CACHE_FILE)) {
      return JSON.parse(fs.readFileSync(CACHE_FILE, 'utf8'));
    }
  } catch {
    /* ignore */
  }
  return {};
}

function saveCache(cache: Partial<Record<UatRole, LoginResult>>) {
  try {
    fs.writeFileSync(CACHE_FILE, JSON.stringify(cache, null, 2));
  } catch {
    /* ignore */
  }
}

export const API_BASE = process.env.API_BASE || 'http://localhost:3000/api';

export interface LoginResult {
  token: string;
  refreshToken?: string;
  user: { id: number; email: string; role: string; company_id: number | null };
}

// File-based token cache so each role logs in at most once per test-run,
// even when Playwright spawns a new worker per test file.
export async function apiLogin(
  ctx: APIRequestContext,
  role: UatRole = 'admin'
): Promise<LoginResult> {
  const cache = loadCache();
  if (cache[role]?.token) return cache[role]!;

  const u = UAT_USERS[role];
  const res = await ctx.post(`${API_BASE}/auth/login`, {
    data: { email: u.email, password: u.password },
  });
  if (!res.ok()) {
    throw new Error(`Login failed for ${role} (${u.email}): ${res.status()} ${await res.text()}`);
  }
  const body = await res.json();
  const result: LoginResult = {
    token: body.token || body.data?.token,
    refreshToken: body.refreshToken || body.data?.refreshToken,
    user: body.user || body.data?.user,
  };
  cache[role] = result;
  saveCache(cache);
  return result;
}

export function resetTokenCache() {
  try { fs.unlinkSync(CACHE_FILE); } catch { /* ignore */ }
}

export async function apiGet(ctx: APIRequestContext, path: string, token: string) {
  return ctx.get(`${API_BASE}${path}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
}

export async function apiPost(
  ctx: APIRequestContext,
  path: string,
  token: string,
  data?: unknown
) {
  return ctx.post(`${API_BASE}${path}`, {
    headers: { Authorization: `Bearer ${token}` },
    data,
  });
}

export async function apiPatch(
  ctx: APIRequestContext,
  path: string,
  token: string,
  data?: unknown
) {
  return ctx.patch(`${API_BASE}${path}`, {
    headers: { Authorization: `Bearer ${token}` },
    data,
  });
}

export async function apiPut(
  ctx: APIRequestContext,
  path: string,
  token: string,
  data?: unknown
) {
  return ctx.put(`${API_BASE}${path}`, {
    headers: { Authorization: `Bearer ${token}` },
    data,
  });
}

export async function apiDelete(ctx: APIRequestContext, path: string, token: string) {
  return ctx.delete(`${API_BASE}${path}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
}

export async function newApiContext() {
  return request.newContext({ baseURL: API_BASE, ignoreHTTPSErrors: true });
}
