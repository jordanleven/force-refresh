import {
  CHECK_TIMEOUT_MS,
  RETRY_BASE_DELAY_MS,
  RETRY_MAX_DELAY_MS,
  TRIGGER_MIN_GAP_MS,
  createPollingScheduler,
  getRetryDelay,
} from './pollingScheduler.js';

const INTERVAL_MS = 60 * 1000;

// With `random` pinned to 1 the jitter is removed and delays are exact.
const noJitter = () => 1;

const advance = (ms) => jest.advanceTimersByTimeAsync(ms);

const createDeferred = () => {
  let resolve;
  const promise = new Promise((_resolve) => { resolve = _resolve; });
  return { promise, resolve };
};

const setVisibilityState = (visibilityState) => {
  Object.defineProperty(document, 'visibilityState', { configurable: true, value: visibilityState });
};

const dispatchVisibilityChange = (visibilityState) => {
  setVisibilityState(visibilityState);
  document.dispatchEvent(new Event('visibilitychange'));
};

const dispatchOnline = () => window.dispatchEvent(new Event('online'));

const dispatchPageShow = (persisted) => window.dispatchEvent(
  Object.assign(new Event('pageshow'), { persisted }),
);

describe('getRetryDelay', () => {
  it('starts at the base delay', () => {
    expect(getRetryDelay(1, INTERVAL_MS, noJitter)).toBe(RETRY_BASE_DELAY_MS);
  });

  it('doubles with each consecutive failure', () => {
    expect(getRetryDelay(3, INTERVAL_MS, noJitter)).toBe(RETRY_BASE_DELAY_MS * 4);
  });

  it('is capped at the maximum delay', () => {
    expect(getRetryDelay(50, INTERVAL_MS, noJitter)).toBe(RETRY_MAX_DELAY_MS);
  });

  it('is capped at the polling interval when that is longer than the maximum delay', () => {
    const intervalMs = RETRY_MAX_DELAY_MS * 2;
    expect(getRetryDelay(50, intervalMs, noJitter)).toBe(intervalMs);
  });

  it('never starts above the polling interval', () => {
    expect(getRetryDelay(1, 2000, noJitter)).toBe(2000);
  });

  it('applies jitter down to half of the delay', () => {
    expect(getRetryDelay(1, INTERVAL_MS, () => 0)).toBe(RETRY_BASE_DELAY_MS / 2);
  });
});

describe('createPollingScheduler', () => {
  let check;
  let scheduler;

  const startScheduler = async () => {
    scheduler = createPollingScheduler({ check, intervalMs: INTERVAL_MS, random: noJitter });
    scheduler.start();
    await advance(0);
  };

  beforeEach(() => {
    jest.useFakeTimers();
    jest.spyOn(console, 'warn').mockImplementation(() => {});
    setVisibilityState('visible');
    check = jest.fn().mockResolvedValue(true);
  });

  afterEach(() => {
    scheduler.stop();
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  describe('Polling', () => {
    it('checks immediately when started', async () => {
      await startScheduler();
      expect(check).toHaveBeenCalledTimes(1);
    });

    it('does not check again before the interval has passed', async () => {
      await startScheduler();
      await advance(INTERVAL_MS - 1);
      expect(check).toHaveBeenCalledTimes(1);
    });

    it('checks again on every interval', async () => {
      await startScheduler();
      await advance(INTERVAL_MS * 3);
      expect(check).toHaveBeenCalledTimes(4);
    });

    it('reports the time until the next check', async () => {
      await startScheduler();
      await advance(10000);
      expect(scheduler.getMsUntilNextCheck()).toBe(INTERVAL_MS - 10000);
    });

    it('reports no next check while a check is running', async () => {
      check.mockReturnValue(createDeferred().promise);
      await startScheduler();
      expect(scheduler.getMsUntilNextCheck()).toBeNull();
    });

    it('stops checking once stopped', async () => {
      await startScheduler();
      scheduler.stop();
      await advance(INTERVAL_MS * 3);
      expect(check).toHaveBeenCalledTimes(1);
    });

    it('only starts once', async () => {
      await startScheduler();
      scheduler.start();
      await advance(0);
      expect(check).toHaveBeenCalledTimes(1);
    });
  });

  describe('Failed checks', () => {
    it('retries after the base delay instead of stopping', async () => {
      check.mockResolvedValue(false);
      await startScheduler();
      await advance(RETRY_BASE_DELAY_MS);
      expect(check).toHaveBeenCalledTimes(2);
    });

    it('does not retry before the base delay has passed', async () => {
      check.mockResolvedValue(false);
      await startScheduler();
      await advance(RETRY_BASE_DELAY_MS - 1);
      expect(check).toHaveBeenCalledTimes(1);
    });

    it('backs off further with each consecutive failure', async () => {
      check.mockResolvedValue(false);
      await startScheduler();
      await advance(RETRY_BASE_DELAY_MS);
      await advance(RETRY_BASE_DELAY_MS * 2 - 1);
      expect(check).toHaveBeenCalledTimes(2);
      await advance(1);
      expect(check).toHaveBeenCalledTimes(3);
    });

    it('keeps retrying at the maximum delay during a long outage', async () => {
      check.mockResolvedValue(false);
      await startScheduler();
      await advance(RETRY_MAX_DELAY_MS * 10);
      const checksBefore = check.mock.calls.length;
      await advance(RETRY_MAX_DELAY_MS * 3);
      expect(check.mock.calls.length - checksBefore).toBe(3);
    });

    it('treats a rejected check as a failure and retries', async () => {
      check.mockRejectedValue(new Error('Network error'));
      await startScheduler();
      await advance(RETRY_BASE_DELAY_MS);
      expect(check).toHaveBeenCalledTimes(2);
    });

    it('treats a check that throws synchronously as a failure and retries', async () => {
      check.mockImplementation(() => { throw new Error('Unexpected'); });
      await startScheduler();
      await advance(RETRY_BASE_DELAY_MS);
      expect(check).toHaveBeenCalledTimes(2);
    });

    it('gives up on a check that never settles and retries', async () => {
      check.mockReturnValue(createDeferred().promise);
      await startScheduler();
      await advance(CHECK_TIMEOUT_MS + RETRY_BASE_DELAY_MS);
      expect(check).toHaveBeenCalledTimes(2);
    });

    it('warns with the retry delay', async () => {
      check.mockResolvedValue(false);
      await startScheduler();
      expect(console.warn).toHaveBeenCalledWith(expect.stringContaining('Retrying in 5 seconds.'));
    });
  });

  describe('Recovery', () => {
    beforeEach(async () => {
      check.mockResolvedValueOnce(false).mockResolvedValueOnce(false).mockResolvedValue(true);
      await startScheduler();
      // Second failure, then the first success.
      await advance(RETRY_BASE_DELAY_MS);
      await advance(RETRY_BASE_DELAY_MS * 2);
    });

    it('checks successfully after the failures', () => {
      expect(check).toHaveBeenCalledTimes(3);
    });

    it('resumes the normal interval after a success', async () => {
      await advance(INTERVAL_MS - 1);
      expect(check).toHaveBeenCalledTimes(3);
      await advance(1);
      expect(check).toHaveBeenCalledTimes(4);
    });

    it('starts the backoff over on the next failure', async () => {
      check.mockResolvedValue(false);
      await advance(INTERVAL_MS);
      await advance(RETRY_BASE_DELAY_MS);
      expect(check).toHaveBeenCalledTimes(5);
    });
  });

  describe('Overlapping checks', () => {
    it('does not start a second check while one is running', async () => {
      check.mockReturnValue(createDeferred().promise);
      await startScheduler();
      scheduler.checkNow();
      scheduler.checkNow();
      await advance(0);
      expect(check).toHaveBeenCalledTimes(1);
    });

    it('returns the running check to every caller', async () => {
      check.mockReturnValue(createDeferred().promise);
      await startScheduler();
      expect(scheduler.checkNow()).toBe(scheduler.checkNow());
    });

    it('resolves every caller with the result of the running check', async () => {
      const deferred = createDeferred();
      check.mockReturnValue(deferred.promise);
      await startScheduler();
      const results = Promise.all([scheduler.checkNow(), scheduler.checkNow()]);
      deferred.resolve(true);
      expect(await results).toEqual([true, true]);
    });

    it('ignores page events while a check is running', async () => {
      check.mockReturnValue(createDeferred().promise);
      await startScheduler();
      dispatchVisibilityChange('visible');
      dispatchOnline();
      dispatchPageShow(true);
      await advance(0);
      expect(check).toHaveBeenCalledTimes(1);
    });

    it('times the next check from the end of a manual check', async () => {
      await startScheduler();
      await advance(INTERVAL_MS / 2);
      await scheduler.checkNow();
      await advance(INTERVAL_MS - 1);
      expect(check).toHaveBeenCalledTimes(2);
      await advance(1);
      expect(check).toHaveBeenCalledTimes(3);
    });
  });

  describe('Page events', () => {
    beforeEach(async () => {
      await startScheduler();
      await advance(TRIGGER_MIN_GAP_MS);
    });

    it('checks when a hidden page becomes visible', async () => {
      dispatchVisibilityChange('hidden');
      dispatchVisibilityChange('visible');
      await advance(0);
      expect(check).toHaveBeenCalledTimes(2);
    });

    it('does not check when the page becomes hidden', async () => {
      dispatchVisibilityChange('hidden');
      await advance(0);
      expect(check).toHaveBeenCalledTimes(1);
    });

    it('checks when the browser comes back online', async () => {
      dispatchOnline();
      await advance(0);
      expect(check).toHaveBeenCalledTimes(2);
    });

    it('checks when the page is restored from the back/forward cache', async () => {
      dispatchPageShow(true);
      await advance(0);
      expect(check).toHaveBeenCalledTimes(2);
    });

    it('does not check on a normal page show', async () => {
      dispatchPageShow(false);
      await advance(0);
      expect(check).toHaveBeenCalledTimes(1);
    });

    it('checks only once when several events fire together', async () => {
      dispatchPageShow(true);
      dispatchVisibilityChange('visible');
      dispatchOnline();
      await advance(0);
      dispatchVisibilityChange('visible');
      await advance(0);
      expect(check).toHaveBeenCalledTimes(2);
    });

    it('checks again for an event once the last success is no longer recent', async () => {
      dispatchOnline();
      await advance(TRIGGER_MIN_GAP_MS);
      dispatchOnline();
      await advance(0);
      expect(check).toHaveBeenCalledTimes(3);
    });

    it('checks immediately on an event while backing off after a failure', async () => {
      check.mockResolvedValue(false);
      await advance(INTERVAL_MS);
      await advance(RETRY_BASE_DELAY_MS);
      const checksBefore = check.mock.calls.length;
      dispatchOnline();
      await advance(0);
      expect(check.mock.calls.length - checksBefore).toBe(1);
    });

    it('times the next check from the end of an event check', async () => {
      dispatchOnline();
      await advance(INTERVAL_MS - 1);
      expect(check).toHaveBeenCalledTimes(2);
      await advance(1);
      expect(check).toHaveBeenCalledTimes(3);
    });

    it('ignores events once stopped', async () => {
      scheduler.stop();
      dispatchVisibilityChange('visible');
      dispatchOnline();
      dispatchPageShow(true);
      await advance(0);
      expect(check).toHaveBeenCalledTimes(1);
    });
  });
});
