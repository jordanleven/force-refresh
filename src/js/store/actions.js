import {
  deleteScheduledRefresh,
  requestPostRefreshByPostID,
  requestSiteRefresh,
  scheduleRequestSiteRefresh,
  updateForceRefreshDebugMode,
  updateForceRefreshOptions,
} from '@/js/services/admin/refreshService.js';

/**
 * Function to check if the returned response code is a success.
 *
 * @var {int} The response.
 *
 * @return {bool} True if the returned response is a success.
 */
const isSuccess = (response) => response?.code && [200, 201, 202].includes(response.code);

export default {
  requestDeleteScheduledRefresh: async ({ commit }, timestamp) => {
    const response = await deleteScheduledRefresh(timestamp);
    const success = isSuccess(response);

    if (success) {
      commit('DELETE_SCHEDULED_REFRESH', response.data.scheduled_refresh_time);
    }

    return success;
  },
  requestRefreshPost: (_, postId) => requestPostRefreshByPostID(postId),
  requestRefreshSite: requestSiteRefresh,
  requestScheduledRefresh: async ({ commit }, scheduledRefresh) => {
    const response = await scheduleRequestSiteRefresh(scheduledRefresh);
    const success = isSuccess(response);

    if (success) {
      commit('ADD_SCHEDULED_REFRESH', response.data.scheduled_refresh_time);
    }

    return success;
  },
  updateForceRefreshDebugMode: async ({ commit }, updatedDebugMode) => {
    const response = await updateForceRefreshDebugMode({
      isDebugActive: updatedDebugMode,
    });

    const success = isSuccess(response);

    if (success) {
      commit('SET_DEBUG_MODE', updatedDebugMode);
    }

    return success;
  },
  updateForceRefreshSettings: async ({ commit }, updatedOptions) => {
    const response = await updateForceRefreshOptions({
      refreshInterval: updatedOptions?.refreshInterval,
      showRefreshInMenuBar: updatedOptions?.showRefreshInMenuBar,
    });

    const success = isSuccess(response);

    if (success) {
      commit('SET_REFRESH_INTERVAL', updatedOptions?.refreshInterval);
      commit('SET_SHOW_REFRESH_IN_MENU_BAR', updatedOptions?.showRefreshInMenuBar);
    }

    return success;
  },
};
