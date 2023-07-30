const getRoundedRefreshInterval = (value, divisor) => {
  const precision = 100;
  return Math.floor((value * precision) / divisor) / precision;
};

export const getRefreshIntervalUnitAndValue = (refreshInterval) => {
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
  const refreshUnitPlural = roundedInterval === 1 ? '' : 's';

  return [roundedInterval, `${unit}${refreshUnitPlural}`];
};
