import { describe, expect, test } from 'vitest'
import { createVNode } from '../src/vnode'
import { h } from '../src/h'

describe('renderer: h', () => {
  test('type only', () => {
    expect(h('div')).toMatchObject(createVNode('div'))
  })
})
