import 'regenerator-runtime/runtime';
import {
  always,
  anyPass,
  identity,
  ifElse,
  pipe,
  tap,
} from 'ramda';
import { debug, error } from '@/js/services/loggingService';
import {
  getStoredVersionPage,
  getStoredVersionSite,
  setStoredVersionPage,
  setStoredVersionSite,
} from './storedVersions';
import { getCurrentVersion } from './currentVersions';

let checkVersionInterval;

const isSiteVersionOutdated = ({ currentVersionSite }) => currentVersionSite !== getStoredVersionSite();
const isPageVersionOutdated = ({ currentVersionPage }) => currentVersionPage !== getStoredVersionPage();

// eslint-disable-next-line no-restricted-globals
const refreshPage = () => location.reload();

const storeVersionSite = (version) => pipe(
  tap(
    (_version) => debug(`No stored site version, storing version ${_version}`),
  ),
  setStoredVersionSite,
)(version);

const storeVersionPage = (version) => pipe(
  tap(
    (_version) => debug(`No stored page version, storing version ${_version}`),
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
      error('Error received! Stopping the refresh interval');
      clearInterval(checkVersionInterval);
    });
};

// eslint-disable-next-line no-undef
const { refreshInterval } = forceRefreshLocalizedData;

debug(`Refreshing every ${refreshInterval} seconds.`);

checkForRefresh();
// setInterval(checkForRefresh, refreshInterval * 1000);
checkVersionInterval = setInterval(checkForRefresh, 5000);
