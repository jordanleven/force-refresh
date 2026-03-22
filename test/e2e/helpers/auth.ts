import { Page } from '@playwright/test';

export const ADMIN_USERNAME = 'force-refresh-dev';
export const ADMIN_PASSWORD = 'dross_dread_motto1polopony9treacle*SERAGLIO.unctuous8sighted';

const LOGIN_MAX_ATTEMPTS = 3;
const LOGIN_TIMEOUT_MS = 30_000;

export async function loginAsAdmin(page: Page): Promise<void> {
  for (let attempt = 1; attempt <= LOGIN_MAX_ATTEMPTS; attempt++) {
    await page.goto('/wp-login.php');
    await page.fill('#user_login', ADMIN_USERNAME);
    await page.fill('#user_pass', ADMIN_PASSWORD);
    await page.click('#wp-submit');
    // WordPress may show an admin email verification screen before wp-admin
    const reached = await page.waitForURL(/wp-admin/, { timeout: LOGIN_TIMEOUT_MS }).then(() => true).catch(() => false);
    if (reached) return;
  }
  throw new Error(`Failed to reach wp-admin after ${LOGIN_MAX_ATTEMPTS} login attempts`);
}

export async function goToPluginPage(page: Page): Promise<void> {
  await page.goto('/wp-admin/tools.php?page=force_refresh');
  await page.locator('select[name="refresh-interval"]')
    .waitFor({ timeout: 15_000 })
    .catch(async () => {
      // Retry once — in CI, WordPress admin may not be fully ready
      // immediately after the healthcheck passes
      await page.goto('/wp-admin/tools.php?page=force_refresh');
      await page.locator('select[name="refresh-interval"]').waitFor();
    });
}
