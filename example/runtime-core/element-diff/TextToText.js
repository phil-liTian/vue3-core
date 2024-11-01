
import { getCurrentInstance, h, ref } from '../../../lib/vue-core.esm.js'
export const TextToText = {
  name: 'TextToText',
  render() {
    return h('div', this.isChanged ? 'new-child' : 'old-child')
  },
  setup() {
    const isChanged = ref(false)
    window.$self = getCurrentInstance()


    return {
      isChanged
    }
  }
}