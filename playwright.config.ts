import { defineConfig, devices } from '@playwright/test';
import { WP_INSTANCES, getAuthFile } from './test/e2e/helpers/constants';

export default defineConfig({
  testDir: './test/e2e',
  timeout: 120_000,
  reporter: 'list',
  use: {
    trace: 'on-first-retry',
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
      use: {
        ...devices['Desktop Chrome'],
        baseURL,
        storageState: getAuthFile(baseURL),
      },
      dependencies: [`setup-${name}`],
    })),
  ],
});
