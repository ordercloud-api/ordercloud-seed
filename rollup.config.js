import typescript from 'rollup-plugin-typescript2';
import { terser } from 'rollup-plugin-terser';
import json from '@rollup/plugin-json';
import pkg from './package.json'

export default [
  {
    input: 'src/cli.ts',
    output: [
      { file: pkg.bin, format: "cjs", banner: "#!/usr/bin/env node" }
    ],
    plugins: [
      typescript({
        typescript: require('typescript'),
      }),
      json()
    ],
  },
  {
    input: 'src/index.ts',
    output: [
      {
        file: pkg.module,
        format: 'esm',
      },
      {
        file: pkg.main,
        format: 'cjs',
      },
    ],
    external: ['axios'],
    plugins: [
      typescript({
        typescript: require('typescript'),
      }),
      json()
    ],
  },
  // {
  //   input: 'src/index.ts',
  //   output: {
  //     file: pkg['umd:main'],
  //     format: 'umd',
  //     name: 'OrderCloud',
  //     globals: {
  //       axios: 'axios',
  //     },
  //     esModule: false,
  //   },
  //   plugins: [
  //     typescript({
  //       typescript: require('typescript'),
  //     }),
  //     terser(),
  //   ],
  //   external: ['axios'],
  // }
]
