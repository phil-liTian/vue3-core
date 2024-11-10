import { isString } from '../../shared'

// ------------------------------types------------------------------------------
export enum NameSpaces {
  HTML,
}

export enum NodeTypes {
  TEXT,
  INTERPOLATION,
  SIMPLE_EXPRESSION,
  COMMENT,
  ELEMENT,
  ROOT,
  COMPOUND_EXPRESSION,

  // containers
  IF,
  FOR,

  // codegen
  JS_CONDITIONAL_EXPRESSION,
  VNODE_CALL,
  JS_PROPERTY,
  JS_OBJECT_EXPRESSION,
  JS_ARRAY_EXPRESSION,
  JS_FUNCTION_EXPRESSION,
  JS_CALL_EXPRESSION,
}

export enum ElementTypes {
  ELEMENT,
}

export type ElementNode = any

export type TemplateChildNode =
  | ElementNode
  | TextNode
  | CommentNode
  | ForNode
  | InterpolationNode
  | CompoundExpressionNode

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

export type JSChildNode =
  | ConditionalExpression
  | ExpressionNode
  | ObjectExpression

export interface CallExpression extends Node {
  type: NodeTypes.JS_CALL_EXPRESSION
  callee: string | symbol
  arguments: (string | symbol)[]
}

export interface RootNode extends Node {
  type: NodeTypes.ROOT
  source: string
  children: Node[]
  codegenNode?: TemplateChildNode
  helpers?: Set<symbol>
  temps: number
  directives?: string[]
  components?: string[]
  hoists?: (JSChildNode | null)[]
}

export enum ConstantTypes {
  NOT_CONSTANT = 0,
  CAN_SKIP_PATCH,
  CAN_CACHE,
  CAN_STRINGIFY,
}

export interface SimpleExpressionNode extends Node {
  type: NodeTypes.SIMPLE_EXPRESSION
  content: string
  isStatic: boolean
  constType: ConstantTypes
}

export type ExpressionNode = SimpleExpressionNode

export interface InterpolationNode extends Node {
  type: NodeTypes.INTERPOLATION
  content: ExpressionNode | string
}

export interface CommentNode extends Node {
  type: NodeTypes.COMMENT
  content: string
}

export interface CompoundExpressionNode extends Node {
  type: NodeTypes.COMPOUND_EXPRESSION
  children: (
    | CompoundExpressionNode
    | string
    | InterpolationNode
    | SimpleExpressionNode
  )[]
}

export interface ConditionalExpression extends Node {
  type: NodeTypes.JS_CONDITIONAL_EXPRESSION
  test: JSChildNode
  consequent: JSChildNode
  alternate: JSChildNode
  newline: boolean
}

export interface IfConditionalExpression extends ConditionalExpression {
  consequent: any
  alternate: any
}

export interface ForNode extends Node {
  type: NodeTypes.FOR
  source: ExpressionNode
  valueAlias: ExpressionNode | undefined
  keyAlias: ExpressionNode | undefined
  objectIndexAlias: ExpressionNode | undefined
  parseResult: ForParseResult
  children: TemplateChildNode[]
}

export interface ForParseResult {
  source: ExpressionNode
  key: ExpressionNode | undefined
  value: ExpressionNode | undefined
  index: ExpressionNode | undefined
  finalized: boolean
}

export interface VNodeCall extends Node {
  type: NodeTypes.VNODE_CALL

  isBlock: boolean
  isComponent: boolean
  disableTracking: boolean
}

export interface Property extends Node {
  type: NodeTypes.JS_PROPERTY
  key: JSChildNode
  value: JSChildNode
}

export interface ObjectExpression extends Node {
  type: NodeTypes.JS_OBJECT_EXPRESSION
  properties: Array<Property>
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

// 创建一个简单的表达式
export function createSimpleExpression(
  content: SimpleExpressionNode['content'],
  isStatic: SimpleExpressionNode['isStatic'] = false,
  loc: SourceLocation = locStub,
  constType: ConstantTypes = ConstantTypes.NOT_CONSTANT,
): SimpleExpressionNode {
  return {
    type: NodeTypes.SIMPLE_EXPRESSION,
    content,
    isStatic,
    loc,
    constType,
  }
}

// 创建一个对象属性
export function createObjectProperty(
  key: Property['key'],
  value: Property['value'],
): Property {
  return {
    type: NodeTypes.JS_PROPERTY,
    key,
    value,
    loc: locStub,
  }
}

// 创建一个对象表达式
export function createObjectExpression(
  properties: ObjectExpression['properties'],
  loc: SourceLocation = locStub,
): ObjectExpression {
  return {
    type: NodeTypes.JS_OBJECT_EXPRESSION,
    loc,
    properties,
  }
}

// 创建一个插值表达式
export function createInterpolation(
  content: InterpolationNode['content'] | string,
  loc: SourceLocation,
): InterpolationNode {
  return {
    type: NodeTypes.INTERPOLATION,
    content: isString(content)
      ? createSimpleExpression(content as string, false, loc)
      : content,
    loc: locStub,
  }
}

export function createCompoundExpression(
  children: CompoundExpressionNode['children'],
  loc: SourceLocation = locStub,
): CompoundExpressionNode {
  return {
    type: NodeTypes.COMPOUND_EXPRESSION,
    loc,
    children,
  }
}

// 创建一个条件表达式
export function createConditionalExpression(
  test: ConditionalExpression['test'],
  consequent: ConditionalExpression['consequent'],
  alternate: ConditionalExpression['alternate'],
  newline = true,
): ConditionalExpression {
  return {
    type: NodeTypes.JS_CONDITIONAL_EXPRESSION,
    test,
    consequent,
    alternate,
    newline,
    loc: locStub,
  }
}

// 创建一个call表达式
export function createCallExpression<T extends CallExpression['callee']>(
  callee: T,
  args: CallExpression['arguments'] = [],
  loc: SourceLocation = locStub,
) {
  return {
    type: NodeTypes.JS_CALL_EXPRESSION,
    callee,
    arguments: args,
    loc,
  }
}
