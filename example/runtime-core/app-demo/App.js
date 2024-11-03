import { h, version } from "../../../lib/vue-core.esm.js"


export const App = {
  name: 'App',
  setup() {
    return {
    }
  },

  render() {
    console.log('version', version);
    
    return  h('div', {}, 'app')
  }
}