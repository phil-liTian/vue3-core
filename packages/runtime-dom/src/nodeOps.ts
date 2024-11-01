import type { RendererOptions } from '@vue/runtime-core'

export const nodeOps: Omit<RendererOptions, 'patchProp'> = {
  insert(child, parent, anchor) {
    parent.insertBefore(child, anchor || null)
  },

  createElement(tag) {
    const el = document.createElement(tag)
    return el
  },

  setElementText: (el, text) => {
    el.textContent = text
  },

  remove: child => {
    const parent = child.parentNode

    if (parent) parent.removeChild(child)
  },
}
