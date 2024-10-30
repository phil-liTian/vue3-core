import { createRenderer } from '../../runtime-core'

export * from './nodeOps'

const { render: baseRender } = createRenderer()

export const render = baseRender
