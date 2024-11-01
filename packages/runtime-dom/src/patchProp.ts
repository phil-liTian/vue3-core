import { RendererOptions } from '@vue/runtime-core'
import { isOn } from '@vue/shared'

export const patchProp: RendererOptions['patchProp'] = (el, key, value) => {
  if (isOn(key)) {
    const rawName = key.slice(2).toLowerCase()
    el.addEventListener(rawName, value)
  } else {
    if (value === undefined || value === null) {
      el.removeAttribute(key)
    } else {
      el.setAttribute(key, value)
    }
  }
}
