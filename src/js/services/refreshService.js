import wpAdminApiService from './wpAdminApiService';
import { debug } from './loggingService';

const ACTION_FORCE_REFRESH_UPDATE_PAGE_VERSION = 'force_refresh_update_page_version';

export const requestPostRefreshByPostID = async (postId, data) => {
  debug(`Requesting refresh for post ${postId}`);
  const payload = {
    action: ACTION_FORCE_REFRESH_UPDATE_PAGE_VERSION,
    page_id: postId,
    nonce: data.nonce,
  };

  const response = await wpAdminApiService.post(payload);
  return Promise.resolve(response);
};
