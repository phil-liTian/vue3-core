import { isFunction } from '@vue/shared'
import { ReactiveFlags } from './constant'
import { Dep, globalVersion } from './dep'
import { EffectFlags, refreshComputed } from './effect'
import { Ref } from './ref'

interface BaseComputedRef<T, S = T> extends Ref<T, S> {}

export interface ComputedRef<T = any> extends BaseComputedRef<T> {
  readonly value: T
}

export interface WritableComputedRef<T, S = T> extends BaseComputedRef<T, S> {}

export type ComputedGetter<T> = (oldValue?: T) => T
export type ComputedSetter<T> = (newValue: T) => void

export type WritableComputedOptions<T> = {
  get: ComputedGetter<T>
  set: ComputedSetter<T>
}

export class ComputedRefImpl<T = any> {
  _value: any = undefined
  // computed也是一个ref类型
  readonly __v_isRef = true

  readonly dep: Dep = new Dep(this)

  flags: EffectFlags = EffectFlags.DIRTY

  globalVersion: number = globalVersion - 1
  constructor(
    public fn: ComputedGetter<T>,
    private readonly setter: ComputedSetter<T> | undefined,
  ) {
    this[ReactiveFlags.IS_READONLY] = !setter
  }

  notify() {
    console.log('notify')
  }

  get value() {
    this.dep.track()
    // 处理computed中逻辑, 在getter时 才会调用fn, lazyComputed
    refreshComputed(this)
    return this._value
  }

  set value(newValue) {
    if (this.setter) {
      this.setter(newValue)
    } else {
    }
  }
}

export function computed<T>(
  getterOrOptions: ComputedGetter<T> | WritableComputedOptions<T>,
) {
  let getter: ComputedGetter<T>
  let setter: ComputedSetter<T> | undefined
  if (isFunction(getterOrOptions)) {
    getter = getterOrOptions
  } else {
    getter = getterOrOptions.get
    setter = getterOrOptions.set
  }

  const cRef = new ComputedRefImpl(getter, setter)

  return cRef
}
