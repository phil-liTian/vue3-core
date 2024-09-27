import { isObject } from '@vue/shared'
import { ReactiveFlags } from './constant'
import { track, trigger } from './dep'
import { reactive, readonly } from './reactive'
import { warn } from './warning'

class BaseReactiveHandler {
  constructor(
    protected _isReadonly = false,
    protected _isShallow = false,
  ) {}

  get(target, key, receiver) {
    const isShallow = this._isShallow,
      isReadonly = this._isReadonly
    const res = Reflect.get(target, key, receiver)
    // 进行依赖收集
    track(target, key)

    if (key === ReactiveFlags.IS_REACTIVE) {
      return true
    }

    if (key === ReactiveFlags.IS_SHALLOW) {
      return isShallow
    }

    if (key === ReactiveFlags.IS_READONLY) {
      return isReadonly
    }

    // 通过toRaw获取原始类型时 直接返回target
    if (key === ReactiveFlags.RAW) {
      return target
    }

    // 响应式对象只处理到第一层
    if (isShallow) {
      return res
    }

    // 如果是一个对象的话 需要重新执行reactive函数, 监听嵌套的对象
    if (isObject(target[key])) {
      return isReadonly ? readonly(target[key]) : reactive(target[key])
    }

    return res
  }
}

// 可以set
class MutableReactiveHandler extends BaseReactiveHandler {
  constructor(isShallow = false) {
    super(false, isShallow)
  }

  set(target, key, value, receiver) {
    const res = Reflect.set(target, key, value, receiver)
    // 当触发set的时候 派发更新
    trigger(target, key)
    return res
  }

  deleteProperty(target: Record<string, unknown>, key: string) {
    const result = Reflect.deleteProperty(target, key)
    if (result) {
      trigger(target, key)
    }
    return result
  }
}

class ReadonlyReactiveHandler extends BaseReactiveHandler {
  constructor(isShallow = false) {
    super(true, isShallow)
  }

  set(target, key, value) {
    warn(`set ${String(target)} failed: target is readonly.`, target)
    return true
  }
}

export const mutableHandlers: ProxyHandler<object> =
  new MutableReactiveHandler()

export const shallowReactiveHandlers: ProxyHandler<object> =
  new MutableReactiveHandler(true)

export const readonlyHandlers: ProxyHandler<object> =
  new ReadonlyReactiveHandler()

export const shallowReadonlyHandlers: ProxyHandler<object> =
  new ReadonlyReactiveHandler(true)
