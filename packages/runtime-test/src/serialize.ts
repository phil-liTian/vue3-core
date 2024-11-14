import { TestElement, TestNodeType } from './nodeOps'

export function serializeInner(
  node: TestElement,
  indent: number = 0,
  depth: number = 0,
): string {
  const newline = indent ? '\n' : ''

  return node.children.length
    ? newline +
        node.children
          .map(child => serialize(child, indent, depth + 1))
          .join(newline)
    : ''
}

export function serialize(
  node: TestElement,
  indent: number = 0,
  depth: number = 0,
): string {
  if (node.type === TestNodeType.ELEMENT) {
    return serializeElement(node, indent, depth)
  } else {
    return serializeText(node, indent, depth)
  }
}

function serializeElement(node, indent, depth): string {
  return ''
}

function serializeText(node, indent, depth): string {
  return ''
}
