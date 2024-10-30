import { describe, expect, test } from 'vitest'
import { createVNode } from '../src/vnode'
import { h } from '../src/h'

describe('renderer: h', () => {
  test('type only', () => {
    expect(h('div')).toMatchObject(createVNode('div'))
  })

  test('type + props', () => {
    expect(h('div', { id: 'foo' })).toMatchObject(
      createVNode('div', { id: 'foo' }),
    )
  })

  // array
  test('type + omit props', () => {
    // array
    expect(h('div', ['foo'])).toMatchObject(createVNode('div', null, ['foo']))

    // default slot
    const Component = { template: '<br />' }
    const slot = () => {}

    expect(h(Component, slot)).toMatchObject(createVNode(Component, null, slot))

    const vnode = h('div')

    expect(h('div', vnode)).toMatchObject(createVNode('div', null, [vnode]))

    expect(h('div', 'foo')).toMatchObject(createVNode('div', null, 'foo'))

  })

  test('type + props + children', () => {
    expect(h('div', {}, ['foo'])).toMatchObject(createVNode('div', {}, ['foo']))

    const slots = {}
    expect(h('div', {}, slots)).toMatchObject(createVNode('div', {}, slots))

    const Component = { template: '<br />' }
    expect(h(Component, {}, slots)).toMatchObject(
      createVNode(Component, {}, slots),
    )

    const slot = () => {}
    expect(h(Component, {}, slot)).toMatchObject(
      createVNode(Component, {}, slot),
    )

    // vnode
    const vnode = h('div')
    expect(h('div', {}, vnode)).toMatchObject(createVNode('div', {}, [vnode]))

    // text
    expect(h('div', {}, 'foo')).toMatchObject(createVNode('div', {}, 'foo'))
  })

  test('should work with named slot', () => {
    const Component = { template: '<br />' }
    const slot = () => {}

    expect(h(Component, null, { foo: slot })).toMatchObject(
      createVNode(Component, null, { foo: slot }),
    )
  })

  test('support variadic children', () => {
    // @ts-expect-error
    const vnode = h('div', null, h('span'), h('span'))
    expect(vnode.children).toMatchObject([
      {
        type: 'span',
      },
      {
        type: 'span',
      },
    ])
  })
})
