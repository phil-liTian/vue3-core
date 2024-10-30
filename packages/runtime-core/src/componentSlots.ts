import { isArray } from '@vue/shared'

export function initSlots(instance, children) {
  const { vnode } = instance

  // instance.slots = isArray(children) ? children : [children]
  let slots = {}
  for (const key in children) {
    const value = children[key]
    if (value) {
      slots[key] = isArray(value) ? value : [value]
    }
  }

  instance.slots = slots
}
