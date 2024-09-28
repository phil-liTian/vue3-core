import { describe, expect, it, vi } from 'vitest'
import { effect } from '../src/effect'
import { reactive } from '../src/reactive'

describe('reactivity/effect', () => {
  it('should run the passed function once(wrapped by effect)', () => {
    const fnSpy = vi.fn(() => {})
    effect(fnSpy)
    expect(fnSpy).toHaveBeenCalledTimes(1)
  })

  it('should observe basic properties', () => {
    let dummy
    const counter = reactive({ num: 0 })
    effect(() => (dummy = counter.num))

    expect(dummy).toBe(0)
    counter.num = 2
    expect(dummy).toBe(2)
  })

  it('should observe multiple properties', () => {
    let dummy
    const counter = reactive({ num1: 0, num2: 0 })
    effect(() => (dummy = counter.num1 + counter.num2))
    expect(dummy).toBe(0)
    counter.num1 = counter.num2 = 7
    expect(dummy).toBe(14)
  })

  it('should handle multiple effects', () => {
    let dummy1
    let dummy2
    const counter = reactive({ num: 0 })
    effect(() => (dummy1 = counter.num))
    effect(() => (dummy2 = counter.num))
    expect(dummy1).toBe(0)
    expect(dummy2).toBe(0)
    counter.num++
    expect(dummy1).toBe(1)
    expect(dummy2).toBe(1)
  })

  it('should observe nested property', () => {
    let dummy
    const counter = reactive({ nested: { num: 0 } })
    effect(() => (dummy = counter.nested.num))
    expect(dummy).toBe(0)
    counter.nested.num++
    expect(dummy).toBe(1)
  })

  it('should observe delete options', () => {
    let dummy
    const obj = reactive<{ props?: string }>({ props: 'value' })
    effect(() => (dummy = obj.props))
    expect(dummy).toBe('value')
    delete obj.props
    expect(dummy).toBe(undefined)
  })

  it('should observe has operations', () => {
    let dummy
    const obj = reactive<{ props?: string }>({ props: 'value' })
    effect(() => (dummy = 'props' in obj))
    expect(dummy).toBe(true)
    delete obj.props
    // expect(dummy).toBe(false)
  })
})
