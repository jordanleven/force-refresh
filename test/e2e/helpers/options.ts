import { APIResponse, Page } from '@playwright/test';
import { goToPluginPage } from './auth';

export type UpdateMethod = 'rest' | 'static_file' | 'websockets';

export const UPDATE_METHOD_SELECT = '[data-test="select-update-method"]';

/**
 * Opens the plugin page, selects the given update method and saves the options.
 */
export async function setUpdateMethod(adminPage: Page, updateMethod: UpdateMethod): Promise<void> {
  await goToPluginPage(adminPage);
  await adminPage.locator(UPDATE_METHOD_SELECT).selectOption(updateMethod);
  await Promise.all([
    adminPage.waitForResponse((r) => r.url().includes('/options') && r.status() === 201),
    adminPage.locator('[data-test="btn-update-options"]').click(),
  ]);
}

/**
 * Saves options straight through the options REST endpoint, as the admin
 * script would. The page must already be on the plugin page, because the
 * endpoint and nonce are read from its localized data.
 */
export async function saveOptionsThroughApi(
  adminPage: Page,
  options: Record<string, unknown>,
): Promise<APIResponse> {
  const { endpoint, nonce } = await adminPage.evaluate(() => {
    const { adminEndpoints, nonce: wpNonce } = (window as any).forceRefreshMain.localData;
    return { endpoint: adminEndpoints.options, nonce: wpNonce };
  });

  return adminPage.request.put(endpoint, {
    data: options,
    headers: { 'X-WP-Nonce': nonce },
  });
}
