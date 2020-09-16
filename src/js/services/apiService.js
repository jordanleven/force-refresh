import axios from 'axios';
import qs from 'querystring';
import { error } from './loggingService';

const axiosConfig = {
  headers: {
    'Content-Type': 'application/x-www-form-urlencoded',
  },
};

export default ({
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
});
