import { extend } from '../../shared'
import { generate } from './codegen'
import { baseParse } from './parser'
import { transform } from './transform'
import { transformElement } from './transforms/transfromElement'

export function getBaseTransformPreset() {
  return [[transformElement]]
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
