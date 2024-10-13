import { describe, expect, it, test } from 'vitest'
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
import { effect } from '../src'

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

  it('markRaw should skip non-extensible objects', () => {
    const obj = Object.seal({ foo: 1 })
    expect(() => markRaw(obj)).not.toThrowError()
  })

  // it('markeRaw should skip non-', () => {})

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

  it('测试(weakSet、weakMap)', () => {
    class CustomMap extends WeakMap {}
    const cmap = reactive(new CustomMap())
    expect(cmap).toBeInstanceOf(WeakMap)
    expect(isReactive(cmap)).toBe(true)
    const key = {}
    cmap.set(key, {})
    expect(isReactive(cmap.get(key))).toBe(true)

    class CustomSet extends WeakSet {}
    const cset = reactive(new CustomSet())
    expect(cset).toBeInstanceOf(WeakSet)
    expect(isReactive(cset)).toBe(true)
    let dummy
    effect(() => (dummy = cset.has(key)))
    expect(dummy).toBe(false)
    cset.add(key)
    expect(dummy).toBe(true)
  })

  it('测试map、set', () => {
    // subTypes
    class CustomMap extends Map {}
    const cmap = reactive(new CustomMap())

    expect(cmap).toBeInstanceOf(Map)
    expect(isReactive(cmap)).toBe(true)
    cmap.set('key', {})

    expect(isReactive(cmap.get('key'))).toBe(true)
    class CustomSet extends Set {}
    const cset = reactive(new CustomSet())
    expect(cset).toBeInstanceOf(Set)
    expect(isReactive(cset)).toBe(true)
    let dummy
    effect(() => (dummy = cset.has('key')))
    expect(dummy).toBe(false)
    cset.add('key')
    expect(dummy).toBe(true)
  })

  it('observed value should proxy mutations to original (object)', () => {
    const original: any = { foo: 1 }
    const observed = reactive(original)
    // 新增的属性可以直接监听到
    observed.bar = 2
    expect(observed.bar).toBe(2)
    expect(original.bar).toBe(2)

    // 删除的属性也可直接监听
    delete observed.foo
    expect('foo' in observed).toBe(false)
    expect('foo' in original).toBe(false)
  })

  it('original value change should reflect in observed value', () => {
    const original: any = { foo: 1 }
    const observed = reactive(original)
    original.bar = 3
    expect(observed.bar).toBe(3)
    expect(original.bar).toBe(3)

    delete observed.foo
    expect('foo' in observed).toBe(false)
  })

  it('setting a property with an unobserved value should wrap it in reactive', () => {
    const observed = reactive<{ foo?: string }>({})
    const raw = {}
    observed.foo = raw
    expect(observed.foo).not.toBe(raw)
    expect(isReactive(observed.foo)).toBe(true)
  })

  it('observing already observed value should return the same proxy', () => {
    const original = { foo: 1 }
    const observed = reactive(original)
    const observed1 = reactive(observed)
    expect(observed).toBe(observed1)
  })

  it('observing the same value multiple times should return the same proxy', () => {
    const original = { foo: 1 }
    const observed = reactive(original)
    const observed2 = reactive(original)
    expect(observed).toBe(observed2)
  })

  it('测试原始对象污染', () => {
    const original: any = { foo: 1 }
    const original2 = { bar: 2 }
    const observed = reactive(original)
    const observed2 = reactive(original2)
    observed.bar = observed2
    expect(observed.bar).toBe(observed2)
    expect(original.bar).toBe(original2)
  })

  it.skip('原型链上的属性变化, 不再触发依赖', () => {
    const observed = reactive({ foo: 1 })
    const original = Object.create(observed)
    let dummy
    effect(() => {
      dummy = original.foo
    })
    expect(dummy).toBe(1)
    observed.foo = 2
    expect(dummy).toBe(2)

    original.foo = 3
    expect(dummy).toBe(2)
    // original.foo = 4
    // expect(dummy).toBe(2)
  })

  it('toRaw on object using reactive as prototype', () => {
    const original = { foo: 1 }
    const observed = reactive(original)
    const inherted = Object.create(observed)
    expect(toRaw(inherted)).toBe(inherted)
  })
})
