import apiService from '@/js/services/apiService.js';
import { debug } from '@/js/services/loggingService.js';

const apiClient = apiService();

const getCurrentVersionPayload = (postId) => {
  if (!postId) {
    return {};
  }

  return { postId };
};

export const getCurrentVersion = async () => {
  // eslint-disable-next-line no-undef
  const { apiEndpoint, postId } = forceRefreshLocalizedData;

  const message = postId ? ` and post ${postId}` : '';

  debug(`Requesting refresh data for site${message}.`);

  const payload = getCurrentVersionPayload(postId);
  return apiClient.get(apiEndpoint, payload);
};
