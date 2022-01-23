import { isDevelopmentVersion, getSanitizedVersion, versionSatisfies } from './compare-versions.js';

describe('Compare Versions', () => {
  describe('isDevelopmentVersion', () => {
    it('returns true when the installed version is a development version', () => {
      const isDevVersion = isDevelopmentVersion('1.0.0-1984');
      expect(isDevVersion).toBe(true);
    });

    it('returns false when the installed version is not a development version', () => {
      const isDevVersion = isDevelopmentVersion('1.0.0');
      expect(isDevVersion).toBe(false);
    });
  });

  describe('getSanitizedVersion', () => {
    it('returns the correct sanitized version when the installed version is a development version', () => {
      const sanitizedVersion = getSanitizedVersion('1.0.0-1984');
      expect(sanitizedVersion).toBe('1.0.0');
    });

    it('returns the correct sanitized version when the installed version is not a development version', () => {
      const sanitizedVersion = getSanitizedVersion('1.0.0');
      expect(sanitizedVersion).toBe('1.0.0');
    });
  });

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
});
