import { isObject } from '@vue/shared'
import { createVNode, isVNode, VNode } from './vnode'

type RawChildren = string | number | boolean | VNode | (() => any)

type RawProps = Record<string, any>

// type 是element类型
// export function h<K extends keyof HTMLElementTagNameMap>(
//   type: K,
//   children?: RawChildren,
// ): VNode

// export function h<K extends keyof HTMLElementTagNameMap>(
//   type: K,
//   props?: null | RawProps,
//   children?: RawChildren,
// ): VNode

/**
 * @description 创建虚拟的dom节点, 是createVNode的简写,也丰富了createVNode的使用
 * 1. propsOrChildren 可以不传, 如果是array类型, 则默认是children
 * 2. 如果propsOrChildren 是一个vnode, 作用同 createVNode(type, null, [propsOrChildren])
 */

export function h(type: any, propsOrChildren?: any, children?: any): VNode {
  const l = arguments.length
  if (l === 2) {
    if (isObject(propsOrChildren) && !Array.isArray(propsOrChildren)) {
      if (isVNode(propsOrChildren)) {
        return createVNode(type, null, [propsOrChildren])
      }

      return createVNode(type, propsOrChildren)
    } else {
      // 数组、字符串、函数
      return createVNode(type, null, propsOrChildren)
    }
  } else {
    if (l > 3) {
      // 如果数组长度大于3 则从第三个参数开始 都按children处理
      children = Array.prototype.slice.call(arguments, 2)
    } else if (l === 3 && isVNode(children)) {
      return createVNode(type, propsOrChildren, [children])
    }
    return createVNode(type, propsOrChildren, children)
  }
}
