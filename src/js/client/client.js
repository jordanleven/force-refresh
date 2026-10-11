import 'regenerator-runtime/runtime';
import { startDebugCountdown } from '@/js/client/debugCountdown.js';
import { createPollingScheduler } from '@/js/client/pollingScheduler.js';
import { checkForRefresh } from '@/js/client/refreshCheck.js';
import { setDebugMode } from '@/js/services/debugService.js';
import { debug } from '@/js/services/loggingService.js';
import { getRefreshIntervalUnitAndValue } from '@/js/utilities/getRefreshIntervalUnitAndValue.js';

const getRefreshIntervalMessage = (refreshInterval) => {
  const [refreshMessageValue, refreshUnit] = getRefreshIntervalUnitAndValue(refreshInterval);
  return `${refreshMessageValue} ${refreshUnit}`;
};

// eslint-disable-next-line no-undef
const { isDebugActive, refreshInterval } = forceRefreshLocalizedData;

const refreshIntervalMessage = getRefreshIntervalMessage(refreshInterval);

setDebugMode(!!isDebugActive);
debug(`Debug mode is ${isDebugActive ? 'active' : 'inactive'}.`);
debug(`Refreshing every ${refreshIntervalMessage}.`);

const pollingScheduler = createPollingScheduler({
  check: ({ isTriggered, signal }) => checkForRefresh({ bypassCache: isTriggered, signal }),
  intervalMs: refreshInterval * 1000,
});

if (isDebugActive) {
  startDebugCountdown(pollingScheduler.getMsUntilNextCheck);
}

pollingScheduler.start();
