export * from '@vue/reactivity'

export * from '@vue/runtime-dom'
import * as runtimeDom from '@vue/runtime-dom'

import { compile } from '@vue/compile-dom'

function compileToFunction(template) {
  const { code } = compile(template)

  const render = new Function('Vue', code)(runtimeDom)

  return render
}

import { registerRuntimeCompiler } from '@vue/runtime-core'

registerRuntimeCompiler(compileToFunction)
