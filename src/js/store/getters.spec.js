import { createStore } from 'vuex';
import getters from './getters.js';

const makeSiteState = (siteOverrides = {}, networkOverrides = {}, settingsOverrides = {}, featureFlags = {}) => ({
  featureFlags,
  network: {
    detectedCdn: null,
    ...networkOverrides,
  },
  settings: {
    isRelayConfigured: false,
    updateMethod: 'rest',
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

// Getters that build on other getters are read through a real store.
const makeStoreGetters = (state) => createStore({ getters, state }).getters;

const makeUpdateMethodGetters = ({ isRelayConfigured = false, isWebSocketsEnabled = false, updateMethod = 'rest' } = {}) => (
  makeStoreGetters(makeSiteState({}, {}, { isRelayConfigured, updateMethod }, { websockets: isWebSocketsEnabled }))
);

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
      const result = makeStoreGetters(makeSiteState()).troubleshootingInformationSettings;
      expect(result.detectedCdn).toBeNull();
    });

    it('includes detectedCdn when a CDN is detected', () => {
      const result = makeStoreGetters(makeSiteState({}, { detectedCdn: 'Cloudflare' })).troubleshootingInformationSettings;
      expect(result.detectedCdn).toBe('Cloudflare');
    });

    it('includes the selected update method', () => {
      const result = makeUpdateMethodGetters({ updateMethod: 'static_file' }).troubleshootingInformationSettings;
      expect(result.updateMethod).toBe('static_file');
    });

    it('includes the effective update method', () => {
      const result = makeUpdateMethodGetters({ isWebSocketsEnabled: true, updateMethod: 'websockets' }).troubleshootingInformationSettings;
      expect(result.updateMethod).toBe('websockets');
      expect(result.effectiveUpdateMethod).toBe('rest');
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

  describe('updateMethod', () => {
    it.each(['rest', 'static_file', 'websockets'])('returns %s when it is selected', (updateMethod) => {
      const state = makeSiteState({}, {}, { updateMethod });
      expect(getters.updateMethod(state)).toBe(updateMethod);
    });
  });

  describe('refreshOptions', () => {
    it('includes the selected update method', () => {
      const { refreshOptions } = makeUpdateMethodGetters({ updateMethod: 'static_file' });
      expect(refreshOptions.updateMethod).toBe('static_file');
    });
  });

  describe('isRelayConfigured', () => {
    it.each([true, false])('returns %s from settings', (isRelayConfigured) => {
      const state = makeSiteState({}, {}, { isRelayConfigured });
      expect(getters.isRelayConfigured(state)).toBe(isRelayConfigured);
    });
  });

  describe('isWebSocketsEnabled', () => {
    it('returns false when the websockets flag is missing', () => {
      expect(makeStoreGetters(makeSiteState()).isWebSocketsEnabled).toBe(false);
    });

    it.each([true, false])('returns %s from the websockets flag', (isWebSocketsEnabled) => {
      expect(makeUpdateMethodGetters({ isWebSocketsEnabled }).isWebSocketsEnabled).toBe(isWebSocketsEnabled);
    });
  });

  describe('isWebSocketsAvailable', () => {
    it.each([
      { expected: false, isRelayConfigured: false, isWebSocketsEnabled: false },
      { expected: false, isRelayConfigured: true, isWebSocketsEnabled: false },
      { expected: false, isRelayConfigured: false, isWebSocketsEnabled: true },
      { expected: true, isRelayConfigured: true, isWebSocketsEnabled: true },
    ])('returns $expected when flag is $isWebSocketsEnabled and relay is $isRelayConfigured', ({ expected, ...settings }) => {
      expect(makeUpdateMethodGetters(settings).isWebSocketsAvailable).toBe(expected);
    });
  });

  describe('effectiveUpdateMethod', () => {
    it.each(['rest', 'static_file'])('returns %s as selected', (updateMethod) => {
      expect(makeUpdateMethodGetters({ updateMethod }).effectiveUpdateMethod).toBe(updateMethod);
    });

    it('falls back to rest when websockets is selected and the flag is off', () => {
      const { effectiveUpdateMethod } = makeUpdateMethodGetters({ isRelayConfigured: true, updateMethod: 'websockets' });
      expect(effectiveUpdateMethod).toBe('rest');
    });

    it('falls back to rest when websockets is selected and no relay is configured', () => {
      const { effectiveUpdateMethod } = makeUpdateMethodGetters({ isWebSocketsEnabled: true, updateMethod: 'websockets' });
      expect(effectiveUpdateMethod).toBe('rest');
    });

    it('returns websockets when it is selected and available', () => {
      const { effectiveUpdateMethod } = makeUpdateMethodGetters({
        isRelayConfigured: true,
        isWebSocketsEnabled: true,
        updateMethod: 'websockets',
      });
      expect(effectiveUpdateMethod).toBe('websockets');
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
