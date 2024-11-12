import { isArray, isObject, isString } from '@vue/shared'
import { VNodeChildren } from '../component'
import { isReactive } from '@vue/reactivity'

// v-for string
export function renderList(
  source: string,
  renderItem: (value: string, index: number) => VNodeChildren,
): VNodeChildren[]

// v-for number
export function renderList(
  source: number,
  renderItem: (value: number, index: number) => VNodeChildren,
): VNodeChildren[]

// v-for array
export function renderList<T>(
  source: T,
  renderItem: (value: T, index: number) => VNodeChildren,
): VNodeChildren[]

// v-for object
export function renderList<T>(
  source: T,
  renderItem: <K extends keyof T>(
    value: T[K],
    key: K,
    index: number,
  ) => VNodeChildren,
): VNodeChildren[]

export function renderList(
  source: any,
  renderItem: (...args: any[]) => VNodeChildren,
): VNodeChildren[] {
  let ret: VNodeChildren[] = []
  const sourceIsArray = isArray(source)
  if (sourceIsArray || isString(source)) {
    const sourceIsReactiveArray = sourceIsArray && isReactive(source)

    for (let i = 0; i < source.length; i++) {
      const value = source[i]
      ret[i] = renderItem(value, i)
    }
  } else if (typeof source === 'number') {
    ret = new Array(source)

    for (let i = 0; i < ret.length; i++) {
      ret[i] = renderItem(i + 1, i)
    }
  } else if (isObject(source)) {
    if (source[Symbol.iterator]) {
      ret = Array.from(source, (item, index) => {
        return renderItem(item, index)
      })
    } else {
      const keys = Object.keys(source)
      ret = new Array(keys.length)
      for (let i = 0; i < keys.length; i++) {
        const key = keys[i]
        ret[i] = renderItem(source[key], key, i)
      }
    }
  } else {
    ret = []
  }

  return ret
}
