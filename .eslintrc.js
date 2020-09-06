module.exports = {
  root: true,
  env: {
    browser: true,
    node: true,
    jest: true,
  },
  ignorePatterns: [
  ],
  rules: {
    'import/prefer-default-export': 'off',
  },
  extends: [
    'eslint-config-airbnb-base',
    'plugin:vue/vue3-recommended',
  ],
};
