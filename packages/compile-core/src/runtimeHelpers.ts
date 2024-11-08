export const CREATE_VNODE: unique symbol = Symbol('createVNode')
export const RESOLVE_DIRECTIVE: unique symbol = Symbol('resolveDirective')

export const helperNameMap = {
  [CREATE_VNODE]: 'createVNode',
  [RESOLVE_DIRECTIVE]: 'resolveDirective',
}
