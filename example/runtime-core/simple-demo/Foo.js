import { h, getCurrentInstance, inject, provide } from '../../../lib/vue-core.esm.js'
import { FooTwo } from './FooTwo.js'
export const Foo = {
  name: 'Foo',
  setup(props) {
    // const instance = getCurrentInstance()
    // console.log('instance', instance);
    provide('foo', 'foo----')
    const foo = inject('foo')
    
    return {
      foo
    }
  },

  render() {
    // return h('div', {}, '123' + this.message)
    return h('div', {  }, [h('div', {}, '123' + this.foo), h(FooTwo, {}, '')])
  }
}