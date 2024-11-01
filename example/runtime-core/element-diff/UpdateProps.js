import { h, ref } from "../../../lib/vue-core.esm.js"


export const UpdateProps = {
  name: 'UpdateProps',
  render() {
    return h('div', { foo: this.obj.foo, bar: this.obj.bar}, [
      h('div', {}, 'update props'),
      h('button', { onClick: () => this.obj.foo = 'new-foo' }, 'update-props'),
      h('button', { onClick: () => this.obj.foo = undefined }, 'set undefined'),
      h('button', { onClick: this.setObj }, 'set obj')
    ])
  },
  setup() {
    const obj = ref({
      foo: 'foo',
      bar: 'bar'
    })

    const setObj = () => {
      obj.value = {
        foo: 'foo',
      }
    }

    return {
      obj,
      setObj
    }
  }
}