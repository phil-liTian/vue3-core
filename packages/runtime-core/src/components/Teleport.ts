import { VNode } from '../vnode'
export type TeleportVNode = VNode<HTMLElement>

export const TeleportImpl = {
  name: 'Teleport',
  __isTeleport: true,

  process(n1, n2) {
    if (!n1) {
      // 挂载
    } else {
      // 更新
    }
  },

  remove() {},
}

export const Teleport = TeleportImpl as {
  __isTeleport: true
}
