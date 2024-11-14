export enum TestNodeType {
  TEXT = 'text',
  ELEMENT = 'element',
}

export type TestNode = TestElement

export interface TestElement {
  type: TestNodeType.ELEMENT
  children: TestNode[]
}

function createElement(tag) {
  const node = {
    tag,
    children: [],
    props: {},
  }

  return node
}

function insert() {}

function setElementText() {}

export const nodeOps: {
  insert: typeof insert
  createElement: typeof createElement
  setElementText: typeof setElementText
} = {
  insert,
  createElement,
  setElementText,
}
