import { isArray, isIntegerKey, isMap } from '@vue/shared'
import { TrackOpTypes, TriggerOpTypes } from './constant'
import {
  activeEffect,
  shouldTrack,
  effect,
  EffectFlags,
  endBatch,
  Subscriber,
  startBatch,
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
      this.nextSub =
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

  // SubScriber Counter
  sc: number = 0

  constructor(public computed?: ComputedRefImpl | undefined) {}

  track() {
    if (!activeEffect || !shouldTrack) return

    let link = this.activeLink

    if (link === undefined || link.sub !== activeEffect) {
      // activeEffect反向收集当前deps, 执行stop方法的时候 清空当前activeEffect
      link = this.activeLink = new Link(activeEffect, this)
      if (!activeEffect.deps) {
        // 初始化activeEffect的deps和depsTail
        activeEffect.deps = activeEffect.depsTail = link
      } else {
        // effect 形成一个链表
        activeEffect.depsTail.nextDep = link
      }

      addSub(link)
    } else {
      // if (!activeEffect.deps) {
      //   // 初始化activeEffect的deps和depsTail
      //   activeEffect.deps = activeEffect.depsTail = link
      // } else {
      //   // effect 形成一个链表
      //   activeEffect.depsTail.nextDep = link
      // }
    }
  }

  trigger() {
    this.notify()
  }

  notify() {
    startBatch()
    // this.deps.forEach(effect => {
    //   if (effect) {
    //     // ;(effect as any).run()
    //     ;(effect as any).trigger()
    //   }
    // })
    try {
      for (let link = this.subs; link; link = link.prevSub) {
        if (link.sub.notify()) {
          // link.sub.notify()
        }
      }
    } finally {
      endBatch()
    }
  }

  cleanup() {
    // this.deps.forEach(dep => dep.delete(this))
    // activeEffect.deps
    this.subs = undefined
    this.deps.delete(activeEffect)
  }
}

function addSub(link: Link) {
  // this.deps.add(activeEffect)
  // if (link.sub.flags & EffectFlags.DIRTY) {
  // }

  // 记录Subscriber 的数量

  // link.dep.sc++

  if (link.sub.flags & EffectFlags.TRACKING) {
    link.dep.deps.add(activeEffect)
    const currentTail = link.dep.subs
    if (currentTail !== link) {
      link.prevSub = currentTail
    }

    link.dep.subs = link

    // 收集到deps 然后在effect中执行这些deps

    // link.sub.deps = link.dep.deps
  }
}

/**
 *
 * @param target 拥有反应属性的对象。
 * @param type  定义对反应属性的访问类型
 * @param key 要跟踪的反应属性的标识符
 */
export function track(target: object, type: TrackOpTypes, key: unknown) {
  if (shouldTrack && activeEffect) {
    let depsMap = targetMap.get(target)

    if (!depsMap) {
      targetMap.set(target, (depsMap = new Map()))
    }

    let dep = depsMap.get(key)
    if (!dep) {
      depsMap.set(key, (dep = new Dep()))
    }

    dep.track()
  }
}

// 通过target和key找到deps, 然后依次执行deps中的effect函数
export function trigger(target, type: TriggerOpTypes, key) {
  const run = (dep: Dep) => {
    if (dep) {
      dep.trigger()
    }
  }

  // startBatch()

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

  // endBatch()
}

export function getDepFromReactive(
  object: any,
  key: string | symbol,
): Dep | undefined {
  const depMap = targetMap.get(object)

  return depMap && depMap.get(key)
}
