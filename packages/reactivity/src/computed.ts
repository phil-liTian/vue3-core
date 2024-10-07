export type ComputedGetter<T> = (oldValue?: T) => T

export class ComputedRefImpl<T = any> {
  // computed也是一个ref类型
  readonly __v_isRef = true
  constructor(public fn: ComputedGetter<T>) {}

  get value() {
    return this.fn()
  }
}

export function computed<T>(getter) {
  return new ComputedRefImpl(getter)
}
