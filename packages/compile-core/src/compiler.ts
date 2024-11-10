import { generate } from './codegen'
import { baseParse } from './parser'
import { transform } from './transform'

export function baseCompiler(source) {
  const ast = baseParse(source)

  transform(ast)

  return generate(ast)
}
