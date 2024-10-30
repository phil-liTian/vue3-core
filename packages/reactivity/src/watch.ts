import { EMPTY_OBJ, isFunction, NOOP } from '@vue/shared'
import { ReactiveEffect } from './effect'
import { isReactive } from './reactive'
import { Ref } from './ref'
import { ComputedRef } from './computed'

export enum WatchErrorCodes {
  WATCH_GETTER = 2,
  WATCH_CALLBACK,
  WATCH_CLEANUP,
}

// watch可监听的数据源类型
export type WatchSource<T = any> = Ref<T, any> | ComputedRef<T> | (() => T)
// scheduler
export type WatchScheduler = (job: () => void, isFirstRun: boolean) => void

// 存储cleanUp方法, 在触发更新时执行job
const cleanUpMap: WeakMap<ReactiveEffect, (() => void)[]> = new WeakMap()

export type OnCleanUp = (cleanUpFn: () => void) => void
export type WatchEffect = (onCleanup: OnCleanUp) => void
let activeWatcher: ReactiveEffect | undefined = undefined

export interface WatchOptions<Immediate = boolean> {
  immediate?: Immediate
  deep?: boolean | number
  once?: boolean
  scheduler?: WatchScheduler

  call?: (
    fn: Function | Function[],
    type: WatchErrorCodes,
    args?: unknown[],
  ) => void
}

export type WatchStopHandle = () => void

export interface WatchHandle extends WatchStopHandle {
  pause: () => void
  resume: () => void
  stop: () => void
}

export function getCurrentWatcher(): ReactiveEffect | undefined {
  return activeWatcher
}

/**
 * @description 注册一个清理函数，在当前侦听器即将重新运行时执行
 */
export function onWatcherCleanup(
  cleanupFn: () => void,
  failSilently = false, // 设置成true之后, 不会向外抛出警告
  owner: ReactiveEffect | undefined = activeWatcher,
) {
  if (owner) {
    let cleanUps = cleanUpMap.get(owner)
    if (!cleanUps) {
      cleanUpMap.set(owner, (cleanUps = []))
    }
    cleanUps.push(cleanupFn)
  } else if (!failSilently) {
  }
}

export function watch<T>(
  source: WatchSource | WatchSource[] | object | WatchEffect,
  cb?: any,
  options: WatchOptions<boolean> = EMPTY_OBJ,
): WatchHandle {
  let cleanUp: (() => void) | undefined
  const { immediate } = options

  let getter: () => any = NOOP
  let effect: ReactiveEffect
  let boundCleanup: typeof onWatcherCleanup
  let oldValue = undefined
  const reactiveGetter = (source: object) => {}

  if (isFunction(source)) {
    if (cb) {
    } else {
      getter = () => {
        if (cleanUp) {
          try {
            // TODO 处理竞态问题
            cleanUp()
          } finally {
          }
        }
        // 记录当前的watcherEffect, 目的在于可以向外暴露 当前监听的watcher, 也方便给onWatcherCleanup的第三个参数提供默认值
        activeWatcher = effect
        try {
          return source(boundCleanup)
        } catch (e) {
        } finally {
        }
      }
    }
  } else if (isReactive(source)) {
    getter = () => reactiveGetter(source)
  }

  // 是否是设置immediate为true第一次执行
  const job = (immediateFirstRun?: boolean) => {
    if (!immediateFirstRun && !effect.dirty) return
    if (cb) {
      effect.run()
      cb()
    } else {
      effect.run()
    }
  }

  effect = new ReactiveEffect(getter)

  effect.scheduler = job

  // source可接收一个参数 onCleanUp
  boundCleanup = fn => onWatcherCleanup(fn, true, effect)

  // 处理cleanUp方法
  cleanUp = () => {
    const cleanUps = cleanUpMap.get(effect)

    if (cleanUps) {
      for (const cleanUp of cleanUps) {
        cleanUp()
      }
      cleanUpMap.delete(effect)
    }
  }

  if (cb) {
    if (immediate) {
      job(true)
    } else {
      oldValue = effect.run()
    }
  } else {
    effect.run()
  }

  const wathchHandle: WatchHandle = () => {}

  wathchHandle.pause = () => {}
  wathchHandle.resume = () => {}
  wathchHandle.stop = () => {}

  return wathchHandle
}

// deep设置成true 需深度监听对象
export function traverse(value, depth = Infinity, seen?: Set<unknown>) {}
