import { h, provide, onBeforeMount } from '../../../lib/vue-core.esm.js'
export const App = {
  name: 'App',
  setup(props) {
    onBeforeMount(() => {
      console.log('onBeforeMount');
    })
    return {
      msg: 'hello vue'
    }
  },

  render() {
    return h('div', {}, 'life-cycle')
  }
}