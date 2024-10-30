import { isOn, ShapeFlags } from '@vue/shared'
import { effect } from '@vue/reactivity'
import { createComponentInstance, setupComponent } from './component'
import { createVNode, VNode } from './vnode'

// 实现自定义渲染器
export function createRenderer() {
  function render(vnode, container, parentComponent) {
    patch(null, vnode, container, parentComponent)
  }

  function patch(n1, vnode: any, container: any, parentComponent) {
    if (vnode.shapeFlag & ShapeFlags.ELEMENT) {
      processElement(n1, vnode, container, parentComponent)
    } else {
      processComponent(n1, vnode, container, parentComponent)
    }
  }

  function processComponent(
    n1: VNode | null,
    n2: any,
    container: any,
    parentComponent,
  ) {
    if (n1 === null) {
      // 如果没有n1 说明是挂载组件
      mountComponent(n2, container, parentComponent)
    } else {
      // 如何更新component呢？？？
      updateComponent(n1, n2)
    }
  }

  function processElement(n1, vnode, container, parentComponent) {
    if (n1 === null) {
      mountElement(vnode, container, parentComponent)
    } else {
      // 更新Element
      patchElement(n1, vnode, container, parentComponent)
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

  // TODO: 如何更新element
  function patchElement(n1, n2, container, parentComponent) {
    const el = (n2.el = n1.el)

    // console.log('n1, n2', n1, n2)

    console.log('update element')
  }

  function mountChildren(children, container, parentComponent) {
    children.forEach(child => {
      patch(null, child, container, parentComponent)
    })
  }

  function mountComponent(vnode: any, container: any, parentComponent) {
    const instance = (vnode.component = createComponentInstance(
      vnode,
      parentComponent,
    ))

    setupComponent(instance)

    setupRenderEffect(instance, instance.vnode, container)
  }

  function updateComponent(n1, n2) {
    const instance = (n2.component = n1.component)
    instance.update()
    instance.next = n2
  }

  function setupRenderEffect(instance: any, initialVNode, container: any) {
    instance.update = effect(() => {
      if (!instance.isMounted) {
        const subTree = instance.render.call(instance.proxy)
        patch(null, subTree, container, instance)
        instance.isMounted = true
        instance.subTree = subTree
      } else {
        const { next, vnode } = instance
        // TODO: 更新逻辑
        if (next) {
          next.el = vnode.el
          updateComponentPreRender(instance, next)
        }

        const prevTree = instance.subTree || null
        const subTree = instance.render.call(instance.proxy)
        patch(prevTree, subTree, container, instance)
        instance.subTree = subTree
        initialVNode.el = subTree.el
      }
    })
  }

  function updateComponentPreRender(instance, nextVNode) {
    // let prevProps = instance.vnode.props
    // prevProps = nextVNode.props
    instance.vnode = nextVNode
    instance.next = null
    instance.props = nextVNode.props
  }

  return {
    render,
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
