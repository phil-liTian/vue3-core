export let activeEffect

export interface ReactiveEffectOptions {
  scheduler?: () => void
}

class ReactiveEffect {
  private _fn: any
  scheduler?: any
  constructor(fn) {
    this._fn = fn
  }

  run() {
    // 依赖收集的函数内容
    activeEffect = this._fn

    this._fn()
  }
}

export function effect<T = any>(fn: () => T, options?: ReactiveEffectOptions) {
  const effect = new ReactiveEffect(fn)

  if (options) {
    effect.scheduler = options.scheduler
  }

  try {
    effect.run()
  } catch (err) {
    throw err
  }

  const runner = effect.run.bind(effect)
  return runner
}
