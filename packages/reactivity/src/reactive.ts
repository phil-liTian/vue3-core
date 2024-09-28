import { ReactiveFlags } from './constant'
import {
  mutableHandlers,
  readonlyHandlers,
  shallowReactiveHandlers,
  shallowReadonlyHandlers,
} from './baseHandlers'
import {
  mutableCollectionHandlers,
  readonlyCollectionHandlers,
  shallowCollectionHandlers,
} from './collectionHandlers'
import { def, hasOwn, isObject, toRawType } from '@vue/shared'
export interface Target {
  [ReactiveFlags.SKIP]?: boolean
  [ReactiveFlags.IS_SHALLOW]?: boolean
  [ReactiveFlags.IS_READONLY]?: boolean
  [ReactiveFlags.IS_REACTIVE]?: boolean
  [ReactiveFlags.RAW]?: any
}

enum TargetType {
  // MarkRaw 可标记无需响应式的对象, 通过添加SKIP flag
  INVALID = 0,
  // 标识是否是Set、Map, WeakMap, WeakSet等类型
  COLLECTION = 1,
}

function targetTypeMap(rawType: string) {
  switch (rawType) {
    case 'Map':
    case 'Set':
    case 'WeakMap':
    case 'WeakSet':
      return TargetType.COLLECTION
  }
}

function getTargetType(value: Target) {
  return value[ReactiveFlags.SKIP]
    ? TargetType.INVALID
    : targetTypeMap(toRawType(value))
}

export function toRaw<T>(observed: T): T {
  const raw = observed && (observed as Target)[ReactiveFlags.RAW]
  return raw ? toRaw(raw) : observed
}

// 去掉响应式
export function markRaw<T extends object>(value: T) {
  // 如果没有SKIP属性, 并且value是可扩展对象的话，添加属性SKIP
  if (!hasOwn(value, ReactiveFlags.SKIP) && Object.isExtensible(value)) {
    // value[ReactiveFlags.SKIP] = true
    // 添加属性SKIP
    def(value, ReactiveFlags.SKIP, true)
  }

  return value
}

export function reactive<T extends object>(target: T): any
export function reactive(target: object) {
  return createReactiveObject(
    target,
    mutableHandlers,
    mutableCollectionHandlers,
  )
}

export function shallowReactive(target: object) {
  return createReactiveObject(
    target,
    shallowReactiveHandlers,
    shallowCollectionHandlers,
  )
}
export function readonly<T extends object>(target: T): any

export function readonly(target: object) {
  return createReactiveObject(
    target,
    readonlyHandlers,
    readonlyCollectionHandlers,
  )
}

export function shallowReadonly(target: object) {
  return createReactiveObject(
    target,
    shallowReadonlyHandlers,
    readonlyCollectionHandlers,
  )
}

// 判断是否是reactive类型
export function isReactive(value: unknown): boolean {
  // 如果value是一个reactive对象, 那么必定会触发proxy的getter
  return !!(value && (value as Target)[ReactiveFlags.IS_REACTIVE])
}

export function isShallow(value: unknown): boolean {
  return !!(value && (value as Target)[ReactiveFlags.IS_SHALLOW])
}

export function isReadonly(value: unknown): boolean {
  return !!(value && (value as Target)[ReactiveFlags.IS_READONLY])
}

export function isProxy(value: unknown): boolean {
  return !!(value && (value as Target)[ReactiveFlags.RAW])
}

export const toReactive = <T extends unknown>(value: T): T =>
  isObject(value) ? reactive<any>(value) : value

export const toReadonly = <T extends unknown>(value: T): T =>
  isObject(value) ? readonly<any>(value) : value

function createReactiveObject(
  target: Target,
  baseHandlers: ProxyHandler<any>,
  collectionHandlers: ProxyHandler<any>,
) {
  const targetType = getTargetType(target)
  // 标记INVALID后无需响应式
  if (targetType === TargetType.INVALID) {
    return target
  }
  const proxy = new Proxy(
    target,
    targetType === TargetType.COLLECTION ? collectionHandlers : baseHandlers,
  )
  return proxy
}
