import { NodeTypes } from '../ast'

export function transformElement(node, context) {
  return () => {
    node.codegenNode = {
      type: NodeTypes.VNODE_CALL,
    }
  }
}
