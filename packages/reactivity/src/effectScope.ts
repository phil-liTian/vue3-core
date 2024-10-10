import { ReactiveEffect } from './effect'
import { warn } from './warning'

export let activeEffectScope: EffectScope | undefined

export class EffectScope {
  private _active = true

  effects: ReactiveEffect[] = []

  cleanups: (() => void)[] = []

  constructor() {}

  get active() {
    return this._active
  }
  run(fn) {
    if (this._active) {
      activeEffectScope = this
      return fn()
    }
  }

  stop() {
    if (this._active) {
      let i

      for (i = 0; i < this.effects.length; i++) {
        this.effects[i].stop()
      }

      for (i = 0; i < this.cleanups.length; i++) {
        this.cleanups[i]()
      }

      this._active = false
    }
  }
}

export function effectScope() {
  return new EffectScope()
}
// 如果存在activeEffectScope, 则向cleanups中收集fn, 当执行stop的时候, 依次执行这些fn
export function onScopeDispose(fn: () => void, failSilently = false) {
  if (activeEffectScope) {
    activeEffectScope.cleanups.push(fn)
  } else if (!failSilently) {
    warn(
      `onScopeDispose() is called when there is no active effect scope` +
        ` to be associated with.`,
    )
  }
}
