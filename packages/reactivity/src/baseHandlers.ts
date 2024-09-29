import { hasOwn, isArray, isObject } from '@vue/shared'
import { ReactiveFlags, TrackOpTypes, TriggerOpTypes } from './constant'
import { track, trigger } from './dep'
import { isReadonly, isShallow, reactive, readonly, toRaw } from './reactive'
import { warn } from './warning'
import { arrayInstrumentations } from './arrayInstrumentations'

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
    track(target, TrackOpTypes.GET, key)

    if (key === ReactiveFlags.IS_REACTIVE) {
      return true
    }

    if (key === ReactiveFlags.IS_SHALLOW) {
      return isShallow
    } else if (key === ReactiveFlags.IS_READONLY) {
      return isReadonly
    }

    // 通过toRaw获取原始类型时 直接返回target
    if (key === ReactiveFlags.RAW) {
      return target
    }

    const targetIsArray = isArray(target)

    // 处理array的依赖收集 arrayInstrumentations对象中的所有key都能触发依赖收集
    let fn: Function
    if (targetIsArray && (fn = arrayInstrumentations[key])) {
      return fn
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
    if (!isShallow(value) && !isReadonly(value)) {
      // set的时候 如果set的是一个reactive对象, 则将这个reactive对象转化成原始类型, 因为reactive对象默认是递归都具有响应式的, 里面对象无需再包装
      value = toRaw(value)
    }

    const res = Reflect.set(target, key, value, receiver)

    // 判断是否是已经存在的属性
    const hadKey = isArray(target)
      ? Number[key] < target.length
      : hasOwn(target, key)

    if (hadKey) {
      // update
      trigger(target, TriggerOpTypes.SET, key)
    } else {
      // 新增属性
      trigger(target, TriggerOpTypes.ADD, key)
    }

    return res
  }

  deleteProperty(target: Record<string, unknown>, key: string) {
    const hadKey = hasOwn(target, key)
    const result = Reflect.deleteProperty(target, key)

    if (result && hadKey) {
      trigger(target, TriggerOpTypes.DELETE, key)
    }
    return result
  }

  // in 操作符 会触发has操作，处理should observe has operations
  has(target, key) {
    const res = Reflect.has(target, key)
    track(target, TrackOpTypes.HAS, key)
    return res
  }

  // ownKeys(target) {
  //   console.log('target', target)

  //   return Reflect.ownKeys(target)
  // }
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
