import { initProps } from './componentProps'
import { PublicInstanceProxyHandlers } from './componentPublicInstance'
import { VNode } from './vnode'

export type Data = Record<string, unknown>

export interface ComponentInternalInstance {
  vnode: VNode
  type: Component
  provides: Data
  parent: ComponentInternalInstance | null
}

export type Component = {}

// 添加parent 需要用到父级组件中提供的数据, provide/inject
export function createComponentInstance(vnode, parent) {
  const instance = {
    vnode,
    type: vnode.type,
    setupState: {},
    props: {},
    provides: parent ? parent.provides : {},
    parent,
  }

  return instance
}

export function setupComponent(instance) {
  // TODO
  initProps(instance, instance.vnode.props)
  // initSlots()

  setupStatefulComponent(instance)
}

function setupStatefulComponent(instance) {
  const Component = instance.type

  // 实现组件代理对象
  instance.proxy = new Proxy({ _: instance }, PublicInstanceProxyHandlers)
  const { setup } = Component
  if (setup) {
    setCurrentInstance(instance)
    const setupResult = Component.setup(instance.props)
    handleSetupResult(instance, setupResult)
  }
}

function handleSetupResult(instance: any, setupResult: any) {
  if (typeof setupResult === 'object') {
    instance.setupState = setupResult
  }

  finishComponentSetup(instance)
}

function finishComponentSetup(instance: any) {
  const Component = instance.type
  if (Component.render) {
    instance.render = Component.render
  }
}
export let currentInstance: ComponentInternalInstance | null = null

export const getCurrentInstance = () => currentInstance

export const setCurrentInstance = instance => (currentInstance = instance)
