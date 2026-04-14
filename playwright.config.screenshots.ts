import { defineConfig, devices } from '@playwright/test';
import { getAuthFile } from './test/e2e/helpers/constants';

const INSTANCE = { name: 'WordPress 6.9', baseURL: 'http://wp6.force-refresh.localhost' };

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
        viewport: { width: 1600, height: 999 },
        headless: process.env.HEADLESS === 'true',
      },
      dependencies: [`setup-${INSTANCE.name}`],
    },
  ],
});
