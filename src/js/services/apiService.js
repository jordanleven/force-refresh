import axios from 'axios';
import qs from 'qs';
import { error } from './loggingService.js';

const axiosConfig = {
  headers: {
    'Content-Type': 'application/x-www-form-urlencoded',
  },
};

export default ({
  get: async (url, params) => axios.get(
    url,
    {
      params,
    },
  )
    .then(({ data }) => data)
    .catch((errorResponse) => {
      error(errorResponse);
      throw errorResponse;
    }),
  post: async (url, payload) => axios.post(
    url,
    qs.stringify(payload),
    axiosConfig,
  )
    .then(({ data }) => data)
    .catch((errorResponse) => {
      error(errorResponse);
      throw errorResponse;
    }),
});
