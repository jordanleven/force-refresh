module.exports = {
  env: {
    browser: true,
    jest: true,
    node: true,
  },
  extends: [
    'eslint-config-airbnb-base',
    'plugin:vue/recommended',
  ],
  ignorePatterns: [
  ],
  root: true,
  rules: {
    'import/extensions': [
      'error',
      'ignorePackages', {
        js: 'always',
        vue: 'always',
      },
    ],
    'import/order': ['error', {
      alphabetize: {
        caseInsensitive: false,
        order: 'asc',
      },
      groups: ['builtin', 'external', 'index', 'parent', 'internal', 'sibling', 'object'],
    }],
    'import/prefer-default-export': 'off',
    'max-len': [
      'error', 150, 2, {
        ignoreComments: false,
        ignoreRegExpLiterals: true,
        ignoreStrings: false,
        ignoreTemplateLiterals: false,
        ignoreUrls: true,
      },
    ],
    'vue/max-attributes-per-line': ['error', {
      multiline: {
        allowFirstLine: false,
        max: 5,
      },
      singleline: 5,
    }],
    'vue/sort-keys': ['error', 'asc', {
      caseSensitive: true,
      ignoreChildrenOf: ['model'],
      ignoreGrandchildrenOf: ['computed', 'directives', 'inject', 'props', 'watch'],
      minKeys: 2,
      natural: false,
    }],
  },
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
