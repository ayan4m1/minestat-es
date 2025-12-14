import terser from '@rollup/plugin-terser';
import typescript from '@rollup/plugin-typescript';
import autoExternal from 'rollup-plugin-auto-external';

export default {
  input: ['./src/index.ts', './src/browser.ts'],
  output: {
    dir: './lib',
    format: 'esm'
  },
  plugins: [
    autoExternal({
      builtins: true
    }),
    typescript(),
    terser()
  ]
};
