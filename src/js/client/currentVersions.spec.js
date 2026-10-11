import { FAILURE_KINDS, checkFailed } from './checkResult.js';
import { getCurrentVersion, getRetryAfterMs } from './currentVersions.js';

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

const mockFailFetch = (status = 404, headers = {}) => Promise.resolve({
  headers: new Headers(headers),
  json: () => Promise.resolve({}),
  ok: false,
  status,
});

const mockRestFetch = (data) => Promise.resolve({
  json: () => Promise.resolve({ data, message: 'OK' }),
  ok: true,
  status: 200,
});

describe('getRetryAfterMs', () => {
  const getRetryAfter = (value) => getRetryAfterMs({ headers: new Headers({ 'Retry-After': value }) });

  beforeEach(() => {
    jest.useFakeTimers({ now: new Date('2026-10-10T12:00:00Z') });
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('is null when the header is absent', () => {
    expect(getRetryAfterMs({ headers: new Headers() })).toBeNull();
  });

  it('reads a number of seconds', () => {
    expect(getRetryAfter('120')).toBe(120000);
  });

  it('reads a date', () => {
    expect(getRetryAfter('Sat, 10 Oct 2026 12:05:00 GMT')).toBe(300000);
  });

  it('is zero for a date in the past', () => {
    expect(getRetryAfter('Sat, 10 Oct 2026 11:00:00 GMT')).toBe(0);
  });

  it('is null when the header cannot be read', () => {
    expect(getRetryAfter('soon')).toBeNull();
  });
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

      expect(global.fetch.mock.calls[0][0]).toBe(API_ENDPOINT);
    });

    it('requests the versions for the current post', async () => {
      global.forceRefreshLocalizedData = makeLocalizedData({ postId: 42 });
      global.fetch = jest.fn().mockReturnValue(mockRestFetch({ currentVersionSite: 'abc' }));

      await getCurrentVersion();

      expect(global.fetch.mock.calls[0][0]).toBe(`${API_ENDPOINT}?postId=42`);
    });

    it('returns the versions from the REST endpoint', async () => {
      global.forceRefreshLocalizedData = makeLocalizedData();
      global.fetch = jest.fn().mockReturnValue(mockRestFetch({ currentVersionSite: 'abc' }));

      expect(await getCurrentVersion()).toEqual({
        succeeded: true,
        versions: { currentVersionSite: 'abc' },
      });
    });

    it('passes the abort signal to the request', async () => {
      const { signal } = new AbortController();
      global.forceRefreshLocalizedData = makeLocalizedData();
      global.fetch = jest.fn().mockReturnValue(mockRestFetch({ currentVersionSite: 'abc' }));

      await getCurrentVersion({ signal });

      expect(global.fetch.mock.calls[0][1].signal).toBe(signal);
    });

    it('reports a network failure when the request never reaches the server', async () => {
      global.forceRefreshLocalizedData = makeLocalizedData();
      global.fetch = jest.fn().mockRejectedValue(new TypeError('Failed to fetch'));

      expect(await getCurrentVersion()).toEqual(checkFailed(FAILURE_KINDS.NETWORK));
    });

    it.each([429, 500, 503])('reports a server failure for an HTTP %i response', async (status) => {
      global.forceRefreshLocalizedData = makeLocalizedData();
      global.fetch = jest.fn().mockReturnValue(mockFailFetch(status));

      expect(await getCurrentVersion()).toEqual(checkFailed(FAILURE_KINDS.SERVER));
    });

    it('reports how long the server asked to be left alone', async () => {
      global.forceRefreshLocalizedData = makeLocalizedData();
      global.fetch = jest.fn().mockReturnValue(mockFailFetch(503, { 'Retry-After': '90' }));

      expect(await getCurrentVersion()).toEqual(checkFailed(FAILURE_KINDS.SERVER, 90000));
    });

    it('reports a server failure when the response is not JSON', async () => {
      global.forceRefreshLocalizedData = makeLocalizedData();
      global.fetch = jest.fn().mockResolvedValue({
        json: () => Promise.reject(new SyntaxError('Unexpected token <')),
        ok: true,
        status: 200,
      });

      expect(await getCurrentVersion()).toEqual(checkFailed(FAILURE_KINDS.SERVER));
    });

    it('reports a server failure when the response has no data', async () => {
      global.forceRefreshLocalizedData = makeLocalizedData();
      global.fetch = jest.fn().mockReturnValue(mockRestFetch(undefined));

      expect(await getCurrentVersion()).toEqual(checkFailed(FAILURE_KINDS.SERVER));
    });

    it('does not log an error of its own for a failed request', async () => {
      global.forceRefreshLocalizedData = makeLocalizedData();
      global.fetch = jest.fn().mockRejectedValue(new TypeError('Failed to fetch'));

      await getCurrentVersion();

      expect(console.error).not.toHaveBeenCalled();
    });
  });

  describe('when versionFileUrl is present (static file path)', () => {
    it('fetches the static file URL', async () => {
      global.forceRefreshLocalizedData = makeLocalizedData({ versionFileUrl: VERSION_FILE_URL });
      global.fetch = jest.fn().mockResolvedValue(mockOkFetch({ pages: {}, site: 'abc123' }));

      await getCurrentVersion();

      expect(global.fetch.mock.calls[0][0]).toContain(VERSION_FILE_URL);
    });

    it('passes the abort signal to the static file request and the REST fallback', async () => {
      const { signal } = new AbortController();
      global.forceRefreshLocalizedData = makeLocalizedData({ versionFileUrl: VERSION_FILE_URL });
      global.fetch = jest
        .fn()
        .mockReturnValueOnce(mockFailFetch(404))
        .mockReturnValue(mockRestFetch({ currentVersionSite: 'abc' }));

      await getCurrentVersion({ signal });

      expect(global.fetch.mock.calls.map(([, options]) => options.signal)).toEqual([signal, signal]);
    });

    it('lets the browser cache answer a routine poll', async () => {
      global.forceRefreshLocalizedData = makeLocalizedData({ versionFileUrl: VERSION_FILE_URL });
      global.fetch = jest.fn().mockResolvedValue(mockOkFetch({ pages: {}, site: 'abc123' }));

      await getCurrentVersion();

      expect(global.fetch.mock.calls[0][1]).not.toHaveProperty('cache');
    });

    it('does not let the browser cache answer when asked to bypass it', async () => {
      global.forceRefreshLocalizedData = makeLocalizedData({ versionFileUrl: VERSION_FILE_URL });
      global.fetch = jest.fn().mockResolvedValue(mockOkFetch({ pages: {}, site: 'abc123' }));

      await getCurrentVersion({ bypassCache: true });

      expect(global.fetch.mock.calls[0][1].cache).toBe('no-cache');
    });

    it('keeps the interval cache-bust parameter when bypassing the browser cache', async () => {
      global.forceRefreshLocalizedData = makeLocalizedData({ versionFileUrl: VERSION_FILE_URL });
      global.fetch = jest.fn().mockResolvedValue(mockOkFetch({ pages: {}, site: 'abc123' }));

      await getCurrentVersion();
      await getCurrentVersion({ bypassCache: true });

      expect(global.fetch.mock.calls[1][0]).toBe(global.fetch.mock.calls[0][0]);
    });

    it('bypasses the browser cache for the REST fallback too', async () => {
      global.forceRefreshLocalizedData = makeLocalizedData({ versionFileUrl: VERSION_FILE_URL });
      global.fetch = jest
        .fn()
        .mockReturnValueOnce(mockFailFetch(404))
        .mockReturnValue(mockRestFetch({ currentVersionSite: 'abc' }));

      await getCurrentVersion({ bypassCache: true });

      expect(global.fetch.mock.calls[1][1].cache).toBe('no-cache');
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

      expect(result.succeeded).toBe(true);
      expect(result.versions.currentVersionSite).toBe('abc123');
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

      expect(result.versions.currentVersionPage).toBe('xyz789');
    });

    it('returns currentVersionPage as "0" when post ID has no entry', async () => {
      global.forceRefreshLocalizedData = makeLocalizedData({
        postId: 99,
        versionFileUrl: VERSION_FILE_URL,
      });
      global.fetch = jest.fn().mockResolvedValue(mockOkFetch({ pages: {}, site: 'abc123' }));

      const result = await getCurrentVersion();

      expect(result.versions.currentVersionPage).toBe('0');
    });

    it('omits currentVersionPage when postId is absent', async () => {
      global.forceRefreshLocalizedData = makeLocalizedData({
        postId: null,
        versionFileUrl: VERSION_FILE_URL,
      });
      global.fetch = jest.fn().mockResolvedValue(mockOkFetch({ pages: {}, site: 'abc123' }));

      const result = await getCurrentVersion();

      expect(result.versions).not.toHaveProperty('currentVersionPage');
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

    it('reports the failure of the REST fallback when both sources fail', async () => {
      global.forceRefreshLocalizedData = makeLocalizedData({ versionFileUrl: VERSION_FILE_URL });
      global.fetch = jest
        .fn()
        .mockReturnValueOnce(mockFailFetch(404))
        .mockReturnValue(mockFailFetch(503, { 'Retry-After': '90' }));

      expect(await getCurrentVersion()).toEqual(checkFailed(FAILURE_KINDS.SERVER, 90000));
    });
  });
});
