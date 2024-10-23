import { h } from '../../../lib/vue-core.esm.js'
export const App = {
  setup() {
    return {
      msg: 'hello vue'
    }
  },

  render() {
    return h('div', {}, 'hello vue')
  }
}