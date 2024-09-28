import { ReactiveFlags, TrackOpTypes, TriggerOpTypes } from './constant'
import { ITERATE_KEY, track, trigger } from './dep'
import { Target, toRaw, toReactive, toReadonly } from './reactive'

type WeakCollection = (WeakMap<any, any> | WeakSet<any>) & Target
type InterableCollection = (Map<any, any> | Set<any>) & Target
type MapTypes = (Map<any, any> | WeakMap<any, any>) & Target
type SetTypes = (Set<any> | WeakSet<any>) & Target
type CollectionTypes = InterableCollection | WeakCollection

const getProto = <T extends CollectionTypes>(v: T): any =>
  Reflect.getPrototypeOf(v)

// 创建一个可迭代的方法
function createIterableMethod(method: string | symbol) {
  return function (this, ...args: []) {
    console.log('this', this)
  }
}

function get(
  target: MapTypes,
  key: unknown,
  isReadonly: boolean,
  isShallow: boolean,
) {
  target = target[ReactiveFlags.RAW]

  const rawTatget = toRaw(target)
  const wrap = isReadonly ? toReadonly : toReactive

  const { has } = getProto(rawTatget)

  if (has.call(rawTatget, key)) {
    return wrap(target.get(key))
  }

  track(target, TrackOpTypes.GET, key)
}

function set(this, key, value) {
  const target = toRaw(this)

  target.set(key, value)

  trigger(target, TriggerOpTypes.SET, value)

  return this
}

function has(this, key) {
  const target = this[ReactiveFlags.RAW]
  const targetRaw = toRaw(target)
  return targetRaw.has(key)
}

function add(this, key) {
  const target = toRaw(this)
  const targetRaw = toRaw(target)
  targetRaw.add(key)

  trigger(target, TriggerOpTypes.ADD, key)

  return this
}

function createInstrucmentations() {
  const mutableInstrucmentations = {
    get(this: MapTypes, key) {
      return get(this, key, false, false)
    },
    set,
    has,
    add,

    // [Symbol.iterator](this: MapTypes) {
    //   const target = this[ReactiveFlags.RAW]
    //   const rawTarget = toRaw(target)

    //   track(rawTarget, TrackOpTypes.ITERATE, ITERATE_KEY)
    // },
  }

  const iteratorMethods = ['keys', 'values', 'entries', Symbol.iterator]

  iteratorMethods.forEach(method => {
    mutableInstrucmentations[method] = createIterableMethod(method)
  })

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
