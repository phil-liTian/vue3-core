import { describe, it, expect } from 'vitest'
import {
  Component,
  createApp,
  h,
  nodeOps,
  render,
  resolveComponent,
} from '@vue/runtime-test'

describe('resolveAssets', () => {
  it('should work', () => {
    const FooBar = {
      name: 'FooBar',
      render() {
        return h('div', 'FooBar')
      },

      setup() {
        return {}
      },
    }
    const BarBaz = {
      name: 'BarBaz',
      render() {
        return h('div', 'FooBar')
      },

      setup() {
        return {}
      },
    }
    let component1: Component | string
    let component2: Component | string

    const Root: any = {
      components: {
        FooBar: FooBar,
      },
      // directives: {
      //   BarBaz: BarBaz,
      // },
      setup() {
        component1 = resolveComponent('FooBar')!
        component2 = resolveComponent('BarBaz')!


        return () => {
          // directive1 = resolveDirective('BarBaz')!
          // camelize
          // component2 = resolveComponent('Foo-bar')!
          // directive2 = resolveDirective('Bar-baz')!
          // // capitalize
          // component3 = resolveComponent('fooBar')!
          // directive3 = resolveDirective('barBaz')!
          // // camelize and capitalize
          // component4 = resolveComponent('foo-bar')!
          // directive4 = resolveDirective('bar-baz')!
        }
      },

      render() {
        // console.log('this.component1', this.component1)

        return h(this.component1)
      },
    }

    const root = nodeOps.createElement('div')
    const app = createApp(Root)
    app.component('BarBaz', BarBaz)
    app.mount(root)
    // 挂载到当前components属性上
    expect(component1!).toBe(FooBar)
    // 挂载到全局component
    expect(component2!).toBe(BarBaz)
  })
})
