import ApiService from '@/js/services/apiService';
import { debug } from '@/js/services/loggingService';

export const getCurrentVersion = async () => {
  // eslint-disable-next-line no-undef
  const { apiUrl, nonce, postId } = forceRefreshLocalizedData;

  debug(`Requesting refresh for site and post ${postId}.`);
  const payload = {
    action: 'force_refresh_get_version',
    nonce,
    postId,
  };

  return ApiService.get(apiUrl, payload);
};
