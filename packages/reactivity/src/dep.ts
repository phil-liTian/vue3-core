import { isArray, isIntegerKey, isMap } from '@vue/shared'
import { TrackOpTypes, TriggerOpTypes } from './constant'
import { activeEffect, effect } from './effect'

export const targetMap = new WeakMap()

export const MAP_KEY_ITERATE_KEY = Symbol('Map keys iterate')
export const ITERATE_KEY = Symbol('object iterate')
export const ARRAY_ITERATE_KEY = Symbol('Array Iterate')

export class Link {
  constructor(dep: Dep) {}
}

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

  notify() {}
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

  const targetIsArray = isArray(target)
  // 操作数组的下标触发trigger
  const isArrayIndex = targetIsArray && isIntegerKey(key)

  if (isArray(target) && key === 'length') {
    //
  } else {
    // ADD | SET | DELETE

    run(dep)

    // 如果此处通过数组下标 设置元素内容, 则通过ARRAY_ITERATE_KEY来派发依赖更新
    if (isArrayIndex) {
      run(depsMap.get(ARRAY_ITERATE_KEY))
    }
  }

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
