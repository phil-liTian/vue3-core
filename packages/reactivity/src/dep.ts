import { isArray, isMap } from '@vue/shared'
import { TrackOpTypes, TriggerOpTypes } from './constant'
import { activeEffect, effect } from './effect'

export const targetMap = new WeakMap()

export const MAP_KEY_ITERATE_KEY = Symbol('Map keys iterate')
export const ITERATE_KEY = Symbol('object iterate')
export class Dep {
  private deps = new Set()

  track() {
    this.deps.add(activeEffect)
  }

  trigger() {
    this.deps.forEach(effect => {
      if (effect) {
        ;(effect as any)()
      }
    })
  }
}

export function track(target: object, type: TrackOpTypes, key: unknown) {
  let depsMap = targetMap.get(target)

  if (!depsMap) {
    depsMap = new Map()
    targetMap.set(target, depsMap)
  }
  let dep = depsMap.get(key)
  if (!dep) {
    dep = new Dep()
    depsMap.set(key, dep)
  }

  dep.track()
}

// 通过target和key找到deps, 然后依次执行deps中的effect函数
export function trigger(target, type: TriggerOpTypes, key) {
  const run = (dep: Dep) => {
    if (dep) {
      dep.trigger()
    }
  }

  const depsMap = targetMap.get(target)

  if (!depsMap) return
  let dep = depsMap.get(key)

  run(dep)

  const targetIsArray = isArray(target)

  switch (type) {
    case TriggerOpTypes.ADD:
      if (!targetIsArray) {
        run(depsMap.get(ITERATE_KEY))
        // map才会run
        if (isMap(target)) {
          run(depsMap.get(MAP_KEY_ITERATE_KEY))
        }
      }

      break
    case TriggerOpTypes.SET:
      break
    case TriggerOpTypes.DELETE:
      break
  }
}
