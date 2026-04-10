import { debug, error, warn } from './loggingService.js';
import { setDebugMode } from './debugService.js';

const PACKAGE_PREFIX = 'ForceRefresh';

describe('loggingService', () => {
  beforeEach(() => {
    setDebugMode(false);
    jest.spyOn(console, 'debug').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('debug', () => {
    it('does not log when debug mode is inactive', () => {
      debug('test message');
      expect(console.debug).not.toHaveBeenCalled();
    });

    it('logs to console.debug when debug mode is active', () => {
      setDebugMode(true);
      debug('test message');
      expect(console.debug).toHaveBeenCalledWith(`${PACKAGE_PREFIX} - test message`);
    });
  });

  describe('error', () => {
    it('always logs to console.error', () => {
      error('something went wrong');
      expect(console.error).toHaveBeenCalledWith(`${PACKAGE_PREFIX} - something went wrong`);
    });
  });

  describe('warn', () => {
    it('always logs to console.warn', () => {
      warn('a warning occurred');
      expect(console.warn).toHaveBeenCalledWith(`${PACKAGE_PREFIX} - a warning occurred`);
    });
  });
});
