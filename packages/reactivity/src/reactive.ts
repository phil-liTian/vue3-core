import { isObject } from '@vue/shared'
import { ReactiveFlags } from './constant'
import { track, trigger } from './dep'

export function reactive<T extends object>(target: T) {
  const proxy = new Proxy(target, {
    get(target, key, receiver) {
      const res = Reflect.get(target, key, receiver)
      // 进行依赖收集
      track(target, key)

      if (key === ReactiveFlags.IS_REACTIVE) {
        return true
      }

      // 如果是一个对象的话 需要重新执行reactive函数, 监听嵌套的对象
      if (isObject(target[key])) {
        return reactive(target[key])
      }

      return res
    },

    set(target, key, value, receiver) {
      const res = Reflect.set(target, key, value, receiver)
      // 当触发set的时候 派发更新
      trigger(target, key)
      return res
    },
  })

  return proxy
}

export function isReactive(value: unknown): boolean {
  // 如果value是一个reactive对象, 那么必定会触发proxy的getter
  return !!(value as any)[ReactiveFlags.IS_REACTIVE]
}
