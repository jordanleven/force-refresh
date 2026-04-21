const mockApiClient = {
  delete: jest.fn(),
  get: jest.fn(),
  post: jest.fn(),
  put: jest.fn(),
};

jest.mock('../apiService.js', () => ({
  __esModule: true,
  default: jest.fn(() => mockApiClient),
}));

jest.mock('../loggingService.js', () => ({
  debug: jest.fn(),
}));

describe('forceRefreshAdminService', () => {
  let apiService;
  let service;

  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();

    global.forceRefreshMain = {
      localData: {
        adminEndpoints: {
          debugEmail: '/wp-json/force-refresh/v1/debug-email',
          debugging: '/wp-json/force-refresh/v1/debugging',
          options: '/wp-json/force-refresh/v1/options',
          refreshPage: '/wp-json/force-refresh/v1/page-version',
          refreshSite: '/wp-json/force-refresh/v1/site-version',
          scheduleRefreshSite: '/wp-json/force-refresh/v1/schedule-site-version',
        },
        nonce: 'nonce-123',
      },
    };

    // eslint-disable-next-line global-require
    apiService = require('../apiService.js').default;
    // eslint-disable-next-line global-require
    service = require('./forceRefreshAdminService.js');
  });

  describe('initialization', () => {
    it('creates the API client with the localized nonce', () => {
      expect(apiService).toHaveBeenCalledWith({ nonce: 'nonce-123' });
    });
  });

  describe('updateForceRefreshOptions', () => {
    it('sends the mapped options payload to the options endpoint', async () => {
      await service.updateForceRefreshOptions({
        refreshInterval: 120,
        showRefreshInMenuBar: true,
      });

      expect(mockApiClient.put).toHaveBeenCalledWith(
        '/wp-json/force-refresh/v1/options',
        {
          refresh_interval: 120,
          show_refresh_in_admin_bar: true,
        },
      );
    });
  });

  describe('updateForceRefreshDebugMode', () => {
    it('sends the debug mode payload to the debugging endpoint', async () => {
      await service.updateForceRefreshDebugMode({ isDebugActive: true });

      expect(mockApiClient.put).toHaveBeenCalledWith(
        '/wp-json/force-refresh/v1/debugging',
        { debug: true },
      );
    });
  });

  describe('deleteScheduledRefresh', () => {
    it('calls delete with the scheduled refresh endpoint plus ID', async () => {
      await service.deleteScheduledRefresh('abc-123');

      expect(mockApiClient.delete).toHaveBeenCalledWith(
        '/wp-json/force-refresh/v1/schedule-site-version/abc-123',
      );
    });
  });

  describe('getScheduledRefreshes', () => {
    it('fetches scheduled refreshes from the schedule endpoint', async () => {
      await service.getScheduledRefreshes();

      expect(mockApiClient.get).toHaveBeenCalledWith(
        '/wp-json/force-refresh/v1/schedule-site-version',
      );
    });
  });

  describe('requestSiteRefresh', () => {
    it('posts to the site refresh endpoint', async () => {
      await service.requestSiteRefresh();

      expect(mockApiClient.post).toHaveBeenCalledWith(
        '/wp-json/force-refresh/v1/site-version',
      );
    });
  });

  describe('scheduleRequestSiteRefresh', () => {
    it('posts the schedule timestamp to the schedule endpoint', async () => {
      await service.scheduleRequestSiteRefresh('2026-04-01T14:00:00Z');

      expect(mockApiClient.post).toHaveBeenCalledWith(
        '/wp-json/force-refresh/v1/schedule-site-version',
        { schedule_refresh_timestamp: '2026-04-01T14:00:00Z' },
      );
    });
  });

  describe('requestPostRefreshByPostID', () => {
    it('posts the post ID to the page refresh endpoint', async () => {
      await service.requestPostRefreshByPostID(42);

      expect(mockApiClient.post).toHaveBeenCalledWith(
        '/wp-json/force-refresh/v1/page-version',
        { postId: 42 },
      );
    });
  });

  describe('getDebugEmailData', () => {
    it('fetches the debug email preview data from the debug endpoint', async () => {
      await service.getDebugEmailData();

      expect(mockApiClient.get).toHaveBeenCalledWith(
        '/wp-json/force-refresh/v1/debug-email',
      );
    });
  });

  describe('sendDebugEmail', () => {
    it('posts the support topic URL to the debug email endpoint', async () => {
      await service.sendDebugEmail({
        supportTopicUrl: 'https://wordpress.org/support/topic/test-topic/',
      });

      expect(mockApiClient.post).toHaveBeenCalledWith(
        '/wp-json/force-refresh/v1/debug-email',
        { supportTopicUrl: 'https://wordpress.org/support/topic/test-topic/' },
      );
    });
  });
});
