// import { render } from './renderer'
import { version } from '.'
import { createVNode } from './vnode'

// export function createApp(rootComponent) {
//   return {
//     mount: rootContainer => {
//       const vnode = createVNode(rootComponent)
//       render(vnode, rootContainer, null)
//     },
//   }
// }

export interface App<HostElement = any> {
  version: string
  mount: (rootContainer: HostElement) => void

  _uid: number
  _component: any
}

let uid = 0
export function createAppAPI(render) {
  return function createApp(rooterComponent) {
    const app: App = {
      _uid: uid++,
      _component: rooterComponent,

      version,

      mount(rootContainer) {
        const vnode = createVNode(rooterComponent)
        render(vnode, rootContainer, null)
      },
    }

    return app
  }
}
