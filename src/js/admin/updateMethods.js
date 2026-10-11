export const UPDATE_METHOD_REST = 'rest';
export const UPDATE_METHOD_STATIC_FILE = 'static_file';
export const UPDATE_METHOD_WEBSOCKETS = 'websockets';

export const UPDATE_METHODS = [
  UPDATE_METHOD_STATIC_FILE,
  UPDATE_METHOD_REST,
  UPDATE_METHOD_WEBSOCKETS,
];

export const FEATURE_FLAG_WEBSOCKETS = 'websockets';

const UPDATE_METHOD_LABEL_KEYS = {
  [UPDATE_METHOD_REST]: 'ADMIN_SETTINGS.OPTION_UPDATE_METHOD_WORDPRESS_API',
  [UPDATE_METHOD_STATIC_FILE]: 'ADMIN_SETTINGS.OPTION_UPDATE_METHOD_STATIC_FILE',
  [UPDATE_METHOD_WEBSOCKETS]: 'ADMIN_SETTINGS.OPTION_UPDATE_METHOD_WEBSOCKETS',
};

/**
 * Get the translation key for an update method's name.
 *
 * @param {string} updateMethod One of the update methods.
 *
 * @return {string} The translation key, falling back to the WordPress API's.
 */
export const getUpdateMethodLabelKey = (updateMethod) => (
  UPDATE_METHOD_LABEL_KEYS[updateMethod] ?? UPDATE_METHOD_LABEL_KEYS[UPDATE_METHOD_REST]
);
