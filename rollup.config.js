import typescript from '@rollup/plugin-typescript';
import autoExternal from 'rollup-plugin-auto-external';
import { terser } from 'rollup-plugin-terser';

export default {
  input: './src/index.ts',
  output: [
    {
      file: './lib/index.js',
      format: 'esm'
    },
    {
      file: './lib/index.cjs',
      format: 'cjs'
    }
  ],
  plugins: [
    autoExternal({
      builtins: true
    }),
    typescript(),
    terser()
  ]
};
