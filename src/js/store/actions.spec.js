import actions from './actions.js';

// Mock the service module
jest.mock('../services/admin/refreshService.js', () => ({
  deleteScheduledRefresh: jest.fn(),
  scheduleRequestSiteRefresh: jest.fn(),
  requestPostRefreshByPostID: jest.fn(),
  requestSiteRefresh: jest.fn(),
  updateForceRefreshDebugMode: jest.fn(),
  updateForceRefreshOptions: jest.fn(),
}));

// Import mocked functions after mocking the module
import {
  deleteScheduledRefresh,
  scheduleRequestSiteRefresh,
} from '../services/admin/refreshService.js';

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
          scheduled_refresh_time: timestamp,
          id,
        },
      };

      scheduleRequestSiteRefresh.mockResolvedValue(response);

      const result = await actions.requestScheduledRefresh({ commit }, scheduledRefresh);

      expect(scheduleRequestSiteRefresh).toHaveBeenCalledWith(scheduledRefresh);
      expect(commit).toHaveBeenCalledWith('ADD_SCHEDULED_REFRESH', {
        timestamp,
        id,
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
});
