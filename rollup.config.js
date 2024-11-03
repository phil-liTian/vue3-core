import { createRequire } from 'node:module'
import typescript from '@rollup/plugin-typescript'
import esbuild from 'rollup-plugin-esbuild'
import json from '@rollup/plugin-json'
// import { version as masterVersion } from './package.json' 

const require = createRequire(import.meta.url)
const masterVersion = require('./package.json').version

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
    json({
      namedExports: false,
    }),
    typescript(),
    esbuild({
      define: {
        __VERSION__: `"${masterVersion}"`
      }
    })
  ]
}