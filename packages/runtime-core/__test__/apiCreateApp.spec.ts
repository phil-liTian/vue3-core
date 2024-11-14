import { describe, expect, test } from 'vitest'

import {
  type Plugin,
  createApp,
  h,
  inject,
  provide,
  nodeOps,
  render,
} from '@vue/runtime-test'

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
})
