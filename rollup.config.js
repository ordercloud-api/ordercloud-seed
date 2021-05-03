import typescript from 'rollup-plugin-typescript2'

export default [
  {
    input: 'src/validate.ts',
    output: [
      { file: "dist/validate.js", format: "cjs" }
    ],
    plugins: [
      typescript({
        typescript: require('typescript'),
      }),
    ],
  },
  {
    input: 'src/download.ts',
    output: [
      { file: "dist/download.js", format: "cjs" }
    ],
    plugins: [
      typescript({
        typescript: require('typescript'),
      }),
    ],
  },
]
