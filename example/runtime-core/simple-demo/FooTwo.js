import { h, inject } from '../../../lib/vue-core.esm.js'
export const FooTwo = {
  name: 'FooTwo',
  setup(props) {
    const foo = inject('foo')
    return {
      foo
    }
  },

  render() {
    return h('div', {}, 'fooTwo-' + this.foo)
  }
}