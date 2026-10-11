import { FAILURE_KINDS, checkFailed } from '@/js/client/checkResult.js';
import { debug, warn } from '@/js/services/loggingService.js';

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
const runCheckWithTimeout = (check) => new Promise((resolve) => {
  const abortController = new AbortController();
  const timeout = setTimeout(() => {
    abortController.abort();
    resolve(checkFailed(FAILURE_KINDS.TIMEOUT));
  }, CHECK_TIMEOUT_MS);

  Promise.resolve()
    .then(() => check({ signal: abortController.signal }))
    .then(
      (result) => resolve(toCheckResult(result)),
      () => resolve(checkFailed(FAILURE_KINDS.NETWORK)),
    )
    .finally(() => clearTimeout(timeout));
});

/**
 * Decides when to run the version check: on a fixed interval, sooner after a
 * failure, and promptly when the page is likely to have missed a check.
 * It knows nothing about versions; `check` owns the decision to reload.
 * @param     {object}      options
 * @param     {Function}    options.check         Called with `{ signal }`, an `AbortSignal` that
 *                                                aborts when the check is given up on. Resolves
 *                                                to a check result (see `checkResult.js`)
 * @param     {number}      options.intervalMs    The normal polling interval
 * @param     {Function}    options.random        Returns a number between 0 and 1
 * @return    {object}                            The scheduler
 */
export const createPollingScheduler = ({ check, intervalMs, random = Math.random }) => {
  let consecutiveFailures = 0;
  let checkInFlight = null;
  let isStarted = false;
  let lastSuccessAt = null;
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
    if (succeeded) {
      consecutiveFailures = 0;
      lastSuccessAt = Date.now();
      return intervalMs;
    }

    consecutiveFailures += 1;
    const retryDelay = getDelayAfterFailure({
      failureKind,
      failures: consecutiveFailures,
      intervalMs,
      random,
      retryAfterMs,
    });
    warn(`Unable to check for a refresh. Retrying in ${Math.round(retryDelay / 1000)} seconds.`);
    return retryDelay;
  };

  /**
   * Runs a check immediately unless one is already running, in which case the
   * running check is returned. The next scheduled check is always timed from
   * the end of this one.
   * @return    {Promise<object>}    The check result
   */
  const checkNow = () => {
    if (checkInFlight) return checkInFlight;

    clearNextCheck();
    checkInFlight = runCheckWithTimeout(check).then((result) => {
      checkInFlight = null;
      scheduleNextCheck(getDelayAfterCheck(result), checkNow);
      return result;
    });

    return checkInFlight;
  };

  const hasRecentlySucceeded = () => lastSuccessAt !== null
    && Date.now() - lastSuccessAt < TRIGGER_MIN_GAP_MS;

  // Several of these events fire together (a restored page also becomes
  // visible), so anything arriving just after a good check is ignored.
  const checkBecause = (reason) => {
    if (checkInFlight || hasRecentlySucceeded()) return;

    debug(`Checking now because ${reason}.`);
    checkNow();
  };

  const onVisibilityChange = () => {
    if (document.visibilityState === 'visible') checkBecause('the page became visible');
  };

  const onOnline = () => checkBecause('the browser is back online');

  const onPageShow = ({ persisted }) => {
    if (persisted) checkBecause('the page was restored from the back/forward cache');
  };

  const start = () => {
    if (isStarted) return;
    isStarted = true;

    document.addEventListener('visibilitychange', onVisibilityChange);
    window.addEventListener('online', onOnline);
    window.addEventListener('pageshow', onPageShow);

    checkNow();
  };

  const stop = () => {
    isStarted = false;
    clearNextCheck();

    document.removeEventListener('visibilitychange', onVisibilityChange);
    window.removeEventListener('online', onOnline);
    window.removeEventListener('pageshow', onPageShow);
  };

  const getMsUntilNextCheck = () => (nextCheckAt === null ? null : Math.max(nextCheckAt - Date.now(), 0));

  return {
    checkNow,
    getMsUntilNextCheck,
    start,
    stop,
  };
};
