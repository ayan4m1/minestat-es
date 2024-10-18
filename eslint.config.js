import eslint from '@eslint/js';
import { config, configs } from 'typescript-eslint';
import eslintPluginImportX from 'eslint-plugin-import-x';
import eslintPluginPrettier from 'eslint-plugin-prettier/recommended';

export default config(
  eslint.configs.recommended,
  ...configs.recommended,
  eslintPluginImportX.flatConfigs.recommended,
  eslintPluginImportX.flatConfigs.typescript,
  {
    rules: {
      'no-control-regex': 'off'
    }
  },
  eslintPluginPrettier
);
