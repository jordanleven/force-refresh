import ApiService from '@/js/services/apiService';
import { debug } from '@/js/services/loggingService';

export const getCurrentVersion = async () => {
  // eslint-disable-next-line no-undef
  const { apiUrl, postId } = forceRefreshLocalizedData;

  debug(`Requesting refresh for site and post ${postId}`);
  const payload = {
    action: 'force_refresh_get_version',
    postId,
  };

  return ApiService.get(apiUrl, payload);
};
