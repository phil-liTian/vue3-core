import { TrackOpTypes } from './constant'
import { ARRAY_ITERATE_KEY, track } from './dep'
import { toRaw, toReactive } from './reactive'

function reactiveReadArray<T>(array: T[]): T[] {
  const raw = toRaw(array)
  if (raw === array) return raw
  track(raw, TrackOpTypes.ITERATE, ARRAY_ITERATE_KEY)

  return raw.map(toReactive)
}

export const arrayInstrumentations = <any>{
  join(separator?: string) {
    // console.log('separator', reactiveReadArray(this))

    return reactiveReadArray(this).join(separator)
  },

  push(...args: unknown[]) {
    return noTracking(this, 'push', args)
  },

  shift() {
    return noTracking(this, 'shift')
  },

  pop() {
    return noTracking(this, 'pop')
  },
}

// 不需要被track的方法

function noTracking(
  self: unknown[],
  method: keyof Array<any>,
  args: unknown[] = [],
) {
  const res = (toRaw(self) as any)[method].apply(self, args)

  return res
}
