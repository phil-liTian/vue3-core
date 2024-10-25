import { currentInstance } from './component'

export type InjectionKey = Symbol | string

// 实现跨级组件通讯
export function provide(key, value) {
  if (!currentInstance) {
    return
  }
  let provides = currentInstance.provides

  // 获取父组件的provides
  const parentProvides =
    currentInstance.parent && currentInstance.parent.provides

  // 说明是第一次(如果当前组件有parentProvides，则provides和parentProvides指向同一个对象)
  if (provides === parentProvides) {
    // 将当前provides的原型指向父级组件中provides, 这样一来
    // 在inject中注入key时, 如果在当前父组件provides中找不到, 就会去parentProvides中找
    provides = currentInstance.provides = Object.create(parentProvides)
  }

  provides[key] = value
}

export function inject(key, defaultValue) {
  const instance = currentInstance
  const provides = (instance && instance.parent?.provides) || {}

  return provides[key]
}
