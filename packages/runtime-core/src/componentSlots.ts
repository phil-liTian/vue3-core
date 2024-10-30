import { isArray, ShapeFlags } from '@vue/shared'

export function initSlots(instance, children) {
  if (instance.vnode.shapeFlag & ShapeFlags.SLOTS_CHILDREN) {
    normalizeObjectSlots(instance.slots, children)
  }
}

function normalizeObjectSlots(slots, children) {
  for (const key in children) {
    const value = children[key]
    if (value) {
      slots[key] = props => normalizeSlotValue(value(props))
    }
  }
}

// 兼容value是对象或者数组的情况
function normalizeSlotValue(value) {
  return isArray(value) ? value : [value]
}
