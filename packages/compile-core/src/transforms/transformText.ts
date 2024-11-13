import {
  createCompoundExpression,
  CompoundExpressionNode,
  NodeTypes,
} from '../ast'
import { NodeTransform } from '../transform'
import { isText } from '../utils'

// 将 TextNode 和 InterpolationNode合并成一个复合节点 CompoundExpressionNode
export const transformText: NodeTransform = (node, context) => {
  return () => {
    if (node.type === NodeTypes.ELEMENT || node.type === NodeTypes.ROOT) {
      const children = node.children
      let currentContainer: undefined | CompoundExpressionNode = undefined
      for (let i = 0; i < children.length; i++) {
        const child = children[i]

        if (isText(child)) {
          for (let j = i + 1; j < children.length; j++) {
            const next = children[j]
            if (isText(next)) {
              if (!currentContainer) {
                currentContainer = children[i] = createCompoundExpression(
                  [child],
                  child.loc,
                )
              }

              currentContainer.children.push(' + ', next)
              children.splice(j, 1)
              j--
            } else {
              currentContainer = undefined
              break
            }
          }
        }
      }
    }
  }
}
