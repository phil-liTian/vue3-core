import { isObject, isString, ShapeFlags } from '@vue/shared'
import { Data } from './component'
import { warn } from '@vue/reactivity/src/warning'
export type VNodeTypes = string

export type VNodeNormalizedChildren = string

export type VNodeProps = {}

export const Comment: Symbol = Symbol.for('v-cmt')

export interface VNode {
  __v_isVNode: true // 用于区分是否是vnode
  type: VNodeTypes
  props: VNodeProps | null
  children: VNodeNormalizedChildren
  shapeFlag: number
}

export function isVNode(value: any): value is VNode {
  return value ? value.__v_isVNode : false
}

function createBaseVNode(type, props, children, shapeFlag): VNode {
  if (!type) {
    if (__DEV__) {
      warn('Invalid vnode type when creating vnode:', type)
    }
    type = Comment
  }
  const vnode = {
    __v_isVNode: true,
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

export const createVNode = _createVNode as typeof _createVNode

// internal createVNode
function _createVNode(
  type,
  props: Data | null = null,
  children: unknown = null,
): VNode {
  const shapeFlag = isString(type)
    ? ShapeFlags.ELEMENT
    : isObject(type)
      ? ShapeFlags.STATEFUL_COMPONENT
      : 0

  return createBaseVNode(type, props, children, shapeFlag)
}
