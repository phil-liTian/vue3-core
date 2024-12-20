export const NOOP = (): void => {}

export const EMPTY_OBJ = {}
export const EMPTY_ARR = []
// 判断是否是对象类型
export const isObject = (val: unknown): boolean =>
  val !== null && typeof val === 'object'

export const objectToString: typeof Object.prototype.toString =
  Object.prototype.toString

export const toTypeString = (val: unknown): string => objectToString.call(val)

export const isArray: typeof Array.isArray = Array.isArray
export const isMap = (val: unknown): boolean =>
  toTypeString(val) === '[object Map]'

export const isString = (val: unknown): boolean => typeof val === 'string'

export const isSymbol = (val: unknown): boolean => typeof val === 'symbol'

// val is Function 类型谓词, 可更清晰地表达代码中的逻辑，更容易理解变量的类型在不同情况下的变化
export const isFunction = (val: unknown): val is Function =>
  typeof val === 'function'

export const toRawType = (val: unknown): string =>
  toTypeString(val).slice(8, -1)

// 对象上是否存在某个属性
const hasOwnProperty = Object.prototype.hasOwnProperty
export const hasOwn = (val: object, key: string) =>
  hasOwnProperty.call(val, key)

// 给可拓展对象添加属性
export const def = (obj: object, key: string, val: any): void => {
  Object.defineProperty(obj, key, { value: val })
}

export const isIntegerKey = (key: unknown): boolean => {
  return (
    isString(key) && key !== 'NAN' && '' + parseInt(key as string, 10) === key
  )
}

export const extend: typeof Object.assign = Object.assign

export const hasChanged = (value: any, oldValue: any): boolean =>
  !Object.is(value, oldValue)

export const isOn = (key: string): boolean => /^on[A-Z]/.test(key)

export const invokeArrayFns = (fns: Function[], ...args: any[]) => {
  for (let i = 0; i < fns.length; i++) {
    fns[i](...args)
  }
}

// 将中划线转化成驼峰命名
export const camelize = (str: string): string => {
  return str.replace(/-(\w)/g, (_, c) => (c ? c.toUpperCase() : ''))
}

// 首字母转化成大写
export const capitalize = (str: string): string => {
  return str.charAt(0).toUpperCase() + str.slice(1)
}
