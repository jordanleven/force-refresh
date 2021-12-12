import { versionSatisfies } from './compare-versions.js';

describe('versionSatisfies', () => {
  describe('Regular releases', () => {
    it('returns true when the installed version is greater than or equal to the current version', () => {
      const isPluginUpToDate = versionSatisfies('1.0.0', '1.0.1');
      expect(isPluginUpToDate).toBe(true);
    });

    it('returns false when the installed version is lower than the current version', () => {
      const isPluginUpToDate = versionSatisfies('1.1.0', '1.0.1');
      expect(isPluginUpToDate).toBe(false);
    });
  });

  describe('Beta releases', () => {
    it('returns true when the installed version is greater than or equal to the current version', () => {
      const isPluginUpToDate = versionSatisfies('1.0.0', '1.0.1-example-beta-release-0');
      expect(isPluginUpToDate).toBe(true);
    });

    it('returns false when the installed version is lower than the current version', () => {
      const isPluginUpToDate = versionSatisfies('1.1.0', '1.0.1-example-beta-release-0');
      expect(isPluginUpToDate).toBe(false);
    });
  });
});
