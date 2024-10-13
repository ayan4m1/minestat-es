import terser from '@rollup/plugin-terser';
import typescript from '@rollup/plugin-typescript';
import autoExternal from 'rollup-plugin-auto-external';

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
