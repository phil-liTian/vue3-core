import { createComponentInstance, setupComponent } from './component'

export function render(vnode, container) {
  patch(vnode, container)
}

function patch(vnode: any, container: any) {
  processComponent(vnode, container)
}

function processComponent(vnode: any, container: any) {
  if (typeof vnode.type === 'string') {
    mountElement(vnode, container)
  } else {
    mountComponent(vnode, container)
  }
}

function mountElement(vnode, container) {
  const el = document.createElement(vnode.type)
  el.textContent = vnode.children
  container.appendChild(el)
}

function mountComponent(vnode: any, container: any) {
  const instance = createComponentInstance(vnode)

  setupComponent(instance)

  setupRenderEffect(instance, container)
}

function setupRenderEffect(instance: any, container: any) {
  const subTree = instance.render()

  patch(subTree, container)
}
