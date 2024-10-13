export {
  ref,
  isRef,
  toRef,
  unRef,
  toRefs,
  toValue,
  shallowRef,
  triggerRef,
  customRef,
  // proxyRefs,
  type Ref,
  type MaybeRef,
  type ToRefs,
  type ToRef,
} from './ref'

export {
  toRaw,
  markRaw,
  reactive,
  shallowReactive,
  isProxy,
  isReactive,
  isShallow,
  readonly,
  isReadonly,
  shallowReadonly,
  toReactive,
  toReadonly,
} from './reactive'

export { effect } from './effect'

export { effectScope, onScopeDispose } from './effectScope'

export { computed } from './computed'

export { watch } from './watch'

export { trigger, track } from './dep'
