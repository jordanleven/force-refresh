import {
  deleteScheduledRefresh,
  getScheduledRefreshes,
  scheduleRequestSiteRefresh,
} from '../services/admin/refreshService.js';
import actions from './actions.js';

// Mock the service module
jest.mock('../services/admin/refreshService.js', () => ({
  deleteScheduledRefresh: jest.fn(),
  getScheduledRefreshes: jest.fn(),
  requestPostRefreshByPostID: jest.fn(),
  requestSiteRefresh: jest.fn(),
  scheduleRequestSiteRefresh: jest.fn(),
  updateForceRefreshDebugMode: jest.fn(),
  updateForceRefreshOptions: jest.fn(),
}));

describe('Store Actions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('requestDeleteScheduledRefresh', () => {
    it('commits DELETE_SCHEDULED_REFRESH on successful deletion', async () => {
      const commit = jest.fn();
      const id = 'test-id-12345';
      const response = {
        code: 202,
        data: { id },
      };

      deleteScheduledRefresh.mockResolvedValue(response);

      const result = await actions.requestDeleteScheduledRefresh({ commit }, id);

      expect(deleteScheduledRefresh).toHaveBeenCalledWith(id);
      expect(commit).toHaveBeenCalledWith('DELETE_SCHEDULED_REFRESH', id);
      expect(result).toBe(true);
    });

    it('does not commit on 404 error', async () => {
      const commit = jest.fn();
      const id = 'non-existent';
      const response = {
        code: 404,
        data: {},
      };

      deleteScheduledRefresh.mockResolvedValue(response);

      const result = await actions.requestDeleteScheduledRefresh({ commit }, id);

      expect(commit).not.toHaveBeenCalled();
      expect(result).toBe(false);
    });

    it('does not commit on 500 server error', async () => {
      const commit = jest.fn();
      const id = 'test-id';
      const response = {
        code: 500,
        data: {},
      };

      deleteScheduledRefresh.mockResolvedValue(response);

      const result = await actions.requestDeleteScheduledRefresh({ commit }, id);

      expect(commit).not.toHaveBeenCalled();
      expect(result).toBe(false);
    });
  });

  describe('requestScheduledRefresh', () => {
    it('commits ADD_SCHEDULED_REFRESH on successful schedule', async () => {
      const commit = jest.fn();
      const scheduledRefresh = '2026-04-01T14:00:00Z';
      const timestamp = 1777862400;
      const id = 'new-id-12345';
      const response = {
        code: 201,
        data: {
          id,
          scheduled_refresh_time: timestamp,
        },
      };

      scheduleRequestSiteRefresh.mockResolvedValue(response);

      const result = await actions.requestScheduledRefresh({ commit }, scheduledRefresh);

      expect(scheduleRequestSiteRefresh).toHaveBeenCalledWith(scheduledRefresh);
      expect(commit).toHaveBeenCalledWith('ADD_SCHEDULED_REFRESH', {
        id,
        timestamp,
      });
      expect(result).toBe(true);
    });

    it('does not commit on bad request (400)', async () => {
      const commit = jest.fn();
      const scheduledRefresh = 'invalid-time';
      const response = {
        code: 400,
        data: {},
      };

      scheduleRequestSiteRefresh.mockResolvedValue(response);

      const result = await actions.requestScheduledRefresh({ commit }, scheduledRefresh);

      expect(commit).not.toHaveBeenCalled();
      expect(result).toBe(false);
    });

    it('does not commit on server error (500)', async () => {
      const commit = jest.fn();
      const scheduledRefresh = '2026-04-01T14:00:00Z';
      const response = {
        code: 500,
        data: {},
      };

      scheduleRequestSiteRefresh.mockResolvedValue(response);

      const result = await actions.requestScheduledRefresh({ commit }, scheduledRefresh);

      expect(commit).not.toHaveBeenCalled();
      expect(result).toBe(false);
    });
  });

  describe('requestScheduledRefreshes', () => {
    it('commits SET_SCHEDULED_REFRESHES on successful fetch', async () => {
      const commit = jest.fn();
      const scheduledRefreshes = [
        { id: 'first', timestamp: 1777862400 },
        { id: 'second', timestamp: 1777862460 },
      ];
      const response = {
        code: 200,
        data: {
          scheduled_refreshes: scheduledRefreshes,
        },
      };

      getScheduledRefreshes.mockResolvedValue(response);

      const result = await actions.requestScheduledRefreshes({ commit });

      expect(getScheduledRefreshes).toHaveBeenCalled();
      expect(commit).toHaveBeenCalledWith('SET_SCHEDULED_REFRESHES', scheduledRefreshes);
      expect(result).toBe(true);
    });

    it('does not commit on an unsuccessful fetch', async () => {
      const commit = jest.fn();
      getScheduledRefreshes.mockResolvedValue({
        code: 500,
        data: {},
      });

      const result = await actions.requestScheduledRefreshes({ commit });

      expect(commit).not.toHaveBeenCalled();
      expect(result).toBe(false);
    });
  });
});
