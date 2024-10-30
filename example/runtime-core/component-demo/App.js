import { h, ref } from "../../../lib/vue-core.esm.js"
import { Child } from "./Child.js"
import { Foo } from "./Foo.js"


export const App = {
  name: 'App',
  setup() {
    const a = ref(1)

    const handleClick= () => {
      a.value++
    }

    const handleChangeMsg = () => {

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
    const header = h('div', {}, 'header123')
    const footer = h('div', {}, 'footer456')

    // SLOTS_CHILDREN
    // return h(Foo, null, { 
    //   header: ({age}) => h('div', {}, 'header phil age:' + age), 
    //   footer: ({age}) => h('div', {}, 'footer phil age:' + age)
    // })
    // updateComponent
      
    return  h(Child, { msg: this.a }, {
      default: () => h('button', { onClick: this.handleClick }, 'change msg'),
    })
    // h('button', { onClick: this.handleClick }, 'change msg'),
    
  }
}