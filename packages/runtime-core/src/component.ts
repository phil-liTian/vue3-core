import { proxyRefs } from '@vue/reactivity'
import { initProps } from './componentProps'
import { initSlots } from './componentSlots'
import {
  ComponentPublicInstance,
  PublicInstanceProxyHandlers,
} from './componentPublicInstance'
import { VNode } from './vnode'
import { LifecycleHooks } from './enums'
import { SchedulerJob } from './scheduler'
import { AppContext, createAppContext } from './apiCreateApp'

export type LifecycleHook<TFn = Function> = (SchedulerJob[] & TFn) | null

export type Data = Record<string, unknown>

export type VNodeChildren = any
export interface InternalRenderFunction {
  (ctx: ComponentPublicInstance): VNodeChildren
}

export interface ComponentInternalInstance {
  vnode: VNode
  type: Component
  provides: Data
  appContext: AppContext
  parent: ComponentInternalInstance | null

  component: any

  render: InternalRenderFunction | null
  subTree: VNode | null
  next: VNode | null

  // state
  setupState: Data
  props: Data
  slots: Data
  proxy: ComponentPublicInstance | null

  update: () => void

  isMounted: boolean

  // apiLifeCycle
  [LifecycleHooks.BEFORE_MOUNT]: LifecycleHook
  [LifecycleHooks.MOUNTED]: LifecycleHook
}

export type Component = {}

const exptyAppContext = createAppContext()

// 添加parent 需要用到父级组件中提供的数据, provide/inject
export function createComponentInstance(vnode, parent) {

  const appContext = parent ? parent.appContext : vnode.appContext || exptyAppContext
  

  const instance: ComponentInternalInstance = {
    vnode,
    appContext,
    type: vnode.type,
    setupState: {},
    props: {},
    provides: parent ? parent.provides : Object.create(appContext.provides),
    parent,
    component: null,
    slots: {},
    render: null,
    next: null,
    subTree: null,
    proxy: null,

    update: null!,

    isMounted: false,

    // api hooks
    bm: null,
    m: null,
  }

  return instance
}

export function setupComponent(instance) {
  const { children } = instance.vnode
  // 处理props
  initProps(instance, instance.vnode.props)
  // 处理插槽
  initSlots(instance, children)

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
    instance.setupState = proxyRefs(setupResult)
  } else if (typeof setupResult === 'function') {
    // TODO： setup的返回值可以是一个函数, 如果是一个函数则认为是render函数, 默认会忽略自定义的render函数
  }

  finishComponentSetup(instance)
}

function finishComponentSetup(instance: any) {
  const Component = instance.type
  if (!instance.render) {
    if (compiler && !Component.render) {
      // 如果有template, 优先以template为准
      Component.render = compiler(Component.template)
    }

    if (Component.render) {
      instance.render = Component.render
    }
  }
}
export let currentInstance: ComponentInternalInstance | null = null

export const getCurrentInstance = () => currentInstance

export const setCurrentInstance = instance => (currentInstance = instance)

/**
 * compiler
 */
type CompilerFunction = (template: string) => InternalRenderFunction

let compiler: CompilerFunction | undefined

// 注册compiler函数
export function registerRuntimeCompiler(_compiler: CompilerFunction) {
  compiler = _compiler
}
