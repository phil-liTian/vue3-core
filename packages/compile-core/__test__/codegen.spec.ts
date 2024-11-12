import { describe, expect, test } from 'vitest'
import { generate } from '../src/codegen'
import {
  createConditionalExpression,
  createCallExpression,
  createCompoundExpression,
  createInterpolation,
  createObjectExpression,
  createObjectProperty,
  createSimpleExpression,
  locStub,
  NodeTypes,
  RootNode,
} from '../src/ast'

import {
  CREATE_COMMENT,
  CREATE_VNODE,
  FRAGMENT,
  helperNameMap,
  RENDER_LIST,
  RESOLVE_COMPONENT,
  RESOLVE_DIRECTIVE,
  TO_DISPLAY_STRING,
  CREATE_ELEMENT_VNODE,
} from '../src/runtimeHelpers'
import { createElementWithCodegen, genFlagText } from './testUtils'
import { PatchFlags } from '../../shared'

function createRoot(options: Partial<RootNode> = {}): RootNode {
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

  test('assets + temps', () => {
    const root = createRoot({
      components: [`Foo`, `bar-baz`, `barbaz`, `Qux__self`],
      directives: ['my_dir_0', 'my_dir_1'],
      temps: 3,
    })

    const { code } = generate(root, { mode: 'function' })
    expect(code).toMatch(
      `const _component_Foo = _${helperNameMap[RESOLVE_COMPONENT]}("Foo")\n`,
    )

    expect(code).toMatch(
      `const _component_bar_baz = _${helperNameMap[RESOLVE_COMPONENT]}("bar-baz")\n`,
    )

    expect(code).toMatch(
      `const _component_barbaz = _${helperNameMap[RESOLVE_COMPONENT]}("barbaz")\n`,
    )

    expect(code).toMatch(
      `const _component_Qux = _${helperNameMap[RESOLVE_COMPONENT]}("Qux", true)\n`,
    )

    expect(code).toMatch(
      `const _directive_my_dir_0 = _${helperNameMap[RESOLVE_DIRECTIVE]}("my_dir_0")\n`,
    )
    expect(code).toMatch(
      `const _directive_my_dir_1 = _${helperNameMap[RESOLVE_DIRECTIVE]}("my_dir_1")\n`,
    )

    expect(code).toMatch('let _temp0, _temp1, _temp2')
  })

  test('hoists', () => {
    const root = createRoot({
      hoists: [
        createSimpleExpression(`hello`, false, locStub),
        createObjectExpression(
          [
            createObjectProperty(
              createSimpleExpression(`id`, true, locStub),
              createSimpleExpression(`foo`, true, locStub),
            ),
          ],
          locStub,
        ),
      ],
    })
    const { code } = generate(root)
    expect(code).toMatch(`const _hoisted_1 = hello`)
    expect(code).toMatch(`const _hoisted_2 = { id: "foo" }`)
    expect(code).toMatchSnapshot()
  })

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

  test('interpolation', () => {
    const { code } = generate(
      createRoot({
        codegenNode: createInterpolation('hello', locStub),
      }),
    )

    expect(code).toMatch(`return _${helperNameMap[TO_DISPLAY_STRING]}(hello)`)
  })

  test('comment', () => {
    const { code } = generate(
      createRoot({
        codegenNode: {
          type: NodeTypes.COMMENT,
          content: 'foo',
          loc: locStub,
        },
      }),
    )

    expect(code).toMatch(`return _${helperNameMap[CREATE_COMMENT]}("foo")`)
  })

  test('compound expression', () => {
    const { code } = generate(
      createRoot({
        codegenNode: createCompoundExpression(
          [
            '_ctx.',
            createSimpleExpression('foo', false, locStub),
            ' + ',
            {
              type: NodeTypes.INTERPOLATION,
              loc: locStub,
              content: createSimpleExpression('bar', false, locStub),
            },
            createCompoundExpression([' + ', 'nested']),
          ],
          locStub,
        ),
      }),
    )

    expect(code).toMatch(
      `return _ctx.foo + _${helperNameMap[TO_DISPLAY_STRING]}(bar) + nested`,
    )
  })

  test('ifNode', () => {
    const { code } = generate(
      createRoot({
        codegenNode: {
          type: NodeTypes.IF,
          loc: locStub,
          // branches: [],
          codegenNode: createConditionalExpression(
            createSimpleExpression('foo', false),
            createSimpleExpression('bar', false),
            createSimpleExpression('baz', false),
          ),
        },
      }),
    )

    expect(code).toMatch(/return foo\s+\? bar\s+: baz/)
  })

  test('forNode', () => {
    const { code } = generate(
      createRoot({
        codegenNode: {
          type: NodeTypes.FOR,
          loc: locStub,
          source: createSimpleExpression('foo', false),
          valueAlias: undefined,
          keyAlias: undefined,
          codegenNode: {
            type: NodeTypes.VNODE_CALL,
            tag: FRAGMENT,
            isBlock: true,
            disableTracking: true,
            children: createCallExpression(RENDER_LIST),
          },
        },
      }),
    )

    expect(code).toMatch(`openBlock(true)`)
  })

  test('Element (callExpression + objectExpression + TemplateChildNode[])', () => {
    const { code } = generate(
      createRoot({
        codegenNode: createElementWithCodegen(
          `"div"`,
          createObjectExpression(
            [
              createObjectProperty(
                createSimpleExpression('id', true, locStub),
                createSimpleExpression('foo', true, locStub),
              ),
              createObjectProperty(
                createSimpleExpression(`prop`, false, locStub),
                createSimpleExpression(`bar`, false, locStub),
              ),
            ],
            locStub,
          ),
          [
            createElementWithCodegen(
              `"p"`,
              createObjectExpression(
                [
                  createObjectProperty(
                    // should quote the key!
                    createSimpleExpression(`some-key`, true, locStub),
                    createSimpleExpression(`foo`, true, locStub),
                  ),
                ],
                locStub,
              ),
            ),
          ],
          PatchFlags.FULL_PROPS,
        ),
      }),
    )

    expect(code).toMatch(
      `
    return _${helperNameMap[CREATE_ELEMENT_VNODE]}("div", {
      id: "foo",
      [prop]: bar
    }, [
      _${helperNameMap[CREATE_ELEMENT_VNODE]}("p", { "some-key": "foo" })
    ], ${genFlagText(PatchFlags.FULL_PROPS)})`,
    )

    expect(code).toMatchSnapshot()
  })
})
