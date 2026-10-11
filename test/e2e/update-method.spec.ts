import { test, expect } from '@playwright/test';
import { goToPluginPage } from './helpers/auth';
import { getAuthFile } from './helpers/constants';
import { UPDATE_METHOD_SELECT, saveOptionsThroughApi, setUpdateMethod } from './helpers/options';

const WEBSOCKETS_UNAVAILABLE_NOTE = '[data-test="update-method-websockets-unavailable"]';

test.describe('Update method', () => {
  test.afterEach(async ({ browser, baseURL }) => {
    // Always leave the WordPress API selected so other test suites are unaffected.
    const context = await browser.newContext({ baseURL, storageState: getAuthFile(baseURL!) });
    const page = await context.newPage();
    await setUpdateMethod(page, 'rest');
    await context.close();
  });

  test('lists three methods, with WebSockets disabled and explained when no relay is configured', async ({
    page,
  }) => {
    await goToPluginPage(page);

    const select = page.locator(UPDATE_METHOD_SELECT);
    const options = await select.locator('option').evaluateAll((elements) => elements.map((element) => {
      const option = element as HTMLOptionElement;
      return { disabled: option.disabled, label: option.label.trim(), value: option.value };
    }));

    expect(options).toEqual([
      { disabled: false, label: 'Static file', value: 'static_file' },
      { disabled: false, label: 'WordPress API', value: 'rest' },
      { disabled: true, label: 'WebSockets', value: 'websockets' },
    ]);
    await expect(select).toBeEnabled();
    await expect(page.locator(WEBSOCKETS_UNAVAILABLE_NOTE)).toBeVisible();
    await expect(page.locator(WEBSOCKETS_UNAVAILABLE_NOTE)).toHaveText(
      'WebSockets is unavailable until a relay is configured.',
    );
  });

  test('the options API refuses WebSockets and keeps the saved method when no relay is configured', async ({
    page,
  }) => {
    await goToPluginPage(page);

    const response = await saveOptionsThroughApi(page, { update_method: 'websockets' });
    expect(response.status()).toBe(400);

    await goToPluginPage(page);
    await expect(page.locator(UPDATE_METHOD_SELECT)).toHaveValue('rest');
  });

  test('a static file choice saved by an older admin script survives and version.json is still polled', async ({
    browser,
    baseURL,
    page,
  }) => {
    await goToPluginPage(page);

    // Before there were three methods, the admin script saved a boolean.
    const response = await saveOptionsThroughApi(page, { use_static_file_polling: true });
    expect(response.status()).toBe(201);

    await goToPluginPage(page);
    await expect(page.locator(UPDATE_METHOD_SELECT)).toHaveValue('static_file');

    const visitorContext = await browser.newContext({ baseURL });
    const visitorPage = await visitorContext.newPage();

    const staticFileRequests: string[] = [];
    const restRequests: string[] = [];

    visitorPage.on('request', (req) => {
      if (req.url().includes('version.json')) staticFileRequests.push(req.url());
      if (req.url().includes('force-refresh/v1/current-version')) restRequests.push(req.url());
    });

    await visitorPage.goto('/');
    // The first version check runs shortly after load, so one cycle is enough.
    await visitorPage.waitForTimeout(5000);

    expect(staticFileRequests.length).toBeGreaterThan(0);
    expect(restRequests.length).toBe(0);

    await visitorContext.close();
  });
});
