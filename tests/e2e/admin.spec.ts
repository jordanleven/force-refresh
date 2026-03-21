import { test, expect } from '@playwright/test';
import { goToPluginPage } from './helpers/auth';

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
      test.beforeEach(async ({ page }) => {
        await goToPluginPage(page);
        await page.locator('[data-test="btn-force-refresh"]').click();
      });

      test('Clicking Force Refresh shows a success banner', async ({ page }) => {
        await expect(page.locator('.notice-force-refresh.notice-success')).toBeVisible();
      });

      test('Clicking the dismiss button hides the banner', async ({ page }) => {
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
    test.beforeEach(async ({ page }) => {
      await goToPluginPage(page);
      await page.locator('[data-test="btn-troubleshooting"]').click();
    });

    test('Clicking the Troubleshooting button navigates to the troubleshooting section', async ({ page }) => {
      await expect(page.locator('.force-refresh-troubleshooting')).toBeVisible();
    });

    test.describe('Health section', () => {
      test('The health section shows the PHP version', async ({ page }) => {
        await expect(page.locator('.plugin-versions__label').filter({ hasText: /php/i })).toBeVisible();
      });

      test('The health section shows the WordPress version', async ({ page }) => {
        await expect(page.locator('.plugin-versions__label').filter({ hasText: /wordpress/i })).toBeVisible();
      });

      test('The health section shows the Force Refresh version', async ({ page }) => {
        await expect(page.locator('.plugin-versions__label').filter({ hasText: /force refresh/i })).toBeVisible();
      });
    });

    test.describe('Debug mode', () => {
      test('No debug banner is shown when entering troubleshooting mode', async ({ page }) => {
        await expect(page.locator('.notice-force-refresh.notice-warning')).not.toBeVisible();
      });

      test('Enabling debug mode shows a debug banner', async ({ page }) => {
        await page.locator('[data-test="toggle-debug-mode"] label').click();
        await expect(page.locator('.notice-force-refresh.notice-warning')).toBeVisible();

        // Restore: turn debug mode back off so subsequent tests aren't affected
        await page.locator('[data-test="toggle-debug-mode"] label').click();
        await expect(page.locator('.notice-force-refresh.notice-warning')).not.toBeVisible();
      });
    });

    test('Clicking Exit Troubleshooting returns to the main admin page', async ({ page }) => {
      await page.locator('[data-test="btn-exit-troubleshooting"]').click();
      await expect(page.locator('.force-refresh-admin__options')).toBeVisible();
    });
  });

  test.describe('Release notes', () => {
    test.beforeEach(async ({ page }) => {
      await goToPluginPage(page);
      await page.locator('[data-test="btn-release-notes"]').click();
      await page.waitForLoadState('networkidle');
    });

    test('Clicking View Release Notes shows the release notes modal', async ({ page }) => {
      await expect(page.locator('.modal-window')).toBeVisible();
    });

    test('The release notes modal contains release notes', async ({ page }) => {
      await expect(page.locator('.release-note').first()).toBeVisible({ timeout: 15_000 });
    });
  });
});
