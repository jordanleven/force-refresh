import {
  test,
  expect,
  Browser,
  Page,
  Route,
} from '@playwright/test';
import { goToPluginPage } from './helpers/auth';
import { getAuthFile } from './helpers/constants';

const REFRESH_INTERVAL_SELECTOR = 'select[name="refresh-interval"]';
const REFRESH_INTERVAL_SECONDS = 30;
const REFRESH_INTERVAL_MS = REFRESH_INTERVAL_SECONDS * 1000;
// The client gives up on a version check that has not been answered after this long.
const CHECK_TIMEOUT_MS = 30_000;
// Both version sources are blocked so the result does not depend on the update method.
const VERSION_REQUEST_PATTERN = /force-refresh\/v1\/current-version|force-refresh\/version\.json/;
// A failed check must be observed within one polling interval, plus a buffer.
const FAILED_CHECK_TIMEOUT = REFRESH_INTERVAL_MS + 15_000;
// A network error is first retried within 5 seconds and then within 10.
const FAST_RETRY_TIMEOUT = 20_000;
// Once a version check has been answered again the reload follows at once.
// The wait for that check is asserted separately for each kind of failure, so
// this only has to allow for a slow page load.
const RELOAD_AFTER_CHECK_TIMEOUT = 30_000;
// Timers and the route handler run in different processes.
const TIMING_TOLERANCE_MS = 1000;

type VersionCheckFailure = {
  name: string;
  // How the version request fails while the outage lasts.
  fail: (_route: Route) => Promise<void>;
  // How long after the outage ends a version check must have been answered.
  // The client never stops retrying, so this is the longest gap it can leave.
  recoveryCheckTimeout: number;
};

const FAILURES: Record<string, VersionCheckFailure> = {
  // After a few failures the retry delay has grown to at most 40 seconds.
  networkError: {
    fail: (route) => route.abort('failed'),
    name: 'a network error',
    recoveryCheckTimeout: 60_000,
  },
  // A server error is retried at the polling interval.
  serverError: {
    fail: (route) => route.fulfill({
      body: '<h1>Internal Server Error</h1>',
      contentType: 'text/html',
      status: 500,
    }),
    name: 'an HTTP 500',
    recoveryCheckTimeout: REFRESH_INTERVAL_MS + 15_000,
  },
  // The request is given up on after the check timeout and then retried at
  // the polling interval.
  hungRequest: {
    fail: () => Promise.resolve(),
    name: 'a request that is never answered',
    recoveryCheckTimeout: CHECK_TIMEOUT_MS + REFRESH_INTERVAL_MS + 15_000,
  },
};

async function setRefreshInterval(adminPage: Page, value: string) {
  await goToPluginPage(adminPage);
  await adminPage.selectOption(REFRESH_INTERVAL_SELECTOR, { value });
  await Promise.all([
    adminPage.waitForResponse((r) => r.url().includes('/options') && r.status() === 201),
    adminPage.locator('[data-test="btn-update-options"]').click(),
  ]);
}

test.describe('Polling recovery', () => {
  // Each test waits out a polling interval, an outage and the retry that ends it.
  test.setTimeout(240_000);

  let originalRefreshInterval: string;

  test.beforeEach(async ({ browser, baseURL }) => {
    const context = await browser.newContext({ baseURL, storageState: getAuthFile(baseURL!) });
    const page = await context.newPage();
    await goToPluginPage(page);
    originalRefreshInterval = await page.locator(REFRESH_INTERVAL_SELECTOR).inputValue();

    // Use a 30 second interval so the test doesn't wait the default 2 minutes
    // for the visitor's second version check.
    await setRefreshInterval(page, String(REFRESH_INTERVAL_SECONDS));
    await context.close();
  });

  test.afterEach(async ({ browser, baseURL }) => {
    // Always leave the refresh interval as it was found so other test suites are unaffected.
    const context = await browser.newContext({ baseURL, storageState: getAuthFile(baseURL!) });
    const page = await context.newPage();
    await setRefreshInterval(page, originalRefreshInterval);
    await context.close();
  });

  /**
   * Opens a visitor page whose first version check succeeds, then makes its
   * version checks fail in the given way until `endOutage` is called.
   */
  async function openVisitorDuringOutage(visitorPage: Page, failure: VersionCheckFailure) {
    let isVersionCheckFailing = false;
    const failedCheckTimes: number[] = [];

    await visitorPage.route(VERSION_REQUEST_PATTERN, async (route) => {
      if (!isVersionCheckFailing) {
        await route.continue();
        return;
      }

      failedCheckTimes.push(Date.now());
      await failure.fail(route);
    });

    // Let the first check succeed so the visitor has a stored version to compare against.
    await Promise.all([
      visitorPage.waitForResponse((r) => VERSION_REQUEST_PATTERN.test(r.url()) && r.ok()),
      visitorPage.goto('/'),
    ]);

    isVersionCheckFailing = true;
    await expect
      .poll(() => failedCheckTimes.length, {
        message: `a version check should fail with ${failure.name}`,
        timeout: FAILED_CHECK_TIMEOUT,
      })
      .toBeGreaterThan(0);

    return {
      endOutage: () => { isVersionCheckFailing = false; },
      failedCheckTimes,
    };
  }

  /**
   * Requests a refresh the visitor cannot see, ends the outage, and expects
   * the visitor to check again on its own and reload.
   * @return The time at which the visitor's version check was answered again
   */
  async function expectReloadAfterOutage(
    adminPage: Page,
    visitorPage: Page,
    failure: VersionCheckFailure,
    endOutage: () => void,
  ): Promise<number> {
    await Promise.all([
      adminPage.waitForResponse((r) => r.url().includes('force-refresh/v1/') && r.request().method() === 'POST'),
      adminPage.locator('[data-test="btn-force-refresh"]').click(),
    ]);

    // Both waits start before the outage ends so that neither event is missed.
    const answeredCheck = visitorPage.waitForResponse(
      (r) => VERSION_REQUEST_PATTERN.test(r.url()) && r.ok(),
      { timeout: failure.recoveryCheckTimeout },
    );
    const visitorReload = visitorPage.waitForEvent('load', {
      timeout: failure.recoveryCheckTimeout + RELOAD_AFTER_CHECK_TIMEOUT,
    });
    // Reported by the `await` below; this only stops it surfacing as
    // unhandled when the version check assertion fails first.
    visitorReload.catch(() => {});

    endOutage();

    // The check is asserted on its own so that a slow reload is not mistaken
    // for a visitor that stopped checking.
    await answeredCheck;
    const answeredAt = Date.now();
    await visitorReload;

    return answeredAt;
  }

  async function openAdminAndVisitor(browser: Browser, baseURL: string) {
    const adminContext = await browser.newContext({ baseURL, storageState: getAuthFile(baseURL) });
    const adminPage = await adminContext.newPage();
    await goToPluginPage(adminPage);

    const visitorContext = await browser.newContext({ baseURL });
    const visitorPage = await visitorContext.newPage();

    const close = async () => {
      await visitorContext.close();
      await adminContext.close();
    };

    return { adminPage, close, visitorPage };
  }

  test('visitor tab retries quickly and reloads after a network error', async ({ browser, baseURL }) => {
    const failure = FAILURES.networkError;
    const { adminPage, close, visitorPage } = await openAdminAndVisitor(browser, baseURL!);
    const { endOutage, failedCheckTimes } = await openVisitorDuringOutage(visitorPage, failure);

    // A request that never reached the server is retried well inside the polling interval.
    await expect
      .poll(() => failedCheckTimes.length, { timeout: FAST_RETRY_TIMEOUT })
      .toBeGreaterThan(1);
    expect(failedCheckTimes[1] - failedCheckTimes[0]).toBeLessThan(REFRESH_INTERVAL_MS);

    await expectReloadAfterOutage(adminPage, visitorPage, failure, endOutage);
    await close();
  });

  test('visitor tab reloads after an HTTP 500 without retrying sooner than the interval', async ({
    browser,
    baseURL,
  }) => {
    const failure = FAILURES.serverError;
    const { adminPage, close, visitorPage } = await openAdminAndVisitor(browser, baseURL!);
    const { endOutage, failedCheckTimes } = await openVisitorDuringOutage(visitorPage, failure);

    const answeredAt = await expectReloadAfterOutage(adminPage, visitorPage, failure, endOutage);

    // The server was failing, so it was asked again only when a poll was due.
    expect(failedCheckTimes).toHaveLength(1);
    expect(answeredAt - failedCheckTimes[0]).toBeGreaterThanOrEqual(REFRESH_INTERVAL_MS - TIMING_TOLERANCE_MS);
    await close();
  });

  test('visitor tab aborts a version check that is never answered and reloads', async ({
    browser,
    baseURL,
  }) => {
    const failure = FAILURES.hungRequest;
    const { adminPage, close, visitorPage } = await openAdminAndVisitor(browser, baseURL!);

    const abortedVersionRequests: string[] = [];
    visitorPage.on('requestfailed', (request) => {
      if (!VERSION_REQUEST_PATTERN.test(request.url())) return;
      if (request.failure()?.errorText.includes('ERR_ABORTED')) abortedVersionRequests.push(request.url());
    });

    const { endOutage, failedCheckTimes } = await openVisitorDuringOutage(visitorPage, failure);

    // The outage ends while the request is still open, so only the client
    // giving up on it and retrying can lead to the reload.
    await expectReloadAfterOutage(adminPage, visitorPage, failure, endOutage);

    expect(failedCheckTimes).toHaveLength(1);
    expect(abortedVersionRequests).toHaveLength(1);
    await close();
  });
});
