import { FlatCompat } from '@eslint/eslintrc';
import { fixupPluginRules, includeIgnoreFile } from '@eslint/compat';
import tsParser from '@typescript-eslint/parser';
import pluginVue from 'eslint-plugin-vue';
import globals from 'globals';
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

// Wrap eslint-plugin-import with compatibility shims for eslint v10
const airbnbConfig = compat.extends('airbnb-base').map((config) => {
  if (config.plugins && config.plugins.import) {
    return {
      ...config,
      plugins: {
        ...config.plugins,
        import: fixupPluginRules(config.plugins.import),
      },
    };
  }
  return config;
});

const gitignorePath = path.join(__dirname, '.gitignore');

export default [
  includeIgnoreFile(gitignorePath),
  {
    ignores: [
      'dist/**',
      'node_modules/**',
      'eslint.config.mjs',
    ],
  },
  ...airbnbConfig,
  ...pluginVue.configs['flat/recommended'],
  {
    files: ['**/*.js', '**/*.vue'],
    languageOptions: {
      ecmaVersion: 'latest',
      globals: {
        ...globals.browser,
        ...globals.jest,
        ...globals.node,
      },
    },
    settings: {
      'import/resolver': {
        'eslint-import-resolver-custom-alias': {
          alias: {
            '@': path.join(__dirname, 'src'),
          },
          extensions: ['.js', '.ts'],
        },
      },
    },
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
      'no-void': ['error', { allowAsStatement: true }],
      'vue/max-attributes-per-line': ['error', {
        multiline: {
          max: 5,
        },
        singleline: {
          max: 5,
        },
      }],
      'vue/sort-keys': ['error', 'asc', {
        caseSensitive: true,
        ignoreChildrenOf: ['model'],
        ignoreGrandchildrenOf: ['computed', 'directives', 'inject', 'props', 'watch'],
        minKeys: 2,
        natural: false,
      }],
    },
  },
  {
    files: ['**/*.ts'],
    languageOptions: {
      ecmaVersion: 'latest',
      globals: {
        ...globals.browser,
        ...globals.jest,
        ...globals.node,
      },
      parser: tsParser,
      sourceType: 'module',
    },
    settings: {
      'import/resolver': {
        'eslint-import-resolver-custom-alias': {
          alias: {
            '@': path.join(__dirname, 'src'),
          },
          extensions: ['.js', '.ts'],
        },
      },
    },
    rules: {
      'import/extensions': [
        'error',
        'ignorePackages', {
          js: 'always',
          ts: 'never',
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
    },
  },
  {
    files: ['playwright.config*.ts', 'test/**/*.ts'],
    rules: {
      'import/no-extraneous-dependencies': ['error', { devDependencies: true }],
    },
  },
];
