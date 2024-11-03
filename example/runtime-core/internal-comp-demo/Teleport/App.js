import { h, version, Teleport } from "../../../../lib/vue-core.esm.js"


export const App = {
  name: 'App',
  setup() {
    console.log('Teleport', Teleport);
    
    return {
    }
  },

  render() {
    console.log('version', version);
    
    return  h('div', {}, 'app')
  }
}