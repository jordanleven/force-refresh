import { defineConfig, devices } from '@playwright/test';
import { WP_INSTANCES, getAuthFile } from './test/e2e/helpers/constants';

export default defineConfig({
  testDir: './test/e2e',
  timeout: 120_000,
  reporter: process.env.CI ? [['list'], ['html', { open: 'never' }]] : 'list',
  use: {
    trace: process.env.CI ? 'retain-on-failure' : 'on-first-retry',
    screenshot: 'only-on-failure',
    launchOptions: {
      slowMo: process.env.PLAYWRIGHT_SLOW_MO ? 800 : 0,
    },
  },
  projects: [
    ...WP_INSTANCES.map(({ name, baseURL }) => ({
      name: `setup-${name}`,
      testMatch: '**/helpers/auth.setup.ts',
      use: { baseURL },
    })),
    ...WP_INSTANCES.map(({ name, baseURL }) => ({
      name,
      workers: 1,
      use: {
        ...devices['Desktop Chrome'],
        baseURL,
        storageState: getAuthFile(baseURL),
        headless: true,
      },
      dependencies: [`setup-${name}`],
    })),
  ],
});
