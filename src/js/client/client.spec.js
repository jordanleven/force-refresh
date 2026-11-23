import { COUNTDOWN_INTERVAL_MS } from './debugCountdown.js';

jest.mock('./refreshCheck.js', () => ({ checkForRefresh: jest.fn() }));

const REFRESH_INTERVAL_SECONDS = 60;
const REFRESH_INTERVAL_MS = REFRESH_INTERVAL_SECONDS * 1000;

const SUCCEEDED = { succeeded: true };
const NETWORK_FAILURE = { failureKind: 'network', retryAfterMs: null, succeeded: false };

const advance = (ms) => jest.advanceTimersByTimeAsync(ms);

const dispatchVisibilityChange = () => {
  Object.defineProperty(document, 'visibilityState', { configurable: true, value: 'visible' });
  document.dispatchEvent(new Event('visibilitychange'));
};

describe('client', () => {
  let checkForRefresh;

  // `client.js` starts polling as soon as it is loaded, so each test loads its own copy.
  const loadClient = async ({ isDebugActive = false, firstResult = SUCCEEDED } = {}) => {
    global.forceRefreshLocalizedData = {
      isDebugActive,
      refreshInterval: REFRESH_INTERVAL_SECONDS,
    };

    jest.isolateModules(() => {
      /* eslint-disable global-require */
      ({ checkForRefresh } = require('./refreshCheck.js'));
      checkForRefresh.mockResolvedValue(SUCCEEDED).mockResolvedValueOnce(firstResult);
      require('./client.js');
      /* eslint-enable global-require */
    });

    await advance(0);
  };

  const getNextCheckMessages = () => console.debug.mock.calls
    .map(([message]) => message)
    .filter((message) => message.includes('Next check in'));

  beforeEach(() => {
    jest.useFakeTimers();
    jest.spyOn(console, 'debug').mockImplementation(() => {});
    jest.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
    delete global.forceRefreshLocalizedData;
  });

  describe('Polling', () => {
    it('checks for a refresh as soon as it loads', async () => {
      await loadClient();
      expect(checkForRefresh).toHaveBeenCalledTimes(1);
    });

    it('checks again at the localized refresh interval', async () => {
      await loadClient();
      await advance(REFRESH_INTERVAL_MS - 1);
      expect(checkForRefresh).toHaveBeenCalledTimes(1);
      await advance(1);
      expect(checkForRefresh).toHaveBeenCalledTimes(2);
    });

    it('lets a routine poll be answered from the browser cache', async () => {
      await loadClient();
      expect(checkForRefresh.mock.calls[0][0].bypassCache).toBe(false);
    });

    it('gives the check the signal that aborts it', async () => {
      await loadClient();
      expect(checkForRefresh.mock.calls[0][0].signal).toBeInstanceOf(AbortSignal);
    });

    it('bypasses the browser cache for a retry', async () => {
      await loadClient({ firstResult: NETWORK_FAILURE });
      await advance(REFRESH_INTERVAL_MS);
      expect(checkForRefresh.mock.calls[1][0].bypassCache).toBe(true);
    });
  });

  describe('Resuming', () => {
    it('checks when the page becomes visible with its check overdue', async () => {
      await loadClient();
      jest.setSystemTime(Date.now() + REFRESH_INTERVAL_MS);
      dispatchVisibilityChange();
      await advance(0);
      expect(checkForRefresh).toHaveBeenCalledTimes(2);
    });

    it('checks when the browser comes back online with its check overdue', async () => {
      await loadClient();
      jest.setSystemTime(Date.now() + REFRESH_INTERVAL_MS);
      window.dispatchEvent(new Event('online'));
      await advance(0);
      expect(checkForRefresh).toHaveBeenCalledTimes(2);
    });

    it('checks when the page is restored from the back/forward cache with its check overdue', async () => {
      await loadClient();
      jest.setSystemTime(Date.now() + REFRESH_INTERVAL_MS);
      window.dispatchEvent(Object.assign(new Event('pageshow'), { persisted: true }));
      await advance(0);
      expect(checkForRefresh).toHaveBeenCalledTimes(2);
    });

    it('bypasses the browser cache for a check on resume', async () => {
      await loadClient();
      jest.setSystemTime(Date.now() + REFRESH_INTERVAL_MS);
      dispatchVisibilityChange();
      await advance(0);
      expect(checkForRefresh.mock.calls[1][0].bypassCache).toBe(true);
    });
  });

  describe('Debug countdown', () => {
    it('reports the time until the next scheduled check when debug mode is active', async () => {
      await loadClient({ isDebugActive: true });
      await advance(COUNTDOWN_INTERVAL_MS);
      const secondsUntilNextCheck = (REFRESH_INTERVAL_MS - COUNTDOWN_INTERVAL_MS) / 1000;
      expect(getNextCheckMessages()).toEqual([
        expect.stringContaining(`Next check in ${secondsUntilNextCheck} seconds.`),
      ]);
    });

    it('reports nothing when debug mode is inactive', async () => {
      await loadClient();
      await advance(REFRESH_INTERVAL_MS);
      expect(getNextCheckMessages()).toEqual([]);
    });
  });
});
