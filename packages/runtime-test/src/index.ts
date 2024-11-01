import { createRenderer } from '../../runtime-core'
import { extend } from '@vue/shared'
import { nodeOps } from './nodeOps'
import { patchProp } from './patchProp'

export { nodeOps } from './nodeOps'

const { render: baseRender } = createRenderer(
  extend({ patchProp }, nodeOps) as any,
)

export const render = baseRender
