import { describe, expect, test } from 'vitest'
import { generate } from '../src/codegen'
import { locStub, NodeTypes, RootNode } from '../src/ast'
import {
  CREATE_VNODE,
  helperNameMap,
  RESOLVE_DIRECTIVE,
} from '../src/runtimeHelpers'

function createRoot(options = {}) {
  return {
    type: NodeTypes.ROOT,
    source: '',
    children: [],
    helpers: new Set(),
    loc: locStub,
    temps: 0,
    ...options,
  } as RootNode
}

describe('compiler: codegen', () => {
  test('mode preamble', () => {
    const root = createRoot({
      helpers: new Set([CREATE_VNODE, RESOLVE_DIRECTIVE]),
    })

    const { code } = generate(root, { mode: 'module' })

    expect(code).toMatch(
      `import { ${helperNameMap[CREATE_VNODE]} as _${helperNameMap[CREATE_VNODE]}, ${helperNameMap[RESOLVE_DIRECTIVE]} as _${helperNameMap[RESOLVE_DIRECTIVE]} } from "vue"`,
    )
    expect(code).toMatchSnapshot()
  })

  test('w/ optimizeImports: true', () => {
    const root = createRoot({
      helpers: new Set([CREATE_VNODE, RESOLVE_DIRECTIVE]),
    })

    const { code } = generate(root, { mode: 'module', optimizeImports: true })

    expect(code).toMatch(
      `import { ${helperNameMap[CREATE_VNODE]}, ${helperNameMap[RESOLVE_DIRECTIVE]} } from "vue"`,
    )

    expect(code).toMatch(
      `const _${helperNameMap[CREATE_VNODE]} = ${helperNameMap[CREATE_VNODE]}, _${helperNameMap[RESOLVE_DIRECTIVE]} = ${helperNameMap[RESOLVE_DIRECTIVE]}`,
    )
  })

  test('function mode preamble', () => {
    const root = createRoot({
      helpers: new Set([CREATE_VNODE, RESOLVE_DIRECTIVE]),
    })
    const { code } = generate(root, { mode: 'function' })
    expect(code).toMatch(`const _Vue = Vue`)

    expect(code).toMatch(
      `const { ${helperNameMap[CREATE_VNODE]}: _${helperNameMap[CREATE_VNODE]}, ${helperNameMap[RESOLVE_DIRECTIVE]}: _${helperNameMap[RESOLVE_DIRECTIVE]} } = _Vue`,
    )
    expect(code).toMatchSnapshot()
  })

  test('function mode preamble w/ prefixIdentifiers: true', () => {
    const root = createRoot({
      helpers: new Set([CREATE_VNODE, RESOLVE_DIRECTIVE]),
    })
    const { code } = generate(root, {
      mode: 'function',
      prefixIdentifiers: true,
    })
    expect(code).not.toMatch(`const _Vue = Vue`)
    expect(code).toMatch(
      `const { ${helperNameMap[CREATE_VNODE]}: _${helperNameMap[CREATE_VNODE]}, ${helperNameMap[RESOLVE_DIRECTIVE]}: _${helperNameMap[RESOLVE_DIRECTIVE]} } = Vue`,
    )
    expect(code).toMatchSnapshot()
  })

  test('assets + temps', () => {})

  // test('hoists', () => {
  //   const root = createRoot({
  //     hoists: [
  //       createSimpleExpression(`hello`, false, locStub),
  //       createObjectExpression(
  //         [
  //           createObjectProperty(
  //             createSimpleExpression(`id`, true, locStub),
  //             createSimpleExpression(`foo`, true, locStub),
  //           ),
  //         ],
  //         locStub,
  //       ),
  //     ],
  //   })
  //   const { code } = generate(root)
  //   expect(code).toMatch(`const _hoisted_1 = hello`)
  //   expect(code).toMatch(`const _hoisted_2 = { id: "foo" }`)
  //   expect(code).toMatchSnapshot()
  // })

  test('temps', () => {
    const root = createRoot({
      temps: 3,
    })
    const { code } = generate(root)
    expect(code).toMatch(`let _temp0, _temp1, _temp2`)
    expect(code).toMatchSnapshot()
  })

  test('static text', () => {
    const { code } = generate(
      createRoot({
        codegenNode: {
          type: NodeTypes.TEXT,
          content: 'hello',
          loc: locStub,
        },
      }),
    )

    expect(code).toMatch(`return "hello"`)
    expect(code).toMatchSnapshot()
  })
})
