import { FAILURE_KINDS, checkFailed } from '@/js/client/checkResult.js';
import { debug } from '@/js/services/loggingService.js';

const getCacheBustParam = (refreshInterval) => Math.floor(Date.now() / (refreshInterval * 1000));

const toVersionShape = (site, pages, postId) => ({
  currentVersionSite: site ?? '0',
  ...(postId && { currentVersionPage: pages?.[postId] ?? '0' }),
});

/**
 * Reads a `Retry-After` header, which is either a number of seconds or a date.
 * @param     {Response}       response    The response to read
 * @return    {number|null}                The milliseconds to wait, or null when not given
 */
export const getRetryAfterMs = (response) => {
  const retryAfter = response.headers?.get('Retry-After');
  if (!retryAfter) return null;

  const seconds = Number(retryAfter);
  if (Number.isFinite(seconds)) return Math.max(seconds, 0) * 1000;

  const date = Date.parse(retryAfter);
  return Number.isNaN(date) ? null : Math.max(date - Date.now(), 0);
};

/**
 * Requests JSON without throwing, so the caller can tell a request that never
 * reached the server from a server that answered with something unusable.
 * @param     {string}    url             The URL to request
 * @param     {object}    fetchOptions    The options to pass to `fetch`
 * @return    {Promise<object>}           `{ body }` on success, otherwise a failed check result
 */
const requestJson = async (url, fetchOptions) => {
  let response;

  try {
    response = await fetch(url, fetchOptions);
  } catch {
    return checkFailed(FAILURE_KINDS.NETWORK);
  }

  if (!response.ok) return checkFailed(FAILURE_KINDS.SERVER, getRetryAfterMs(response));

  try {
    return { body: await response.json() };
  } catch {
    return checkFailed(FAILURE_KINDS.SERVER);
  }
};

const fetchStaticVersion = async (versionFileUrl, refreshInterval, postId, fetchOptions) => {
  const url = `${versionFileUrl}?t=${getCacheBustParam(refreshInterval)}`;
  const { body } = await requestJson(url, fetchOptions);

  if (!body) return null;

  const { site, pages } = body;
  return { succeeded: true, versions: toVersionShape(site, pages, postId) };
};

const fetchRestVersion = async (apiEndpoint, postId, fetchOptions) => {
  const message = postId ? ` and post ${postId}` : '';
  debug(`Requesting refresh data for site${message}.`);

  const url = postId ? `${apiEndpoint}?${new URLSearchParams({ postId })}` : apiEndpoint;
  const { body, ...failure } = await requestJson(url, fetchOptions);

  if (!body) return failure;
  if (!body.data) return checkFailed(FAILURE_KINDS.SERVER);

  return { succeeded: true, versions: body.data };
};

/**
 * Retrieves the current versions from the static version file when the site
 * uses one, and from the REST API otherwise or when the file is unavailable.
 * @param     {object}         options
 * @param     {AbortSignal}    options.signal    Aborts the request when the check is given up on
 * @return    {Promise<object>}                  `{ succeeded: true, versions }`, or a failed check
 *                                               result saying why the versions were not retrieved
 */
export const getCurrentVersion = async ({ signal } = {}) => {
  const {
    apiEndpoint,
    postId,
    refreshInterval,
    versionFileUrl,
  // eslint-disable-next-line no-undef
  } = forceRefreshLocalizedData;

  const fetchOptions = { signal };

  if (!versionFileUrl) return fetchRestVersion(apiEndpoint, postId, fetchOptions);

  const staticResult = await fetchStaticVersion(versionFileUrl, refreshInterval, postId, fetchOptions);
  return staticResult ?? fetchRestVersion(apiEndpoint, postId, fetchOptions);
};
