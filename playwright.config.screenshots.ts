import { defineConfig, devices } from '@playwright/test';
import { getAuthFile } from './test/e2e/helpers/constants';

const INSTANCE = { name: 'WordPress 7.0', baseURL: 'http://wp7.force-refresh.localhost' };

export default defineConfig({
  testDir: './screenshots',
  testMatch: '**/capture.ts',
  timeout: 120_000,
  reporter: 'list',
  workers: 1,
  use: {
    launchOptions: {
      slowMo: process.env.PLAYWRIGHT_SLOW_MO ? 800 : 0,
    },
  },
  projects: [
    {
      name: `setup-${INSTANCE.name}`,
      testDir: './test/e2e',
      testMatch: '**/helpers/auth.setup.ts',
      use: { baseURL: INSTANCE.baseURL },
    },
    {
      name: INSTANCE.name,
      use: {
        ...devices['Desktop Chrome'],
        baseURL: INSTANCE.baseURL,
        storageState: getAuthFile(INSTANCE.baseURL),
        viewport: { width: 1280, height: 831 },
        headless: process.env.HEADLESS === 'true',
      },
      dependencies: [`setup-${INSTANCE.name}`],
    },
  ],
});
