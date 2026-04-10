import apiService from './apiService.js';

const BASE_URL = 'https://example.com/api';

const mockFetchResponse = (status, body) => ({
  json: () => Promise.resolve(body),
  status,
});

describe('apiService', () => {
  let api;

  beforeEach(() => {
    global.fetch = jest.fn();
    jest.spyOn(console, 'error').mockImplementation(() => {});
    api = apiService();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('get', () => {
    it('fetches the URL without a query string when no params are given', async () => {
      global.fetch.mockResolvedValue(mockFetchResponse(200, { data: {} }));
      await api.get(BASE_URL);
      expect(global.fetch).toHaveBeenCalledWith(BASE_URL, expect.anything());
    });

    it('appends params as a query string', async () => {
      global.fetch.mockResolvedValue(mockFetchResponse(200, { data: {} }));
      await api.get(BASE_URL, { postId: 42 });
      expect(global.fetch).toHaveBeenCalledWith(`${BASE_URL}?postId=42`, expect.anything());
    });

    it('returns { code, data } shaped from the HTTP status and response body', async () => {
      const data = { currentVersionSite: '1.0' };
      global.fetch.mockResolvedValue(mockFetchResponse(200, { data }));
      const result = await api.get(BASE_URL);
      expect(result).toEqual({ code: 200, data });
    });

    it('returns the HTTP status code as code for non-2xx responses', async () => {
      global.fetch.mockResolvedValue(mockFetchResponse(404, { data: {} }));
      const result = await api.get(BASE_URL);
      expect(result.code).toBe(404);
    });

    it('returns undefined on network failure', async () => {
      global.fetch.mockRejectedValue(new Error('Network error'));
      const result = await api.get(BASE_URL);
      expect(result).toBeUndefined();
    });
  });

  describe('post', () => {
    it('sends a POST request with a JSON-serialized body', async () => {
      const payload = { schedule_refresh_timestamp: '2026-04-09T12:00:00Z' };
      global.fetch.mockResolvedValue(mockFetchResponse(201, { data: { id: 'abc' } }));
      await api.post(BASE_URL, payload);
      expect(global.fetch).toHaveBeenCalledWith(BASE_URL, expect.objectContaining({
        body: JSON.stringify(payload),
        method: 'POST',
      }));
    });

    it('includes a Content-Type: application/json header', async () => {
      global.fetch.mockResolvedValue(mockFetchResponse(201, { data: {} }));
      await api.post(BASE_URL, {});
      const [, options] = global.fetch.mock.calls[0];
      expect(options.headers['Content-Type']).toBe('application/json');
    });

    it('returns { code, data } from the response', async () => {
      const data = { id: 'abc' };
      global.fetch.mockResolvedValue(mockFetchResponse(201, { data }));
      const result = await api.post(BASE_URL, {});
      expect(result).toEqual({ code: 201, data });
    });
  });

  describe('put', () => {
    it('sends a PUT request with a JSON-serialized body', async () => {
      const payload = { refresh_interval: 30 };
      global.fetch.mockResolvedValue(mockFetchResponse(200, { data: {} }));
      await api.put(BASE_URL, payload);
      expect(global.fetch).toHaveBeenCalledWith(BASE_URL, expect.objectContaining({
        body: JSON.stringify(payload),
        method: 'PUT',
      }));
    });

    it('returns { code, data } from the response', async () => {
      const data = { refresh_interval: 30 };
      global.fetch.mockResolvedValue(mockFetchResponse(200, { data }));
      const result = await api.put(BASE_URL, {});
      expect(result).toEqual({ code: 200, data });
    });
  });

  describe('delete', () => {
    it('sends a DELETE request', async () => {
      global.fetch.mockResolvedValue(mockFetchResponse(202, { data: { id: 'abc' } }));
      await api.delete(`${BASE_URL}/abc`);
      expect(global.fetch).toHaveBeenCalledWith(`${BASE_URL}/abc`, expect.objectContaining({
        method: 'DELETE',
      }));
    });

    it('appends params as a query string', async () => {
      global.fetch.mockResolvedValue(mockFetchResponse(202, { data: {} }));
      await api.delete(BASE_URL, { id: 'abc' });
      expect(global.fetch).toHaveBeenCalledWith(`${BASE_URL}?id=abc`, expect.anything());
    });

    it('returns { code, data } from the response', async () => {
      const data = { id: 'abc' };
      global.fetch.mockResolvedValue(mockFetchResponse(202, { data }));
      const result = await api.delete(`${BASE_URL}/abc`);
      expect(result).toEqual({ code: 202, data });
    });
  });

  describe('nonce', () => {
    beforeEach(() => {
      jest.resetModules();
    });

    it('includes X-WP-Nonce when initialized with a nonce', async () => {
      // eslint-disable-next-line global-require
      const freshApiService = require('./apiService.js').default;
      const apiWithNonce = freshApiService({ nonce: 'abc123' });
      global.fetch.mockResolvedValue(mockFetchResponse(200, { data: {} }));
      await apiWithNonce.get(BASE_URL);
      const [, options] = global.fetch.mock.calls[0];
      expect(options.headers['X-WP-Nonce']).toBe('abc123');
    });

    it('does not include X-WP-Nonce when initialized without a nonce', async () => {
      // eslint-disable-next-line global-require
      const freshApiService = require('./apiService.js').default;
      const freshApi = freshApiService();
      global.fetch.mockResolvedValue(mockFetchResponse(200, { data: {} }));
      await freshApi.get(BASE_URL);
      const [, options] = global.fetch.mock.calls[0];
      expect(options.headers['X-WP-Nonce']).toBeUndefined();
    });
  });
});
