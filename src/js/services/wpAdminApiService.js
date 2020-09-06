import axios from 'axios';
import qs from 'querystring';
import { error } from './loggingService';

// ajaxurl is a global WordPress variable
// eslint-disable-next-line no-undef
const WORDPRESS_AJAX_URL = ajaxurl;

const axiosConfig = {
  headers: {
    'Content-Type': 'application/x-www-form-urlencoded',
  },
};

export default ({
  post: async (payloadData) => axios.post(
    WORDPRESS_AJAX_URL,
    qs.stringify(payloadData),
    axiosConfig,
  )
    .then(({ data }) => data)
    .catch((errorResponse) => {
      error(errorResponse);
      throw errorResponse;
    }),
});
