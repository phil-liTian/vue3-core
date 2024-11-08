import { baseCompiler } from '@vue/compile-core'

export function compile(template) {
  return baseCompiler(template)
}
