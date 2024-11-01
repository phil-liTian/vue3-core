import { createRenderer } from '@vue/runtime-core'
import { extend } from '@vue/shared'
import { nodeOps } from './nodeOps'
import { patchProp } from './patchProp'

const rendererOptions = /*#__PURE__*/ extend({ patchProp }, nodeOps)

function ensureRenderer() {
  return createRenderer(rendererOptions)
}

export function createApp(rootComponent) {
  const app = ensureRenderer().createApp(rootComponent)

  return app
}

export * from '@vue/runtime-core'
