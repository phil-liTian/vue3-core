
import { getCurrentInstance, h, ref } from '../../../lib/vue-core.esm.js'


// const oldList = [
//   h('div', {key: 'A'}, 'A'),
//   h('div', {key: 'B'}, 'B'),
//   h('div', {key: 'C'}, 'C'),
// ]

// const newList = [
//   h('div', {key: 'A'}, 'A'),
//   h('div', {key: 'B'}, 'B'),
//   h('div', {key: 'D'}, 'D'),
//   h('div', {key: 'E'}, 'E'),
// ]


// const oldList = [
//   h('div', {key: 'A'}, 'A'),
//   h('div', {key: 'B'}, 'B'),
//   h('div', {key: 'C'}, 'C'),
// ]

// const newList = [
//   h('div', {key: 'D'}, 'D'),
//   h('div', {key: 'E'}, 'E'),
//   h('div', {key: 'B'}, 'B'),
//   h('div', {key: 'C'}, 'C'),
// ]

// const oldList = [
//   h('div', {key: 'A'}, 'A'),
//   h('div', {key: 'B'}, 'B'),
// ]

// const newList = [
//   h('div', {key: 'A'}, 'A'),
//   h('div', {key: 'B'}, 'B'),
//   h('div', {key: 'C'}, 'C'),
//   h('div', {key: 'C'}, 'D'),
// ]

// const oldList = [
//   h('div', {key: 'A'}, 'A'),
//   h('div', {key: 'B'}, 'B'),
// ]

// const newList = [
//   h('div', {key: 'C'}, 'C'),
//   h('div', {key: 'D'}, 'D'),
//   h('div', {key: 'A'}, 'A'),
//   h('div', {key: 'B'}, 'B'),
// ]

// const oldList = [
//   h('div', {key: 'A'}, 'A'),
//   h('div', {key: 'B'}, 'B'),
//   h('div', {key: 'C'}, 'C'),
// ]

// const newList = [
//   h('div', {key: 'A'}, 'A'),
//   h('div', {key: 'B'}, 'B'),
// ]


const oldList = [
  h('div', {key: 'A'}, 'A'),
  h('div', {key: 'B'}, 'B'),
  h('div', {key: 'C'}, 'C'),
  h('div', {key: 'D'}, 'D'),
  h('div', {key: 'E'}, 'E'),
  h('div', {key: 'F'}, 'F'),
  h('div', {key: 'G'}, 'G'),
]

const newList = [
  h('div', {key: 'A'}, 'A'),
  h('div', {key: 'B'}, 'B'),
  h('div', {key: 'E'}, 'E'),
  h('div', {key: 'D'}, 'D'),
  h('div', {key: 'C'}, 'C'),
  h('div', {key: 'H'}, 'H'),
  h('div', {key: 'F'}, 'F'),
  h('div', {key: 'G'}, 'G'),
]


export const ArrayToArray = {
  name: 'ArrayToArray',
  render() {
    return h('div', this.isChanged ? newList : oldList)
  },
  setup() {
    const isChanged = ref(false)
    window.$self = getCurrentInstance()


    return {
      isChanged
    }
  }
}