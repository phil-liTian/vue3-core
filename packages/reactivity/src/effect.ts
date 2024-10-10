import { extend, hasChanged } from '@vue/shared'
import { ReactiveFlags } from './constant'
import { Dep, Link } from './dep'
import { ComputedRefImpl } from './computed'
import { activeEffectScope } from './effectScope'

export let activeEffect

export enum EffectFlags {
  ACTIVE = 1 << 0,
  RUNNING = 1 << 1,
  DIRTY = 1 << 4, // 标识计算属性是否需要重新计算
  PAUSE = 1 << 6, // 标识是否暂停监听
}

export interface ReactiveEffectOptions {
  scheduler?: () => void
  onStop?: () => void
}

export interface Subscriber {
  deps?: Link
  flags: EffectFlags
  notify(): true | void
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

  // 链表尾部
  depsTail?: Link = undefined
  constructor(fn) {
    if (activeEffectScope && activeEffectScope.active) {
      activeEffectScope.effects.push(this)
    }

    this._fn = fn
  }

  run() {
    // 依赖收集的函数内容
    activeEffect = this

    return this._fn()
  }

  stop() {
    for (let link = this.deps; link; link = link.nextDep) {
      link.dep.cleanup()
    }

    this.onStop && this.onStop()
  }

  trigger() {
    if (this.flags & EffectFlags.PAUSE) {
      // 暂停状态 不再触发更新
    } else if (this.scheduler) {
      this.scheduler()
    } else {
      this.run()
    }
  }

  // 通知需要更新batchedSub
  notify() {
    batch(this)
  }

  pause() {
    this.flags |= EffectFlags.PAUSE
  }

  resume() {
    if (this.flags & EffectFlags.PAUSE) {
      // 取消暂停状态
      this.flags &= ~EffectFlags.PAUSE

      // 取消之后立即执行一次
      this.trigger()
    }
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

// 处理computed
export function refreshComputed(computed: ComputedRefImpl) {
  // 不需要重新计算
  if (!(computed.flags & EffectFlags.DIRTY)) {
    return
  }

  // 清除DIRTY标志位的目的
  // computed.flags &= ~EffectFlags.DIRTY

  const value = computed.fn(computed._value)
  if (hasChanged(value, computed._value)) {
    computed._value = value
  }
}
