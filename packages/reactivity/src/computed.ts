export type ComputedGetter<T> = (oldValue?: T) => T

export class ComputedRefImpl<T = any> {
  constructor(public fn: ComputedGetter<T>) {}

  get value() {
    return this.fn()
  }
}

export function computed<T>(getter) {
  return new ComputedRefImpl(getter)
}
