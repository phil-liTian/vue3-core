import { describe, expect, test, vi } from 'vitest'
import { baseParse } from '../src/parser'
import {
  ElementNode,
  ElementTypes,
  InterpolationNode,
  NameSpaces,
  NodeTypes,
  TextNode,
} from '../src/ast'
import { ErrorCodes } from '../src/errors'

describe('compile: parse', () => {
  describe('text', () => {
    test('simple-text', () => {
      const ast = baseParse('some text')
      const text = ast.children[0]
      expect(text).toStrictEqual({
        type: NodeTypes.TEXT,
        content: 'some text',
        loc: {
          start: { offset: 0, line: 1, column: 1 },
          end: { offset: 9, line: 1, column: 10 },
          source: 'some text',
        },
      })
    })

    test('纯文本附带不合法的标签', () => {
      const onError = vi.fn()
      const ast = baseParse('some text')
      const text = ast.children[0] as TextNode

      // expect(onError.mock.calls).toMatchObject([
      //   [
      //     {
      //       code: ErrorCodes.X_INVALID_END_TAG,
      //       loc: {
      //         start: { column: 10, line: 1, offset: 9 },
      //         end: { column: 10, line: 1, offset: 9 },
      //       },
      //     },
      //   ],
      // ])
    })

    test('text with interpolation', () => {
      const ast = baseParse('some {{ foo + bar }} text')
      const text1 = ast.children[0] as TextNode
      const text2 = ast.children[2] as TextNode

      expect(text1).toStrictEqual({
        type: NodeTypes.TEXT,
        content: 'some ',
        loc: {
          start: { offset: 0, line: 1, column: 1 },
          end: { offset: 5, line: 1, column: 6 },
          source: 'some ',
        },
      })

      expect(text2).toStrictEqual({
        type: NodeTypes.TEXT,
        content: ' text',
        loc: {
          start: { offset: 20, line: 1, column: 21 },
          end: { offset: 25, line: 1, column: 26 },
          source: ' text',
        },
      })
    })
  })

  describe('Interpolation', () => {
    test('simple Interpolation', () => {
      const ast = baseParse('{{message}}')
      const interpolation = ast.children[0] as InterpolationNode
      expect(interpolation).toMatchObject({
        type: NodeTypes.INTERPOLATION,
        content: {
          type: NodeTypes.SIMPLE_EXPRESSION,
          content: 'message',
          isStatic: false,
          loc: {
            start: { offset: 2, line: 1, column: 3 },
            end: { offset: 9, line: 1, column:10 },
          }
        },
        loc: {
          start: { offset: 0, line: 1, column: 1 },
          end: { offset: 11, line: 1, column: 12 },
          source: '{{message}}',
        }
      })
    })
  })

  describe('Element', () => {
    test('simple div', () => {
      const ast = baseParse('<div>hello</div>')

      const element = ast.children[0] as ElementNode
      expect(element).toStrictEqual({
        type: NodeTypes.ELEMENT,
        tag: 'div',
        ns: NameSpaces.HTML,
        tagType: ElementTypes.ELEMENT,
        codegenNode: undefined,
        props: [],
        children: [
          {
            type: NodeTypes.TEXT,
            content: 'hello',
            loc: {
              start: { offset: 5, line: 1, column: 6 },
              end: { offset: 10, line: 1, column: 11 },
              source: 'hello',
            },
          },
        ],
        loc: {
          start: { offset: 0, line: 1, column: 1 },
          end: { offset: 16, line: 1, column: 17 },
          source: '<div>hello</div>',
        },
      })
    })
  })
})
