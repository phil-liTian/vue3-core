export enum NameSpaces {
  HTML,
}

export enum NodeTypes {
  TEXT,
  INTERPOLATION,
  SIMPLE_EXPRESSION,
  ELEMENT,
  ROOT,
  COMPOUND_EXPRESSION,
  VNODE_CALL,
  JS_CALL_EXPRESSION,
  JS_OBJECT_EXPRESSION,
  JS_PROPERTY,
  JS_ARRAY_EXPRESSION,
  JS_FUNCTION_EXPRESSION,
}

export enum ElementTypes {
  ELEMENT,
}

export type ElementNode = any

export type TemplateChildNode = ElementNode | TextNode

// loc记录行、列、偏移量
export interface Position {
  line: number
  offset: number
  column: number
}

export interface Node {
  loc: SourceLocation
  type: NodeTypes
}

export interface SourceLocation {
  start: Position
  end: Position
  source: string
}

export interface TextNode extends Node {
  type: NodeTypes.TEXT
  content: string
}

export interface RootNode extends Node {
  type: NodeTypes.ROOT
  source: string
  children: Node[]
  codegenNode?: TemplateChildNode
  helpers?: Set<symbol>
  temps: number
}

export type ParentNode = ElementNode | RootNode

// AST Utilities ---------------------------------------------------------------

export const locStub: SourceLocation = {
  start: { line: 1, column: 1, offset: 0 },
  end: { line: 1, column: 1, offset: 0 },
  source: '',
}

export function createRoot(children, source): RootNode {
  return {
    type: NodeTypes.ROOT,
    source,
    children,
    loc: locStub,
    codegenNode: undefined,
    temps: 0,
  }
}
