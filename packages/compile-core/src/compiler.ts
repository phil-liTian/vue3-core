import { extend } from '../../shared'
import { generate } from './codegen'
import { baseParse } from './parser'
import { transform } from './transform'

export function baseCompiler(source) {
  const ast = baseParse(source)

  const resolvedOptions = extend({}, {
    prefixIdentifiers: true,
  })

  transform(ast, extend({}, resolvedOptions))

  return generate(ast, resolvedOptions)
}
