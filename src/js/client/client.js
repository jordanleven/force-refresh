import 'regenerator-runtime/runtime';
import {
  __,
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

const COUNTDOWN_INTERVAL_IN_SECONDS = 5;

let checkVersionInterval;
let countdownInterval;

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
)();

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

const refreshPage = ({ currentVersionSite, currentVersionPage }) => {
  if (getDebugMode()) {
    debug('Conditions met for reload but not executed.');
    setStoredVersionSite(currentVersionSite);
    setStoredVersionPage(currentVersionPage);
    return;
  }

  // eslint-disable-next-line no-restricted-globals
  location.reload();
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

const exitForceRefresh = () => {
  error('Error received! Stopping the refresh interval.');
  clearInterval(checkVersionInterval);
  clearInterval(countdownInterval);
};

const checkForRefresh = async () => {
  const { success, data } = await getCurrentVersion().catch(exitForceRefresh);
  if (!success) {
    exitForceRefresh();
    return;
  }
  compareRetrievedVersions(data);
};

const setCountdownInterval = (refreshInterval) => {
  const intervalMinusCountdownInterval = refreshInterval - COUNTDOWN_INTERVAL_IN_SECONDS;
  let countdownSecondsUntilRefresh = intervalMinusCountdownInterval;

  countdownInterval = setInterval(() => {
    debug(`Next check in ${countdownSecondsUntilRefresh} seconds.`);
    const remainingSeconds = countdownSecondsUntilRefresh - COUNTDOWN_INTERVAL_IN_SECONDS;
    countdownSecondsUntilRefresh = remainingSeconds < 0 ? intervalMinusCountdownInterval : remainingSeconds;
  }, COUNTDOWN_INTERVAL_IN_SECONDS * 1000);
};

const getRoundedRefreshInterval = (value, divisor) => {
  const precision = 100;
  return Math.floor((value * precision) / divisor) / precision;
};

const getRefreshIntervalUnitAndValue = (refreshInterval) => {
  const divisors = {
    hour: 3600,
    minute: 60,
    second: 1,
  };

  let unit;
  let divisor;
  switch (true) {
    case refreshInterval >= divisors.hour:
      unit = 'hour';
      divisor = divisors.hour;
      break;
    case refreshInterval >= divisors.minute:
      unit = 'minute';
      divisor = divisors.minute;
      break;
    default:
      unit = 'second';
      divisor = divisors.second;
      break;
  }

  const roundedInterval = getRoundedRefreshInterval(refreshInterval, divisor);
  return [roundedInterval, unit];
};

const getRefreshIntervalMessage = (refreshInterval) => {
  const [refreshMessageValue, refreshUnit] = getRefreshIntervalUnitAndValue(refreshInterval);
  const refreshUnitPlural = refreshMessageValue === 1 ? '' : 's';
  return `${refreshMessageValue} ${refreshUnit}${refreshUnitPlural}`;
};

// eslint-disable-next-line no-undef
const { isDebugActive, refreshInterval } = forceRefreshLocalizedData;
const refreshIntervalMessage = getRefreshIntervalMessage(refreshInterval);

setDebugMode(!!isDebugActive);
debug(`Debug mode is ${isDebugActive ? 'active' : 'inactive'}.`);
debug(`Refreshing every ${refreshIntervalMessage}.`);

if (isDebugActive) {
  setCountdownInterval(refreshInterval);
}

checkForRefresh();
checkVersionInterval = setInterval(checkForRefresh, refreshInterval * 1000);
