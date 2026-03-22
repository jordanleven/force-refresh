import { Page } from '@playwright/test';

const REFRESH_INTERVAL_SECONDS = 30;
const REFRESH_POLL_BUFFER_SECONDS = 5;
const VISITOR_RELOAD_TIMEOUT = (REFRESH_INTERVAL_SECONDS + REFRESH_POLL_BUFFER_SECONDS) * 1000;

/**
 * Waits for the visitor's initial poll, triggers a refresh via the given
 * button, and waits for the visitor page to reload within the poll cycle.
 */
export async function triggerRefreshAndWaitForReload(
  adminPage: Page,
  visitorPage: Page,
  refreshButtonSelector: string,
): Promise<void> {
  await visitorPage.waitForTimeout(2000);
  await adminPage.locator(refreshButtonSelector).click();
  await visitorPage.waitForEvent('load', { timeout: VISITOR_RELOAD_TIMEOUT });
}
