import { EMPTY_OBJ, isFunction, NOOP } from '@vue/shared'
import { ReactiveEffect } from './effect'
import { isReactive } from './reactive'

export type WatchSource<T> = () => T

export interface WatchOptions<Immediate extends boolean> {
  immediate?: Immediate

  deep?: boolean | number
}

export type WatchStopHandle = () => void

export interface WatchHandle extends WatchStopHandle {
  pause: () => void
  resume: () => void
  stop: () => void
}

export function watch<T>(
  source: WatchSource<T> | object,
  cb?: any,
  options: WatchOptions<boolean> = EMPTY_OBJ,
): WatchHandle {
  let getter: () => any = NOOP
  let effect: ReactiveEffect
  const reactiveGetter = (source: object) => {}

  if (isFunction(source)) {
    getter = () => source()
  } else if (isReactive(source)) {
    getter = () => reactiveGetter(source)
  }

  const job = () => {
    if (cb) {
      effect.run()
      cb()
    } else {
      effect.run()
    }
  }

  effect = new ReactiveEffect(getter)

  effect.scheduler = job

  // if (cb) {
  //   effect.run()
  // }
  effect.run()

  const wathchHandle: WatchHandle = () => {}

  wathchHandle.pause = () => {}
  wathchHandle.resume = () => {}
  wathchHandle.stop = () => {}

  return wathchHandle
}

export function traverse(value, depth = Infinity, seen?: Set<unknown>) {}
