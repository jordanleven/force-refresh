import ApiService from '../apiService';
import { debug } from '../loggingService';

const ACTION_FORCE_REFRESH_UPDATE_OPTIONS = 'force_refresh_update_site_options';
const ACTION_FORCE_REFRESH_UPDATE_SITE_VERSION = 'force_refresh_update_site_version';
const ACTION_FORCE_REFRESH_UPDATE_PAGE_VERSION = 'force_refresh_update_page_version';

export const updateForceRefreshOptions = async (data) => {
  debug('Requesting admin options update');
  const payload = {
    action: ACTION_FORCE_REFRESH_UPDATE_OPTIONS,
    nonce: data.nonce,
    show_refresh_in_admin_bar: data?.showRefreshInMenuBar,
    refresh_interval: data?.refreshInterval,
  };

  // ajaxurl is a global WordPress variable
  // eslint-disable-next-line no-undef
  const response = await ApiService.post(ajaxurl, payload);
  return Promise.resolve(response);
};

export const requestSiteRefresh = async (data) => {
  debug('Requesting refresh for site');
  const payload = {
    action: ACTION_FORCE_REFRESH_UPDATE_SITE_VERSION,
    nonce: data.nonce,
  };

  // ajaxurl is a global WordPress variable
  // eslint-disable-next-line no-undef
  const response = await ApiService.post(ajaxurl, payload);
  return Promise.resolve(response);
};

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
