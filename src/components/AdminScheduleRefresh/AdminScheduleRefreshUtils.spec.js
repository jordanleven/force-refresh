import {
  filterAvailableDates,
  filterAvailableTimes,
  formatScheduledTime,
} from './AdminScheduleRefreshUtils.js';

describe('AdminScheduleRefreshUtils', () => {
  describe('filterAvailableDates', () => {
    it('disables yesterday', () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      expect(filterAvailableDates(yesterday)).toBe(true);
    });

    it('allows today', () => {
      expect(filterAvailableDates(new Date())).toBe(false);
    });

    it('allows tomorrow', () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      expect(filterAvailableDates(tomorrow)).toBe(false);
    });

    it('disables a date well in the past', () => {
      expect(filterAvailableDates(new Date('2000-01-01'))).toBe(true);
    });

    it('allows a date well in the future', () => {
      expect(filterAvailableDates(new Date('2099-12-31'))).toBe(false);
    });
  });

  describe('filterAvailableTimes', () => {
    it('allows all times for a future date', () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(0, 0, 0, 0);
      expect(filterAvailableTimes(tomorrow)).toBe(false);
    });

    it('allows a time one hour in the future (today)', () => {
      const futureTime = new Date(Date.now() + 3600000);
      expect(filterAvailableTimes(futureTime)).toBe(false);
    });

    it('disables a time one hour in the past (today)', () => {
      const pastTime = new Date(Date.now() - 3600000);
      expect(filterAvailableTimes(pastTime)).toBe(true);
    });

    it('disables all times for a past date', () => {
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 1);
      pastDate.setHours(12, 0, 0, 0);
      expect(filterAvailableTimes(pastDate)).toBe(true);
    });

    it('disables a time far in the past', () => {
      expect(filterAvailableTimes(new Date('2000-01-01T12:00:00'))).toBe(true);
    });

    it('allows a time far in the future', () => {
      expect(filterAvailableTimes(new Date('2099-12-31T23:59:00'))).toBe(false);
    });
  });

  describe('formatScheduledTime', () => {
    it('formats a date as "Month Day, Year at H:MM AM/PM"', () => {
      expect(formatScheduledTime(new Date('2026-04-01T14:00:00'))).toMatch(/April 1, 2026 at 2:00 PM/);
    });

    it('uses numeric hours without a leading zero', () => {
      const formatted = formatScheduledTime(new Date('2026-04-01T09:00:00'));
      expect(formatted).toMatch(/9:00 AM/);
      expect(formatted).not.toMatch(/09:00 AM/);
    });

    it('formats midnight correctly', () => {
      const formatted = formatScheduledTime(new Date('2026-06-15T00:00:00'));
      expect(formatted).toMatch(/June 15, 2026 at 12:00 AM/);
    });

    it('formats noon correctly', () => {
      const formatted = formatScheduledTime(new Date('2026-06-15T12:00:00'));
      expect(formatted).toMatch(/June 15, 2026 at 12:00 PM/);
    });
  });
});
