import { ReactiveFlags, TriggerOpTypes } from './constant'
import { trigger } from './dep'
import { toRaw } from './reactive'

function set(this, key, value) {
  const target = toRaw(this)
  target.set(key, value)

  // trigger(target, TriggerOpTypes.SET, key, value)

  return this
}

function createInstrucmentations() {
  const mutableInstrucmentations = {
    get() {},
    set,
  }

  return {
    mutableInstrucmentations,
  }
}

const { mutableInstrucmentations } = createInstrucmentations()

const createInstrumentationGetter = (target, key, receiver) => {
  if (key === ReactiveFlags.IS_REACTIVE) {
    return true
  }

  if (key === ReactiveFlags.RAW) {
    return target
  }

  return Reflect.get(mutableInstrucmentations, key, receiver)
}

export const mutableCollectionHandlers: ProxyHandler<any> = {
  get: createInstrumentationGetter,
}

export const shallowCollectionHandlers: ProxyHandler<any> = {
  get: createInstrumentationGetter,
}

export const readonlyCollectionHandlers: ProxyHandler<any> = {
  get: createInstrumentationGetter,
}
