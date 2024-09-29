import { describe, expect, it, vi } from 'vitest'
import { isRef, ref } from '../src/ref'
import { effect, reactive } from '../src'

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

  it('should make nested properties reactive', () => {
    const a = ref({ count: 1 })
    let dummy
    effect(() => {
      dummy = a.value.count
    })
    expect(dummy).toBe(1)
    a.value.count = 2
    expect(a.value.count).toBe(2)
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

  it('', () => {
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

  it('isRef', () => {
    const value = ref(1)
    expect(isRef(value)).toBe(true)

    expect(isRef(1)).toBe(false)
    expect(isRef({ foo: 1 })).toBe(false)
  })
})
