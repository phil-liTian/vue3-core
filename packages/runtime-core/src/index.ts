// export * from './createApp'

export const version: string = __VERSION__

export * from './h'

export type { Plugin, App, FunctionPlugin, ObjectPlugin } from './apiCreateApp'

export { getCurrentInstance, registerRuntimeCompiler } from './component'

export { onBeforeMount } from './apiLifecycle'

export { provide, inject } from './apiInject'

export { nextTick } from './scheduler'

export { createRenderer, type RendererOptions } from './renderer'

export { renderSlots } from './helpers/renderSlots'

// 内建组件
export { Teleport } from './components/Teleport'

// 在compiler-core里面用到的方法
export { toDisplayString } from '@vue/shared'

export { createElementVNode } from './vnode'
