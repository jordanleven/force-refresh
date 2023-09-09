/* eslint-disable no-param-reassign */
export default {
  ADD_SCHEDULED_REFRESH: (state, timestamp) => {
    state.site.scheduledRefreshes.push({ timestamp });
  },
  DELETE_SCHEDULED_REFRESH: (state, timestampToDelete) => {
    const { scheduledRefreshes } = state.site;
    state.site.scheduledRefreshes = scheduledRefreshes.filter(({ timestamp }) => {
      console.log(timestamp);
      console.log(timestampToDelete);
      return timestamp !== timestampToDelete;
    });
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
