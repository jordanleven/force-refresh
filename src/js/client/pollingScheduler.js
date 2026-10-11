import { FAILURE_KINDS, checkFailed } from '@/js/client/checkResult.js';
import { debug, info, warn } from '@/js/services/loggingService.js';

export const RETRY_BASE_DELAY_MS = 5 * 1000;
export const RETRY_MAX_DELAY_MS = 5 * 60 * 1000;
// A server can ask for longer than this, but a tab should not go quiet for a day.
export const RETRY_AFTER_MAX_MS = 60 * 60 * 1000;
export const CHECK_TIMEOUT_MS = 30 * 1000;
export const TRIGGER_MIN_GAP_MS = 5 * 1000;

/**
 * The delay before retrying after consecutive failed checks. Doubles with
 * each failure and is capped so an outage never leaves a tab waiting much
 * longer than usual, while the jitter keeps every open tab from retrying
 * against a recovering server at the same moment.
 * @param     {number}      failures      The number of consecutive failed checks
 * @param     {number}      intervalMs    The normal polling interval
 * @param     {Function}    random        Returns a number between 0 and 1
 * @return    {number}                    The delay in milliseconds
 */
export const getRetryDelay = (failures, intervalMs, random = Math.random) => {
  const baseDelay = Math.min(RETRY_BASE_DELAY_MS, intervalMs);
  const maxDelay = Math.max(RETRY_MAX_DELAY_MS, intervalMs);
  const delay = Math.min(baseDelay * 2 ** (failures - 1), maxDelay);
  return Math.round((delay / 2) * (1 + random()));
};

/**
 * The delay before the next check after a failed one. Only a request that
 * never reached the server is retried quickly. A server that answered with an
 * error, or did not answer in time, is already struggling, so it is never
 * asked again sooner than the normal interval or than it asked to be.
 * @param     {object}         options
 * @param     {number}         options.failures        The number of consecutive failed checks
 * @param     {string}         options.failureKind     One of FAILURE_KINDS
 * @param     {number|null}    options.retryAfterMs    The wait the server asked for, if any
 * @param     {number}         options.intervalMs      The normal polling interval
 * @param     {Function}       options.random          Returns a number between 0 and 1
 * @return    {number}                                 The delay in milliseconds
 */
export const getDelayAfterFailure = ({
  failures,
  failureKind,
  retryAfterMs,
  intervalMs,
  random = Math.random,
}) => {
  const retryDelay = getRetryDelay(failures, intervalMs, random);
  if (failureKind === FAILURE_KINDS.NETWORK) return retryDelay;

  const requestedDelay = Math.min(retryAfterMs ?? 0, Math.max(RETRY_AFTER_MAX_MS, intervalMs));
  return Math.max(retryDelay, intervalMs, requestedDelay);
};

// Anything that is not a check result (a thrown error, for example) is treated
// as the request not having reached the server.
const toCheckResult = (result) => (
  typeof result?.succeeded === 'boolean' ? result : checkFailed(FAILURE_KINDS.NETWORK)
);

// A check that never settles would otherwise block every later check. Its
// request is aborted when it is given up on, so that a server too busy to
// answer is not left holding one more connection for every retry.
const runCheckWithTimeout = (check, isTriggered) => new Promise((resolve) => {
  const abortController = new AbortController();
  const timeout = setTimeout(() => {
    abortController.abort();
    resolve(checkFailed(FAILURE_KINDS.TIMEOUT));
  }, CHECK_TIMEOUT_MS);

  Promise.resolve()
    .then(() => check({ isTriggered, signal: abortController.signal }))
    .then(
      (result) => resolve(toCheckResult(result)),
      () => resolve(checkFailed(FAILURE_KINDS.NETWORK)),
    )
    .finally(() => clearTimeout(timeout));
});

/**
 * Decides when to run the version check: on a fixed interval, sooner after a
 * network failure, and as soon as the page resumes having missed a check.
 * It knows nothing about versions; `check` owns the decision to reload.
 * @param     {object}      options
 * @param     {Function}    options.check         Called with `{ isTriggered, signal }`. `isTriggered`
 *                                                is false for a routine poll and true when
 *                                                something prompted the check, such as a retry
 *                                                or a resumed page, so it must not be answered
 *                                                from a cache. `signal` is an `AbortSignal` that
 *                                                aborts when the check is given up on. Resolves
 *                                                to a check result (see `checkResult.js`)
 * @param     {number}      options.intervalMs    The normal polling interval, which can be
 *                                                changed later with `setIntervalMs`
 * @param     {Function}    options.random        Returns a number between 0 and 1
 * @return    {object}                            The scheduler
 */
export const createPollingScheduler = ({
  check,
  intervalMs: initialIntervalMs,
  random = Math.random,
}) => {
  let consecutiveFailures = 0;
  let checkInFlight = null;
  let hasWarnedOfOutage = false;
  let intervalMs = initialIntervalMs;
  let isRetryScheduled = false;
  let isStarted = false;
  let isTrailingCheckQueued = false;
  let lastCheckEndedAt = null;
  let lastFailureKind = null;
  let nextCheckAt = null;
  let nextCheckTimeout = null;

  const clearNextCheck = () => {
    clearTimeout(nextCheckTimeout);
    nextCheckTimeout = null;
    nextCheckAt = null;
  };

  const scheduleNextCheck = (delay, runCheck) => {
    clearNextCheck();
    if (!isStarted) return;

    nextCheckAt = Date.now() + delay;
    nextCheckTimeout = setTimeout(runCheck, delay);
  };

  const getDelayAfterCheck = ({ failureKind, retryAfterMs, succeeded }) => {
    lastCheckEndedAt = Date.now();
    lastFailureKind = succeeded ? null : failureKind;

    if (succeeded) {
      if (hasWarnedOfOutage) info('Checking for a refresh is working again.');
      consecutiveFailures = 0;
      hasWarnedOfOutage = false;
      return intervalMs;
    }

    consecutiveFailures += 1;
    return getDelayAfterFailure({
      failureKind,
      failures: consecutiveFailures,
      intervalMs,
      random,
      retryAfterMs,
    });
  };

  // An outage is reported to visitors once; the retries that follow are only
  // of interest to someone debugging.
  const logRetry = (retryDelay) => {
    const log = hasWarnedOfOutage ? debug : warn;
    hasWarnedOfOutage = true;
    log(`Unable to check for a refresh. Retrying in ${Math.round(retryDelay / 1000)} seconds.`);
  };

  const scheduleCheckAfter = (result, runCheck) => {
    const delay = getDelayAfterCheck(result);

    if (isTrailingCheckQueued) {
      isTrailingCheckQueued = false;
      runCheck(true);
      return;
    }

    if (!result.succeeded) logRetry(delay);
    // A retry is prompted by the failure before it; only a poll is routine.
    isRetryScheduled = !result.succeeded;
    scheduleNextCheck(delay, () => runCheck(isRetryScheduled));
  };

  const runCheck = (isTriggered) => {
    if (checkInFlight) return checkInFlight;

    clearNextCheck();
    checkInFlight = runCheckWithTimeout(check, isTriggered).then((result) => {
      checkInFlight = null;
      scheduleCheckAfter(result, runCheck);
      return result;
    });

    return checkInFlight;
  };

  /**
   * Runs a check immediately unless one is already running, in which case the
   * running check is returned. The next scheduled check is always timed from
   * the end of this one.
   * @return    {Promise<object>}    The check result
   */
  const checkNow = () => runCheck(true);

  /**
   * Asks for a check that starts no earlier than now. A check that is already
   * running may have read the versions before whatever prompted this request,
   * so instead of being relied on it is followed by exactly one more check,
   * however many requests arrive while it runs.
   * @return    {void}
   */
  const requestCheck = () => {
    if (!checkInFlight) {
      runCheck(true);
      return;
    }

    isTrailingCheckQueued = true;
  };

  /**
   * Changes the polling interval without checking and without disturbing a
   * retry. A waiting poll is re-timed from the end of the last check. When
   * that makes it overdue it is spread across one new interval instead of run
   * at once, because every open tab is told to speed up at the same moment
   * (when a WebSocket relay goes away, for example).
   * @param     {number}    newIntervalMs    The new polling interval
   * @return    {void}
   */
  const setIntervalMs = (newIntervalMs) => {
    intervalMs = newIntervalMs;

    // A running check or a retry picks the new interval up when it next schedules a poll.
    if (nextCheckTimeout === null || isRetryScheduled) return;

    const msUntilDue = lastCheckEndedAt + intervalMs - Date.now();
    const delay = msUntilDue > 0 ? msUntilDue : Math.round(random() * intervalMs);
    scheduleNextCheck(delay, () => runCheck(false));
  };

  // A frozen, sleeping or cached page does not run its timers, so the check
  // it had scheduled can be long past due by the time the page resumes.
  const isCheckOverdue = () => nextCheckAt !== null && Date.now() >= nextCheckAt;

  const isRetryingNetworkFailure = () => consecutiveFailures > 0
    && lastFailureKind === FAILURE_KINDS.NETWORK;

  const hasJustChecked = () => lastCheckEndedAt !== null
    && Date.now() - lastCheckEndedAt < TRIGGER_MIN_GAP_MS;

  // Resuming is a reason to check only when a check was missed or the network
  // may be back. Anything else would let switching tabs request more often
  // than the interval the site owner chose. Several of these events fire
  // together (a restored page also becomes visible), so retries are spaced.
  const shouldCheckOnResume = () => {
    if (checkInFlight) return false;
    if (isCheckOverdue()) return true;

    return isRetryingNetworkFailure() && !hasJustChecked();
  };

  const checkOnResume = (reason) => {
    if (!shouldCheckOnResume()) return;

    debug(`Checking now because ${reason}.`);
    checkNow();
  };

  const onVisibilityChange = () => {
    if (document.visibilityState === 'visible') checkOnResume('the page became visible');
  };

  const onOnline = () => checkOnResume('the browser is back online');

  const onPageShow = ({ persisted }) => {
    if (persisted) checkOnResume('the page was restored from the back/forward cache');
  };

  const start = () => {
    if (isStarted) return;
    isStarted = true;

    document.addEventListener('visibilitychange', onVisibilityChange);
    window.addEventListener('online', onOnline);
    window.addEventListener('pageshow', onPageShow);

    runCheck(false);
  };

  const stop = () => {
    isStarted = false;
    isTrailingCheckQueued = false;
    clearNextCheck();

    document.removeEventListener('visibilitychange', onVisibilityChange);
    window.removeEventListener('online', onOnline);
    window.removeEventListener('pageshow', onPageShow);
  };

  const getMsUntilNextCheck = () => (nextCheckAt === null ? null : Math.max(nextCheckAt - Date.now(), 0));

  return {
    checkNow,
    getMsUntilNextCheck,
    requestCheck,
    setIntervalMs,
    start,
    stop,
  };
};
