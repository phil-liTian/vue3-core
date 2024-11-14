import { createRenderer } from '../../runtime-core'
import { extend } from '@vue/shared'
import { nodeOps } from './nodeOps'
import { patchProp } from './patchProp'

export { nodeOps } from './nodeOps'

const { render: baseRender, createApp: baseCreateApp } = createRenderer(
  extend({ patchProp }, nodeOps) as any,
)

export const render = baseRender
export const createApp = baseCreateApp

export * from '@vue/runtime-core'
