// 判断是否是对象类型
export const isObject = (val: unknown): boolean =>
  val !== null && typeof val === 'object'

export const objectToString: typeof Object.prototype.toString =
  Object.prototype.toString

export const toTypeString = (val: unknown): string => objectToString.call(val)

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
