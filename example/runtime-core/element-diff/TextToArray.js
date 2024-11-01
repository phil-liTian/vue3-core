
import { getCurrentInstance, h, ref } from '../../../lib/vue-core.esm.js'
export const TextToArray = {
  name: 'TextToArray',
  render() {
    const A = h('div', 'A')
    const B = h('div', 'B')
    return h('div', this.isChanged ? [A, B] : '123')
  },
  setup() {
    const isChanged = ref(false)
    window.$self = getCurrentInstance()


    return {
      isChanged
    }
  }
}