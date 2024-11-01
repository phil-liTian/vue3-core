
import { getCurrentInstance, h, ref } from '../../../lib/vue-core.esm.js'
export const ArrayToText = {
  name: 'TextToText',
  render() {
    const A = h('div', 'A')
    const B = h('div', 'B')
    return h('div', this.isChanged ? '123' : [A, B])
  },
  setup() {
    const isChanged = ref(false)
    window.$self = getCurrentInstance()


    return {
      isChanged
    }
  }
}