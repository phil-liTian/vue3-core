import { h, version, ref, Teleport, createElementVNode } from "../../../../lib/vue-core.esm.js"


export const App = {
  name: 'App',

  // template: `{{message}}`,
  template: `<div>hi,{{ message }}: {{ count }}</div>`,
  setup() {
    const count = window.count = ref(1)
    return {
      message: 'compiler',
      count
    }
  },
  
  // render() {
  //   return createElementVNode('div')
  // }
}