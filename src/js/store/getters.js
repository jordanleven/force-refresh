export default {
  isDebugActive: ({ settings }) => settings.isDebugActive,
  refreshFromAdminBar: ({ settings }) => settings.refreshFromAdminBar,
  refreshInterval: ({ settings }) => settings.refreshInterval,
  refreshOptions: ({ settings }, getters) => ({
    customRefreshIntervalMaximumInMinutes: settings.customRefreshIntervalMaximumInMinutes,
    customRefreshIntervalMinimumInMinutes: settings.customRefreshIntervalMinimumInMinutes,
    refreshInterval: getters.refreshInterval,
    showRefreshInMenuBar: getters.refreshFromAdminBar,
  }),
  siteName: ({ site }) => site.siteName,
  troubleshootingInformation: (_, getters) => ({
    ...getters.troubleshootingInformationSettings,
    ...getters.troubleshootingInformationVersions,
  }),
  troubleshootingInformationSettings: ({ site }) => ({
    currentSiteId: site.siteId,
    isMultiSite: site.isMultiSite,
    siteName: site.siteName,
  }),
  troubleshootingInformationVersions: ({ site }) => ({
    versions: {
      forceRefresh: {
        required: site.versionForceRefreshRequired,
        version: site.versionForceRefreshInstalled,
      },
      php: {
        required: site.versionPhpRequired,
        version: site.versionPhpInstalled,
      },
      wordPress: {
        required: site.versionWordPressRequired,
        version: site.versionWordPressInstalled,
      },
    },
  }),
  wordPressNonce: ({ nonce }) => nonce,
};
