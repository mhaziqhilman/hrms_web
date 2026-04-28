import { Page, expect } from '@playwright/test';
import { UAT_USERS, UatRole } from './users';

/**
 * UI login via the /auth/login page.
 */
export async function loginAs(page: Page, role: UatRole) {
  const user = UAT_USERS[role];
  await page.goto('/auth/login');
  await page.getByLabel('Email').fill(user.email);
  await page.getByLabel('Password').fill(user.password);
  await page.getByRole('button', { name: /^login$/i }).click();
  await page.waitForURL(/\/dashboard/, { timeout: 15_000 }).catch(() => {});
}

/**
 * Programmatic session setup — bypasses the UI login page by putting the JWT
 * straight into localStorage. Much faster than UI login when the test itself
 * isn't about auth.
 */
export async function setAuth(page: Page, token: string, refreshToken?: string) {
  await page.addInitScript(
    ({ t, r }) => {
      localStorage.setItem('hrms_token', t);
      if (r) localStorage.setItem('hrms_refresh_token', r);
    },
    { t: token, r: refreshToken || '' }
  );
}

export async function expectLoggedIn(page: Page) {
  await expect(page).toHaveURL(/\/dashboard/);
}
