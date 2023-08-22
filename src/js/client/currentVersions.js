import apiService from '@/js/services/apiService.js';
import { debug } from '@/js/services/loggingService.js';

const apiClient = apiService();

export const getCurrentVersion = async () => {
  // eslint-disable-next-line no-undef
  const { apiEndpoint, postId } = forceRefreshLocalizedData;

  debug(`Requesting refresh data for site and post ${postId}.`);
  const payload = {
    postId,
  };

  return apiClient.get(apiEndpoint, payload);
};
