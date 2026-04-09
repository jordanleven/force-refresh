import {
  formatScheduledRefreshBaseLabel,
  formatScheduledRefreshDateLabel,
  formatScheduledRefreshTimeLabel,
  getScheduledRefreshCountdownLabel,
  getScheduledRefreshDateKey,
  formatScheduledRefreshLabel,
  getSecondsUntilScheduledRefresh,
  isScheduledRefreshImminent,
} from './AdminMainRefreshUtils.js';

const TIMESTAMP_EXPECTED = 1706107260;

describe('AdminMainRefreshUtils', () => {
  describe('formatScheduledRefreshDateLabel', () => {
    it('formats only the scheduled refresh date', () => {
      expect(formatScheduledRefreshDateLabel(TIMESTAMP_EXPECTED)).toBe('January 24, 2024');
    });
  });

  describe('formatScheduledRefreshBaseLabel', () => {
    it('formats a scheduled refresh as "Month Day, Year at H:MM AM/PM"', () => {
      expect(formatScheduledRefreshBaseLabel(TIMESTAMP_EXPECTED)).toBe('January 24, 2024 at 9:41 AM');
    });
  });

  describe('formatScheduledRefreshTimeLabel', () => {
    it('formats only the scheduled refresh time', () => {
      expect(formatScheduledRefreshTimeLabel(TIMESTAMP_EXPECTED)).toBe('9:41 AM');
    });
  });

  describe('getSecondsUntilScheduledRefresh', () => {
    it('returns the remaining seconds for future refreshes', () => {
      expect(getSecondsUntilScheduledRefresh(200, 141)).toBe(59);
    });

    it('never returns a negative number', () => {
      expect(getSecondsUntilScheduledRefresh(100, 141)).toBe(0);
    });
  });

  describe('isScheduledRefreshImminent', () => {
    it('returns true when the refresh timestamp has been reached', () => {
      expect(isScheduledRefreshImminent(100, 100)).toBe(true);
    });

    it('returns true when the refresh timestamp is in the past', () => {
      expect(isScheduledRefreshImminent(100, 101)).toBe(true);
    });

    it('returns false when the refresh is still in the future', () => {
      expect(isScheduledRefreshImminent(100, 99)).toBe(false);
    });
  });

  describe('formatScheduledRefreshLabel', () => {
    it('shows the base label when the refresh is at least 60 seconds away', () => {
      expect(formatScheduledRefreshLabel(200, 140)).toMatch(/\w+ \d{1,2}, \d{4} at \d{1,2}:\d{2} (AM|PM)$/);
    });

    it('shows a countdown when the refresh is less than 60 seconds away', () => {
      expect(formatScheduledRefreshLabel(200, 141)).toMatch(/\(59 seconds\)$/);
    });

    it('uses a singular unit for one second', () => {
      expect(formatScheduledRefreshLabel(200, 199)).toMatch(/\(1 second\)$/);
    });

    it('shows imminent when the refresh time has arrived', () => {
      expect(formatScheduledRefreshLabel(200, 200)).toMatch(/\(imminent\)$/);
    });
  });

  describe('getScheduledRefreshCountdownLabel', () => {
    it('returns null when the refresh is at least 60 seconds away', () => {
      expect(getScheduledRefreshCountdownLabel(200, 140)).toBe(null);
    });

    it('returns the countdown text when the refresh is less than 60 seconds away', () => {
      expect(getScheduledRefreshCountdownLabel(200, 141)).toEqual({
        secondsUntilRefresh: 59,
        type: 'countdown',
      });
    });

    it('returns imminent when the refresh time has arrived', () => {
      expect(getScheduledRefreshCountdownLabel(200, 200)).toEqual({
        type: 'imminent',
      });
    });
  });

  describe('getScheduledRefreshDateKey', () => {
    it('returns a stable date key for grouping scheduled refreshes', () => {
      expect(getScheduledRefreshDateKey(TIMESTAMP_EXPECTED)).toBe('2024-01-24');
    });
  });
});
