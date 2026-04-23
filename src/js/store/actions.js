import {
  deleteScheduledRefresh,
  getCronStatus,
  getScheduledRefreshes,
  getWebSocketHealth,
  requestPostRefreshByPostID,
  requestSiteRefresh,
  scheduleRequestSiteRefresh,
  updateForceRefreshDebugMode,
  updateForceRefreshOptions,
} from '@/js/services/admin/forceRefreshAdminService.js';

/**
 * Function to check if the returned response code is a success.
 *
 * @var {int} The response.
 *
 * @return {bool} True if the returned response is a success.
 */
const isSuccess = (response) => response?.code && [200, 201, 202].includes(response.code);

export default {
  requestCronStatus: async ({ commit }) => {
    const response = await getCronStatus();
    if (isSuccess(response)) {
      commit('SET_LAST_CRON_RUN', response.data.last_cron_run ?? null);
    }
  },
  requestWebSocketHealth: async ({ commit }) => {
    const response = await getWebSocketHealth();
    if (isSuccess(response)) {
      commit('SET_WEBSOCKET_HEALTH', response.data.websocket_supported ?? false);
    }
  },
  requestDeleteScheduledRefresh: async ({ commit }, id) => {
    const response = await deleteScheduledRefresh(id);
    const success = isSuccess(response);

    if (success) {
      commit('DELETE_SCHEDULED_REFRESH', response.data.id);
    }

    return success;
  },
  requestRefreshPost: (_, postId) => requestPostRefreshByPostID(postId),
  requestRefreshSite: requestSiteRefresh,
  requestScheduledRefresh: async ({ commit }, scheduledRefresh) => {
    const response = await scheduleRequestSiteRefresh(scheduledRefresh);
    const success = isSuccess(response);

    if (success) {
      commit('ADD_SCHEDULED_REFRESH', {
        id: response.data.id,
        timestamp: response.data.scheduled_refresh_time,
      });
    }

    return success;
  },
  requestScheduledRefreshes: async ({ commit }) => {
    const response = await getScheduledRefreshes();
    const success = isSuccess(response);

    if (success) {
      commit('SET_SCHEDULED_REFRESHES', response.data.scheduled_refreshes ?? []);
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
