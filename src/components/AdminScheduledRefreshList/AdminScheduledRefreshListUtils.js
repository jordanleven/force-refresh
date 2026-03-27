import {
  formatScheduledRefreshBaseLabel,
  formatScheduledRefreshDateLabel,
  formatScheduledRefreshTimeLabel,
  getScheduledRefreshCountdownLabel,
  getScheduledRefreshDateKey,
  isScheduledRefreshImminent,
} from '../AdminMainRefresh/AdminMainRefreshUtils.js';

const MINIMUM_SCHEDULED_REFRESHES_TO_GROUP = 5;

export function getScheduledRefreshesWithLabel(scheduledRefreshes, currentTimestamp) {
  if (!scheduledRefreshes || !scheduledRefreshes.length) {
    return [];
  }

  return scheduledRefreshes
    .slice()
    .sort((a, b) => a.timestamp - b.timestamp)
    .map(({ timestamp, id }) => {
      const refreshId = id || `${timestamp}`;

      return {
        countdownLabel: getScheduledRefreshCountdownLabel(timestamp, currentTimestamp),
        dateKey: getScheduledRefreshDateKey(timestamp),
        dateLabel: formatScheduledRefreshDateLabel(timestamp),
        deleteDisabled: isScheduledRefreshImminent(timestamp, currentTimestamp),
        id: refreshId,
        label: formatScheduledRefreshBaseLabel(timestamp),
        timeLabel: formatScheduledRefreshTimeLabel(timestamp),
      };
    });
}

export function shouldGroupScheduledRefreshes(scheduledRefreshes) {
  if (!scheduledRefreshes || scheduledRefreshes.length < MINIMUM_SCHEDULED_REFRESHES_TO_GROUP) {
    return false;
  }

  const countsByDate = scheduledRefreshes.reduce((counts, { timestamp }) => {
    const dateKey = getScheduledRefreshDateKey(timestamp);
    return {
      ...counts,
      [dateKey]: (counts[dateKey] ?? 0) + 1,
    };
  }, {});

  return Object.values(countsByDate).some((count) => count > 1);
}

export function getGroupedScheduledRefreshes(scheduledRefreshes, currentTimestamp) {
  if (!shouldGroupScheduledRefreshes(scheduledRefreshes)) {
    return [];
  }

  return getScheduledRefreshesWithLabel(scheduledRefreshes, currentTimestamp).reduce((groups, schedule) => {
    const existingGroup = groups.find(({ dateKey }) => dateKey === schedule.dateKey);

    if (existingGroup) {
      existingGroup.refreshes.push(schedule);
      return groups;
    }

    groups.push({
      dateKey: schedule.dateKey,
      dateLabel: schedule.dateLabel,
      refreshes: [schedule],
    });

    return groups;
  }, []);
}
