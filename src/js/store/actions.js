import {
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
const isSuccess = (response) => response?.code && [200, 201].includes(response.code);

export default {
  requestRefreshPost: (_, postId) => requestPostRefreshByPostID(postId),
  requestRefreshSite: requestSiteRefresh,
  requestScheduledRefresh: (_, scheduledRefresh) => scheduleRequestSiteRefresh(scheduledRefresh),
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
