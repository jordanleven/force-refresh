import { test, expect, Page } from '@playwright/test';
import { goToPluginPage } from './helpers/auth';
import { getAuthFile } from './helpers/constants';

test.describe('Admin', () => {
  test.describe('Force Refresh button', () => {
    test('Clicking Force Refresh updates the site version', async ({ page }) => {
      await page.goto('/');
      await page.locator('html[force-refresh-version-site]').waitFor();
      const beforeVersion = await page.locator('html').getAttribute('force-refresh-version-site');

      await goToPluginPage(page);
      await page.locator('[data-test="btn-force-refresh"]').click();

      await page.goto('/');
      await page.locator('html[force-refresh-version-site]').waitFor();
      const afterVersion = await page.locator('html').getAttribute('force-refresh-version-site');

      expect(afterVersion).not.toBe(beforeVersion);
    });

    test.describe('Success banner', () => {
      test.describe.configure({ mode: 'serial' });
      let page: Page;

      test.beforeAll(async ({ browser, baseURL }) => {
        const context = await browser.newContext({ baseURL, storageState: getAuthFile(baseURL!) });
        page = await context.newPage();
        await goToPluginPage(page);
        await page.locator('[data-test="btn-force-refresh"]').click();
      });

      test.afterAll(async () => {
        await page.close();
      });

      test('Clicking Force Refresh shows a success banner', async () => {
        await expect(page.locator('.notice-force-refresh.notice-success')).toBeVisible();
      });

      test('Clicking the dismiss button hides the banner', async () => {
        const banner = page.locator('.notice-force-refresh.notice-success');
        await expect(banner).toBeVisible();
        await banner.locator('.notice-force-refresh__button').click();
        await expect(banner).not.toBeVisible();
      });
    });
  });

  test.describe('Admin bar option', () => {
    test('Setting the option to Show displays the admin bar button', async ({ page }) => {
      await goToPluginPage(page);
      await page.selectOption('select[name="show-in-wp-admin-bar"]', { label: 'Show' });
      await page.locator('[data-test="btn-update-options"]').click();

      await expect(page.locator('[data-test="btn-admin-bar-refresh"]')).toBeVisible();
    });

    test('Setting the option to Hide removes the admin bar button', async ({ page }) => {
      await goToPluginPage(page);
      await page.selectOption('select[name="show-in-wp-admin-bar"]', { label: 'Hide' });
      await page.locator('[data-test="btn-update-options"]').click();

      await expect(page.locator('[data-test="btn-admin-bar-refresh"]')).not.toBeVisible();
    });
  });

  test.describe('Troubleshooting', () => {
    test('Clicking the Troubleshooting button navigates to the troubleshooting section', async ({ page }) => {
      await goToPluginPage(page);
      await page.locator('[data-test="btn-troubleshooting"]').click();
      await expect(page.locator('.force-refresh-troubleshooting')).toBeVisible();
    });

    test.describe('Health section', () => {
      test.describe.configure({ mode: 'serial' });
      let page: Page;

      test.beforeAll(async ({ browser, baseURL }) => {
        const context = await browser.newContext({ baseURL, storageState: getAuthFile(baseURL!) });
        page = await context.newPage();
        await goToPluginPage(page);
        await page.locator('[data-test="btn-troubleshooting"]').click();
      });

      test.afterAll(async () => {
        await page.close();
      });

      test('The health section shows the PHP version', async () => {
        await expect(page.locator('.plugin-versions__label').filter({ hasText: /php/i })).toBeVisible();
      });

      test('The health section shows the WordPress version', async () => {
        await expect(page.locator('.plugin-versions__label').filter({ hasText: /wordpress/i })).toBeVisible();
      });

      test('The health section shows the Force Refresh version', async () => {
        await expect(page.locator('.plugin-versions__label').filter({ hasText: /force refresh/i })).toBeVisible();
      });
    });

    test.describe('Debug mode', () => {
      test.describe.configure({ mode: 'serial' });
      let page: Page;

      test.beforeAll(async ({ browser, baseURL }) => {
        const context = await browser.newContext({ baseURL, storageState: getAuthFile(baseURL!) });
        page = await context.newPage();
        await goToPluginPage(page);
        await page.locator('[data-test="btn-troubleshooting"]').click();
      });

      test.afterAll(async () => {
        await page.close();
      });

      test('No debug badge is shown when entering troubleshooting mode', async () => {
        await expect(page.locator('.header-row__badges .admin-header-badge--debug')).not.toBeVisible();
      });

      test('Enabling debug mode shows a debug badge', async () => {
        await page.locator('[data-test="toggle-debug-mode"] label').click();
        await expect(page.locator('.header-row__badges .admin-header-badge--debug')).toBeVisible();

        // Restore: turn debug mode back off so subsequent tests aren't affected
        await page.locator('[data-test="toggle-debug-mode"] label').click();
        await expect(page.locator('.header-row__badges .admin-header-badge--debug')).not.toBeVisible();
      });

      test('Hovering the debug badge shows the tooltip message', async () => {
        await page.locator('[data-test="toggle-debug-mode"] label').click();
        await expect(page.locator('.header-row__badges .admin-header-badge--debug')).toBeVisible();

        await page.locator('.header-row__badges .admin-header-badge--debug').hover();
        await expect(page.locator('.tooltip.tooltip--visible')).toBeVisible();

        // Restore: turn debug mode back off so subsequent tests aren't affected
        await page.locator('[data-test="toggle-debug-mode"] label').click();
        await expect(page.locator('.header-row__badges .admin-header-badge--debug')).not.toBeVisible();
      });
    });

    test.describe('Debug email', () => {
      test.describe.configure({ mode: 'serial' });
      let page: Page;

      test.beforeAll(async ({ browser, baseURL }) => {
        const context = await browser.newContext({ baseURL, storageState: getAuthFile(baseURL!) });
        page = await context.newPage();
        await goToPluginPage(page);
        await page.locator('[data-test="btn-troubleshooting"]').click();
        await page.locator('[data-test="toggle-debug-mode"] label').click();
      });

      test.afterAll(async () => {
        // Close the modal if it was left open by a failing test
        const modal = page.locator('.modal-window--open');
        if (await modal.isVisible()) {
          await page.locator('[data-test="btn-cancel-debug-email"]').click();
          await expect(modal).not.toBeVisible();
        }
        await page.locator('[data-test="toggle-debug-mode"] label').click();
        await page.close();
      });

      test('Clicking Submit Debug Info opens the debug email modal', async () => {
        await page.locator('[data-test="btn-submit-debug-info"]').click();
        await expect(page.locator('.modal-window')).toBeVisible();
      });

      test('The modal shows a loading state while fetching data', async () => {
        await page.locator('[data-test="btn-cancel-debug-email"]').click();
        await expect(page.locator('.modal-window')).not.toBeVisible();

        await page.route('**/wp-json/force-refresh/v1/debug-email', async (route, request) => {
          if (request.method() !== 'GET') {
            await route.continue();
            return;
          }

          await page.waitForTimeout(750);
          await route.continue();
        }, { times: 1 });

        await page.locator('[data-test="btn-submit-debug-info"]').click();
        await expect(page.locator('.debug-modal__loading')).toBeVisible();
      });

      test('The modal shows debug data rows after loading', async () => {
        await expect(page.locator('.debug-modal__rows')).toBeVisible({ timeout: 15_000 });
        await expect(page.locator('.debug-modal__row').first()).toBeVisible();
      });

      test('The send button is disabled when no URL is entered', async () => {
        await expect(page.locator('[data-test="btn-send-debug-email"]')).toBeDisabled();
      });

      test('Entering a valid support URL enables the send button', async () => {
        await page.locator('#debug-support-topic-url').fill('https://wordpress.org/support/topic/test-issue/');
        await expect(page.locator('[data-test="btn-send-debug-email"]')).not.toBeDisabled();
      });

      test('Submitting the form shows the success state', async () => {
        await page.locator('[data-test="btn-send-debug-email"]').click();
        await expect(page.locator('[data-test="debug-email-sent"]')).toBeVisible({ timeout: 15_000 });
      });

      test('Clicking Done on the success state closes the modal', async () => {
        await page.locator('[data-test="btn-debug-email-done"]').click();
        await expect(page.locator('.modal-window')).not.toBeVisible();
      });
    });

    test('Clicking Exit Troubleshooting returns to the main admin page', async ({ page }) => {
      await goToPluginPage(page);
      await page.locator('[data-test="btn-troubleshooting"]').click();
      await page.locator('[data-test="btn-exit-troubleshooting"]').click();
      await expect(page.locator('.force-refresh-admin__options')).toBeVisible();
    });
  });

  test.describe('Release notes', () => {
    test.describe.configure({ mode: 'serial' });
    let page: Page;
    let firstToggle: any;
    let secondToggle: any;

    test.beforeAll(async ({ browser, baseURL }) => {
      const context = await browser.newContext({ baseURL, storageState: getAuthFile(baseURL!) });
      page = await context.newPage();
      await goToPluginPage(page);
      await page.locator('[data-test="btn-release-notes"]').click();
      await page.waitForLoadState('networkidle');
      firstToggle = page.locator('[data-test="toggle-release-note-group-0"]');
      secondToggle = page.locator('[data-test="toggle-release-note-group-1"]');
    });

    test.afterAll(async () => {
      await page.close();
    });

    test('Clicking View Release Notes shows the release notes modal', async () => {
      await expect(page.locator('.modal-window')).toBeVisible();
      await expect(page.locator('[data-test="release-notes-modal-content"]')).toBeVisible();
    });

    test('The release notes modal contains release notes', async () => {
      await expect(page.locator('.release-note').first()).toBeVisible({ timeout: 15_000 });
    });

    test('Clicking a release version opens the matching GitHub release tag', async () => {
      const releaseLink = page.locator('[data-test^="release-note-link-"]').first();
      const expectedUrl = await releaseLink.getAttribute('href');

      await expect(releaseLink).toHaveAttribute('target', '_blank');
      await expect(releaseLink).toHaveAttribute('rel', 'noopener noreferrer');

      const [popup] = await Promise.all([
        page.waitForEvent('popup'),
        releaseLink.click(),
      ]);

      await expect.poll(() => popup.url()).toBe(expectedUrl);
      await popup.close();
    });

    test('The newest minor version group is expanded by default', async () => {
      await expect(firstToggle).toHaveAttribute('aria-expanded', 'true');
      await expect(secondToggle).toHaveAttribute('aria-expanded', 'false');
      await expect(page.locator('[data-test="release-note-group-panel-0"]')).toHaveCount(1);
      await expect(page.locator('[data-test="release-note-group-panel-1"]')).toHaveCount(0);
    });

    test('Only one minor version group is expanded at a time', async () => {
      await secondToggle.click();

      await expect(secondToggle).toHaveAttribute('aria-expanded', 'true');
      await expect(firstToggle).toHaveAttribute('aria-expanded', 'false');
      await expect(page.locator('[data-test="release-note-group-panel-1"]')).toHaveCount(1);
      await expect(page.locator('[data-test="release-note-group-panel-0"]')).toHaveCount(0);

      await firstToggle.click();

      await expect(firstToggle).toHaveAttribute('aria-expanded', 'true');
      await expect(secondToggle).toHaveAttribute('aria-expanded', 'false');
      await expect(page.locator('[data-test="release-note-group-panel-0"]')).toHaveCount(1);
      await expect(page.locator('[data-test="release-note-group-panel-1"]')).toHaveCount(0);
    });

    test('Clicking an open minor version group collapses it', async () => {
      await firstToggle.click();

      await expect(firstToggle).toHaveAttribute('aria-expanded', 'false');
      await expect(page.locator('[data-test="release-note-group-panel-0"]')).toHaveCount(0);
    });
  });
});
