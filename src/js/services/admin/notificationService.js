// `wp` is a globally-available variable
/* eslint-disable no-undef */

export const isDispatchNotificationsSupported = wp.data;

export const dispatchEditorNotification = (message, type = 'success', options = {}) => wp?.data.dispatch('core/notices').createNotice(
  type,
  message,
  {
    // Any actions the user can perform.
    actions: options?.actions,
    isDismissible: options?.isDismissible ?? true,
    type: 'snackbar',
  },
);
