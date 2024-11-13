import { createVNode } from '../../../runtime-core/src/vnode'
import { createVNodeCall, NodeTypes, VNodeCall } from '../ast'
import { genNode } from '../codegen'
import { CREATE_ELEMENT_VNODE } from '../runtimeHelpers'

export function transformElement(node, context) {
  return () => {
    if (!(node.type === NodeTypes.ELEMENT)) return

    context.helper(CREATE_ELEMENT_VNODE)

    const { tag } = node
    const vnodeTag = `"${tag}"`
    let vnodeProps: VNodeCall['props']
    let vnodeChildren: VNodeCall['children']
    vnodeChildren = node.children

    if (node.children.length > 0) {
      if (node.children.length === 1) {
        vnodeChildren = node.children[0]
      } else {
        vnodeChildren = node.children
      }
    }

    node.codegenNode = createVNodeCall(
      context,
      vnodeTag,
      vnodeProps,
      vnodeChildren,
    )
  }
}
