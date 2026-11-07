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
 * Returns all scheduled refreshes via the REST API.
 */
async function getScheduledRefreshesViaApi(page: Page): Promise<Array<{ id: string; timestamp: number }>> {
  const response = await page.evaluate(async () => {
    const { nonce } = (window as any).forceRefreshMain.localData;
    const result = await fetch('/wp-json/force-refresh/v1/schedule-site-version', {
      credentials: 'same-origin',
      headers: {
        'Content-Type': 'application/json',
        'X-WP-Nonce': nonce,
      },
    });

    return {
      status: result.status,
      json: await result.json(),
    };
  });

  if (response.status !== 200) throw new Error(`Fetching scheduled refreshes failed: ${response.status}`);
  return response.json.data.scheduled_refreshes as Array<{ id: string; timestamp: number }>;
}

/**
 * Schedules a site refresh via the REST API and returns the scheduled event's id.
 */
async function scheduleRefreshViaApi(page: Page, scheduledDate: Date): Promise<string> {
  const response = await scheduleRefreshApiRequest(page, 'POST', '', {
    schedule_refresh_timestamp: scheduledDate.toISOString(),
  });

  if (response.status !== 201) throw new Error(`Scheduling refresh failed: ${response.status}`);
  return response.json.data.id as string;
}

/**
 * Deletes a scheduled refresh via the REST API.
 */
async function deleteScheduledRefreshViaApi(page: Page, id: string): Promise<void> {
  const response = await scheduleRefreshApiRequest(page, 'DELETE', `/${id}`);
  if (response.status !== 202) throw new Error(`Deleting scheduled refresh failed: ${response.status}`);
}

/**
 * Removes all scheduled refreshes so the test starts from a known state.
 */
async function clearScheduledRefreshesViaApi(page: Page): Promise<void> {
  const scheduledRefreshes = await getScheduledRefreshesViaApi(page);

  await Promise.all(
    scheduledRefreshes.map(({ id }) => deleteScheduledRefreshViaApi(page, id)),
  );
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
  const values = await page.evaluate((iso) => {
    const date = new Date(iso);
    return {
      label: date.toLocaleDateString(undefined, { dateStyle: 'full' }),
      hour: String(date.getHours() % 12 || 12).padStart(2, '0'),
      minute: String(date.getMinutes()).padStart(2, '0'),
      period: date.getHours() >= 12 ? 'PM' : 'AM',
      monthOffset: (() => {
        const initial = new Date(Math.ceil((Date.now() + 60000) / 300000) * 300000);
        return (date.getFullYear() - initial.getFullYear()) * 12 + date.getMonth() - initial.getMonth();
      })(),
    };
  }, scheduledDate.toISOString());
  // Navigation depends on the previous month transition.
  // eslint-disable-next-line no-await-in-loop
  for (let i = 0; i < values.monthOffset; i += 1) await page.getByRole('button', { name: 'Next month' }).click();
  await page.getByRole('button', { name: values.label, exact: true }).click();
  await page.locator('.schedule-time__column').nth(0).getByRole('button', { name: values.hour, exact: true }).click();
  await page.locator('.schedule-time__column').nth(1).getByRole('button', { name: values.minute, exact: true }).click();
  await page.locator('.schedule-time__period').getByRole('button', { name: values.period, exact: true }).click();
}

test.describe('Schedule Refresh', () => {
  test.beforeAll(async ({ browser, baseURL }) => {
    const context = await browser.newContext({ baseURL, storageState: getAuthFile(baseURL!) });
    const page = await context.newPage();
    await goToPluginPage(page);
    await clearScheduledRefreshesViaApi(page);
    await page.close();
    await context.close();
  });

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
      await expect(page.locator('[data-test="schedule-refresh-modal-content"]')).toBeVisible();
    });

    test('The modal contains a date picker', async () => {
      await expect(page.locator('.schedule-calendar')).toBeVisible();
    });

    test('The modal opens with one selected day', async () => {
      await expect(page.locator('.schedule-calendar__grid button[aria-pressed="true"]')).toHaveCount(1);
    });

    test('The modal opens with an enabled submit button', async () => {
      await expect(page.locator('[data-test="btn-submit-schedule-refresh"]')).toBeEnabled();
    });

    test('Clearing the selected date disables submission', async () => {
      await page.locator('.schedule-sheet__selection button').click();
      await expect(page.locator('[data-test="btn-submit-schedule-refresh"]')).toBeDisabled();
    });
  });

  test('Clearing a selected date returns keyboard focus to that calendar date', async ({ page }) => {
    await goToPluginPage(page);
    await page.locator('[data-test="btn-schedule-refresh"]').click();
    const selectedDateLabel = await page.locator('.schedule-calendar__grid button[aria-pressed="true"]').getAttribute('aria-label');
    await page.locator('.schedule-sheet__selection button').focus();
    await page.keyboard.press('Enter');
    await expect(page.getByRole('button', { name: selectedDateLabel!, exact: true })).toBeFocused();
  });

  test.describe('Scheduling through the UI', () => {
    [
      { name: 'the default selection', chooseDate: false },
      { name: 'a chosen date', chooseDate: true },
    ].forEach(({ name, chooseDate }) => {
      test.describe(`Scheduling ${name}`, () => {
        test.describe.configure({ mode: 'serial' });
        let page: Page;
        let scheduledRefreshLabel: string;

        test.beforeAll(async ({ browser, baseURL }) => {
          const context = await browser.newContext({ baseURL, storageState: getAuthFile(baseURL!) });
          page = await context.newPage();
          await goToPluginPage(page);
          await page.locator('[data-test="btn-schedule-refresh"]').click();
          if (chooseDate) await selectScheduledRefreshInUi(page, tomorrowAtTenThirtyPm());
          // Use the browser's label to avoid timezone drift from the test runner.
          scheduledRefreshLabel = (await page.locator('.schedule-sheet__selection > span').innerText()).trim();
        });

        test.afterAll(async () => {
          await clearScheduledRefreshesViaApi(page);
          await page.context().close();
        });

        test('The calendar has one selected day', async () => {
          await expect(page.locator('.schedule-calendar__grid button[aria-pressed="true"]')).toHaveCount(1);
        });

        test('The selected date can be submitted', async () => {
          await expect(page.locator('[data-test="btn-submit-schedule-refresh"]')).toBeEnabled();
        });

        test('Submitting shows a success notice', async () => {
          await page.locator('[data-test="btn-submit-schedule-refresh"]').click();
          await expect(page.locator('.notice-force-refresh.notice-success')).toBeVisible();
        });

        test('The scheduled date appears in the list', async () => {
          const item = page.locator('.scheduled-refreshes__list li').filter({ hasText: scheduledRefreshLabel });
          await expect(item).toBeVisible();
        });

        test('Deleting the scheduled date removes it from the list', async () => {
          const item = page.locator('.scheduled-refreshes__list li').filter({ hasText: scheduledRefreshLabel });
          await item.getByRole('button', { name: 'Delete' }).click();
          await expect(item).toHaveCount(0);
        });
      });
    });

    [
      { timezoneId: 'America/New_York', label: 'Eastern Time' },
      { timezoneId: 'America/Los_Angeles', label: 'Pacific Time' },
    ].forEach(({ timezoneId, label }) => {
      test.describe(`Scheduling in the browser's ${label} zone`, () => {
        test.describe.configure({ mode: 'serial' });
        let page: Page;
        let scheduledId: string | undefined;
        let iso: string;
        let status: number;
        let responseTimestamp: number;
        let timezoneText: string;

        test.beforeAll(async ({ browser, baseURL }) => {
          const context = await browser.newContext({
            baseURL, storageState: getAuthFile(baseURL!), timezoneId, locale: 'en-US',
          });
          page = await context.newPage();
          await goToPluginPage(page);
          await page.locator('[data-test="btn-schedule-refresh"]').click();
          timezoneText = await page.locator('.schedule-sheet__timezone').innerText();
          iso = await page.evaluate(() => {
            const date = new Date();
            date.setDate(date.getDate() + 1);
            date.setHours(22, 30, 0, 0);
            return date.toISOString();
          });
          await selectScheduledRefreshInUi(page, new Date(iso));
          const responsePromise = page.waitForResponse((response) => (
            response.url().includes('/schedule-site-version') && response.request().method() === 'POST'
          ));
          await page.locator('[data-test="btn-submit-schedule-refresh"]').click();
          const response = await responsePromise;
          const { data } = await response.json();
          scheduledId = data.id;
          status = response.status();
          responseTimestamp = data.scheduled_refresh_time;
        });

        test.afterAll(async () => {
          try {
            if (scheduledId) await deleteScheduledRefreshViaApi(page, scheduledId);
          } finally {
            await page.context().close();
          }
        });

        test('The dialog identifies the browser timezone', () => {
          expect(timezoneText).toBe(`Times are in ${label}.`);
        });

        test('Scheduling returns a created response', () => {
          expect(status).toBe(201);
        });

        test('The response timestamp matches the chosen local time', () => {
          expect(responseTimestamp).toBe(Date.parse(iso) / 1000);
        });

        test('The stored timestamp matches the chosen local time', async () => {
          const stored = await getScheduledRefreshesViaApi(page);
          expect(stored.find(({ id }) => id === scheduledId)?.timestamp).toBe(Date.parse(iso) / 1000);
        });
      });
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
      await clearScheduledRefreshesViaApi(page);
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
      await expect(page.locator(`[data-test="scheduled-refresh-${scheduledId}"]`)).toBeVisible();
    });

    test('The scheduled refresh shows a formatted date', async () => {
      const text = await page.locator(`[data-test="scheduled-refresh-${scheduledId}"]`).textContent();
      // Matches "Month Day, Year at H:MM AM/PM"
      expect(text).toMatch(/\w+ \d{1,2}, \d{4} at \d{1,2}:\d{2} (AM|PM)/);
    });

    test('Deleting a scheduled refresh removes it from the list', async () => {
      await page.locator(`[data-test="btn-delete-scheduled-refresh-${scheduledId}"]`).click();
      await expect(page.locator(`[data-test="scheduled-refresh-${scheduledId}"]`)).toHaveCount(0);
      scheduledId = '';
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
