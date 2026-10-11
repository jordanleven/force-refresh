import { FAILURE_KINDS, checkFailed, checkSucceeded } from './checkResult.js';
import {
  CHECK_TIMEOUT_MS,
  RETRY_AFTER_MAX_MS,
  RETRY_BASE_DELAY_MS,
  RETRY_MAX_DELAY_MS,
  TRIGGER_MIN_GAP_MS,
  createPollingScheduler,
  getDelayAfterFailure,
  getRetryDelay,
} from './pollingScheduler.js';

const INTERVAL_MS = 60 * 1000;

const SUCCEEDED = checkSucceeded();
const NETWORK_FAILURE = checkFailed(FAILURE_KINDS.NETWORK);
const SERVER_FAILURE = checkFailed(FAILURE_KINDS.SERVER);

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

describe('getDelayAfterFailure', () => {
  const getDelay = (options) => getDelayAfterFailure({
    failures: 1,
    intervalMs: INTERVAL_MS,
    random: noJitter,
    retryAfterMs: null,
    ...options,
  });

  it('retries a network failure after the short retry delay', () => {
    expect(getDelay({ failureKind: FAILURE_KINDS.NETWORK })).toBe(RETRY_BASE_DELAY_MS);
  });

  it.each([
    FAILURE_KINDS.SERVER,
    FAILURE_KINDS.TIMEOUT,
  ])('does not retry a %s failure sooner than the polling interval', (failureKind) => {
    expect(getDelay({ failureKind })).toBe(INTERVAL_MS);
  });

  it('keeps to the polling interval for a server failure whatever the jitter', () => {
    expect(getDelay({ failureKind: FAILURE_KINDS.SERVER, random: () => 0 })).toBe(INTERVAL_MS);
  });

  it('backs off beyond the polling interval once the retry delay is longer', () => {
    expect(getDelay({ failureKind: FAILURE_KINDS.SERVER, failures: 6 })).toBe(RETRY_BASE_DELAY_MS * 32);
  });

  it('waits as long as the server asked when that is longer than the polling interval', () => {
    const retryAfterMs = INTERVAL_MS * 5;
    expect(getDelay({ failureKind: FAILURE_KINDS.SERVER, retryAfterMs })).toBe(retryAfterMs);
  });

  it('does not retry sooner than the polling interval when the server asked for less', () => {
    expect(getDelay({ failureKind: FAILURE_KINDS.SERVER, retryAfterMs: 1000 })).toBe(INTERVAL_MS);
  });

  it('caps the wait a server can ask for', () => {
    const retryAfterMs = RETRY_AFTER_MAX_MS * 24;
    expect(getDelay({ failureKind: FAILURE_KINDS.SERVER, retryAfterMs })).toBe(RETRY_AFTER_MAX_MS);
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
    check = jest.fn().mockResolvedValue(SUCCEEDED);
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

  describe('Routine and triggered checks', () => {
    const wasTriggered = () => check.mock.calls.map(([{ isTriggered }]) => isTriggered);

    it('treats the first check and every poll as routine', async () => {
      await startScheduler();
      await advance(INTERVAL_MS * 2);
      expect(wasTriggered()).toEqual([false, false, false]);
    });

    it('treats a retry after a failed check as triggered', async () => {
      check.mockResolvedValueOnce(NETWORK_FAILURE);
      await startScheduler();
      await advance(RETRY_BASE_DELAY_MS);
      expect(wasTriggered()).toEqual([false, true]);
    });

    it('treats the poll after a successful retry as routine again', async () => {
      check.mockResolvedValueOnce(NETWORK_FAILURE);
      await startScheduler();
      await advance(RETRY_BASE_DELAY_MS + INTERVAL_MS);
      expect(wasTriggered()).toEqual([false, true, false]);
    });

    it('treats a check on resume as triggered', async () => {
      await startScheduler();
      jest.setSystemTime(Date.now() + INTERVAL_MS);
      dispatchVisibilityChange('visible');
      await advance(0);
      expect(wasTriggered()).toEqual([false, true]);
    });

    it('treats a check asked for directly as triggered', async () => {
      await startScheduler();
      await scheduler.checkNow();
      expect(wasTriggered()).toEqual([false, true]);
    });
  });

  describe('Failed checks', () => {
    it('retries after the base delay instead of stopping', async () => {
      check.mockResolvedValue(NETWORK_FAILURE);
      await startScheduler();
      await advance(RETRY_BASE_DELAY_MS);
      expect(check).toHaveBeenCalledTimes(2);
    });

    it('does not retry before the base delay has passed', async () => {
      check.mockResolvedValue(NETWORK_FAILURE);
      await startScheduler();
      await advance(RETRY_BASE_DELAY_MS - 1);
      expect(check).toHaveBeenCalledTimes(1);
    });

    it('backs off further with each consecutive failure', async () => {
      check.mockResolvedValue(NETWORK_FAILURE);
      await startScheduler();
      await advance(RETRY_BASE_DELAY_MS);
      await advance(RETRY_BASE_DELAY_MS * 2 - 1);
      expect(check).toHaveBeenCalledTimes(2);
      await advance(1);
      expect(check).toHaveBeenCalledTimes(3);
    });

    it('keeps retrying at the maximum delay during a long outage', async () => {
      check.mockResolvedValue(NETWORK_FAILURE);
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
      await advance(CHECK_TIMEOUT_MS + INTERVAL_MS);
      expect(check).toHaveBeenCalledTimes(2);
    });

    it('treats a check that resolves to something other than a result as a failure', async () => {
      check.mockResolvedValue(undefined);
      await startScheduler();
      await advance(RETRY_BASE_DELAY_MS);
      expect(check).toHaveBeenCalledTimes(2);
    });

    it('does not retry a server failure sooner than the polling interval', async () => {
      check.mockResolvedValue(SERVER_FAILURE);
      await startScheduler();
      await advance(INTERVAL_MS - 1);
      expect(check).toHaveBeenCalledTimes(1);
      await advance(1);
      expect(check).toHaveBeenCalledTimes(2);
    });

    it('does not check a failing server more often than normal polling would', async () => {
      check.mockResolvedValue(SERVER_FAILURE);
      await startScheduler();
      await advance(INTERVAL_MS * 5);
      expect(check.mock.calls.length).toBeLessThanOrEqual(6);
    });

    it('waits as long as a failing server asked', async () => {
      check.mockResolvedValue(checkFailed(FAILURE_KINDS.SERVER, INTERVAL_MS * 3));
      await startScheduler();
      await advance(INTERVAL_MS * 3 - 1);
      expect(check).toHaveBeenCalledTimes(1);
      await advance(1);
      expect(check).toHaveBeenCalledTimes(2);
    });

    it('does not retry a check that timed out sooner than the polling interval', async () => {
      check.mockReturnValue(createDeferred().promise);
      await startScheduler();
      await advance(CHECK_TIMEOUT_MS + INTERVAL_MS - 1);
      expect(check).toHaveBeenCalledTimes(1);
      await advance(1);
      expect(check).toHaveBeenCalledTimes(2);
    });

    it('aborts the request of a check that timed out', async () => {
      check.mockReturnValue(createDeferred().promise);
      await startScheduler();
      const [{ signal }] = check.mock.calls[0];
      expect(signal.aborted).toBe(false);
      await advance(CHECK_TIMEOUT_MS);
      expect(signal.aborted).toBe(true);
    });

    it('does not abort a check that settled in time', async () => {
      await startScheduler();
      await advance(CHECK_TIMEOUT_MS);
      expect(check.mock.calls[0][0].signal.aborted).toBe(false);
    });

    it('gives every check its own abort signal', async () => {
      await startScheduler();
      await advance(INTERVAL_MS);
      const [[first], [second]] = check.mock.calls;
      expect(first.signal).not.toBe(second.signal);
    });

    it('never leaves more than one request open while the server hangs', async () => {
      check.mockImplementation(() => createDeferred().promise);
      await startScheduler();
      await advance(INTERVAL_MS * 10);
      const openRequests = check.mock.calls.filter(([{ signal }]) => !signal.aborted);
      expect(check.mock.calls.length).toBeGreaterThan(2);
      expect(openRequests.length).toBeLessThanOrEqual(1);
    });

    it('warns with the retry delay', async () => {
      check.mockResolvedValue(NETWORK_FAILURE);
      await startScheduler();
      expect(console.warn).toHaveBeenCalledWith(expect.stringContaining('Retrying in 5 seconds.'));
    });
  });

  describe('Recovery', () => {
    beforeEach(async () => {
      check.mockResolvedValueOnce(NETWORK_FAILURE).mockResolvedValueOnce(NETWORK_FAILURE).mockResolvedValue(SUCCEEDED);
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
      check.mockResolvedValue(NETWORK_FAILURE);
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
      deferred.resolve(SUCCEEDED);
      expect(await results).toEqual([SUCCEEDED, SUCCEEDED]);
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
    // Moves the clock without running timers, as when a page is frozen.
    const freezePageFor = (ms) => jest.setSystemTime(Date.now() + ms);

    beforeEach(async () => {
      await startScheduler();
      await advance(TRIGGER_MIN_GAP_MS);
    });

    describe('before the next check is due', () => {
      it('does not check when a hidden page becomes visible', async () => {
        dispatchVisibilityChange('hidden');
        dispatchVisibilityChange('visible');
        await advance(0);
        expect(check).toHaveBeenCalledTimes(1);
      });

      it('does not check when the browser comes back online', async () => {
        dispatchOnline();
        await advance(0);
        expect(check).toHaveBeenCalledTimes(1);
      });

      it('does not check when the page is restored from the back/forward cache', async () => {
        dispatchPageShow(true);
        await advance(0);
        expect(check).toHaveBeenCalledTimes(1);
      });

      it('keeps to the interval however often the visitor switches tabs', async () => {
        scheduler.stop();
        check.mockClear();
        scheduler = createPollingScheduler({ check, intervalMs: 4 * 60 * 60 * 1000, random: noJitter });
        scheduler.start();
        await advance(0);

        for (let i = 0; i < 60; i += 1) {
          // eslint-disable-next-line no-await-in-loop
          await advance(10 * 1000);
          dispatchVisibilityChange('hidden');
          dispatchVisibilityChange('visible');
        }

        expect(check).toHaveBeenCalledTimes(1);
      });

      it('leaves the scheduled check where it was', async () => {
        dispatchVisibilityChange('visible');
        await advance(INTERVAL_MS - TRIGGER_MIN_GAP_MS);
        expect(check).toHaveBeenCalledTimes(2);
      });
    });

    describe('when the scheduled check is overdue', () => {
      beforeEach(() => {
        freezePageFor(INTERVAL_MS);
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

      it('times the next check from the end of an event check', async () => {
        dispatchOnline();
        await advance(INTERVAL_MS - 1);
        expect(check).toHaveBeenCalledTimes(2);
        await advance(1);
        expect(check).toHaveBeenCalledTimes(3);
      });
    });

    describe('while retrying after a network failure', () => {
      beforeEach(async () => {
        check.mockResolvedValue(NETWORK_FAILURE);
        // The poll fails, then the first retry fails; the next retry is 10 seconds away.
        await advance(INTERVAL_MS - TRIGGER_MIN_GAP_MS);
        await advance(RETRY_BASE_DELAY_MS);
        check.mockClear();
      });

      it('checks on an event without waiting for the retry', async () => {
        await advance(TRIGGER_MIN_GAP_MS);
        dispatchOnline();
        await advance(0);
        expect(check).toHaveBeenCalledTimes(1);
      });

      it('ignores an event that follows a check too closely', async () => {
        await advance(TRIGGER_MIN_GAP_MS - 1);
        dispatchOnline();
        await advance(0);
        expect(check).not.toHaveBeenCalled();
      });
    });

    describe('while waiting after a server failure', () => {
      beforeEach(async () => {
        check.mockResolvedValue(SERVER_FAILURE);
        await advance(INTERVAL_MS - TRIGGER_MIN_GAP_MS);
        check.mockClear();
      });

      it('does not check on an event before the retry is due', async () => {
        await advance(TRIGGER_MIN_GAP_MS);
        dispatchVisibilityChange('visible');
        dispatchOnline();
        dispatchPageShow(true);
        await advance(0);
        expect(check).not.toHaveBeenCalled();
      });

      it('checks on an event once the retry is overdue', async () => {
        freezePageFor(INTERVAL_MS);
        dispatchVisibilityChange('visible');
        await advance(0);
        expect(check).toHaveBeenCalledTimes(1);
      });
    });

    it('ignores events once stopped', async () => {
      freezePageFor(INTERVAL_MS);
      scheduler.stop();
      dispatchVisibilityChange('visible');
      dispatchOnline();
      dispatchPageShow(true);
      await advance(0);
      expect(check).toHaveBeenCalledTimes(1);
    });
  });
});
