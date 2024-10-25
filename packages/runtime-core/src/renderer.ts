import { isOn, ShapeFlags } from '@vue/shared'
import { createComponentInstance, setupComponent } from './component'
import { createVNode } from './vnode'

// 实现自定义渲染器
export function createRenderer() {
  function render(vnode, container, parentComponent) {
    patch(vnode, container, parentComponent)
  }

  function patch(vnode: any, container: any, parentComponent) {
    processComponent(vnode, container, parentComponent)
  }

  function processComponent(vnode: any, container: any, parentComponent) {
    if (vnode.shapeFlag & ShapeFlags.ELEMENT) {
      mountElement(vnode, container, parentComponent)
    } else {
      mountComponent(vnode, container, parentComponent)
    }
  }

  function mountElement(vnode, container, parentComponent) {
    const el = (vnode.el = document.createElement(vnode.type))

    if (vnode.shapeFlag & ShapeFlags.ARRAY_CHILDREN) {
      // 注意这里的container 应该是el才对, 这样children中的元素才能正确的渲染到parentComponent中
      mountChildren(vnode.children, el, parentComponent)
    } else if (vnode.shapeFlag & ShapeFlags.TEXT_CHILDREN) {
      el.textContent = vnode.children
    }

    if (vnode.props) {
      for (const key in vnode.props) {
        if (isOn(key)) {
          const rawName = key.slice(2).toLowerCase()
          el.addEventListener(rawName, vnode.props[key])
        } else {
          el.setAttribute(key, vnode.props[key])
        }
      }
    }

    container.appendChild(el)
  }

  function mountChildren(children, container, parentComponent) {
    children.forEach(child => {
      patch(child, container, parentComponent)
    })
  }

  function mountComponent(vnode: any, container: any, parentComponent) {
    const instance = createComponentInstance(vnode, parentComponent)

    setupComponent(instance)

    setupRenderEffect(instance, instance.vnode, container)
  }

  function setupRenderEffect(instance: any, initialVNode, container: any) {
    const subTree = instance.render.call(instance.proxy)

    patch(subTree, container, instance)

    initialVNode.el = subTree.el
  }

  return {
    // render,
    createApp: rooterComponent => {
      return {
        mount: container => {
          const vnode = createVNode(rooterComponent)
          render(vnode, container, null)
        },
      }
    },
  }
}
