import { debug } from '@/js/services/loggingService.js';

export const COUNTDOWN_INTERVAL_MS = 5 * 1000;

/**
 * Periodically logs how long remains until the next version check.
 * @param     {Function}    getMsUntilNextCheck    Returns the milliseconds until the next
 *                                                 check, or null when none is scheduled
 * @return    {Function}                           Stops the countdown
 */
export const startDebugCountdown = (getMsUntilNextCheck) => {
  const countdownInterval = setInterval(() => {
    const msUntilNextCheck = getMsUntilNextCheck();
    if (msUntilNextCheck === null) return;

    debug(`Next check in ${Math.round(msUntilNextCheck / 1000)} seconds.`);
  }, COUNTDOWN_INTERVAL_MS);

  return () => clearInterval(countdownInterval);
};
