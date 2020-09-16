import ApiService from '../apiService';
import { debug } from '../loggingService';

const ACTION_FORCE_REFRESH_UPDATE_PAGE_VERSION = 'force_refresh_update_page_version';

export const requestPostRefreshByPostID = async (postId, data) => {
  debug(`Requesting refresh for post ${postId}`);
  const payload = {
    action: ACTION_FORCE_REFRESH_UPDATE_PAGE_VERSION,
    post_id: postId,
    nonce: data.nonce,
  };

  // ajaxurl is a global WordPress variable
  // eslint-disable-next-line no-undef
  const response = await ApiService.post(ajaxurl, payload);
  return Promise.resolve(response);
};
