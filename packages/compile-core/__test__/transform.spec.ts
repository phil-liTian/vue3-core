import { describe, expect, it, test } from 'vitest'
import { baseParse } from '../src/parser'
import { NodeTransform, transform } from '../src/transform'
import { ElementNode } from '../src/ast'

describe('compiler: transform', () => {
  test('context state', () => {
    const ast = baseParse('<div>hi, {{message}}</div>')
    const calls: any[] = []

    const plugins: NodeTransform = (node, context) => {
      calls.push([node, { ...context }])
    }

    transform(ast, {
      nodeTransforms: [plugins],
    })

    const div = ast.children[0] as ElementNode

    expect(calls.length).toBe(4)

    expect(calls[0]).toMatchObject([
      ast,
      {
        parent: null,
        currentNode: ast,
      },
    ])

    expect(calls[1]).toMatchObject([
      div,
      {
        parent: ast,
        currentNode: div
      },
    ])

    expect(calls[2]).toMatchObject([
      div.children[0],
      {
        parent: div,
        currentNode: div.children[0]
      },
    ])

    expect(calls[3]).toMatchObject([
      div.children[1],
      {
        parent: div,
        currentNode: div.children[1]
      },
    ])
  })
})
