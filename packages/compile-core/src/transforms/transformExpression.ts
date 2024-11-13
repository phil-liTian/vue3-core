import { isString } from '../../../shared'
import { createSimpleExpression, NodeTypes } from '../ast'
import { TransformContext } from '../transform'

// 处理InterpolationNode
export function transformExpression(node, context) {
  return () => {
    if (node.type === NodeTypes.INTERPOLATION) {
      node.content = processExpression(node.content, context)
      const content = node.content

      node.codegenNode = {
        type: NodeTypes.INTERPOLATION,
        content: isString(content)
          ? createSimpleExpression(content as string, true)
          : content,
      }
    }
  }
}

export function processExpression(node, context: TransformContext) {
  return createSimpleExpression(`_ctx.${node.content}` as string, false)
}
