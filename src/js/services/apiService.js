import axios from 'axios';
import { error } from './loggingService.js';

const axiosConfig = {
  headers: {
    'Cache-Control': 'no-cache',
  },
};

const handleAxiosRequest = async (method) => {
  try {
    const { data } = await method;
    return data;
  } catch (e) {
    error(e);
    return e?.response?.data;
  }
};

export default (args) => {
  // If we have a set nonce, then set it.
  if (args?.nonce) {
    axiosConfig.headers['X-WP-Nonce'] = args.nonce;
  }

  return {
    delete: async (url, payload) => handleAxiosRequest(axios.delete(url, { ...axiosConfig, params: payload })),
    get: async (url, payload) => handleAxiosRequest(axios.get(url, { ...axiosConfig, params: payload })),
    post: async (url, payload) => handleAxiosRequest(axios.post(url, payload, axiosConfig)),
    put: async (url, payload) => handleAxiosRequest(axios.put(url, payload, axiosConfig)),
  };
};
