import axios, { AxiosHeaders } from 'axios';
import { error } from './loggingService.js';

const axiosConfig = {
  headers: {},
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
    get: async (url, payload) => handleAxiosRequest(axios.get(url, { AxiosHeaders, params: payload })),
    post: async (url, payload) => handleAxiosRequest(axios.post(url, payload, axiosConfig)),
    put: async (url, payload) => handleAxiosRequest(axios.put(url, payload, axiosConfig)),
  };
};
