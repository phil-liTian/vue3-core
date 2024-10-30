import { hasChanged, isArray, isFunction, isObject } from '@vue/shared'
import { ReactiveFlags } from './constant'
import { Dep } from './dep'
import {
  isProxy,
  isReactive,
  isShallow,
  reactive,
  readonly,
  toRaw,
  toReactive,
} from './reactive'
import { warn } from './warning'

export interface Ref<T = any, S = T> {
  get value(): T
  set value(_: S)
}

export type MaybeRef<T = any> = T | Ref<T>

export type MaybeRefOrGetter<T = any> = MaybeRef<T> | (() => T)

export type ToRef<T> = Ref<T>
export type ToRefs<T extends object> = {
  [K in keyof T]: ToRef<T[K]>
}

export type CustomRefFactory<T> = (
  track: () => void,
  trigger: () => void,
) => {
  get: () => T
  set: (value: T) => void
}

class CustomRefImpl<T> {
  public [ReactiveFlags.IS_REF] = true
  public _value: T = undefined!
  readonly _get: ReturnType<CustomRefFactory<T>>['get']
  readonly _set: ReturnType<CustomRefFactory<T>>['set']

  constructor(factory: CustomRefFactory<T>) {
    const dep = new Dep()
    // 此处向外抛出的是依赖收集Dep身上的track和trigger, 可用用户自定义track和trigger的逻辑, 例如vueuse中的refAutoReset就是利用这个api实现灵活控制ref自动重置
    const { get, set } = factory(dep.track.bind(dep), dep.trigger.bind(dep))

    this._get = get
    this._set = set
  }

  get value() {
    return (this._value = this._get())
  }

  set value(newValue) {
    this._set(newValue)
  }
}

class RefImpl<T = any> {
  _value: any
  _rawValue: any
  dep: Dep = new Dep()
  public [ReactiveFlags.IS_REF] = true
  constructor(rawValue: T, isShallow: boolean) {
    this._rawValue = isShallow ? rawValue : toRaw(rawValue)
    this._value = isShallow ? rawValue : toReactive(rawValue)
    this[ReactiveFlags.IS_SHALLOW] = isShallow
  }

  get value() {
    this.dep.track()
    return this._value
  }

  set value(newValue) {
    const oldValue = this._rawValue
    // 重新set的值是shallow或者原始的类型是shallow, 则直接赋值, 否则toRaw再附值
    const useDirectValue = isShallow(newValue) || this[ReactiveFlags.IS_SHALLOW]

    newValue = useDirectValue ? newValue : toRaw(newValue)
    // 性能优化点: 只有值发生改变时,才触发更新
    if (hasChanged(oldValue, newValue)) {
      this._rawValue = newValue
      this._value = newValue
      this.dep.trigger()
    }
  }
}

function createRef(value: unknown, shallow: boolean) {
  return new RefImpl(value, shallow)
}

export function shallowRef(value) {
  return createRef(value, true)
}

export function triggerRef(ref: Ref): void {
  if ((ref as RefImpl).dep) {
    ;(ref as RefImpl).dep.trigger()
  }
}

export function ref(value?: unknown) {
  return createRef(value, false)
}

export function customRef<T>(factory: CustomRefFactory<T>) {
  return new CustomRefImpl(factory)
}

export function isRef(r: any): boolean {
  return !!(r && r[ReactiveFlags.IS_REF])
}

export function toRef<T>(value: T): Ref<T>

export function toRef<T extends object, K extends keyof T>(
  source: T,
  key: K,
): Ref<T[K]>

export function toRef<T extends object, K extends keyof T>(
  source: T,
  key: K,
  defaultValue: T[K],
): Ref<Exclude<T[K], 'undefined'>>

export function toRef(
  source: MaybeRef,
  key?: string,
  defaultValue?: unknown,
): Ref {
  if (isRef(source)) {
    return source
  } else if (isFunction(source)) {
    return new GetterRefImpl(source) as any
  } else if (isObject(source) && arguments.length > 1) {
    // 保留原来source的响应式
    return propertyToRef(source, key!, defaultValue)
  } else {
    return ref(source)
  }
}

export function toRefs<T extends object>(object: T): ToRefs<T> {
  // toRefs的参数 必须是一个响应式对象
  if (!isProxy(object)) {
    warn('toRefs() expects a reactive object but received a plain one.')
  }

  let ret: any = isArray(object) ? new Array(object.length) : {}
  for (let key in object) {
    ret[key] = propertyToRef(object, key)
  }

  return ret
}

export function unRef<T>(ref: MaybeRef<any>): T {
  return isRef(ref) ? ref.value : ref
}

export function toValue<T>(source: MaybeRefOrGetter<T>): T {
  return isFunction(source) ? source() : unRef(source)
}

// 作用: 在组件中可直接使用ref, 或computed返回的值, 而无需再.value调用了
export function proxyRefs<T extends object>(objectWithRefs: T) {
  return isReactive(objectWithRefs)
    ? objectWithRefs
    : new Proxy(objectWithRefs, shallowUnwrapHandlers)
}

// toRef可保留object的响应式
class ObjectRefImpl<T extends object, K extends keyof T> {
  public readonly [ReactiveFlags.IS_REF] = true
  constructor(
    private _object: T,
    private _key: K,
    private _defaultValue: T[K],
  ) {}

  get value() {
    const val = this._object[this._key]

    return val ?? this._defaultValue
  }

  set value(newVal) {
    this._object[this._key] = newVal
  }
}

// 处理函数, readonly
class GetterRefImpl<T> {
  public readonly [ReactiveFlags.IS_REF] = true
  public readonly [ReactiveFlags.IS_READONLY] = true

  constructor(private _getter: () => T) {}

  get value() {
    return this._getter()
  }
}

function propertyToRef(
  source: Record<string, any>,
  key: string,
  defaultValue?: unknown,
) {
  const value = source[key]

  return isRef(value)
    ? value
    : (new ObjectRefImpl(source, key, defaultValue) as any)
}

const shallowUnwrapHandlers: ProxyHandler<any> = {
  get(target, key) {
    return unRef(Reflect.get(target, key))
  },
  set(target, key, value) {
    const oldValue = target[key]
    if (isRef(oldValue) && !isRef(value)) {
      return (oldValue.value = value)
    } else {
      return Reflect.set(target, key, value)
    }
  },
}
