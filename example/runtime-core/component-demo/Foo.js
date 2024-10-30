import { h, renderSlots } from '../../../lib/vue-core.esm.js'

export const Foo = {
  setup() {
    return {

    }
  },

  render() {
    const age = 22
    return h('div', {}, [renderSlots(this.$slots, 'header', { age }), h('p', {}, 'foo'), renderSlots(this.$slots, 'footer', { age: 100 })])
  }
}