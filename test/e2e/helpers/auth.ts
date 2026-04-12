import { Page } from '@playwright/test';

export const ADMIN_USERNAME = 'force-refresh-dev';
export const ADMIN_PASSWORD = 'dross_dread_motto1polopony9treacle*SERAGLIO.unctuous8sighted';

const LOGIN_MAX_ATTEMPTS = 3;
const LOGIN_TIMEOUT_MS = 30_000;
const DEBUG_BADGE_SELECTOR = '.admin-header-badge.admin-header-badge--debug';

async function dismissWordPressInterstitials(page: Page): Promise<void> {
  // Admin email confirmation screen
  if (page.url().includes('admin-email-confirm.php')) {
    await page.locator('#submit').click();
    await page.waitForURL(/wp-admin/, { timeout: LOGIN_TIMEOUT_MS });
  }

  // Database upgrade screen
  if (page.url().includes('upgrade.php')) {
    const upgradeButton = page.locator('.button.button-large');
    if (await upgradeButton.isVisible()) {
      await upgradeButton.click();
      await page.waitForURL(/upgrade\.php/, { timeout: LOGIN_TIMEOUT_MS });
    }
    await page.goto('/wp-admin/');
    await page.waitForURL(/wp-admin/, { timeout: LOGIN_TIMEOUT_MS });
  }
}

export async function loginAsAdmin(page: Page): Promise<void> {
  for (let attempt = 1; attempt <= LOGIN_MAX_ATTEMPTS; attempt += 1) {
    // eslint-disable-next-line no-await-in-loop
    await page.goto('/wp-login.php');
    // eslint-disable-next-line no-await-in-loop
    await page.fill('#user_login', ADMIN_USERNAME);
    // eslint-disable-next-line no-await-in-loop
    await page.fill('#user_pass', ADMIN_PASSWORD);
    // eslint-disable-next-line no-await-in-loop
    await page.click('#wp-submit');
    // eslint-disable-next-line no-await-in-loop
    await page.waitForURL(/wp-admin|admin-email-confirm|upgrade\.php/, { timeout: LOGIN_TIMEOUT_MS }).catch(() => {});
    // eslint-disable-next-line no-await-in-loop
    await dismissWordPressInterstitials(page);
    if (page.url().includes('wp-admin')) return;
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

export function getDebugBadge(page: Page) {
  return page.locator(DEBUG_BADGE_SELECTOR);
}

export async function isDebugModeEnabled(page: Page): Promise<boolean> {
  return getDebugBadge(page).isVisible();
}

export async function waitForDebugModeEnabled(page: Page): Promise<void> {
  await getDebugBadge(page).waitFor({ state: 'visible', timeout: 5_000 });
}

export async function waitForDebugModeDisabled(page: Page): Promise<void> {
  await getDebugBadge(page).waitFor({ state: 'hidden', timeout: LOGIN_TIMEOUT_MS });
}
