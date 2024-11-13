import { h, version, ref, Teleport, createElementVNode } from "../../../../lib/vue-core.esm.js"


export const App = {
  name: 'App',

  // template: `{{message}}`,
  template: `<div>hi,{{ message }}: {{ count }}</div>`,
  setup() {
    const count = window.count = ref(1)
    return {
      message: '正在开启compiler魔盒',
      count
    }
  },
  
  // render() {
  //   return createElementVNode('div')
  // }
}