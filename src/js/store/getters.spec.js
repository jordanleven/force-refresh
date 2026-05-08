import getters from './getters.js';

const makeSiteState = (siteOverrides = {}, networkOverrides = {}, settingsOverrides = {}) => ({
  featureFlags: {},
  network: {
    detectedCdn: null,
    ...networkOverrides,
  },
  settings: {
    useStaticFilePolling: false,
    ...settingsOverrides,
  },
  site: {
    isMultiSite: false,
    lastCronRun: null,
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
    ...siteOverrides,
  },
});

describe('Getters', () => {
  describe('detectedCdn', () => {
    it('returns null when no CDN is detected', () => {
      const state = makeSiteState();
      expect(getters.detectedCdn(state)).toBeNull();
    });

    it('returns the CDN name when one is detected', () => {
      const state = makeSiteState({}, { detectedCdn: 'Cloudflare' });
      expect(getters.detectedCdn(state)).toBe('Cloudflare');
    });
  });

  describe('troubleshootingInformationSettings', () => {
    it('includes detectedCdn when null', () => {
      const state = makeSiteState();
      const result = getters.troubleshootingInformationSettings(state);
      expect(result.detectedCdn).toBeNull();
    });

    it('includes detectedCdn when a CDN is detected', () => {
      const state = makeSiteState({}, { detectedCdn: 'Cloudflare' });
      const result = getters.troubleshootingInformationSettings(state);
      expect(result.detectedCdn).toBe('Cloudflare');
    });
  });

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

  describe('useStaticFilePolling', () => {
    it('returns false by default', () => {
      const state = makeSiteState();
      expect(getters.useStaticFilePolling(state)).toBe(false);
    });

    it('returns true when the option is enabled', () => {
      const state = makeSiteState({}, {}, { useStaticFilePolling: true });
      expect(getters.useStaticFilePolling(state)).toBe(true);
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
