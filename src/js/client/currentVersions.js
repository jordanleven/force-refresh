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
 * @param     {string}    url    The URL to request
 * @return    {Promise<object>}  `{ body }` on success, otherwise a failed check result
 */
const requestJson = async (url) => {
  let response;

  try {
    response = await fetch(url);
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

const fetchStaticVersion = async (versionFileUrl, refreshInterval, postId) => {
  const url = `${versionFileUrl}?t=${getCacheBustParam(refreshInterval)}`;
  const { body } = await requestJson(url);

  if (!body) return null;

  const { site, pages } = body;
  return { succeeded: true, versions: toVersionShape(site, pages, postId) };
};

const fetchRestVersion = async (apiEndpoint, postId) => {
  const message = postId ? ` and post ${postId}` : '';
  debug(`Requesting refresh data for site${message}.`);

  const url = postId ? `${apiEndpoint}?${new URLSearchParams({ postId })}` : apiEndpoint;
  const { body, ...failure } = await requestJson(url);

  if (!body) return failure;
  if (!body.data) return checkFailed(FAILURE_KINDS.SERVER);

  return { succeeded: true, versions: body.data };
};

/**
 * Retrieves the current versions from the static version file when the site
 * uses one, and from the REST API otherwise or when the file is unavailable.
 * @return    {Promise<object>}    `{ succeeded: true, versions }`, or a failed check
 *                                 result saying why the versions could not be retrieved
 */
export const getCurrentVersion = async () => {
  const {
    apiEndpoint,
    postId,
    refreshInterval,
    versionFileUrl,
  // eslint-disable-next-line no-undef
  } = forceRefreshLocalizedData;

  if (!versionFileUrl) return fetchRestVersion(apiEndpoint, postId);

  const staticResult = await fetchStaticVersion(versionFileUrl, refreshInterval, postId);
  return staticResult ?? fetchRestVersion(apiEndpoint, postId);
};
