import { extend } from '@vue/shared'
import { ReactiveFlags } from './constant'
import { Dep, Link } from './dep'

export let activeEffect

export enum EffectFlags {
  ACTIVE = 1 << 0,
  RUNNING = 1 << 1,
}

export interface ReactiveEffectOptions {
  scheduler?: () => void
  onStop?: () => void
}

export interface Subscriber {
  deps?: Link
  flags?: EffectFlags
}

export interface ReactiveEffectRunner<T> {
  (): T
  effect: ReactiveEffect
}

export class ReactiveEffect {
  private _fn: any
  scheduler?: any
  onStop?: () => void
  flags: EffectFlags = EffectFlags.ACTIVE
  // 用作反向收集dep, 实现stop方法
  deps?: Link = undefined
  constructor(fn) {
    this._fn = fn
  }

  run() {
    // 依赖收集的函数内容
    activeEffect = this

    return this._fn()
  }

  stop() {
    // this.deps.forEach(dep => dep.delete(this))
    for (let link = this.deps; link; link = link.nextDep) {
      link.dep.cleanup()
    }
    this.onStop && this.onStop()
    // this.deps = undefined
  }

  trigger() {
    if (this.scheduler) {
      this.scheduler()
    } else {
      this.run()
    }
  }

  // 通知需要更新batchedSub
  notify() {
    batch(this)
  }
}

export function effect<T = any>(
  fn: () => T,
  options?: ReactiveEffectOptions,
): ReactiveEffectRunner<T> {
  const effect = new ReactiveEffect(fn)

  if (options) {
    extend(effect, options)
  }

  try {
    effect.run()
  } catch (err) {
    throw err
  }

  const runner = effect.run.bind(effect) as ReactiveEffectRunner<T>
  runner.effect = effect
  return runner
}

export function stop<T>(runner: ReactiveEffectRunner<T>) {
  runner.effect.stop()
}

// 收集Subscriber
let batchedSub: Subscriber | undefined

export function batch(sub: Subscriber): void {
  batchedSub = sub
}

export function startBatch() {}

// 遍历当前的batchedSub, 触发trigger函数
export function endBatch() {
  // while(batchedSub) {
  // }
  let effect = batchedSub
  let error: unknown

  try {
    ;(effect as ReactiveEffect).trigger()
  } catch (err) {
    if (!error) error = err
  }

  // if (error) throw error
}
