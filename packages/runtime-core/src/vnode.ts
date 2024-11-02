import { isObject, isString, ShapeFlags } from '@vue/shared'
import { Component, ComponentInternalInstance, Data } from './component'
import { warn } from '@vue/reactivity/src/warning'
import { RenderElement, RenderNode } from './renderer'
export type VNodeTypes = string | Component

export type VNodeNormalizedChildren = string

export type VNodeProps = {}

export const Comment: Symbol = Symbol.for('v-cmt')

export interface VNode<HostNode = RenderNode, HostElement = RenderElement> {
  __v_isVNode: true // 用于区分是否是vnode
  type: VNodeTypes // 类型
  props: VNodeProps | null
  children: VNodeNormalizedChildren
  shapeFlag: number
  key: null | PropertyKey
  el: HostNode | null
  component: ComponentInternalInstance | null
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
    key: props?.key,
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
  type: VNodeTypes,
  props: Data | null = null,
  children: unknown = null,
): VNode {
  let shapeFlag = isString(type)
    ? ShapeFlags.ELEMENT
    : isObject(type)
      ? ShapeFlags.STATEFUL_COMPONENT
      : 0

  if (isObject(children) && shapeFlag & ShapeFlags.STATEFUL_COMPONENT) {
    shapeFlag |= ShapeFlags.SLOTS_CHILDREN
  }

  return createBaseVNode(type, props, children, shapeFlag)
}

export function isSameVNodeType(n1, n2) {
  return n1.type === n2.type && n1.key === n2.key
}
