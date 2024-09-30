import { isArray, isFunction, isObject } from '@vue/shared'
import { ReactiveFlags } from './constant'
import { Dep } from './dep'
import { isProxy } from './reactive'
import { warn } from './warning'

export interface Ref<T = any, S = T> {
  get value(): T
  set value(_: S)
}

export type MaybeRef<T = any> = T | Ref<T>

export type ToRef<T> = Ref<T>
export type ToRefs<T extends object> = {
  [K in keyof T]: ToRef<T[K]>
}

class RefImpl {
  _value: any
  dep: Dep = new Dep()
  public [ReactiveFlags.IS_REF] = true
  constructor(rawValue) {
    this._value = rawValue
  }

  get value() {
    this.dep.track()
    return this._value
  }

  set value(newValue) {
    this._value = newValue
    this.dep.trigger()
  }
}

function createRef(value) {
  return new RefImpl(value)
}

export function ref(value?: unknown) {
  return createRef(value)
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

// 可保留object的响应式
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
