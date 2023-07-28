export default (localizedData) => ({
  nonce: localizedData.nonce,
  settings: {
    customRefreshIntervalMaximumInMinutes: localizedData.refreshOptions.customRefreshIntervalMaximumInMinutes,
    customRefreshIntervalMinimumInMinutes: localizedData.refreshOptions.customRefreshIntervalMinimumInMinutes,
    isDebugActive: localizedData.isDebugActive,
    refreshFromAdminBar: localizedData.refreshOptions.showRefreshInMenuBar,
    refreshInterval: localizedData.refreshOptions.refreshInterval,
  },
  site: {
    isMultiSite: localizedData.isMultiSite,
    siteId: localizedData.siteId,
    siteName: localizedData.siteName,
    versionForceRefreshInstalled: localizedData.versions.forceRefresh.version,
    versionForceRefreshRequired: localizedData.versions.forceRefresh.versionRequired,
    versionPhpInstalled: localizedData.versions.php.version,
    versionPhpRequired: localizedData.versions.php.versionRequired,
    versionWordPressInstalled: localizedData.versions.wordPress.version,
    versionWordPressRequired: localizedData.versions.wordPress.versionRequired,
  },
});
