/* eslint-disable no-param-reassign */
export default {
  SET_DEBUG_MODE: (state, updatedDebugMode) => {
    state.settings.isDebugActive = updatedDebugMode;
  },
  SET_REFRESH_INTERVAL: (state, updatedRefreshInterval) => {
    state.settings.refreshInterval = updatedRefreshInterval;
  },
  SET_SHOW_REFRESH_IN_MENU_BAR: (state, updatedShowRefreshInMenuBar) => {
    state.settings.refreshFromAdminBar = updatedShowRefreshInMenuBar;
  },
};
