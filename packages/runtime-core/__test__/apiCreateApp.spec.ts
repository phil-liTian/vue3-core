import { describe, expect, test, vi } from 'vitest'

import {
  type Plugin,
  createApp,
  h,
  inject,
  provide,
  nodeOps,
  render,
  getCurrentInstance,
  resolveComponent,
} from '@vue/runtime-test'
import { ref } from '@vue/reactivity'

describe('api: createApp', () => {
  test.skip('mount', () => {})
  test.skip('unmount', () => {})

  test('provide', () => {
    const Root = {
      name: 'Root',
      setup() {
        provide('foo', 3)
        // h(Child)
        return {}
      },

      render() {
        return h(Child)
      },
    }

    const Child: any = {
      name: 'Child',
      setup() {
        const foo = inject('foo')
        const bar = inject('bar')
        try {
          inject('__proto__')
        } catch (e: any) {}

        return {
          foo,
          bar,
        }
      },
      render() {
        return h(`${this.foo},${this.bar}`)
      },
    }

    const app = createApp(Root)
    app.provide('foo', 1)
    app.provide('bar', 2)

    const root = nodeOps.createElement('div')
    app.mount(root)
    // expect('[Vue warn]: injection "__proto__" not found.').toHaveBeenWarned()
    // console.log('root', Root.render())
  })

  test('runwithContext', () => {
    const app = createApp({
      setup() {
        provide('foo', 'should not be seen')

        const childApp = createApp({
          setup() {
            provide('foo', 'foo from child')
          },

          render() {
            return h('div', {})
          },
        })

        childApp.provide('foo', 2)
        expect(childApp.runWithContext(() => inject('foo'))).toBe(2)
      },
      render() {
        return h('div', {})
      },
    })
    app.provide('foo', 1)
    const root = nodeOps.createElement('div')
    app.mount(root)

    expect(
      app.runWithContext(() => {
        app.runWithContext(() => {})
        return inject('foo')
      }),
    ).toBe(1)
  })

  test('use', () => {
    const pluginA: Plugin = {
      install(app, a, b) {
        app.provide('foo', a + b)
      },
    }

    const pluginB: Plugin = app => {
      app.provide('bar', 'bar from pluginB')

      return app
    }

    const pluginC: Plugin = {
      install(app) {
        app.provide('baz', 'baz from pluginC')
      },
    }

    class PluginD {
      static install(app) {
        app.provide('baz1', 'baz from pluginD')
      }
    }

    const Root: any = {
      name: 'Root',
      setup() {
        const foo = inject('foo')
        const bar = inject('bar')
        const baz = inject('baz')
        const baz1 = inject('baz1')
        console.log('bar', bar)
        console.log('foo', foo)
        console.log('baz', baz)
        console.log('baz1', baz1)

        return {
          foo,
          bar,
        }
      },
      render() {
        return h(`${this.foo},${this.bar}`)
      },
    }

    const app = createApp(Root)
    app.use(pluginB)
    app.use(pluginC)
    app.use(pluginA, 1, 2)
    app.use(PluginD)
    const root = nodeOps.createElement('div')
    app.mount(root)
  })

  test('component', () => {
    const Root = {
      // local override
      // components: {
      //   BarBaz: () => 'barbaz-local!',
      // },
      setup() {
        // resolve in setup
        const FooBar = resolveComponent('foo-bar')

        return () => {
          // resolve in render
          
          // const BarBaz = resolveComponent('bar-baz')
          return h('div', [h(FooBar), h(BarBaz)])
        }
      },
      render() {
        console.log('BarBaz----', BarBaz)
        return {}
      }
    }
    const app = createApp(Root)
    const BarBaz = {
      setup() {
        return {}
      },
      render() {
        
        return 'barbaz'
      },
    }
    app.component('BarBaz', BarBaz)

    const FooBar = () => 'foobar!'
    app.component('FooBar', FooBar)
    expect(app.component('FooBar')).toBe(FooBar)
    const root = nodeOps.createElement('div')
    app.mount(root)
  })
  test.skip('directive', () => {})
  test.skip('onUnmount', () => {})

  test('config.errorHandler', () => {
    const error = new Error()
    const count = ref(0)

    const handler = vi.fn((err, instance, info) => {
      // expect(err).toBe(error)
      // expect(instance.count).toBe(count.value)
      // expect(info).toBe(`render function`)
    })

    const Root = {
      setup() {
        const count = ref(0)
        return {
          count,
        }
      },
      render() {
        throw error
      },
    }

    const app = createApp(Root)
    app.config.errorHandler = handler
    app.mount(nodeOps.createElement('div'))
    expect(handler).toHaveBeenCalled()
  })

  test('config.warnHandler', () => {
    let ctx: any
    const handler = vi.fn((msg, instance, trace) => {
      expect(msg).toMatch(`Component is missing template or render function`)
      expect(instance).toBe(ctx.proxy)
      expect(trace).toMatch(`Hello`)
    })

    const Root = {
      name: 'Hello',
      setup() {
        ctx = getCurrentInstance()
      },
    }

    const app = createApp(Root)
    app.config.warnHandler = handler
    app.mount(nodeOps.createElement('div'))
    expect(handler).toHaveBeenCalledTimes(1)
  })

  test('config.globalProperties', () => {
    const app = createApp({
      render() {
        console.log('this.foo-----', this.foo)

        return this.foo
      },

      setup() {
        return {}
      },
    })
    app.config.globalProperties.foo = 'hello'
    const root = nodeOps.createElement('div')
    app.mount(root)
  })
})
