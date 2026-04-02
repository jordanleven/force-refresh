import getters from './getters.js';

describe('Getters', () => {
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
