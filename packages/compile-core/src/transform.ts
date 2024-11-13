import { NodeTypes, RootNode, TemplateChildNode } from './ast'
import { TransformOptions } from './options'
import { TO_DISPLAY_STRING } from './runtimeHelpers'

// transform上下文
export interface TransformContext {
  root: RootNode
  nodeTransforms: NodeTransform[]
  // 父节点
  parent: null | ParentNode
  // 当前节点
  currentNode: null | RootNode

  helpers: Map<symbol, number>

  helper<T extends symbol>(key: T): T
}

export type NodeTransform = (
  node: RootNode | TemplateChildNode,
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
    helpers: new Map(),

    helper(name) {
      const count = context.helpers.get(name) || 0
      context.helpers.set(name, count + 1)
      return name
    },
  }

  return context
}

// 语义分析
export function transform(
  root: RootNode,
  options: TransformOptions = {},
): void {
  const context = createTransformContext(root, options)
  traverseNode(root, context)

  createRootCodegen(root, context)

  root.helpers = new Set([...context.helpers.keys()])
}

export function traverseNode(
  node: RootNode | TemplateChildNode,
  context: TransformContext,
) {
  // 一定要在transform执行前, 赋值currentNode
  context.currentNode = node

  const { nodeTransforms, helper } = context

  let exitFns: any[] = []
  for (let i = 0; i < nodeTransforms.length; i++) {
    const onExit = nodeTransforms[i](node, context)

    if (onExit) {
      exitFns.push(onExit)
    }
  }

  switch (node.type) {
    case NodeTypes.INTERPOLATION: {
      helper(TO_DISPLAY_STRING)
      break
    }

    // 注意： 这里如果是element也需要遍历
    case NodeTypes.ELEMENT:
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
