import { ComponentInternalInstance, currentInstance } from './component'
import { LifecycleHooks } from './enums'

type CreateHook<T = any> = (
  hook: T,
  target: ComponentInternalInstance | null,
) => void

export function injectHook(type: LifecycleHooks, hook, target) {
  if (target) {
    const hooks = target[type] || (target[type] = [])

    const wrappedHook = () => {
      hook.apply(target)
    }

    hooks.push(wrappedHook)

    return wrappedHook
  }
}

const createHook =
  (lifecycle: LifecycleHooks) =>
  (hook, target: ComponentInternalInstance | null = currentInstance) => {
    injectHook(lifecycle, (...args) => hook(...args), target)
  }

export const onBeforeMount: CreateHook = createHook(LifecycleHooks.BEFORE_MOUNT)

export const onMounted: CreateHook = createHook(LifecycleHooks.MOUNTED)
