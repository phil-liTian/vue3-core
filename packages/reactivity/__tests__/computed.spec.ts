import { describe, expect, it, vi } from 'vitest'
import { computed } from '../src/computed'
import { reactive, ref } from '../src'

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
    // expect(getter).toHaveBeenCalledTimes(1)
  })
})
