// ESLint flat config. Formatting is Prettier's job; ESLint catches bugs.
import js from '@eslint/js';
import globals from 'globals';

export default [
  { ignores: ['node_modules/', '.wrangler/', 'public/vendor/'] },
  js.configs.recommended,
  {
    languageOptions: { ecmaVersion: 2023, sourceType: 'module' },
    rules: {
      eqeqeq: 'error',
      'no-var': 'error',
      'prefer-const': 'error',
      'no-console': ['error', { allow: ['error', 'warn'] }],
      'no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    },
  },
  { files: ['public/js/**'], languageOptions: { globals: globals.browser } },
  { files: ['functions/**', 'lib/**'], languageOptions: { globals: globals.serviceworker } },
  { files: ['test/**', 'tools/**', '*.config.js'], languageOptions: { globals: globals.node } },
  { files: ['**/*.cjs'], languageOptions: { sourceType: 'commonjs', globals: globals.node } },
];
