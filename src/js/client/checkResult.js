/**
 * Why a version check failed. The scheduler retries quickly only when the
 * request never reached the server; a server that answered with an error, or
 * did not answer in time, is not asked again sooner than it normally would be.
 */
export const FAILURE_KINDS = {
  NETWORK: 'network',
  SERVER: 'server',
  TIMEOUT: 'timeout',
};

export const checkSucceeded = () => ({ succeeded: true });

/**
 * @param     {string}         failureKind     One of FAILURE_KINDS
 * @param     {number|null}    retryAfterMs    How long the server asked to be left alone, if it said
 * @return    {object}                         The result of a failed check
 */
export const checkFailed = (failureKind, retryAfterMs = null) => ({
  failureKind,
  retryAfterMs,
  succeeded: false,
});
