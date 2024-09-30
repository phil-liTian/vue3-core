import { isFunction, NOOP } from '@vue/shared'
import { ReactiveEffect } from './effect'

export type WatchSource<T> = () => T

export function watch<T>(source: WatchSource<T>) {
  let getter: () => any = NOOP
  if (isFunction(source)) {
    getter = source
  }

  const effect = new ReactiveEffect(getter)
  effect.run()
}
