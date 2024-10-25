import { createRenderer } from '@vue/runtime-core'

export function createApp(rootComponent) {
  return createRenderer().createApp(rootComponent)
}

export * from '@vue/runtime-core'
