import nx from '@nx/eslint-plugin';
import jsoncParser from 'jsonc-eslint-parser';
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
          prefix: 'web',
          style: 'camelCase',
        },
      ],
      '@angular-eslint/component-selector': [
        'error',
        {
          type: 'element',
          prefix: 'web',
          style: 'kebab-case',
        },
      ],
    },
  },
  {
    files: ['**/*.html'],
    // Override or add rules here
    rules: {},
  },
  {
    // The SSR bundle inlines most deps, but the runtime image installs this app's own dependency
    // subtree (not the whole monorepo), so keep apps/web/package.json complete and in sync with the
    // source imports. Autofix with `nx lint web --fix`.
    files: ['**/package.json'],
    languageOptions: { parser: jsoncParser },
    rules: {
      '@nx/dependency-checks': [
        'error',
        {
          ignoredFiles: ['{projectRoot}/eslint.config.{js,cjs,mjs}'],
          // Workspace libs are bundled into the SSR output, not installed from a registry.
          ignoredDependencies: ['@portfolio-ebeerens/api-client'],
        },
      ],
    },
  },
];
