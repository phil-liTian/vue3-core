import { describe, expect, it, vi } from 'vitest'
import { computed } from '../src/computed'
import { effect, reactive, ref } from '../src'

describe('reactivity/computed', () => {
  it('should return updated value', () => {
    const value = reactive<{ foo?: number }>({})
    const cValue = computed(() => value.foo)
    expect(cValue.value).toBe(undefined)
    value.foo = 1
    expect(cValue.value).toBe(1)
  })

  it('pass oldValue to computed getter', () => {
    const count = ref(0)
    let oldValue = ref()
    // getter带参数
    const curValue = computed(pre => {
      oldValue.value = pre
      return count.value
    })
    expect(curValue.value).toBe(0)
    expect(oldValue.value).toBe(undefined)
    count.value++
    expect(curValue.value).toBe(1)
    expect(oldValue.value).toBe(0)
  })

  it('lazy computed', () => {
    const value = reactive<{ foo?: number }>({})
    const getter = vi.fn(() => value.foo)
    const cValue = computed(getter)

    expect(getter).not.toHaveBeenCalled()
    expect(cValue.value).toBe(undefined)
    expect(getter).toHaveBeenCalledTimes(1)

    cValue.value
    expect(getter).toHaveBeenCalledTimes(1)

    value.foo = 1
    expect(getter).toHaveBeenCalledTimes(1)
    // should be computed
    expect(cValue.value).toBe(1)
    expect(getter).toHaveBeenCalledTimes(2)

    cValue.value
    expect(getter).toHaveBeenCalledTimes(2)
  })

  it('should trigger effect', () => {
    const value = reactive<{ foo?: number }>({})
    const cValue = computed(() => value.foo)
    let dummy
    effect(() => (dummy = cValue.value))
    expect(dummy).toBe(undefined)
    value.foo = 1
    expect(dummy).toBe(1)
  })

  it('should work when chained', () => {
    const value = reactive({ foo: 0 })
    const c1 = computed(() => value.foo)
    const c2 = computed(() => c1.value + 1)
    expect(c1.value).toBe(0)
    expect(c2.value).toBe(1)
    value.foo = 2
    expect(c1.value).toBe(2)
    expect(c2.value).toBe(3)
  })

  it('should trigger effect when chained', () => {
    const value = reactive({ foo: 0 })
    const getter1 = vi.fn(() => value.foo)
    const getter2 = vi.fn(() => c1.value + 1)
    const c1 = computed(getter1)
    const c2 = computed(getter2)
    let dummy
    effect(() => (dummy = c2.value))

    expect(dummy).toBe(1)
    expect(getter1).toHaveBeenCalledTimes(1)
    expect(getter2).toHaveBeenCalledTimes(1)

    value.foo++
    expect(dummy).toBe(2)
    expect(getter1).toHaveBeenCalledTimes(2)
    expect(getter2).toHaveBeenCalledTimes(2)
  })

  it('should trigger effect when chained (mixed invocations)', () => {
    const value = reactive({ foo: 0 })
    const getter1 = vi.fn(() => value.foo)
    const getter2 = vi.fn(() => {
      return c1.value + 1
    })
    const c1 = computed(getter1)
    const c2 = computed(getter2)

    let dummy
    effect(() => {
      dummy = c1.value + c2.value
    })
    expect(dummy).toBe(1)

    expect(getter1).toHaveBeenCalledTimes(1)
    expect(getter2).toHaveBeenCalledTimes(1)
    value.foo++
    expect(dummy).toBe(3)
    // should not result in duplicate calls
    expect(getter1).toHaveBeenCalledTimes(2)
    expect(getter2).toHaveBeenCalledTimes(2)
  })

  it('should support setter', () => {
    const n = ref(1)

    const plusOne = computed({
      get: () => n.value + 1,
      set: val => {
        n.value = val - 1
      },
    })

    expect(plusOne.value).toBe(2)
    n.value++
    expect(plusOne.value).toBe(3)
    plusOne.value = 0
    expect(n.value).toBe(-1)
  })
})
