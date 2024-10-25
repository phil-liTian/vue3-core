export const PublicPropertiesMap = {
  $el: i => i.vnode.el,
  $props: i => i.props,
}

// 处理组件代理对象(在render函数中 通过this访问相关属性)
export const PublicInstanceProxyHandlers = {
  get: ({ _: instance }, key) => {
    if (key in instance.setupState) {
      return instance.setupState[key]
    }

    if (key in instance.props) {
      return instance.props[key]
    }

    const publicGetter = PublicPropertiesMap[key]
    if (publicGetter) {
      return publicGetter(instance)
    }
  },
}
