import { warn } from '@/js/services/loggingService.js';

export const RETRY_BASE_DELAY_MS = 5 * 1000;
export const RETRY_MAX_DELAY_MS = 5 * 60 * 1000;
export const CHECK_TIMEOUT_MS = 30 * 1000;

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

// A check that never settles would otherwise block every later check.
const runCheckWithTimeout = (check) => new Promise((resolve) => {
  const timeout = setTimeout(() => resolve(false), CHECK_TIMEOUT_MS);

  Promise.resolve()
    .then(check)
    .then((succeeded) => resolve(!!succeeded), () => resolve(false))
    .finally(() => clearTimeout(timeout));
});

/**
 * Decides when to run the version check: on a fixed interval, and sooner
 * after a failure so that one bad check never stops the page from polling.
 * It knows nothing about versions; `check` owns the decision to reload.
 * @param     {object}      options
 * @param     {Function}    options.check         Resolves to true when the check succeeded
 * @param     {number}      options.intervalMs    The normal polling interval
 * @param     {Function}    options.random        Returns a number between 0 and 1
 * @return    {object}                            The scheduler
 */
export const createPollingScheduler = ({ check, intervalMs, random = Math.random }) => {
  let consecutiveFailures = 0;
  let checkInFlight = null;
  let isStarted = false;
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

  const getDelayAfterCheck = (succeeded) => {
    if (succeeded) {
      consecutiveFailures = 0;
      return intervalMs;
    }

    consecutiveFailures += 1;
    const retryDelay = getRetryDelay(consecutiveFailures, intervalMs, random);
    warn(`Unable to check for a refresh. Retrying in ${Math.round(retryDelay / 1000)} seconds.`);
    return retryDelay;
  };

  /**
   * Runs a check immediately unless one is already running, in which case the
   * running check is returned. The next scheduled check is always timed from
   * the end of this one.
   * @return    {Promise<boolean>}    Whether the check succeeded
   */
  const checkNow = () => {
    if (checkInFlight) return checkInFlight;

    clearNextCheck();
    checkInFlight = runCheckWithTimeout(check).then((succeeded) => {
      checkInFlight = null;
      scheduleNextCheck(getDelayAfterCheck(succeeded), checkNow);
      return succeeded;
    });

    return checkInFlight;
  };

  const start = () => {
    if (isStarted) return;
    isStarted = true;

    checkNow();
  };

  const stop = () => {
    isStarted = false;
    clearNextCheck();
  };

  const getMsUntilNextCheck = () => (nextCheckAt === null ? null : Math.max(nextCheckAt - Date.now(), 0));

  return {
    checkNow,
    getMsUntilNextCheck,
    start,
    stop,
  };
};
