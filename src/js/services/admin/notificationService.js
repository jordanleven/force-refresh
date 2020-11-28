// `wp` is a globally-available variable
/* eslint-disable no-undef */

export const isDispatchNotificationsSupported = wp.data;

export const dispatchEditorNotification = (message, type = 'success', options = {}) => wp?.data.dispatch('core/notices').createNotice(
  type,
  message,
  {
    type: 'snackbar',
    isDismissible: options?.isDismissible ?? true,
    // Any actions the user can perform.
    actions: options?.actions,
  },
);
