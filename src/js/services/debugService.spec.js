import { getDebugMode, setDebugMode } from './debugService.js';

describe('debugService', () => {
  beforeEach(() => {
    setDebugMode(undefined);
  });

  describe('getDebugMode', () => {
    it('returns false by default', () => {
      expect(getDebugMode()).toBe(false);
    });

    it('returns true when debug mode is enabled', () => {
      setDebugMode(true);
      expect(getDebugMode()).toBe(true);
    });

    it('returns false when debug mode is disabled', () => {
      setDebugMode(true);
      setDebugMode(false);
      expect(getDebugMode()).toBe(false);
    });
  });

  describe('setDebugMode', () => {
    it('enables debug mode', () => {
      setDebugMode(true);
      expect(getDebugMode()).toBe(true);
    });

    it('disables debug mode', () => {
      setDebugMode(true);
      setDebugMode(false);
      expect(getDebugMode()).toBe(false);
    });
  });
});
