import { defineConfig, devices } from '@playwright/test';
import { WP_INSTANCES, getAuthFile } from './test/e2e/helpers/constants';

const QA_INSTANCES = [
  { name: 'WordPress 5', baseURL: 'http://wp5.force-refresh.localhost' },
  { name: 'WordPress 6', baseURL: 'http://wp6.force-refresh.localhost' },
  { name: 'WordPress 7', baseURL: 'http://wp7.force-refresh.localhost' },
];

export default defineConfig({
  testDir: './test/e2e',
  timeout: 120_000,
  reporter: 'list',
  workers: 1,
  use: {
    trace: 'on-first-retry',
    launchOptions: {
      slowMo: 800,
    },
  },
  projects: QA_INSTANCES.flatMap((instance) => [
    {
      name: `setup-${instance.name}`,
      testMatch: '**/helpers/auth.setup.ts',
      use: { baseURL: instance.baseURL },
    },
    {
      name: instance.name,
      use: {
        ...devices['Desktop Chrome'],
        baseURL: instance.baseURL,
        storageState: getAuthFile(instance.baseURL),
        headless: false,
      },
      dependencies: [`setup-${instance.name}`],
    },
  ]),
});
