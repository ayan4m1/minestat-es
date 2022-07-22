import { nodeResolve } from '@rollup/plugin-node-resolve';
import { terser } from 'rollup-plugin-terser';
import autoExternal from 'rollup-plugin-auto-external';

export default {
  input: './src/index.js',
  output: {
    dir: './lib/',
    format: 'esm'
  },
  plugins: [
    autoExternal({
      builtins: true
    }),
    nodeResolve(),
    terser()
  ]
};
