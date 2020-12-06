import { requestSiteRefresh, updateForceRefreshOptions, updateForceRefreshDebugMode } from '@/js/services/admin/refreshService';

export default {
  requestRefreshSite: ({ getters }) => {
    const { wordPressNonce } = getters;
    return requestSiteRefresh({ nonce: wordPressNonce });
  },
  updateForceRefreshDebugMode: async ({ commit, getters }, updatedDebugMode) => {
    const { wordPressNonce } = getters;

    const { success } = await updateForceRefreshDebugMode({
      isDebugActive: updatedDebugMode,
      nonce: wordPressNonce,
    });

    if (success) {
      commit('SET_DEBUG_MODE', updatedDebugMode);
    }

    return success;
  },
  updateForceRefreshSettings: async ({ commit, getters }, updatedOptions) => {
    const { wordPressNonce } = getters;

    const { success } = await updateForceRefreshOptions({
      nonce: wordPressNonce,
      refreshInterval: updatedOptions?.refreshInterval,
      showRefreshInMenuBar: updatedOptions?.showRefreshInMenuBar,
    });

    if (success) {
      commit('SET_REFRESH_INTERVAL', updatedOptions?.refreshInterval);
      commit('SET_SHOW_REFRESH_IN_MENU_BAR', updatedOptions?.showRefreshInMenuBar);
    }

    return success;
  },
};
