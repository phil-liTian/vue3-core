import { NodeTypes, RootNode } from "./ast"
import { CodegenOptions } from "./options"
import { helperNameMap } from "./runtimeHelpers"


export enum NewlineType {
  Start = 0,
  End = -1,
  None = -2,
  Unknown = -3,
}

export interface CodegenContext extends CodegenOptions {
  code: string,
  indentLevel: number, // 缩进的个数
  push: (code: string, newLineIndex?: number) => void
  newline: () => void
  indent: () => void
  deindent: (withoutNewline?: boolean) => void // 回退缩进
}

const aliasHelper = (s: symbol) => `${helperNameMap[s]}: _${helperNameMap[s]}`

// 创建ast的上下文
function createCodegenContext(ast, {
  mode = 'function',
  runtimeModuleName = 'vue',
  runtimeGlobalName = 'Vue',
  optimizeImports = false,
  prefixIdentifiers = mode === 'module'
}: CodegenOptions): CodegenContext {
  const context: CodegenContext = {
    code: '',
    mode,
    optimizeImports,
    runtimeModuleName,
    runtimeGlobalName,
    prefixIdentifiers,
    indentLevel: 0,
    push(code, newLineIndex = NewlineType.None) {
      context.code += code
    },  

    indent() { 
      newline(++context.indentLevel)
    },

    deindent(withoutNewline = false) {
      if ( withoutNewline ) {
        --context.indentLevel
      } else {
        newline(--context.indentLevel)
      }
    },

    // 可实现待缩减换行
    newline() {
      newline(context.indentLevel)
    }
  }

  function newline(n: number) {
    context.push('\n' + '  '.repeat(n))
  }

  return context
}

// 主方法
export function generate(ast: RootNode, options: CodegenOptions = {}) {
  const context = createCodegenContext(ast, options)
  
  const { push, mode, prefixIdentifiers } = context
  const { temps } = ast

  const helpers = Array.from(ast.helpers!)
  const hasHelper = helpers.length > 0
  const useWithBlock = !prefixIdentifiers && mode !== 'module'
  

  // 生成函数前导码
  if ( mode === 'module' ) {
    genModulePreamble(ast, context)
  } else {
    genFunctionPreamble(ast, context)
  }
  const functionName = 'render'
  const args = ['_ctx', '_cache']
  const signarture = args.join(', ')
  push(`function ${functionName}(${signarture}) {`)

  if ( useWithBlock ) {
    push(`with (_ctx)`)
    
    if ( hasHelper ) {
      push(`const { ${helpers.map(aliasHelper).join(', ')} } = _Vue\n`)
    }
  }

  if ( temps > 0 ) {
    push('let')
    for (let i = 0; i < temps; i++) {
      push(`${i > 0 ? ',' : ''} _temp${i}`)      
    }
  }
  push('\n')
  push(`return `)

  // 如何生成的codegenNode??? transform??
  if ( ast.codegenNode ) {
    genNode(ast.codegenNode, context)
  }

  push(`}`)

  return {
    code: context.code,
  }
}

// 指定mode为module时, 使用es模块化导入
function genModulePreamble (ast: RootNode, context: CodegenContext) {
  const { push, runtimeModuleName, optimizeImports } = context
  const { helpers } = ast

  if ( helpers?.size ) {
    const helpers = Array.from(ast.helpers!)

    if ( optimizeImports ) {
      push(`import { ${helpers.map(h => `${helperNameMap[h]}`).join(', ')} } from ${JSON.stringify(runtimeModuleName)}\n`)


      push(`\n//Binding optimization for webpack code-split\nconst ${helpers.map(h => `_${helperNameMap[h]} = ${helperNameMap[h]}`).join(', ')}`)

    } else {
      push(`import { ${helpers.map(h => `${helperNameMap[h]} as _${helperNameMap[h]}`).join(', ')} } from ${JSON.stringify(runtimeModuleName)}\n`)
    }
  }
}

function genFunctionPreamble(ast: RootNode, context) {
  const { push, runtimeModuleName, mode, runtimeGlobalName, prefixIdentifiers } = context
  const { } = ast


  const helper = Array.from(ast.helpers!)
  if ( helper.length ) {
    if ( prefixIdentifiers ) {
      // 将导入语句放到整个函数块之前
      push(`const { ${helper.map(aliasHelper).join(', ')} } = Vue\n`)
    } else {
      push(`const _Vue = ${runtimeGlobalName}\n`)
    }
  }

  push('return ')
}

function genNode(node: any, context ) {
  switch( node.type ) {
    case NodeTypes.TEXT:
      genText(node, context)
      break
    case NodeTypes.ELEMENT: 
      genNode(node.codegenNode, context)
      break
  }
}

function genText(node, context) {
  const { push } = context
  push(JSON.stringify(node.content))
}
