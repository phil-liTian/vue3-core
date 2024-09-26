import { activeEffect, effect } from './effect'

export const targetMap = new WeakMap()

export function track(target: object, key: unknown) {
  let depsMap = targetMap.get(target)
  if (!depsMap) {
    depsMap = new Map()
    targetMap.set(target, depsMap)
  }
  let dep = depsMap.get(key)
  if (!dep) {
    dep = new Set()
    depsMap.set(key, dep)
  }
  dep.add(activeEffect)
}

// 通过target和key找到deps, 然后依次执行deps中的effect函数
export function trigger(target, key) {
  const depsMap = targetMap.get(target)
  if (!depsMap) return
  let deps = depsMap.get(key)
  deps.forEach(effect => effect())
}
