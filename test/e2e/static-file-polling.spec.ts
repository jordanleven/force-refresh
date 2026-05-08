import { test, expect } from '@playwright/test';
import { goToPluginPage } from './helpers/auth';
import { triggerRefreshAndWaitForReload } from './helpers/client';
import { getAuthFile } from './helpers/constants';

const VERSION_FILE_PATH = '/wp-content/uploads/force-refresh/version.json';

async function enableStaticFilePolling(adminPage: Parameters<typeof goToPluginPage>[0]) {
  await goToPluginPage(adminPage);
  await adminPage.locator('[data-test="toggle-static-file-polling"] label').click();
  await adminPage.locator('[data-test="btn-update-options"]').click();
  await adminPage.waitForLoadState('networkidle');
}

async function disableStaticFilePolling(adminPage: Parameters<typeof goToPluginPage>[0]) {
  await goToPluginPage(adminPage);
  await adminPage.locator('[data-test="toggle-static-file-polling"] label').click();
  await adminPage.locator('[data-test="btn-update-options"]').click();
  await adminPage.waitForLoadState('networkidle');
}

test.describe('Static file polling', () => {
  test.afterEach(async ({ browser, baseURL }) => {
    // Always leave static file polling disabled so other test suites are unaffected.
    const context = await browser.newContext({ baseURL, storageState: getAuthFile(baseURL!) });
    const page = await context.newPage();
    await disableStaticFilePolling(page);
    await context.close();
  });

  test('version.json is created after enabling the option and triggering a refresh', async ({
    browser,
    baseURL,
  }) => {
    const context = await browser.newContext({ baseURL, storageState: getAuthFile(baseURL!) });
    const page = await context.newPage();

    await enableStaticFilePolling(page);

    // Trigger a site refresh so the file gets written
    await page.locator('[data-test="btn-force-refresh"]').click();
    await page.waitForLoadState('networkidle');

    const response = await page.request.get(VERSION_FILE_PATH);
    expect(response.status()).toBe(200);

    const body = await response.json();
    expect(body).toHaveProperty('site');

    await context.close();
  });

  test('client polls the static version file instead of the REST endpoint when option is enabled', async ({
    browser,
    baseURL,
  }) => {
    const adminContext = await browser.newContext({ baseURL, storageState: getAuthFile(baseURL!) });
    const adminPage = await adminContext.newPage();
    await enableStaticFilePolling(adminPage);

    // Trigger a refresh so version.json is created before the visitor polls
    await adminPage.locator('[data-test="btn-force-refresh"]').click();
    await adminPage.waitForLoadState('networkidle');

    const visitorContext = await browser.newContext({ baseURL });
    const visitorPage = await visitorContext.newPage();

    const staticFileRequests: string[] = [];
    const restRequests: string[] = [];

    visitorPage.on('request', (req) => {
      if (req.url().includes('version.json')) staticFileRequests.push(req.url());
      if (req.url().includes('force-refresh/v1/current-version')) restRequests.push(req.url());
    });

    await visitorPage.goto('/');
    // Wait long enough for at least one polling cycle (refresh interval is 30s in beforeAll,
    // but static file polling doesn't need the full interval to be observed)
    await visitorPage.waitForTimeout(5000);

    expect(staticFileRequests.length).toBeGreaterThan(0);
    expect(restRequests.length).toBe(0);

    await visitorContext.close();
    await adminContext.close();
  });

  test('refresh still causes the visitor page to reload when static file polling is enabled', async ({
    browser,
    baseURL,
  }) => {
    const adminContext = await browser.newContext({ baseURL, storageState: getAuthFile(baseURL!) });
    const adminPage = await adminContext.newPage();
    await enableStaticFilePolling(adminPage);

    // Trigger an initial refresh so version.json exists before the visitor loads
    await adminPage.locator('[data-test="btn-force-refresh"]').click();
    await adminPage.waitForLoadState('networkidle');

    const visitorContext = await browser.newContext({ baseURL });
    const visitorPage = await visitorContext.newPage();
    await visitorPage.goto('/');

    await triggerRefreshAndWaitForReload(adminPage, visitorPage, '[data-test="btn-force-refresh"]');

    await visitorContext.close();
    await adminContext.close();
  });

  test('version.json returns 404 after the option is disabled', async ({ browser, baseURL }) => {
    const context = await browser.newContext({ baseURL, storageState: getAuthFile(baseURL!) });
    const page = await context.newPage();

    await enableStaticFilePolling(page);

    await page.locator('[data-test="btn-force-refresh"]').click();
    await page.waitForLoadState('networkidle');

    // Confirm file exists first
    const before = await page.request.get(VERSION_FILE_PATH);
    expect(before.status()).toBe(200);

    await disableStaticFilePolling(page);

    const after = await page.request.get(VERSION_FILE_PATH);
    expect(after.status()).toBe(404);

    await context.close();
  });

  test('client falls back to REST after the static file is deleted', async ({
    browser,
    baseURL,
  }) => {
    const adminContext = await browser.newContext({ baseURL, storageState: getAuthFile(baseURL!) });
    const adminPage = await adminContext.newPage();

    // Disable the option so no version.json exists; visitor should use REST
    await disableStaticFilePolling(adminPage);

    const visitorContext = await browser.newContext({ baseURL });
    const visitorPage = await visitorContext.newPage();

    const restRequests: string[] = [];
    visitorPage.on('request', (req) => {
      if (req.url().includes('force-refresh/v1/current-version')) restRequests.push(req.url());
    });

    await visitorPage.goto('/');
    await visitorPage.waitForTimeout(5000);

    expect(restRequests.length).toBeGreaterThan(0);

    await visitorContext.close();
    await adminContext.close();
  });
});
