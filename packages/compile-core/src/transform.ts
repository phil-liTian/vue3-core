import { NodeTypes, RootNode, TemplateChildNode } from './ast'
import { TransformOptions } from './options'

// transform上下文
export interface TransformContext {
  root: RootNode
  nodeTransforms: NodeTransform[]
  // 父节点
  parent: null | ParentNode
  // 当前节点
  currentNode: null | RootNode
}

export type NodeTransform = (
  node: RootNode,
  context: TransformContext,
) => void | (() => void)

export function createTransformContext(
  root,
  { nodeTransforms = [] }: TransformOptions,
): TransformContext {
  const context: TransformContext = {
    root,
    nodeTransforms,
    parent: null,
    currentNode: root,
  }

  // root.codegenNode = {
  //   type: NodeTypes.TEXT,
  //   content: root.source,
  // }

  return context
}

// 语义分析
export function transform(
  root: RootNode,
  options: TransformOptions = {},
): void {
  console.log('options', options.nodeTransforms)

  const context = createTransformContext(root, options)

  traverseNode(root, context)

  createRootCodegen(root, context)
}

export function traverseNode(
  node: RootNode | TemplateChildNode,
  context: TransformContext,
) {
  // 一定要在transform执行前, 赋值currentNode
  context.currentNode = node

  const { nodeTransforms } = context

  let exitFns: any[] = []
  for (let i = 0; i < nodeTransforms.length; i++) {
    const onExit = nodeTransforms[i](node, context)

    if (onExit) {
      exitFns.push(onExit)
    }
  }

  switch (node.type) {
    case NodeTypes.ELEMENT: {
    }

    case NodeTypes.ROOT: {
      traverseChildren(node, context)
      break
    }
  }

  let i = exitFns.length
  while (i--) {
    exitFns[i]()
  }
}

export function traverseChildren(
  parent: ParentNode,
  context: TransformContext,
) {
  for (let i = 0; i < parent.children.length; i++) {
    const child = parent.children[i]
    context.parent = parent
    traverseNode(child, context)
  }
}

function createRootCodegen(root: RootNode, context) {
  const { children } = root

  if (children.length === 1) {
    const child = children[0]
    root.codegenNode = child
  } else if (children.length > 1) {
    root.codegenNode = {
      type: NodeTypes.TEXT,
      content: 'multi children not supported yet',
    }
  } else {
    // no children return null
  }
}
