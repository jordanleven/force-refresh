import {
  __,
  always,
  anyPass,
  curry,
  identity,
  ifElse,
  pipe,
  tap,
} from 'ramda';
import { FAILURE_KINDS, checkFailed, checkSucceeded } from '@/js/client/checkResult.js';
import { getCurrentVersion } from '@/js/client/currentVersions.js';
import { reloadPage } from '@/js/client/reloadPage.js';
import {
  getStoredVersionPage,
  getStoredVersionSite,
  setStoredVersionPage,
  setStoredVersionSite,
} from '@/js/client/storedVersions.js';
import { getDebugMode } from '@/js/services/debugService.js';
import { debug } from '@/js/services/loggingService.js';

const isVersionOutdated = (type, storedVersion, currentVersion) => {
  debug(`${type}: stored version: ${storedVersion}, current version: ${currentVersion}.`);
  return storedVersion !== currentVersion;
};

const isSiteVersionOutdated = ({ currentVersionSite }) => pipe(
  getStoredVersionSite,
  curry(
    isVersionOutdated,
  )('Site', __, currentVersionSite),
)();

const isPageVersionOutdated = ({ currentVersionPage }) => ifElse(
  (v) => v !== undefined,
  (v) => pipe(
    getStoredVersionPage,
    curry(
      isVersionOutdated,
    )('Page', __, v),
  )(),
  always(false),
)(currentVersionPage);

const storeVersionSite = (version) => pipe(
  tap(
    (_version) => debug(`No stored site version, storing version ${_version}.`),
  ),
  setStoredVersionSite,
)(version);

const storeVersionPage = (version) => pipe(
  tap(
    (_version) => debug(`No stored page version, storing version ${_version}.`),
  ),
  setStoredVersionPage,
)(version);

const maybeStoreVersionSite = (currentVersion) => ifElse(
  () => !getStoredVersionSite(),
  storeVersionSite,
  identity,
)(currentVersion);

const maybeStoreVersionPage = (currentVersion) => ifElse(
  () => !getStoredVersionPage(),
  storeVersionPage,
  identity,
)(currentVersion);

const pageRequiresRefresh = (versions) => anyPass([
  isSiteVersionOutdated,
  isPageVersionOutdated,
])(versions);

const maybeStoreVersions = ({ currentVersionSite, currentVersionPage }) => {
  maybeStoreVersionSite(currentVersionSite);

  if (currentVersionPage !== undefined) {
    maybeStoreVersionPage(currentVersionPage);
  }
};

const refreshPage = ({ currentVersionSite, currentVersionPage }) => {
  if (getDebugMode()) {
    debug('Conditions met for reload but not executed.');
    setStoredVersionSite(currentVersionSite);
    setStoredVersionPage(currentVersionPage);
    return;
  }

  reloadPage();
};

const compareRetrievedVersions = (versions) => pipe(
  tap(
    maybeStoreVersions,
  ),
  ifElse(
    pageRequiresRefresh,
    refreshPage,
    () => debug('Refresh not required.'),
  ),
)(versions);

const isSuccessfulResult = (result) => result?.succeeded === true && !!result.versions;

/**
 * Fetches the current versions and reloads the page when they are newer than
 * the versions this page loaded with. This is the single "should this page
 * reload?" decision, independent of what prompted the check.
 * @param     {object}    options      Passed to `getCurrentVersion`
 * @return    {Promise<object>}        A check result: `{ succeeded: true }`, or a failed
 *                                     result with the kind of failure. It never throws.
 */
export const checkForRefresh = async (options) => {
  const result = await getCurrentVersion(options).catch(() => undefined);

  if (!isSuccessfulResult(result)) {
    return checkFailed(result?.failureKind ?? FAILURE_KINDS.NETWORK, result?.retryAfterMs ?? null);
  }

  compareRetrievedVersions(result.versions);
  return checkSucceeded();
};
