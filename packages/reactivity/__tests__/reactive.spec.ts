import { describe, expect, it } from 'vitest'
import { isReactive, reactive } from '../src/reactive'

describe('reactivity/reactive', () => {
  it('object', () => {
    const original = { foo: 1 }
    const observed = reactive(original)
    expect(observed).not.toBe(original)
    expect(observed.foo).toBe(1)
    expect('foo' in observed).toBe(true)
    expect(Object.keys(observed)).toEqual(['foo'])
    expect(isReactive(observed)).toBe(true)
    expect(isReactive(original)).toBe(false)
  })

  it('nested reactive', () => {
    const original = {
      nested: {
        foo: 1,
      },
      array: [{ bar: 2 }],
    }
    const observed = reactive(original)
    expect(isReactive(observed.nested)).toBe(true)
    expect(isReactive(observed.array)).toBe(true)
    expect(isReactive(observed.array[0])).toBe(true)
  })
})
