import { describe, expect, it } from 'vitest'
import {
  isProxy,
  isReactive,
  isReadonly,
  isShallow,
  markRaw,
  reactive,
  readonly,
  shallowReactive,
  shallowReadonly,
  toRaw,
} from '../src/reactive'

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

    const shallowObserved = shallowReactive(original)
    expect(isReactive(shallowObserved)).toBe(true)
    expect(isReactive(shallowObserved.nested)).toBe(false)
    expect(isShallow(shallowObserved)).toBe(true)
    expect(isShallow(shallowObserved.nested)).toBe(false)
  })

  it('proto', () => {
    const obj = {}
    const reactiveObj = reactive(obj)
    expect(isReactive(reactiveObj)).toBe(true)
    const otherObj = { data: ['a'] }
    const prototype = reactiveObj['__proto__']
    expect(isReactive(otherObj)).toBe(false)
    const reactiveOther = reactive(otherObj)
    expect(isReactive(reactiveOther)).toBe(true)
    expect(reactiveOther.data[0]).toBe('a')
  })

  it('observed value should proxy mutations to original (object)', () => {
    const original = { foo: 1 }
    const observed = reactive(original)
    observed.foo = 2
    expect(original.foo).toBe(2)
    expect(observed.foo).toBe(2)

    delete observed.foo
    expect('foo' in observed).toBe(false)
    expect('foo' in original).toBe(false)
  })

  it('observing subtypes of InterableCollection(Map、Set)', () => {
    // subTypes
    class CustomMap extends Map {}
    const cmap = reactive(new CustomMap())

    expect(cmap).toBeInstanceOf(Map)
    expect(isReactive(cmap)).toBe(true)
    cmap.set('key', {})
    // expect(isReactive(cmap.get('key'))).toBe(true)
  })

  it('toRaw', () => {
    const original = { foo: 1 }
    const observed = reactive(original)
    expect(toRaw(observed)).toBe(original)
    expect(toRaw(original)).toBe(original)
  })

  it('markRaw', () => {
    const obj = reactive({
      foo: { a: 1 },
      bar: markRaw({ b: 2 }),
    })
    expect(isReactive(obj.foo)).toBe(true)
    expect(isReactive(obj.bar)).toBe(false)
  })

  it('markeRaw should skip non-', () => {})

  it('isProxy', () => {
    const foo = {}
    expect(isProxy(foo)).toBe(false)
    const observed = reactive(foo)
    expect(isProxy(observed)).toBe(true)

    const observedS = shallowReactive(foo)
    expect(isProxy(observedS)).toBe(true)

    const observedR = readonly(foo)
    expect(isProxy(observedR)).toBe(true)
    expect(isReadonly(observedR)).toBe(true)

    const observedSR = shallowReadonly(foo)
    expect(isProxy(observedSR)).toBe(true)
    expect(isReadonly(observedSR)).toBe(true)
    expect(isShallow(observedSR)).toBe(true)
  })
})
