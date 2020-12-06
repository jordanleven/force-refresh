import 'regenerator-runtime/runtime';
import {
  always,
  anyPass,
  identity,
  ifElse,
  pipe,
  tap,
} from 'ramda';
import { getDebugMode, setDebugMode } from '@/js/services/debugService.js';
import { debug, error } from '@/js/services/loggingService.js';
import { getCurrentVersion } from './currentVersions.js';
import {
  getStoredVersionPage,
  getStoredVersionSite,
  setStoredVersionPage,
  setStoredVersionSite,
} from './storedVersions.js';

let checkVersionInterval;

const isSiteVersionOutdated = ({ currentVersionSite }) => {
  const storedVersionSite = getStoredVersionSite();
  debug(`Site: stored version: ${storedVersionSite}, current version: ${currentVersionSite}.`);
  return currentVersionSite !== storedVersionSite;
};

const isPageVersionOutdated = ({ currentVersionPage }) => {
  const storedVersionPage = getStoredVersionPage();
  debug(`Page: stored version: ${storedVersionPage}, current version: ${currentVersionPage}.`);
  return currentVersionPage !== storedVersionPage;
};

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
