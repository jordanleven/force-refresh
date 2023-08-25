import apiService from '../apiService.js';
import { debug } from '../loggingService.js';

// The localized data is globally declared.
// eslint-disable-next-line no-undef
const { adminEndpoints, nonce } = forceRefreshMain.localData;

const apiClient = apiService({ nonce });

export const updateForceRefreshOptions = async (data) => {
  const payload = {
    refresh_interval: data?.refreshInterval,
    show_refresh_in_admin_bar: data?.showRefreshInMenuBar,
  };

  debug('Requesting admin options update');

  return apiClient.put(adminEndpoints.options, payload);
};

export const updateForceRefreshDebugMode = async (data) => {
  debug('Requesting admin debug mode update');
  return apiClient.put(adminEndpoints.debugging, { debug: data.isDebugActive });
};

export const requestSiteRefresh = async () => {
  debug('Requesting refresh for site');
  return apiClient.post(adminEndpoints.refreshSite);
};

export const scheduleRequestSiteRefresh = async (date) => {
  debug(`Requesting scheduled refresh for site for ${date}`);
  return apiClient.post(adminEndpoints.scheduleRefreshSite, { schedule_refresh_timestamp: date });
};

export const requestPostRefreshByPostID = async (postId) => {
  debug(`Requesting refresh for post ${postId}`);
  return apiClient.post(adminEndpoints.refreshPage, { postId });
};
