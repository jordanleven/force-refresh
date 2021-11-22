import ApiService from '@/js/services/apiService.js';
import { debug } from '@/js/services/loggingService.js';

export const getCurrentVersion = async () => {
  // eslint-disable-next-line no-undef
  const { apiUrl, postId } = forceRefreshLocalizedData;

  debug(`Requesting refresh for site and post ${postId}.`);
  const payload = {
    action: 'force_refresh_get_version',
    postId,
  };

  return ApiService.get(apiUrl, payload);
};
