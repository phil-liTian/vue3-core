import { h, ref } from "../../../lib/vue-core.esm.js"
import { Foo } from "./Foo.js"


export const App = {
  name: 'App',
  setup() {
    const a = ref(1)

    const handleClick= () => {
      a.value++
    }

    return {
      a,
      handleClick
    }
  },

  render() {
    window.$self = this

    //[
    //   h('p', {}, 'hello:' + this.a),
    //   h('button', { onClick: this.handleClick }, 'click')
    // ]
    // return h('div', {}, 'hello' + this.a)


    // return h('div', {}, [h('p', {}, 'hello:' + this.a), h('button', { onClick: this.handleClick }, 'click')])
    const header = h('div', {}, 'header')
    const footer = h('div', {}, 'footer')

    return h(Foo, null, {
      footer,
      header
    })
  }
}