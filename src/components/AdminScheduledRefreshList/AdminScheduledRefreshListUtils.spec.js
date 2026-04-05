import {
  getGroupedScheduledRefreshes,
  getScheduledRefreshesWithLabel,
  shouldGroupScheduledRefreshes,
} from './AdminScheduledRefreshListUtils.js';

// Timestamps spread across two distinct UTC dates (2026-01-01 and 2026-01-02)
const JAN_1_TIMESTAMP = 1751328000; // 2026-01-01 00:00:00 UTC
const JAN_2_TIMESTAMP = 1751414400; // 2026-01-02 00:00:00 UTC

describe('AdminScheduledRefreshListUtils', () => {
  describe('getScheduledRefreshesWithLabel', () => {
    it('returns an empty array when given an empty array', () => {
      expect(getScheduledRefreshesWithLabel([], 0)).toEqual([]);
    });

    it('returns an empty array when given null', () => {
      expect(getScheduledRefreshesWithLabel(null, 0)).toEqual([]);
    });

    it('sorts refreshes by timestamp ascending', () => {
      const refreshes = [
        { id: 'b', timestamp: JAN_2_TIMESTAMP },
        { id: 'a', timestamp: JAN_1_TIMESTAMP },
      ];

      const result = getScheduledRefreshesWithLabel(refreshes, 0);

      expect(result[0].id).toBe('a');
      expect(result[1].id).toBe('b');
    });

    it('includes a countdown label when the refresh is within 59 seconds', () => {
      const timestamp = 1000;
      const currentTimestamp = 942; // 58 seconds before

      const [result] = getScheduledRefreshesWithLabel([{ id: 'x', timestamp }], currentTimestamp);

      expect(result.countdownLabel).toEqual({ secondsUntilRefresh: 58, type: 'countdown' });
    });

    it('has no countdown label when the refresh is more than 59 seconds away', () => {
      const timestamp = 1000;
      const currentTimestamp = 0;

      const [result] = getScheduledRefreshesWithLabel([{ id: 'x', timestamp }], currentTimestamp);

      expect(result.countdownLabel).toBeNull();
    });

    it('marks the delete button as disabled when the refresh is imminent', () => {
      const timestamp = 1000;

      const [result] = getScheduledRefreshesWithLabel([{ id: 'x', timestamp }], timestamp);

      expect(result.deleteDisabled).toBe(true);
    });

    it('marks the delete button as enabled when the refresh is not imminent', () => {
      const timestamp = 1000;
      const currentTimestamp = 0;

      const [result] = getScheduledRefreshesWithLabel([{ id: 'x', timestamp }], currentTimestamp);

      expect(result.deleteDisabled).toBe(false);
    });
  });

  describe('shouldGroupScheduledRefreshes', () => {
    it('returns false when given fewer than 5 refreshes', () => {
      const refreshes = [
        { id: 'a', timestamp: JAN_1_TIMESTAMP },
        { id: 'b', timestamp: JAN_1_TIMESTAMP + 3600 },
      ];

      expect(shouldGroupScheduledRefreshes(refreshes)).toBe(false);
    });

    it('returns false when 5+ refreshes all fall on different dates', () => {
      const refreshes = Array.from({ length: 5 }, (_, i) => ({
        id: `${i}`,
        timestamp: JAN_1_TIMESTAMP + i * 86400, // one per day
      }));

      expect(shouldGroupScheduledRefreshes(refreshes)).toBe(false);
    });

    it('returns true when 5+ refreshes include multiple on the same date', () => {
      const refreshes = [
        { id: 'a', timestamp: JAN_1_TIMESTAMP },
        { id: 'b', timestamp: JAN_1_TIMESTAMP + 3600 },
        { id: 'c', timestamp: JAN_2_TIMESTAMP },
        { id: 'd', timestamp: JAN_2_TIMESTAMP + 3600 },
        { id: 'e', timestamp: JAN_2_TIMESTAMP + 7200 },
      ];

      expect(shouldGroupScheduledRefreshes(refreshes)).toBe(true);
    });

    it('returns false when given null', () => {
      expect(shouldGroupScheduledRefreshes(null)).toBe(false);
    });
  });

  describe('getGroupedScheduledRefreshes', () => {
    it('returns an empty array when grouping threshold is not met', () => {
      const refreshes = [{ id: 'a', timestamp: JAN_1_TIMESTAMP }];

      expect(getGroupedScheduledRefreshes(refreshes, 0)).toEqual([]);
    });

    it('groups refreshes by date key', () => {
      const refreshes = [
        { id: 'a', timestamp: JAN_1_TIMESTAMP },
        { id: 'b', timestamp: JAN_1_TIMESTAMP + 3600 },
        { id: 'c', timestamp: JAN_2_TIMESTAMP },
        { id: 'd', timestamp: JAN_2_TIMESTAMP + 3600 },
        { id: 'e', timestamp: JAN_2_TIMESTAMP + 7200 },
      ];

      const groups = getGroupedScheduledRefreshes(refreshes, 0);

      expect(groups).toHaveLength(2);
      expect(groups[0].refreshes).toHaveLength(2);
      expect(groups[1].refreshes).toHaveLength(3);
    });

    it('includes a dateLabel on each group', () => {
      const refreshes = [
        { id: 'a', timestamp: JAN_1_TIMESTAMP },
        { id: 'b', timestamp: JAN_1_TIMESTAMP + 3600 },
        { id: 'c', timestamp: JAN_2_TIMESTAMP },
        { id: 'd', timestamp: JAN_2_TIMESTAMP + 3600 },
        { id: 'e', timestamp: JAN_2_TIMESTAMP + 7200 },
      ];

      const groups = getGroupedScheduledRefreshes(refreshes, 0);

      groups.forEach((group) => {
        expect(typeof group.dateLabel).toBe('string');
        expect(group.dateLabel.length).toBeGreaterThan(0);
      });
    });
  });
});
