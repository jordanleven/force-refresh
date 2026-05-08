import { getCurrentVersion } from './currentVersions.js';

const API_ENDPOINT = 'http://example.com/wp-json/force-refresh/v1/current-version';
const VERSION_FILE_URL = 'http://example.com/wp-content/uploads/force-refresh/version.json';

const makeLocalizedData = (overrides = {}) => ({
  apiEndpoint: API_ENDPOINT,
  postId: null,
  refreshInterval: 60,
  versionFileUrl: null,
  ...overrides,
});

const mockOkFetch = (body) => Promise.resolve({
  json: () => Promise.resolve(body),
  ok: true,
});

const mockFailFetch = (status = 404) => Promise.resolve({
  json: () => Promise.resolve({}),
  ok: false,
  status,
});

describe('getCurrentVersion', () => {
  beforeEach(() => {
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
    delete global.forceRefreshLocalizedData;
    delete global.fetch;
  });

  describe('when versionFileUrl is absent (REST-only path)', () => {
    it('calls the REST endpoint', async () => {
      global.forceRefreshLocalizedData = makeLocalizedData({ versionFileUrl: null });
      global.fetch = jest.fn().mockResolvedValue({
        json: () => Promise.resolve({ data: { currentVersionSite: 'abc' }, message: 'OK' }),
        ok: true,
        status: 200,
      });

      await getCurrentVersion();

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining(API_ENDPOINT),
        expect.anything(),
      );
    });
  });

  describe('when versionFileUrl is present (static file path)', () => {
    it('fetches the static file URL', async () => {
      global.forceRefreshLocalizedData = makeLocalizedData({ versionFileUrl: VERSION_FILE_URL });
      global.fetch = jest.fn().mockResolvedValue(mockOkFetch({ pages: {}, site: 'abc123' }));

      await getCurrentVersion();

      expect(global.fetch).toHaveBeenCalledWith(expect.stringContaining(VERSION_FILE_URL));
    });

    it('appends a cache-bust query parameter', async () => {
      global.forceRefreshLocalizedData = makeLocalizedData({
        refreshInterval: 60,
        versionFileUrl: VERSION_FILE_URL,
      });
      global.fetch = jest.fn().mockResolvedValue(mockOkFetch({ pages: {}, site: 'abc123' }));

      await getCurrentVersion();

      const calledUrl = global.fetch.mock.calls[0][0];
      expect(calledUrl).toMatch(/\?t=\d+/);
    });

    it('returns the site version from the static file', async () => {
      global.forceRefreshLocalizedData = makeLocalizedData({ versionFileUrl: VERSION_FILE_URL });
      global.fetch = jest.fn().mockResolvedValue(mockOkFetch({ pages: {}, site: 'abc123' }));

      const result = await getCurrentVersion();

      expect(result.code).toBe(200);
      expect(result.data.currentVersionSite).toBe('abc123');
    });

    it('includes currentVersionPage when postId is set and page entry exists', async () => {
      global.forceRefreshLocalizedData = makeLocalizedData({
        postId: 42,
        versionFileUrl: VERSION_FILE_URL,
      });
      global.fetch = jest
        .fn()
        .mockResolvedValue(mockOkFetch({ pages: { 42: 'xyz789' }, site: 'abc123' }));

      const result = await getCurrentVersion();

      expect(result.data.currentVersionPage).toBe('xyz789');
    });

    it('returns currentVersionPage as "0" when post ID has no entry', async () => {
      global.forceRefreshLocalizedData = makeLocalizedData({
        postId: 99,
        versionFileUrl: VERSION_FILE_URL,
      });
      global.fetch = jest.fn().mockResolvedValue(mockOkFetch({ pages: {}, site: 'abc123' }));

      const result = await getCurrentVersion();

      expect(result.data.currentVersionPage).toBe('0');
    });

    it('omits currentVersionPage when postId is absent', async () => {
      global.forceRefreshLocalizedData = makeLocalizedData({
        postId: null,
        versionFileUrl: VERSION_FILE_URL,
      });
      global.fetch = jest.fn().mockResolvedValue(mockOkFetch({ pages: {}, site: 'abc123' }));

      const result = await getCurrentVersion();

      expect(result.data).not.toHaveProperty('currentVersionPage');
    });

    it('falls back to REST when the static file returns a non-OK response', async () => {
      global.forceRefreshLocalizedData = makeLocalizedData({ versionFileUrl: VERSION_FILE_URL });
      global.fetch = jest
        .fn()
        .mockResolvedValueOnce(mockFailFetch(404))
        .mockResolvedValue({
          json: () => Promise.resolve({
            data: { currentVersionSite: 'rest-version' },
            message: 'OK',
          }),
          ok: true,
          status: 200,
        });

      await getCurrentVersion();

      expect(global.fetch).toHaveBeenCalledTimes(2);
      expect(global.fetch.mock.calls[1][0]).toContain(API_ENDPOINT);
    });

    it('falls back to REST when the static file fetch throws a network error', async () => {
      global.forceRefreshLocalizedData = makeLocalizedData({ versionFileUrl: VERSION_FILE_URL });
      global.fetch = jest
        .fn()
        .mockRejectedValueOnce(new Error('network error'))
        .mockResolvedValue({
          json: () => Promise.resolve({
            data: { currentVersionSite: 'rest-version' },
            message: 'OK',
          }),
          ok: true,
          status: 200,
        });

      await getCurrentVersion();

      expect(global.fetch).toHaveBeenCalledTimes(2);
      expect(global.fetch.mock.calls[1][0]).toContain(API_ENDPOINT);
    });
  });
});
