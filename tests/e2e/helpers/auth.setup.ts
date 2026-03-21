import { test as setup, expect } from '@playwright/test';
import { loginAsAdmin, goToPluginPage } from './auth';
import { getAuthFile } from './constants';

setup('authenticate and verify initial state', async ({ page, baseURL }) => {
  await loginAsAdmin(page);
  await page.context().storageState({ path: getAuthFile(baseURL!) });

  await goToPluginPage(page);

  const debugBanner = page.locator('.notice-force-refresh.notice-warning');
  const isDebugActive = await debugBanner.isVisible();

  if (isDebugActive) {
    await page.locator('[data-test="btn-troubleshooting"]').click();
    await page.locator('[data-test="toggle-debug-mode"] label').click();
    await expect(debugBanner).not.toBeVisible({ timeout: 10_000 });
  }
});
