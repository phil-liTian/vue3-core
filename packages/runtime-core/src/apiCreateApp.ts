// import { render } from './renderer'
import { warn } from './warning'
import { version } from '.'
import { InjectionKey } from './apiInject'
import { createVNode } from './vnode'
import { isFunction } from '@vue/shared'

// export function createApp(rootComponent) {
//   return {
//     mount: rootContainer => {
//       const vnode = createVNode(rootComponent)
//       render(vnode, rootContainer, null)
//     },
//   }
// }

export interface App<HostElement = any> {
  // internal
  _uid: number
  _component: any
  _context: AppContext

  version: string
  mount: (rootContainer: HostElement) => void
  provide<T, K = InjectionKey<T>>(
    key: K,
    value: K extends InjectionKey<infer V> ? V : T,
  ): this

  runWithContext<T>(fn: () => T): T

  use<Option extends unknown[]>(
    plugin: Plugin<Option>,
    ...options: Option
  ): this
  use<Option>(plugin: Plugin<Option>, options: Option): this
}

export interface AppContext {
  app: App
  provides: Record<string | symbol, any>
}

type PluginInstallFunction<Options = any[]> = Options extends unknown[]
  ? (app: App, ...options: Options) => any
  : (app: App, options: Options) => any

export type ObjectPlugin<Options = any[]> = {
  install: PluginInstallFunction<Options>
}

export type FunctionPlugin<Options = any[]> = PluginInstallFunction<Options> &
  Partial<ObjectPlugin<Options>>

// vue的插件 可以是一个对象或者函数
export type Plugin<Options = any[]> =
  | ObjectPlugin<Options>
  | FunctionPlugin<Options>

let uid = 0

export function createAppContext(): AppContext {
  return {
    app: null as any,
    provides: Object.create(null),
  }
}

export function createAppAPI(render) {
  return function createApp(rooterComponent) {
    const context = createAppContext()
    const installedPlugins = new WeakSet()

    const app: App = (context.app = {
      _uid: uid++,
      _component: rooterComponent,
      _context: context,
      version,

      provide(key, value) {
        context.provides[key as string | symbol] = value
        return app
      },

      runWithContext(fn) {
        const lastApp = currentApp

        currentApp = app
        try {
          return fn()
        } finally {
          currentApp = lastApp
        }
      },

      use(plugin: Plugin, ...options: any[]) {
        if (installedPlugins.has(plugin)) {
          __DEV__ && warn(`Plugin has already been applied to target app.`)
        } else if (plugin && isFunction(plugin.install)) {
          installedPlugins.add(plugin)
          plugin.install(app, ...options)
        } else if (isFunction(plugin)) {
          installedPlugins.add(plugin)
          plugin(app, ...options)
        } else {
          __DEV__ && warn(`Invalid Plugin: ${plugin}`)
        }

        return app // 可链式调用
      },

      mount(rootContainer) {
        const vnode = createVNode(rooterComponent)
        // 挂载的时候给vnode添加appContext, 这样在vnode上就可以访问到全局注册的appContext对象了
        vnode.appContext = context
        render(vnode, rootContainer, null)
      },
    })

    return app
  }
}

export let currentApp: App<unknown> | null = null
