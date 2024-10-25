import { isObject, isString, ShapeFlags } from '@vue/shared'
export type VNodeTypes = string

export type VNodeNormalizedChildren = string

export type VNodeProps = {}

export interface VNode {
  type: VNodeTypes
  props: VNodeProps | null
  children: VNodeNormalizedChildren
  shapeFlag: number
}

function createBaseVNode(type, props, children, shapeFlag): VNode {
  const vnode = {
    type,
    props,
    children,
    shapeFlag,
  } as VNode

  if (children) {
    vnode.shapeFlag |=
      typeof children === 'string'
        ? ShapeFlags.TEXT_CHILDREN
        : ShapeFlags.ARRAY_CHILDREN
  }

  return vnode
}

export function createVNode(type, props?, children?) {
  return _createVNode(type, props, children)
}

// internal createVNode
function _createVNode(type, props?, children?): VNode {
  const shapeFlag = isString(type)
    ? ShapeFlags.ELEMENT
    : isObject(type)
      ? ShapeFlags.STATEFUL_COMPONENT
      : 0

  return createBaseVNode(type, props, children, shapeFlag)
}
