import { isString } from '../../shared'
import {
  CallExpression,
  CommentNode,
  CompoundExpressionNode,
  ConditionalExpression,
  ExpressionNode,
  InterpolationNode,
  NodeTypes,
  ObjectExpression,
  RootNode,
  SimpleExpressionNode,
  VNodeCall,
} from './ast'
import { CodegenOptions } from './options'
import {
  CREATE_COMMENT,
  helperNameMap,
  OPEN_BLOCK,
  RESOLVE_COMPONENT,
  RESOLVE_DIRECTIVE,
  TO_DISPLAY_STRING,
} from './runtimeHelpers'
import { isSimpleIdentifier, isValidAssetId } from './utils'

export enum NewlineType {
  Start = 0,
  End = -1,
  None = -2,
  Unknown = -3,
}

export interface CodegenContext extends CodegenOptions {
  code: string
  indentLevel: number // 缩进的个数
  helper: (key: symbol) => void
  push: (code: string, newLineIndex?: number) => void
  newline: () => void
  indent: () => void
  deindent: (withoutNewline?: boolean) => void // 回退缩进
}

const aliasHelper = (s: symbol) => `${helperNameMap[s]}: _${helperNameMap[s]}`

// 创建ast的上下文
function createCodegenContext(
  ast,
  {
    mode = 'function',
    runtimeModuleName = 'vue',
    runtimeGlobalName = 'Vue',
    optimizeImports = false,
    prefixIdentifiers = mode === 'module',
  }: CodegenOptions,
): CodegenContext {
  const context: CodegenContext = {
    code: '',
    mode,
    optimizeImports,
    runtimeModuleName,
    runtimeGlobalName,
    prefixIdentifiers,
    indentLevel: 0,

    helper(key) {
      return `_${helperNameMap[key]}`
    },
    push(code, newLineIndex = NewlineType.None) {
      context.code += code
    },

    indent() {
      newline(++context.indentLevel)
    },

    deindent(withoutNewline = false) {
      if (withoutNewline) {
        --context.indentLevel
      } else {
        newline(--context.indentLevel)
      }
    },

    // 可实现待缩减换行
    newline() {
      newline(context.indentLevel)
    },
  }

  function newline(n: number) {
    context.push('\n' + '  '.repeat(n))
  }

  return context
}

// 主方法
export function generate(ast: RootNode, options: CodegenOptions = {}) {
  const context = createCodegenContext(ast, options)

  const { push, mode, prefixIdentifiers, newline } = context
  const { temps, components, directives } = ast

  const helpers = Array.from(ast.helpers!)
  const hasHelper = helpers.length > 0
  const useWithBlock = !prefixIdentifiers && mode !== 'module'

  // 生成函数前导码
  if (mode === 'module') {
    genModulePreamble(ast, context)
  } else {
    genFunctionPreamble(ast, context)
  }
  const functionName = 'render'
  const args = ['_ctx', '_cache']
  const signarture = args.join(', ')
  push(`function ${functionName}(${signarture}) {`)

  if (useWithBlock) {
    push(`with (_ctx)`)

    if (hasHelper) {
      push(`const { ${helpers.map(aliasHelper).join(', ')} } = _Vue\n`)
    }
  }

  // 处理components
  if (components?.length) {
    genAssets(components, 'component', context)
    if (temps > 0) {
      newline()
    }
  }

  // 处理directives
  if (directives?.length) {
    genAssets(directives, 'directive', context)
    if (temps > 0) {
      newline()
    }
  }

  if (temps > 0) {
    push('let')
    for (let i = 0; i < temps; i++) {
      push(`${i > 0 ? ',' : ''} _temp${i}`)
    }
  }

  push('\n')
  push(`return `)

  // 如何生成的codegenNode??? transform??
  if (ast.codegenNode) {
    genNode(ast.codegenNode, context)
  }

  push(`}`)

  return {
    code: context.code,
  }
}

// 指定mode为module时, 使用es模块化导入
function genModulePreamble(ast: RootNode, context: CodegenContext) {
  const { push, runtimeModuleName, optimizeImports } = context
  const { helpers } = ast

  if (helpers?.size) {
    const helpers = Array.from(ast.helpers!)

    if (optimizeImports) {
      push(
        `import { ${helpers.map(h => `${helperNameMap[h]}`).join(', ')} } from ${JSON.stringify(runtimeModuleName)}\n`,
      )

      push(
        `\n//Binding optimization for webpack code-split\nconst ${helpers.map(h => `_${helperNameMap[h]} = ${helperNameMap[h]}`).join(', ')}`,
      )
    } else {
      push(
        `import { ${helpers.map(h => `${helperNameMap[h]} as _${helperNameMap[h]}`).join(', ')} } from ${JSON.stringify(runtimeModuleName)}\n`,
      )
    }
  }
}

// 函数前导
function genFunctionPreamble(ast: RootNode, context) {
  const {
    push,
    runtimeModuleName,
    mode,
    runtimeGlobalName,
    prefixIdentifiers,
  } = context
  const {} = ast

  const helper = Array.from(ast.helpers!)
  if (helper.length) {
    if (prefixIdentifiers) {
      // 将导入语句放到整个函数块之前
      push(`const { ${helper.map(aliasHelper).join(', ')} } = Vue\n`)
    } else {
      push(`const _Vue = ${runtimeGlobalName}\n`)
    }
  }
  genHoist(ast.hoists, context)

  push('return ')
}

// 处理 components、directives
function genAssets(
  assets: string[],
  type: 'component' | 'directive',
  { push, helper, newline }: CodegenContext,
) {
  const resolver = helper(
    type === 'component' ? RESOLVE_COMPONENT : RESOLVE_DIRECTIVE,
  )
  for (let i = 0; i < assets.length; i++) {
    let id = assets[i]

    const maybeSetReference = id.endsWith('__self')
    if (maybeSetReference) {
      id = id.slice(0, -6)
    }

    push(
      `const ${isValidAssetId(id, type)} = ${resolver}(${JSON.stringify(id)}${maybeSetReference ? ', true' : ''})`,
    )

    // 不是最后一个assets则末尾换行处理
    if (i < assets.length - 1) {
      newline()
    }
  }
}

// 处理静态提升
function genHoist(hoist, context) {
  const { push, newline } = context
  if (!hoist?.length) return
  for (let i = 0; i < hoist.length; i++) {
    const exp = hoist[i]
    if (exp) {
      push(`const _hoisted_${i + 1} = `)
      genNode(exp, context)

      newline()
    }
  }
}

// 处理node的核心入口函数
function genNode(node: any, context) {
  switch (node.type) {
    case NodeTypes.ELEMENT:
    case NodeTypes.IF:
    case NodeTypes.FOR:
      genNode(node.codegenNode, context)
      break
    case NodeTypes.TEXT:
      genText(node, context)
      break

    case NodeTypes.SIMPLE_EXPRESSION:
      genExpression(node, context)
      break
    case NodeTypes.JS_OBJECT_EXPRESSION: {
      genObjectExpression(node, context)
      break
    }
    case NodeTypes.INTERPOLATION: {
      genInterpolation(node, context)
      break
    }
    case NodeTypes.COMMENT: {
      genComment(node, context)
      break
    }
    case NodeTypes.COMPOUND_EXPRESSION: {
      genCompoundExpression(node, context)
      break
    }
    case NodeTypes.JS_CONDITIONAL_EXPRESSION: {
      genConditionalExpression(node, context)
      break
    }
    case NodeTypes.VNODE_CALL: {
      genVNodeCall(node, context)
      break
    }
    case NodeTypes.JS_CALL_EXPRESSION: {
      genCallExpression(node, context)
      break
    }
  }
}

// 处理纯文本
function genText(node, context) {
  const { push } = context
  push(JSON.stringify(node.content))
}

// 处理简单表达式
function genExpression(node: SimpleExpressionNode, context: CodegenContext) {
  const { push } = context
  const { isStatic, content } = node
  push(isStatic ? JSON.stringify(content) : content)
}

// 处理js对象
function genObjectExpression(node: ObjectExpression, context: CodegenContext) {
  const { properties } = node
  const { push, newline } = context
  if (!properties.length) {
    return
  }

  push('{ ')

  for (let i = 0; i < properties.length; i++) {
    const { key, value } = properties[i]
    // 处理对象的key
    genExpressionAsPropertyKey(key, context)
    push(': ')
    // 处理对象的value
    genNode(value, context)
    // 同样的 如果不是第一个 就换行展示
    if (i < properties.length - 1) {
      newline()
    }
  }

  push(' }')
}

// 处理插值
function genInterpolation(node: InterpolationNode, context: CodegenContext) {
  const { content } = node
  const { push, helper } = context
  push(`${helper(TO_DISPLAY_STRING)}(`)
  genNode(content, context)
  push(')')
}

// 处理注释
function genComment(node: CommentNode, context: CodegenContext) {
  const { push, helper } = context
  push(`${helper(CREATE_COMMENT)}(${JSON.stringify(node.content)})`)
}

// 处理CompoundExpressionNode的node, children是一个数组, 是各种元素的集合
function genCompoundExpression(
  node: CompoundExpressionNode,
  context: CodegenContext,
) {
  const { push } = context
  for (let i = 0; i < node.children.length; i++) {
    const child = node.children[i]
    if (isString(child)) {
      push(child as string)
    } else {
      genNode(child, context)
    }
  }
}

// 处理条件语句
function genConditionalExpression(
  node: ConditionalExpression,
  context: CodegenContext,
) {
  const { push, indent, newline } = context
  const { test, consequent, alternate, newline: needNewline } = node
  if (test.type === NodeTypes.SIMPLE_EXPRESSION) {
    genExpression(test, context)
  }
  needNewline && indent()
  needNewline || push(` `)
  push('? ')
  genNode(consequent, context)
  context.indentLevel--
  needNewline && newline()
  push(': ')
  genNode(alternate, context)
}

function genVNodeCall(node: VNodeCall, context: CodegenContext) {
  const { isBlock, disableTracking } = node
  const { push, helper } = context
  if (isBlock) {
    push(`(${helper(OPEN_BLOCK)}(${disableTracking ? `true` : ''})`)
  }
}

function genCallExpression(node: CallExpression, context: CodegenContext) {
  const { push, helper } = context
}

// ---------------------------- utils -------------------------------
// 处理js对象的key
function genExpressionAsPropertyKey(
  node: ExpressionNode,
  context: CodegenContext,
) {
  const { push } = context
  if (node.isStatic) {
    const text = isSimpleIdentifier(node.content)
      ? node.content
      : JSON.stringify(node.content)

    push(text)
  }
}
