import { isString, PatchFlags } from '../../shared'
import { CREATE_ELEMENT_VNODE } from './runtimeHelpers'

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

export type propsExpression = ObjectExpression

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

export interface SourceLocation {
  start: Position
  end: Position
  source: string
}

// -------------------------Node Types-------------------------------------------------
export interface Node {
  loc: SourceLocation
  type: NodeTypes
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
  tag: string | symbol | CallExpression
  props: propsExpression | undefined
  children: TemplateChildNode[] | string | undefined
  type: NodeTypes.VNODE_CALL

  dynamicProps: undefined | string

  isBlock: boolean
  isComponent: boolean
  disableTracking: boolean
  patchFlag: undefined | PatchFlags
}

export interface CompoundExpressionNode extends Node {
  type: NodeTypes.COMPOUND_EXPRESSION

  children: (
    | TextNode
    | InterpolationNode
    | SimpleExpressionNode
    | CompoundExpressionNode
    | string
  )[]
}

export interface Property extends Node {
  type: NodeTypes.JS_PROPERTY
  key: ExpressionNode
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

// 创建一个复合类型 及 element 内 既有text又有interpolation的表达式 会组成一个复合类型
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

// 创建vnode
export function createVNodeCall(
  context,
  tag: VNodeCall['tag'],
  props: VNodeCall['props'],
  children: VNodeCall['children'],
) {
  return {
    type: NodeTypes.VNODE_CALL,
    props,
    tag,
    children,
  }
}

export function getVNodeHelper() {
  return CREATE_ELEMENT_VNODE
}
