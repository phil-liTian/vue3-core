export let activeEffect

class ReactiveEffect {
  private _fn: any
  constructor(fn) {
    this._fn = fn
    this.run()
  }

  run() {
    // 依赖收集的函数内容
    activeEffect = this._fn
    this._fn()
  }
}

export function effect<T = any>(fn: () => T) {
  const effect = new ReactiveEffect(fn)
}
