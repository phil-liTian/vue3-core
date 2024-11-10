export const CREATE_VNODE: unique symbol = Symbol('createVNode')
export const RESOLVE_DIRECTIVE: unique symbol = Symbol('resolveDirective')
export const RESOLVE_COMPONENT: unique symbol = Symbol('resolveComponent')
export const TO_DISPLAY_STRING: unique symbol = Symbol('toDisplayString')
export const CREATE_COMMENT: unique symbol = Symbol('createCommentVNode')
export const FRAGMENT: unique symbol = Symbol('Fragment')
export const RENDER_LIST: unique symbol = Symbol('renderList')
export const OPEN_BLOCK: unique symbol = Symbol('openBlock')

export const helperNameMap = {
  [CREATE_VNODE]: 'createVNode',
  [RESOLVE_DIRECTIVE]: 'resolveDirective',
  [RESOLVE_COMPONENT]: 'resolveComponent',
  [TO_DISPLAY_STRING]: 'toDisplayString',
  [CREATE_COMMENT]: 'createCommentVNode',
  [FRAGMENT]: 'Fragment',
  [RENDER_LIST]: 'renderList',
  [OPEN_BLOCK]: 'openBlock',
}
