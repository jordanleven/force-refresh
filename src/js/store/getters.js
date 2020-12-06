export default {
  isDebugActive: ({ settings }) => settings.isDebugActive,
  refreshFromAdminBar: ({ settings }) => settings.refreshFromAdminBar,
  refreshInterval: ({ settings }) => settings.refreshInterval,
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
        required: site.versionForceRefreshInstalled,
        version: site.versionForceRefreshRequired,
      },
      php: {
        required: site.versionPhpInstalled,
        version: site.versionPhpRequired,
      },
      wordPress: {
        required: site.versionWordPressInstalled,
        version: site.versionWordPressRequired,
      },
    },
  }),
  wordPressNonce: ({ nonce }) => nonce,
};
