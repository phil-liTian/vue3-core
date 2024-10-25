import { h, provide } from '../../../lib/vue-core.esm.js'
import { Foo } from './Foo.js'
window.self = undefined
export const App = {
  name: 'App',
  setup(props) {
    provide('foo', 'foo-app')
    return {
      msg: 'hello vue'
    }
  },

  render() {
    window.self = this

    // return h('div', { onClick: () => console.log('click') }, [h('p', { class: 'red', onClick: () => console.log('click')  }, 'hello'), h('p', {}, 'vue')])
    // return h('div', { onClick: () => console.log('click') }, this.msg)
    return h('div', { onClick: () => console.log('click') }, [h(Foo, { message: 'hello', onClick: () => console.log('click') })])
  }
}