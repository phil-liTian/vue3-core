import { h } from '../../../lib/vue-core.esm.js'
import { TextToText } from './TextToText.js'
import { ArrayToText } from './ArrayToText.js'
import { UpdateProps } from './UpdateProps.js'
import { TextToArray } from './TextToArray.js'
import { ArrayToArray } from './ArrayToArray.js'
export const App = {
  name: 'App',
  setup(props) {
    return {
      msg: 'hello vue'
    }
  },

  render() {
    return h('div', {}, [
      // h(UpdateProps)
      // h(TextToText)
      // h(ArrayToText)
      // h(TextToArray)
      h(ArrayToArray)
    ])
  }
}