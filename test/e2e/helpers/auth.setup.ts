import { test as setup } from '@playwright/test';
import {
  isDebugModeEnabled,
  loginAsAdmin,
  goToPluginPage,
  waitForDebugModeDisabled,
} from './auth';
import { getAuthFile } from './constants';

setup('authenticate and verify initial state', async ({ page, baseURL }) => {
  await loginAsAdmin(page);
  await page.context().storageState({ path: getAuthFile(baseURL!) });

  await goToPluginPage(page);

  const isDebugActive = await isDebugModeEnabled(page);

  if (isDebugActive) {
    await page.locator('[data-test="btn-troubleshooting"]').click();
    await page.locator('[data-test="toggle-debug-mode"] label').click();
    await waitForDebugModeDisabled(page);
  }
});
