
import { h, renderSlots } from "../../../lib/vue-core.esm.js"

export const Child = {
  name: 'Child',
  
  setup() {
    return {}
  },

  render() {
    return h('div', {}, [
      h('div', 'child：' + this.$props.msg),
      renderSlots(this.$slots, 'default')
    ])
  },
}