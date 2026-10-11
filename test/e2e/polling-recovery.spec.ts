import { test, expect } from '@playwright/test';
import { goToPluginPage } from './helpers/auth';
import { getAuthFile } from './helpers/constants';

const REFRESH_INTERVAL_SELECTOR = 'select[name="refresh-interval"]';
const REFRESH_INTERVAL_SECONDS = '30';
// Both version sources are blocked so the result does not depend on the update method.
const VERSION_REQUEST_PATTERN = /force-refresh\/v1\/current-version|force-refresh\/version\.json/;
// A failed check must be observed within one polling interval, plus a buffer.
const FAILED_CHECK_TIMEOUT = 45_000;
// The first retry follows a failed check within 5 seconds, so a reload inside
// this window (shorter than the polling interval) can only come from a retry.
const RECOVERY_RELOAD_TIMEOUT = 20_000;

async function setRefreshInterval(adminPage: Parameters<typeof goToPluginPage>[0], value: string) {
  await goToPluginPage(adminPage);
  await adminPage.selectOption(REFRESH_INTERVAL_SELECTOR, { value });
  await Promise.all([
    adminPage.waitForResponse((r) => r.url().includes('/options') && r.status() === 201),
    adminPage.locator('[data-test="btn-update-options"]').click(),
  ]);
}

test.describe('Polling recovery', () => {
  let originalRefreshInterval: string;

  test.beforeEach(async ({ browser, baseURL }) => {
    const context = await browser.newContext({ baseURL, storageState: getAuthFile(baseURL!) });
    const page = await context.newPage();
    await goToPluginPage(page);
    originalRefreshInterval = await page.locator(REFRESH_INTERVAL_SELECTOR).inputValue();

    // Use a 30 second interval so the test doesn't wait the default 2 minutes
    // for the visitor's second version check.
    await setRefreshInterval(page, REFRESH_INTERVAL_SECONDS);
    await context.close();
  });

  test.afterEach(async ({ browser, baseURL }) => {
    // Always leave the refresh interval as it was found so other test suites are unaffected.
    const context = await browser.newContext({ baseURL, storageState: getAuthFile(baseURL!) });
    const page = await context.newPage();
    await setRefreshInterval(page, originalRefreshInterval);
    await context.close();
  });

  test('visitor tab still reloads after its version checks fail and then succeed', async ({
    browser,
    baseURL,
  }) => {
    const adminContext = await browser.newContext({ baseURL, storageState: getAuthFile(baseURL!) });
    const adminPage = await adminContext.newPage();
    await goToPluginPage(adminPage);

    const visitorContext = await browser.newContext({ baseURL });
    const visitorPage = await visitorContext.newPage();

    let isVersionCheckFailing = false;
    let failedVersionChecks = 0;

    await visitorPage.route(VERSION_REQUEST_PATTERN, async (route) => {
      if (!isVersionCheckFailing) {
        await route.continue();
        return;
      }

      failedVersionChecks += 1;
      await route.abort('failed');
    });

    // Let the first check succeed so the visitor has a stored version to compare against.
    await Promise.all([
      visitorPage.waitForResponse((r) => VERSION_REQUEST_PATTERN.test(r.url()) && r.ok()),
      visitorPage.goto('/'),
    ]);

    // Break the network for the version check and wait for a check to fail.
    isVersionCheckFailing = true;
    await expect.poll(() => failedVersionChecks, { timeout: FAILED_CHECK_TIMEOUT }).toBeGreaterThan(0);

    // The refresh is requested while the visitor is unable to see it.
    await Promise.all([
      adminPage.waitForResponse((r) => r.url().includes('force-refresh/v1/') && r.request().method() === 'POST'),
      adminPage.locator('[data-test="btn-force-refresh"]').click(),
    ]);

    // Restore the network. The visitor must retry on its own and reload.
    const visitorReload = visitorPage.waitForEvent('load', { timeout: RECOVERY_RELOAD_TIMEOUT });
    isVersionCheckFailing = false;
    await visitorReload;

    await visitorContext.close();
    await adminContext.close();
  });
});
