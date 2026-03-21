import { defineConfig, devices } from '@playwright/test';
import { getAuthFile } from './tests/e2e/helpers/constants';

const QA_INSTANCE = { name: 'QA', baseURL: 'http://qa.force-refresh.localhost' };

export default defineConfig({
  testDir: './tests/e2e',
  timeout: 120_000,
  reporter: 'list',
  workers: 1,
  use: {
    trace: 'on-first-retry',
    launchOptions: {
      slowMo: 800,
    },
  },
  projects: [
    {
      name: `setup-${QA_INSTANCE.name}`,
      testMatch: '**/helpers/auth.setup.ts',
      use: { baseURL: QA_INSTANCE.baseURL },
    },
    {
      name: QA_INSTANCE.name,
      use: {
        ...devices['Desktop Chrome'],
        baseURL: QA_INSTANCE.baseURL,
        storageState: getAuthFile(QA_INSTANCE.baseURL),
        headless: false,
      },
      dependencies: [`setup-${QA_INSTANCE.name}`],
    },
  ],
});
