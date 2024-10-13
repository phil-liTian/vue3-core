import { describe, expect, it, vi } from 'vitest'
import {
  customRef,
  isRef,
  ref,
  shallowRef,
  toRef,
  toRefs,
  triggerRef,
  unRef,
} from '../src/ref'
import {
  computed,
  effect,
  isReactive,
  isReadonly,
  isShallow,
  reactive,
  toValue,
} from '../src'
import { isArray } from '@vue/shared'

describe('reactivity/ref', () => {
  it('should hold a value', () => {
    const a = ref(1)
    expect(a.value).toBe(1)
    a.value = 2
    expect(a.value).toBe(2)
  })

  it('should be reactive', () => {
    const a = ref(1)
    let dummy
    const fn = vi.fn(() => {
      dummy = a.value
    })

    effect(fn)
    expect(fn).toHaveBeenCalledTimes(1)
    expect(dummy).toBe(1)

    a.value = 2
    expect(fn).toHaveBeenCalledTimes(2)
  })

  it.skip('test', () => {
    const a = ref(1)
    const b = reactive(a)
    let dummy
    const fn = vi.fn(() => (dummy = b.value))
    effect(fn)
    expect(fn).toHaveBeenCalledTimes(1)
    expect(dummy).toBe(1)

    a.value = 3
    expect(fn).toHaveBeenCalledTimes(2)
    expect(dummy).toBe(3)

    // b.value = 5
  })

  it('should make nested properties reactive', () => {
    const a = ref({ count: 1 })
    let dummy
    effect(() => {
      dummy = a.value.count
    })
    expect(dummy).toBe(1)
    a.value.count = 2
    expect(a.value.count).toBe(2)
    expect(dummy).toBe(2)
  })

  it('should work without initial value', () => {
    const a = ref()
    let dummy
    effect(() => {
      dummy = a.value
    })
    expect(dummy).toBe(undefined)
    a.value = 2
    expect(dummy).toBe(2)
  })

  it.skip('', () => {
    const a = ref(1)
    const b = reactive(a)
    let dummy
    const fn = vi.fn(() => {
      dummy = b.value
    })
    effect(fn)
    expect(fn).toHaveBeenCalledTimes(1)
    expect(dummy).toBe(1)

    a.value = 2
    expect(fn).toHaveBeenCalledTimes(2)
    expect(dummy).toBe(2)

    // b.value = 5
    // expect(dummy).toBe(5)
  })

  it('shallowRef', () => {
    const sRef = shallowRef({ a: 1 })
    expect(isReactive(sRef)).toBe(false)
    let dummy
    effect(() => {
      dummy = sRef.value.a
    })

    expect(dummy).toBe(1)

    sRef.value = { a: 2 }
    expect(isReactive(sRef.value)).toBe(false)
    expect(dummy).toBe(2)

    sRef.value.a = 3
    expect(dummy).toBe(2)

    triggerRef(sRef)
    expect(dummy).toBe(3)

    expect(isShallow(sRef)).toBe(true)
  })

  it('isRef', () => {
    const value = ref(1)
    expect(isRef(value)).toBe(true)

    expect(isRef(1)).toBe(false)
    expect(isRef({ foo: 1 })).toBe(false)
  })

  it('toRef', () => {
    const a = reactive({ x: 1 })
    const x = toRef(a, 'x')
    const b = ref({ y: 1 })
    const c = toRef(b)
    const d = toRef({ z: 1 })

    expect(c).toBe(b)
    expect(d.value.z).toBe(1)
    expect(isRef(x)).toBe(true)
    expect(x.value).toBe(1)

    a.x = 2
    expect(x.value).toBe(2)
    x.value = 3
    expect(a.x).toBe(3)

    let dummyX
    effect(() => (dummyX = x.value))
    expect(dummyX).toBe(x.value)

    a.x = 4
    expect(dummyX).toBe(4)

    const r = { x: ref(1) }
    expect(toRef(r, 'x')).toBe(r.x)
  })

  it('toRef on Array', () => {
    const a = reactive(['a', 'b'])
    const r = toRef(a, 1)
    expect(r.value).toBe('b')
    r.value = 'c'
    expect(a[1]).toBe('c')
    expect(isRef(r)).toBe(true)
  })

  it('toRef with default value', () => {
    const obj = reactive({ foo: undefined })
    const foo = toRef(obj, 'foo', 'bar')
    expect(foo.value).toBe('bar')
    obj.foo = 'old-foo'
    expect(foo.value).toBe('old-foo')
  })

  it('toRef with function', () => {
    const x = toRef(() => 1)
    expect(x.value).toBe(1)
    expect(isRef(x)).toBe(true)
    expect(unRef(x)).toBe(1)
    // @ts-ignore
    expect(() => (x.value = 123)).toThrow()
    expect(isReadonly(x)).toBe(true)
  })

  it('toRefs', () => {
    const a = reactive({ x: 1, y: 2 })
    const { x, y } = toRefs(a)
    expect(x.value).toBe(1)
    expect(y.value).toBe(2)
    a.x = 3
    expect(x.value).toBe(3)
    x.value = 4
    expect(a.x).toBe(4)

    let dummyX
    effect(() => (dummyX = x.value))
    expect(dummyX).toBe(4)
    a.x = 6
    expect(dummyX).toBe(6)
  })

  it('toRefs should warn on plain object', () => {
    toRef({})
    toRef([])
    expect('toRefs() expects a reactive object').toHaveBeenWarned()
  })

  it('toRefs with array', () => {
    const arr = reactive([1, 2, 3])
    const refs = toRefs(arr)
    expect(isArray(refs)).toBe(true)

    refs[1].value = 5
    expect(arr).toEqual([1, 5, 3])

    refs[2].value = 6
    expect(arr).toEqual([1, 5, 6])
  })

  it('toValue', () => {
    const a = ref(1)
    const b = computed(() => a.value + 1)

    const c = () => a.value + 2
    const d = 4

    expect(toValue(a)).toBe(1)
    expect(toValue(b)).toBe(2)
    expect(toValue(c)).toBe(3)
    expect(toValue(d)).toBe(4)
  })

  it('customRef', () => {
    let value = 1

    let _trigger: () => void
    const custom = customRef((track, trigger) => ({
      get() {
        track()
        return value
      },
      set(newValue: number) {
        value = newValue + 1
        _trigger = trigger
        return true
      },
    }))

    expect(isRef(custom)).toBe(true)
    let dummy
    effect(() => (dummy = custom.value))

    expect(dummy).toBe(1)
    custom.value = 2
    expect(dummy).toBe(1)

    _trigger!()
    expect(dummy).toBe(3)
  })

  it('should not trigger when setting value to same proxy', () => {
    const obj = reactive({ foo: 1 })

    const a = ref(obj)
    const spy1 = vi.fn(() => a.value)
    effect(spy1)

    expect(spy1).toHaveBeenCalledTimes(1)
    a.value = obj
    expect(spy1).toHaveBeenCalledTimes(1)

    const b = shallowRef(obj)
    const spy2 = vi.fn(() => b.value)
    effect(spy2)

    expect(spy2).toHaveBeenCalledTimes(1)
    b.value = obj
    expect(spy2).toHaveBeenCalledTimes(1)
  })
})
