import state from './state.js';

const makeLocalizedData = (refreshOptions = {}) => ({
  refreshOptions: {
    customRefreshIntervalMaximumInMinutes: 240,
    customRefreshIntervalMinimumInMinutes: 0.5,
    refreshInterval: 120,
    showRefreshInMenuBar: false,
    ...refreshOptions,
  },
  versions: {
    forceRefresh: {},
    php: {},
    wordPress: {},
  },
});

describe('Store State', () => {
  describe('updateMethod', () => {
    it.each(['rest', 'static_file', 'websockets'])('uses %s from the localized data', (updateMethod) => {
      const { settings } = state(makeLocalizedData({ updateMethod }));
      expect(settings.updateMethod).toBe(updateMethod);
    });

    it('defaults to rest when the localized data has no update method', () => {
      const { settings } = state(makeLocalizedData());
      expect(settings.updateMethod).toBe('rest');
    });
  });

  describe('isRelayConfigured', () => {
    it('uses the value from the localized data', () => {
      const { settings } = state(makeLocalizedData({ isRelayConfigured: true }));
      expect(settings.isRelayConfigured).toBe(true);
    });

    it('defaults to false when the localized data leaves it out', () => {
      const { settings } = state(makeLocalizedData());
      expect(settings.isRelayConfigured).toBe(false);
    });
  });
});
