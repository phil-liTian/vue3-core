import { describe, it, expect, test } from 'vitest'
import { createVNode, Comment } from '../src/vnode'

describe('vnode', () => {
  it('create with just tag', () => {
    const vnode = createVNode('div')
    expect(vnode.type).toBe('div')
    expect(vnode.props).toBe(null)
  })

  test('create with tag and props', () => {
    const vnode = createVNode('p', {})
    expect(vnode.type).toBe('p')
    expect(vnode.props).toEqual({})
  })

  test('create with tag, props with children', () => {
    const vnode = createVNode('p', {}, 'hello')
    expect(vnode.type).toBe('p')
    expect(vnode.props).toEqual({})
    expect(vnode.children).toBe('hello')
  })

  test('create with null as props', () => {
    const vnode = createVNode('p', null)
    expect(vnode.type).toBe('p')
    expect(vnode.props).toBe(null)
  })

  test('show warn when create Invalid VNode type', () => {
    const vnode = createVNode('')
    expect('Invalid vnode type when creating vnode').toHaveBeenWarned()
    expect(vnode.type).toBe(Comment)
  })
})
