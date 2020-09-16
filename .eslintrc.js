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
    'max-len': [
      'error', 150, 2, {
        ignoreUrls: true,
        ignoreComments: false,
        ignoreRegExpLiterals: true,
        ignoreStrings: false,
        ignoreTemplateLiterals: false,
      },
    ],
  },
  extends: [
    'eslint-config-airbnb-base',
    'plugin:vue/vue3-recommended',
  ],
  settings: {
    'import/resolver': {
      'eslint-import-resolver-custom-alias': {
        alias: {
          '@': `${__dirname}/src`,
        },
        extensions: ['.js'],
      },
    },
  },
};
