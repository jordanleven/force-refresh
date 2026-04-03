export function formatScheduledRefreshBaseLabel(timestamp) {
  const timestampDate = new Date(0);
  timestampDate.setUTCSeconds(timestamp);

  const date = timestampDate.toLocaleDateString('en-US', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const time = timestampDate.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  });

  return `${date} at ${time}`;
}

export function getSecondsUntilScheduledRefresh(timestamp, currentTimestamp = Math.floor(Date.now() / 1000)) {
  return Math.max(timestamp - currentTimestamp, 0);
}

export function isScheduledRefreshImminent(timestamp, currentTimestamp = Math.floor(Date.now() / 1000)) {
  return getSecondsUntilScheduledRefresh(timestamp, currentTimestamp) === 0;
}

export function getScheduledRefreshCountdownLabel(timestamp, currentTimestamp = Math.floor(Date.now() / 1000)) {
  const secondsUntilRefresh = getSecondsUntilScheduledRefresh(timestamp, currentTimestamp);

  if (secondsUntilRefresh === 0) {
    return {
      type: 'imminent',
    };
  }

  if (secondsUntilRefresh < 60) {
    return {
      secondsUntilRefresh,
      type: 'countdown',
    };
  }

  return null;
}

export function formatScheduledRefreshLabel(timestamp, currentTimestamp = Math.floor(Date.now() / 1000)) {
  const baseLabel = formatScheduledRefreshBaseLabel(timestamp);
  const countdown = getScheduledRefreshCountdownLabel(timestamp, currentTimestamp);

  if (countdown?.type === 'imminent') {
    return `${baseLabel} (imminent)`;
  }

  if (countdown?.type === 'countdown') {
    const unitLabel = countdown.secondsUntilRefresh === 1 ? 'second' : 'seconds';
    return `${baseLabel} (${countdown.secondsUntilRefresh} ${unitLabel})`;
  }

  return baseLabel;
}
