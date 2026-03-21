import { test, expect } from '@playwright/test';
import { goToPluginPage } from './helpers/auth';
import { getAuthFile } from './helpers/constants';
import { triggerRefreshAndWaitForReload } from './helpers/client';

test.describe('Client', () => {
  test.beforeAll(async ({ browser, baseURL }) => {
    const context = await browser.newContext({ baseURL, storageState: getAuthFile(baseURL!) });
    const page = await context.newPage();
    await goToPluginPage(page);

    // Set the refresh interval to 30 seconds so the reload tests don't
    // have to wait the default 2 minutes
    await page.selectOption('select[name="refresh-interval"]', { value: '30' });
    await page.locator('[data-test="btn-update-options"]').click();
    await page.waitForLoadState('networkidle');
    await context.close();
  });

  test('Clicking Force Refresh causes a visitor tab to reload', async ({ browser, baseURL }) => {
    const adminContext = await browser.newContext({ baseURL, storageState: getAuthFile(baseURL!) });
    const adminPage = await adminContext.newPage();
    await goToPluginPage(adminPage);

    const visitorContext = await browser.newContext({ baseURL });
    const visitorPage = await visitorContext.newPage();
    await visitorPage.goto('/');

    await triggerRefreshAndWaitForReload(adminPage, visitorPage, '[data-test="btn-force-refresh"]');
  });

  test.describe('Debug mode', () => {
    const consoleLogs: string[] = [];
    let pageReloaded = false;
    let debugModeEnabled = false;

    test.beforeAll(async ({ browser, baseURL }) => {
      const adminContext = await browser.newContext({ baseURL, storageState: getAuthFile(baseURL!) });
      const adminPage = await adminContext.newPage();
      await goToPluginPage(adminPage);

      // Enable debug mode and check if it actually took effect
      await adminPage.locator('[data-test="btn-troubleshooting"]').click();
      await adminPage.locator('[data-test="toggle-debug-mode"] label').click();
      debugModeEnabled = await adminPage.locator('.notice-force-refresh.notice-warning').isVisible();

      if (!debugModeEnabled) {
        await adminContext.close();
        return;
      }

      await adminPage.locator('[data-test="btn-exit-troubleshooting"]').click();

      // Open visitor page after debug mode is active so it initializes with debug on
      const visitorContext = await browser.newContext({ baseURL });
      const visitorPage = await visitorContext.newPage();

      // Capture all console.debug messages before navigating so nothing is missed
      visitorPage.on('console', (msg) => {
        if (msg.type() === 'debug') consoleLogs.push(msg.text());
      });

      await visitorPage.goto('/');

      // After the initial load resolves, any further load event is a reload
      visitorPage.on('load', () => { pageReloaded = true; });

      await visitorPage.waitForTimeout(2000);

      // Trigger refresh and wait for the conditions-met log
      await adminPage.locator('[data-test="btn-force-refresh"]').click();

      await visitorPage.waitForEvent('console', {
        predicate: (msg) => msg.type() === 'debug' && msg.text().includes('Conditions met for reload but not executed'),
        timeout: 35_000,
      });

      // Wait briefly to confirm no reload follows
      await visitorPage.waitForTimeout(2000);
    });

    test.afterAll(async ({ browser, baseURL }) => {
      if (!debugModeEnabled) return;

      const adminContext = await browser.newContext({ baseURL, storageState: getAuthFile(baseURL!) });
      const adminPage = await adminContext.newPage();
      await goToPluginPage(adminPage);
      await adminPage.locator('[data-test="btn-troubleshooting"]').click();
      await adminPage.locator('[data-test="toggle-debug-mode"] label').click();
      await expect(adminPage.locator('.notice-force-refresh.notice-warning')).not.toBeVisible({ timeout: 10_000 });
    });

    test('Shows a countdown log to the next refresh', () => {
      test.skip(!debugModeEnabled, 'Debug mode not supported on this instance');
      expect(consoleLogs.some((log) => log.includes('Next check in'))).toBe(true);
    });

    test('Logs that conditions were met but the reload was skipped', () => {
      test.skip(!debugModeEnabled, 'Debug mode not supported on this instance');
      expect(consoleLogs.some((log) => log.includes('Conditions met for reload but not executed'))).toBe(true);
    });

    test('Does not reload the visitor page', () => {
      test.skip(!debugModeEnabled, 'Debug mode not supported on this instance');
      expect(pageReloaded).toBe(false);
    });
  });

  test('Clicking Force Refresh from the admin bar causes a visitor tab to reload', async ({ browser, baseURL }) => {
    const adminContext = await browser.newContext({ baseURL, storageState: getAuthFile(baseURL!) });
    const adminPage = await adminContext.newPage();
    await goToPluginPage(adminPage);

    // Changing the admin bar option triggers a full page reload
    await adminPage.selectOption('select[name="show-in-wp-admin-bar"]', { label: 'Show' });
    await adminPage.locator('[data-test="btn-update-options"]').click();
    await adminPage.waitForLoadState('networkidle');
    await adminPage.waitForLoadState('networkidle');
    await adminPage.waitForSelector('[data-test="btn-admin-bar-refresh"]');

    const visitorContext = await browser.newContext({ baseURL });
    const visitorPage = await visitorContext.newPage();
    await visitorPage.goto('/');

    await triggerRefreshAndWaitForReload(adminPage, visitorPage, '[data-test="btn-admin-bar-refresh"]');
  });
});
