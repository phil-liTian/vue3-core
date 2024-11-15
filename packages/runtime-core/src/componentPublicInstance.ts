import { hasOwn } from '@vue/shared'

export type ComponentPublicInstance<TypeEl extends Element = any> = {
  $el: TypeEl
}

export const PublicPropertiesMap = {
  $el: i => i.vnode.el,
  $props: i => i.props,
  $slots: i => i.slots,
}

// 处理组件代理对象(在render函数中 通过this访问相关属性)
export const PublicInstanceProxyHandlers = {
  get: ({ _: instance }, key) => {
    const { appContext } = instance
    if (key in instance.setupState) {
      return instance.setupState[key]
    }

    if (key in instance.props) {
      return instance.props[key]
    }

    let globalProperties
    const publicGetter = PublicPropertiesMap[key]
    if (publicGetter) {
      return publicGetter(instance)
    } else if (
      ((globalProperties = appContext.config.globalProperties),
      hasOwn(globalProperties, key))
    ) {
      return globalProperties[key]
    }
  },
}
