import getters from './getters.js';

const makeSiteState = (overrides = {}) => ({
  featureFlags: {},
  settings: {},
  site: {
    isMultiSite: false,
    scheduledRefreshes: [],
    siteId: 1,
    siteName: 'Test Site',
    siteUrl: 'http://example.com',
    versionForceRefreshInstalled: '2.0.0',
    versionForceRefreshRequired: '1.0.0',
    versionPhpEolDate: '2022-11-28',
    versionPhpInstalled: '7.4.33',
    versionPhpRequired: '7.2',
    versionWordPressEolDate: '2024-01-09',
    versionWordPressInstalled: '4.9',
    versionWordPressRequired: '4.9',
    ...overrides,
  },
});

describe('Getters', () => {
  describe('troubleshootingInformationVersions', () => {
    it('includes eolDate for PHP', () => {
      const state = makeSiteState();
      const result = getters.troubleshootingInformationVersions(state);
      expect(result.versions.php.eolDate).toBe('2022-11-28');
    });

    it('includes eolDate for WordPress', () => {
      const state = makeSiteState();
      const result = getters.troubleshootingInformationVersions(state);
      expect(result.versions.wordPress.eolDate).toBe('2024-01-09');
    });

    it('passes null eolDate when not set', () => {
      const state = makeSiteState({ versionPhpEolDate: null, versionWordPressEolDate: null });
      const result = getters.troubleshootingInformationVersions(state);
      expect(result.versions.php.eolDate).toBeNull();
      expect(result.versions.wordPress.eolDate).toBeNull();
    });
  });

  describe('isFeatureEnabled', () => {
    it('returns false when featureFlags is empty', () => {
      const state = { featureFlags: {} };
      const isFeatureEnabled = getters.isFeatureEnabled(state);
      expect(isFeatureEnabled('scheduledRefresh')).toBe(false);
    });

    it('returns false when the scheduledRefresh flag is false', () => {
      const state = { featureFlags: { scheduledRefresh: false } };
      const isFeatureEnabled = getters.isFeatureEnabled(state);
      expect(isFeatureEnabled('scheduledRefresh')).toBe(false);
    });

    it('returns true when the scheduledRefresh flag is true', () => {
      const state = { featureFlags: { scheduledRefresh: true } };
      const isFeatureEnabled = getters.isFeatureEnabled(state);
      expect(isFeatureEnabled('scheduledRefresh')).toBe(true);
    });

    it('returns false when the flag does not exist', () => {
      const state = { featureFlags: { scheduledRefresh: true } };
      const isFeatureEnabled = getters.isFeatureEnabled(state);
      expect(isFeatureEnabled('unknownFlag')).toBe(false);
    });
  });
});
