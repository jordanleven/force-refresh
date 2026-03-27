/**
 * Returns true if the given date is in the past (before today), false otherwise.
 * Used by the date picker to disable past dates.
 */
export function filterAvailableDates(date) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const checkDate = new Date(date);
  checkDate.setHours(0, 0, 0, 0);

  return checkDate < today;
}

/**
 * Returns true if the given time should be disabled, false if it should be allowed.
 * - Future dates: all times allowed.
 * - Today: only future times allowed.
 * - Past dates: all times disabled.
 */
export function filterAvailableTimes(date) {
  const now = new Date();
  const selectedDate = new Date(date);

  const endOfToday = new Date(now);
  endOfToday.setHours(23, 59, 59, 999);

  if (selectedDate > endOfToday) {
    return false;
  }

  if (selectedDate.toDateString() === now.toDateString()) {
    return selectedDate <= now;
  }

  return true;
}

/**
 * Formats a date as "Month Day, Year at H:MM AM/PM".
 */
export function formatScheduledTime(date) {
  const scheduledDateTime = new Date(date);
  const datePart = scheduledDateTime.toLocaleDateString('en-US', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
  const timePart = scheduledDateTime.toLocaleTimeString('en-US', {
    hour: 'numeric',
    hour12: true,
    minute: '2-digit',
  });
  return `${datePart} at ${timePart}`;
}
