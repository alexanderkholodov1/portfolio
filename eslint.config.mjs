import js from '@eslint/js';
import globals from 'globals';

export default [
  { ignores: ['dist/**', 'node_modules/**', '.astro/**', 'test-results/**', 'playwright-report/**', 'private/**'] },
  js.configs.recommended,
  { files: ['**/*.mjs'], languageOptions: { globals: globals.node } },
  { files: ['tests/browser/*.mjs'], languageOptions: { globals: globals.browser } },
];
