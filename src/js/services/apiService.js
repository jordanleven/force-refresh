import { error } from './loggingService.js';

const headers = {};

const buildUrl = (url, params) => (params ? `${url}?${new URLSearchParams(params)}` : url);

const handleFetchRequest = async (url, options = {}) => {
  try {
    const response = await fetch(url, {
      ...options,
      headers: { ...headers, ...options.headers },
    });
    const { data, message } = await response.json();
    return { code: response.status, data, message };
  } catch (e) {
    error(e);
    return undefined;
  }
};

const buildJsonRequest = (method) => (url, payload) => handleFetchRequest(url, {
  body: JSON.stringify(payload),
  headers: { 'Content-Type': 'application/json' },
  method,
});

export default (args) => {
  if (args?.nonce) {
    headers['X-WP-Nonce'] = args.nonce;
  }

  return {
    delete: (url, payload) => handleFetchRequest(buildUrl(url, payload), { method: 'DELETE' }),
    get: (url, payload) => handleFetchRequest(buildUrl(url, payload)),
    post: buildJsonRequest('POST'),
    put: buildJsonRequest('PUT'),
  };
};
