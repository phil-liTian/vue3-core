import { ReactiveFlags } from './constant'
import { Dep } from './dep'

class RefImpl {
  _value: any
  dep: Dep = new Dep()
  public [ReactiveFlags.IS_REF] = true
  constructor(rawValue) {
    this._value = rawValue
  }

  get value() {
    this.dep.track()
    return this._value
  }

  set value(newValue) {
    this._value = newValue
    this.dep.trigger()
  }
}

function createRef(value) {
  return new RefImpl(value)
}

export function ref(value?: unknown) {
  return createRef(value)
}

export function isRef(r: any): boolean {
  return !!(r && r[ReactiveFlags.IS_REF])
}
