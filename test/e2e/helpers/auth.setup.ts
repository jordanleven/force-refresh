import { test as setup, expect } from '@playwright/test';
import { loginAsAdmin, goToPluginPage } from './auth';
import { getAuthFile } from './constants';

setup('authenticate and verify initial state', async ({ page, baseURL }) => {
  await loginAsAdmin(page);
  await page.context().storageState({ path: getAuthFile(baseURL!) });

  await goToPluginPage(page);

  const debugBadge = page.locator('.admin-header-badge.admin-header-badge--debug');
  const isDebugActive = await debugBadge.isVisible();

  if (isDebugActive) {
    await page.locator('[data-test="btn-troubleshooting"]').click();
    await page.locator('[data-test="toggle-debug-mode"] label').click();
    await expect(debugBadge).not.toBeVisible({ timeout: 10_000 });
  }
});
