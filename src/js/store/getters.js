import {
  FEATURE_FLAG_WEBSOCKETS,
  UPDATE_METHOD_REST,
  UPDATE_METHOD_WEBSOCKETS,
} from '@/js/admin/updateMethods.js';

export default {
  detectedCdn: ({ network }) => network.detectedCdn,
  effectiveUpdateMethod: (_, getters) => (
    getters.updateMethod === UPDATE_METHOD_WEBSOCKETS && !getters.isWebSocketsAvailable
      ? UPDATE_METHOD_REST
      : getters.updateMethod
  ),
  featureFlags: ({ featureFlags }) => featureFlags,
  isDebugActive: ({ settings }) => settings.isDebugActive,
  isFeatureEnabled: ({ featureFlags }) => (flag) => Boolean(featureFlags?.[flag]),
  isRelayConfigured: ({ settings }) => settings.isRelayConfigured,
  isWebSocketsAvailable: (_, getters) => getters.isWebSocketsEnabled && getters.isRelayConfigured,
  isWebSocketsEnabled: (_, getters) => getters.isFeatureEnabled(FEATURE_FLAG_WEBSOCKETS),
  refreshFromAdminBar: ({ settings }) => settings.refreshFromAdminBar,
  refreshInterval: ({ settings }) => settings.refreshInterval,
  refreshOptions: ({ settings }, getters) => ({
    customRefreshIntervalMaximumInMinutes: settings.customRefreshIntervalMaximumInMinutes,
    customRefreshIntervalMinimumInMinutes: settings.customRefreshIntervalMinimumInMinutes,
    refreshInterval: getters.refreshInterval,
    showRefreshInMenuBar: getters.refreshFromAdminBar,
    updateMethod: getters.updateMethod,
  }),
  scheduledRefreshes: ({ site }) => site.scheduledRefreshes,
  siteName: ({ site }) => site.siteName,
  troubleshootingInformation: (_, getters) => ({
    ...getters.troubleshootingInformationSettings,
    ...getters.troubleshootingInformationVersions,
  }),
  troubleshootingInformationSettings: ({ site, network }, getters) => ({
    currentSiteId: site.siteId,
    detectedCdn: network.detectedCdn,
    effectiveUpdateMethod: getters.effectiveUpdateMethod,
    isMultiSite: site.isMultiSite,
    lastCronRun: site.lastCronRun,
    scheduledRefreshesCount: site.scheduledRefreshes.length,
    siteName: site.siteName,
    siteUrl: site.siteUrl,
    updateMethod: getters.updateMethod,
  }),
  troubleshootingInformationVersions: ({ site }) => ({
    versions: {
      forceRefresh: {
        required: site.versionForceRefreshRequired,
        version: site.versionForceRefreshInstalled,
      },
      php: {
        eolDate: site.versionPhpEolDate,
        required: site.versionPhpRequired,
        version: site.versionPhpInstalled,
      },
      wordPress: {
        eolDate: site.versionWordPressEolDate,
        required: site.versionWordPressRequired,
        version: site.versionWordPressInstalled,
      },
    },
  }),
  updateMethod: ({ settings }) => settings.updateMethod,
  wordPressNonce: ({ nonce }) => nonce,
};
