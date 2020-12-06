import 'regenerator-runtime/runtime';
import {
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

const isSiteVersionOutdated = ({ currentVersionSite }) => {
  const storedSiteVersion = getStoredVersionSite();
  debug(`Comparing stored site version ${storedSiteVersion} with current site version ${currentVersionSite}`);
  return currentVersionSite !== getStoredVersionSite();
};

const isPageVersionOutdated = ({ currentVersionPage }) => {
  const storedPageVersion = getStoredVersionPage();
  debug(`Comparing stored page version ${storedPageVersion} with current page version ${currentVersionPage}`);
  return currentVersionPage !== storedPageVersion;
};

// eslint-disable-next-line no-restricted-globals
const refreshPage = () => debug('Browser would refresh');

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
    () => debug('Site does not require refresh'),
  ),
)(versions);

const checkForRefresh = () => {
  getCurrentVersion()
    .then(({ data }) => {
      // eslint-disable-next-line no-console
      console.groupCollapsed(`Refresh request for ${new Date()}`);
      compareRetrievedVersions(data);
      // eslint-disable-next-line no-console
      console.groupEnd();
    })
    .catch(() => {
      error('Error received! Stopping the refresh interval');
      clearInterval(checkVersionInterval);
    });
};

// eslint-disable-next-line no-undef
const { refreshInterval } = forceRefreshLocalizedData;
const refreshIntervalInMicroseconds = refreshInterval * 1000;

debug(`Refreshing every ${refreshInterval} seconds.`);

checkForRefresh();
checkVersionInterval = setInterval(checkForRefresh, refreshIntervalInMicroseconds);
