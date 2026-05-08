import apiService from '@/js/services/apiService.js';
import { debug } from '@/js/services/loggingService.js';

const apiClient = apiService();

const getCurrentVersionPayload = (postId) => {
  if (!postId) {
    return {};
  }

  return { postId };
};

const getCacheBustParam = (refreshInterval) => Math.floor(Date.now() / (refreshInterval * 1000));

const toVersionShape = (site, pages, postId) => ({
  currentVersionSite: site ?? '0',
  ...(postId && { currentVersionPage: pages?.[postId] ?? '0' }),
});

const fetchStaticVersion = async (versionFileUrl, refreshInterval, postId) => {
  const url = `${versionFileUrl}?t=${getCacheBustParam(refreshInterval)}`;
  const response = await fetch(url);

  if (!response.ok) return null;

  const { site, pages } = await response.json();
  return { code: 200, data: toVersionShape(site, pages, postId) };
};

const fetchRestVersion = (apiEndpoint, postId) => {
  const message = postId ? ` and post ${postId}` : '';
  debug(`Requesting refresh data for site${message}.`);
  return apiClient.get(apiEndpoint, getCurrentVersionPayload(postId));
};

export const getCurrentVersion = async () => {
  const {
    apiEndpoint,
    postId,
    refreshInterval,
    versionFileUrl,
  // eslint-disable-next-line no-undef
  } = forceRefreshLocalizedData;

  if (!versionFileUrl) return fetchRestVersion(apiEndpoint, postId);

  const staticResult = await fetchStaticVersion(versionFileUrl, refreshInterval, postId).catch(
    () => null,
  );
  return staticResult ?? fetchRestVersion(apiEndpoint, postId);
};
