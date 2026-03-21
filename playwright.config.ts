import { defineConfig, devices } from '@playwright/test';
import { WP_INSTANCES, getAuthFile } from './tests/e2e/helpers/constants';

export default defineConfig({
  testDir: './tests/e2e',
  timeout: 120_000,
  reporter: 'list',
  use: {
    trace: 'on-first-retry',
    launchOptions: {
      slowMo: 800,
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
