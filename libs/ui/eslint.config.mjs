import nx from '@nx/eslint-plugin';
import baseConfig from '../../eslint.config.mjs';

export default [
  ...nx.configs['flat/angular'],
  ...nx.configs['flat/angular-template'],
  ...baseConfig,
  {
    files: ['**/*.ts'],
    rules: {
      '@angular-eslint/directive-selector': [
        'error',
        {
          type: 'attribute',
          prefix: 'ui',
          style: 'camelCase',
        },
      ],
      '@angular-eslint/component-selector': [
        'error',
        {
          type: 'element',
          prefix: 'ui',
          style: 'kebab-case',
        },
      ],
    },
  },
  {
    // Components that render onto a host <a>/<button> so the app can own routerLink/href.
    files: ['**/nav-item/*.ts', '**/quick-action/*.ts', '**/button/*.ts'],
    rules: {
      '@angular-eslint/component-selector': [
        'error',
        {
          type: 'attribute',
          prefix: 'ui',
          style: 'camelCase',
        },
      ],
    },
  },
  {
    files: ['**/*.html'],
    // Override or add rules here
    rules: {},
  },
];
