import { UPDATE_METHOD_REST } from '@/js/admin/updateMethods.js';

export default (localizedData) => ({
  featureFlags: localizedData.featureFlags ?? {},
  network: {
    detectedCdn: localizedData.detectedCdn ?? null,
  },
  settings: {
    customRefreshIntervalMaximumInMinutes: localizedData.refreshOptions.customRefreshIntervalMaximumInMinutes,
    customRefreshIntervalMinimumInMinutes: localizedData.refreshOptions.customRefreshIntervalMinimumInMinutes,
    isDebugActive: localizedData.isDebugActive,
    isRelayConfigured: localizedData.refreshOptions.isRelayConfigured ?? false,
    refreshFromAdminBar: localizedData.refreshOptions.showRefreshInMenuBar,
    refreshInterval: localizedData.refreshOptions.refreshInterval,
    updateMethod: localizedData.refreshOptions.updateMethod ?? UPDATE_METHOD_REST,
  },
  site: {
    isMultiSite: localizedData.isMultiSite,
    lastCronRun: localizedData.lastCronRun ?? null,
    scheduledRefreshes: localizedData.scheduledRefreshes,
    siteId: localizedData.siteId,
    siteName: localizedData.siteName,
    siteUrl: localizedData.siteUrl,
    versionForceRefreshInstalled: localizedData.versions.forceRefresh.version,
    versionForceRefreshRequired: localizedData.versions.forceRefresh.versionRequired,
    versionPhpEolDate: localizedData.versions.php.eolDate ?? null,
    versionPhpInstalled: localizedData.versions.php.version,
    versionPhpRequired: localizedData.versions.php.versionRequired,
    versionWordPressEolDate: localizedData.versions.wordPress.eolDate ?? null,
    versionWordPressInstalled: localizedData.versions.wordPress.version,
    versionWordPressRequired: localizedData.versions.wordPress.versionRequired,
  },
});
