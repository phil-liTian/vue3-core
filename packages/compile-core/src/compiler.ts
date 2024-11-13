import { extend } from '../../shared'
import { generate } from './codegen'
import { baseParse } from './parser'
import { transform } from './transform'
import { transformElement } from './transforms/transformElement'
import { transformExpression } from './transforms/transformExpression'
import { transformText } from './transforms/transformText'

export function getBaseTransformPreset() {
  return [[transformExpression, transformElement, transformText]]
}

export function baseCompiler(source) {
  const ast = baseParse(source)

  const [nodeTransforms] = getBaseTransformPreset()

  const resolvedOptions = extend(
    {},
    {
      prefixIdentifiers: true,
    },
  )

  transform(
    ast,
    extend({}, resolvedOptions, {
      nodeTransforms: [...nodeTransforms],
    }),
  )

  return generate(ast, resolvedOptions)
}
