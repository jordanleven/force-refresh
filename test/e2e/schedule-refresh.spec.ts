import { test, expect, Page } from '@playwright/test';
import { goToPluginPage } from './helpers/auth';
import { getAuthFile } from './helpers/constants';

/**
 * Runs a schedule refresh REST request from the authenticated browser page so
 * WordPress receives the admin cookies and nonce together.
 */
async function scheduleRefreshApiRequest(page: Page, method: 'POST' | 'DELETE', path = '', data?: Record<string, unknown>) {
  return page.evaluate(async ({ methodValue, pathValue, requestData }) => {
    const { nonce } = (window as any).forceRefreshMain.localData;
    const response = await fetch(`/wp-json/force-refresh/v1/schedule-site-version${pathValue}`, {
      method: methodValue,
      credentials: 'same-origin',
      headers: {
        'Content-Type': 'application/json',
        'X-WP-Nonce': nonce,
      },
      body: requestData ? JSON.stringify(requestData) : undefined,
    });

    return {
      status: response.status,
      json: await response.json(),
    };
  }, {
    methodValue: method,
    pathValue: path,
    requestData: data,
  });
}

/**
 * Schedules a site refresh via the REST API and returns the scheduled event's id.
 */
async function scheduleRefreshViaApi(page: Page, scheduledDate: Date): Promise<string> {
  const response = await scheduleRefreshApiRequest(page, 'POST', '', {
    schedule_refresh_timestamp: scheduledDate.toISOString(),
  });

  expect(response.status).toBe(201);
  return response.json.data.id as string;
}

/**
 * Deletes a scheduled refresh via the REST API.
 */
async function deleteScheduledRefreshViaApi(page: Page, id: string): Promise<void> {
  const response = await scheduleRefreshApiRequest(page, 'DELETE', `/${id}`);
  expect(response.status).toBe(202);
}

/**
 * Returns a Date one hour in the future, rounded to the nearest minute.
 */
function oneHourFromNow(): Date {
  const date = new Date(Date.now() + 60 * 60 * 1000);
  date.setSeconds(0, 0);
  return date;
}

/**
 * Returns a Date one day in the future at 10:30 PM, rounded to the minute.
 */
function tomorrowAtTenThirtyPm(): Date {
  const date = new Date(Date.now() + 24 * 60 * 60 * 1000);
  date.setHours(22, 30, 0, 0);
  return date;
}

/**
 * Selects a scheduled refresh date and time using the modal's real date picker UI.
 */
async function selectScheduledRefreshInUi(page: Page, scheduledDate: Date): Promise<void> {
  const dateTitle = scheduledDate.toISOString().slice(0, 10);
  const hour12 = new Intl.DateTimeFormat('en-US', {
    hour: '2-digit',
    hour12: true,
    timeZone: 'UTC',
  }).format(scheduledDate).slice(0, 2);
  const minute = new Intl.DateTimeFormat('en-US', {
    minute: '2-digit',
    timeZone: 'UTC',
  }).format(scheduledDate);
  const meridiem = new Intl.DateTimeFormat('en-US', {
    hour: '2-digit',
    hour12: true,
    timeZone: 'UTC',
  }).format(scheduledDate).slice(-2);

  await page.locator('#schedule-datetime-picker').click();
  await page.locator(`.mx-table-date td.cell[title="${dateTitle}"]`).click();
  await page.locator('.mx-time-column [data-type="hour"] .mx-time-item', { hasText: hour12 }).click();
  await page.locator('.mx-time-column [data-type="minute"] .mx-time-item', { hasText: minute }).click();
  await page.locator('.mx-time-column [data-type="ampm"] .mx-time-item', { hasText: meridiem }).click();
}

test.describe('Schedule Refresh', () => {
  test.describe('Scheduling modal', () => {
    test.describe.configure({ mode: 'serial' });
    let page: Page;

    test.beforeAll(async ({ browser, baseURL }) => {
      const context = await browser.newContext({ baseURL, storageState: getAuthFile(baseURL!) });
      page = await context.newPage();
      await goToPluginPage(page);
      await page.locator('[data-test="btn-schedule-refresh"]').click();
    });

    test.afterAll(async () => {
      await page.close();
    });

    test('Clicking "Schedule Refresh" opens the scheduling modal', async () => {
      await expect(page.locator('.modal-window')).toBeVisible();
    });

    test('The modal contains a date picker', async () => {
      await expect(page.locator('#schedule-datetime-picker')).toBeVisible();
    });

    test('The submit button is disabled when no date is selected', async () => {
      await expect(page.locator('[data-test="btn-submit-schedule-refresh"]')).toBeDisabled();
    });
  });

  test.describe('Scheduling through the UI', () => {
    test('Submitting the scheduling modal creates a scheduled refresh', async ({ page }) => {
      await goToPluginPage(page);
      await page.locator('[data-test="btn-schedule-refresh"]').click();

      await selectScheduledRefreshInUi(page, tomorrowAtTenThirtyPm());
      await expect(page.locator('[data-test="btn-submit-schedule-refresh"]')).toBeEnabled();
      await page.locator('[data-test="btn-submit-schedule-refresh"]').click({ force: true });

      await expect(page.locator('.notice-force-refresh.notice-success')).toBeVisible();
      await expect(page.locator('.scheduled-refreshes__list li')).toHaveCount(1);

      await page.locator('[data-test="btn-delete-scheduled-refresh"]').click();
      await expect(page.locator('.scheduled-refreshes__list')).not.toBeVisible();
    });
  });

  test.describe('Scheduling a refresh', () => {
    test.describe.configure({ mode: 'serial' });
    let page: Page;
    let scheduledId: string;

    test.beforeAll(async ({ browser, baseURL }) => {
      const context = await browser.newContext({ baseURL, storageState: getAuthFile(baseURL!) });
      page = await context.newPage();
      await goToPluginPage(page);
      scheduledId = await scheduleRefreshViaApi(page, oneHourFromNow());
      await page.reload();
      await page.locator('.scheduled-refreshes__list').waitFor();
    });

    test.afterAll(async () => {
      // Clean up if the delete test didn't remove it (e.g. if it failed).
      if (scheduledId) {
        await deleteScheduledRefreshViaApi(page, scheduledId).catch(() => {});
      }
      await page.close();
    });

    test('A scheduled refresh appears in the list', async () => {
      await expect(page.locator('.scheduled-refreshes__list li')).toHaveCount(1);
    });

    test('The scheduled refresh shows a formatted date', async () => {
      const text = await page.locator('.scheduled-refreshes__list li').first().textContent();
      // Matches "Month Day, Year at H:MM AM/PM"
      expect(text).toMatch(/\w+ \d{1,2}, \d{4} at \d{1,2}:\d{2} (AM|PM)/);
    });

    test('Deleting a scheduled refresh removes it from the list', async () => {
      await page.locator('[data-test="btn-delete-scheduled-refresh"]').click();
      scheduledId = '';
      await expect(page.locator('.scheduled-refreshes__list')).not.toBeVisible();
    });
  });

  test.describe('Cron execution', () => {
    test('A scheduled refresh changes the site version when cron runs', async ({ page }) => {
      // Capture the current site version from the visitor-facing page.
      await page.goto('/');
      await page.locator('html[force-refresh-version-site]').waitFor();
      const versionBefore = await page.locator('html').getAttribute('force-refresh-version-site');

      // Schedule a refresh slightly in the future via the REST API.
      await goToPluginPage(page);
      const scheduledDate = new Date(Date.now() + 10_000);
      await scheduleRefreshViaApi(page, scheduledDate);

      // Wait until the scheduled time has passed, then trigger WP cron.
      await page.waitForTimeout(12_000);
      await page.goto('/wp-cron.php?doing_wp_cron');

      // The site version on a fresh page load should now be different.
      await expect.poll(async () => {
        await page.goto('/');
        await page.locator('html[force-refresh-version-site]').waitFor();
        return page.locator('html').getAttribute('force-refresh-version-site');
      }, {
        timeout: 30_000,
      }).not.toBe(versionBefore);

      const versionAfter = await page.locator('html').getAttribute('force-refresh-version-site');
      expect(versionAfter).not.toBe(versionBefore);
    });
  });
});
