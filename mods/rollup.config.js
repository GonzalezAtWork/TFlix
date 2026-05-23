import { babel } from '@rollup/plugin-babel';
import { nodeResolve } from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import terser from '@rollup/plugin-terser';
import { string } from 'rollup-plugin-string';

export default [
  {
    input: 'userScript.js',
    output: {
      file: '../dist/userScript.js',
      format: 'iife'
    },
    plugins: [
      string({
        include: '**/*.css'
      }),
      nodeResolve(),
      commonjs(),
      babel({
        babelHelpers: 'bundled',
        presets: ['@babel/preset-env']
      }),
      terser()
    ]
  }
];
