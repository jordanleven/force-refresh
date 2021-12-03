import 'regenerator-runtime/runtime';
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
import { getCurrentVersion } from '@/js/client/currentVersions.js';
import {
  getStoredVersionPage,
  getStoredVersionSite,
  setStoredVersionPage,
  setStoredVersionSite,
} from '@/js/client/storedVersions.js';
import { getDebugMode, setDebugMode } from '@/js/services/debugService.js';
import { debug, error } from '@/js/services/loggingService.js';

let checkVersionInterval;

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

const isPageVersionOutdated = ({ currentVersionPage }) => pipe(
  getStoredVersionPage,
  curry(
    isVersionOutdated,
  )('Page', __, currentVersionPage),
  () => false,
)();

const refreshPage = () => {
  if (getDebugMode()) {
    debug('Conditions met for reload but not executed.');
    return;
  }

  // eslint-disable-next-line no-restricted-globals
  location.reload();
};

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
  maybeStoreVersionPage(currentVersionPage);
};

const compareRetrievedVersions = (versions) => pipe(
  tap(
    maybeStoreVersions,
  ),
  ifElse(
    pageRequiresRefresh,
    refreshPage,
    always(null),
  ),
)(versions);

const checkForRefresh = () => {
  getCurrentVersion()
    .then(({ data }) => compareRetrievedVersions(data))
    .catch(() => {
      error('Error received! Stopping the refresh interval.');
      clearInterval(checkVersionInterval);
    });
};

// eslint-disable-next-line no-undef
const { isDebugActive, refreshInterval } = forceRefreshLocalizedData;
const refreshIntervalInMilliseconds = refreshInterval * 1000;

setDebugMode(!!isDebugActive);
debug(`Debug mode is ${isDebugActive ? 'active' : 'inactive'}.`);
debug(`Refreshing every ${refreshInterval} seconds.`);

checkForRefresh();
checkVersionInterval = setInterval(checkForRefresh, refreshIntervalInMilliseconds);
