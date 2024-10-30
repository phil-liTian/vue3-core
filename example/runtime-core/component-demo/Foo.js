import { h } from '../../../lib/vue-core.esm.js'

export const Foo = {
  setup() {
    return {

    }
  },

  render() {
    return h('div', {}, this.$slots.header, 1231, this.$slots.footer)
  }
}