import { isArray, isIntegerKey, isMap } from '@vue/shared'
import { TrackOpTypes, TriggerOpTypes } from './constant'
import {
  activeEffect,
  effect,
  EffectFlags,
  endBatch,
  Subscriber,
} from './effect'
import { ComputedRefImpl } from './computed'

export const targetMap = new WeakMap()

export const MAP_KEY_ITERATE_KEY = Symbol('Map keys iterate')
export const ITERATE_KEY = Symbol('object iterate')
export const ARRAY_ITERATE_KEY = Symbol('Array Iterate')

// 创建一个双向链表
export class Link {
  nextDep?: Link
  prevDep?: Link
  nextSub?: Link
  prevSub?: Link
  prevActiveSub?: Link

  constructor(
    public sub: Subscriber, // activeEffect
    public dep: Dep, // dep
  ) {
    this.nextDep =
      this.nextSub =
      this.prevDep =
      this.prevSub =
      this.prevActiveSub =
        undefined
  }
}

export class Dep {
  deps = new Set()
  activeLink?: Link = undefined
  // 双向链表的尾部
  subs?: Link = undefined
  // 双向链表的头部
  subsHead?: Link = undefined

  constructor(public computed?: ComputedRefImpl | undefined) {}

  track() {
    if (!activeEffect) return

    // activeEffect反向收集当前deps, 执行stop方法的时候 清空当前activeEffect
    let link = (this.activeLink = new Link(activeEffect, this))
    if (!activeEffect.deps) {
      activeEffect.deps = activeEffect.depsTail = link
    } else {
    }

    addSub(link)
  }

  trigger() {
    this.notify()
  }

  notify() {
    this.deps.forEach(effect => {
      if (effect) {
        // ;(effect as any).run()
        ;(effect as any).trigger()
      }
    })

    for (let link = this.subs; link; link = link.prevSub) {
      // link.dep.deps.forEach(effect => {
      //   if (effect) {
      //     ;(effect as any).trigger()
      //   }
      // })
      // if ( link.sub.notify() ) {
      //   link.sub.deps
      // }
    }
  }

  cleanup() {
    // this.deps.forEach(dep => dep.delete(this))
    this.deps.delete(activeEffect)
  }
}

function addSub(link: Link) {
  // this.deps.add(activeEffect)
  // if (link.sub.flags & EffectFlags.DIRTY) {
  // }
  link.dep.deps.add(activeEffect)
  link.dep.subs = link
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

  endBatch()
}

export function getDepFromReactive(
  object: any,
  key: string | symbol,
): Dep | undefined {
  const depMap = targetMap.get(object)

  return depMap && depMap.get(key)
}
