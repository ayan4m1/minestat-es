import eslint from '@eslint/js';
import tslint from 'typescript-eslint';
import eslintPluginPrettier from 'eslint-plugin-prettier/recommended';

export default tslint.config(
  eslint.configs.recommended,
  ...tslint.configs.recommended,
  eslintPluginPrettier,
  {
    rules: {
      'no-control-regex': 'off'
    }
  }
);
