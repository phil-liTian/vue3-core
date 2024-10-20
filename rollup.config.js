import typescript from '@rollup/plugin-typescript'

export default {
  input: './packages/vue/src/index.ts',
  output: [
    {
      format: 'cjs',
      file: 'lib/vue-core.cjs.js'
    },
    {
      format: 'es',
      file: 'lib/vue-core.esm.js'
    }
  ],

  plugins: [
    typescript()
  ]
}