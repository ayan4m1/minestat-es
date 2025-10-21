import eslint from '@eslint/js';
import { configs } from 'typescript-eslint';
import { defineConfig } from 'eslint/config';
import { flatConfigs as importConfigs } from 'eslint-plugin-import-x';
import eslintPluginPrettier from 'eslint-plugin-prettier/recommended';

export default defineConfig(
  eslint.configs.recommended,
  ...configs.recommended,
  importConfigs.recommended,
  importConfigs.typescript,
  {
    rules: {
      'no-control-regex': 'off'
    }
  },
  eslintPluginPrettier
);
