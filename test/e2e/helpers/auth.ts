import { Page } from '@playwright/test';

export const ADMIN_USERNAME = 'force-refresh-dev';
export const ADMIN_PASSWORD = 'dross_dread_motto1polopony9treacle*SERAGLIO.unctuous8sighted';

export async function loginAsAdmin(page: Page): Promise<void> {
  await page.goto('/wp-login.php');
  await page.fill('#user_login', ADMIN_USERNAME);
  await page.fill('#user_pass', ADMIN_PASSWORD);
  await page.click('#wp-submit');
  // WordPress may show an admin email verification screen before wp-admin
  await page.waitForURL(/wp-admin/, { timeout: 60_000 });
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
