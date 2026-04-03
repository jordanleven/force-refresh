/* eslint-disable no-param-reassign */
export default {
  ADD_SCHEDULED_REFRESH: (state, refreshData) => {
    state.site.scheduledRefreshes.push(refreshData);
  },
  DELETE_SCHEDULED_REFRESH: (state, idToDelete) => {
    const { scheduledRefreshes } = state.site;
    state.site.scheduledRefreshes = scheduledRefreshes.filter(({ id }) => id !== idToDelete);
  },
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
