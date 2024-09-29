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
    expect(dummy).toBe(false)
    obj.props = 'value'
    expect(dummy).toBe(true)
  })

  it('should observe properties on the prototype chain', () => {
    let dummy
    const counter = reactive<{ num?: number }>({ num: 0 })
    const parentCounter = reactive({ num: 2 })
    // 将counter的原型指向parentCounter
    Object.setPrototypeOf(counter, parentCounter)
    effect(() => (dummy = counter.num))
    expect(dummy).toBe(0)
    delete counter.num
    expect(dummy).toBe(2)
    parentCounter.num = 4
    expect(dummy).toBe(4)
    counter.num = 3
    expect(dummy).toBe(3)
  })

  // 可访问原型链上的has属性
  it('should observe has operations on the prototype chain', () => {
    let dummy
    const counter = reactive<{ num?: number }>({ num: 0 })
    const parentCounter = reactive({ num: 2 })
    Object.setPrototypeOf(counter, parentCounter)
    effect(() => (dummy = 'num' in counter))
    expect(dummy).toBe(true)
    delete counter.num
    expect(dummy).toBe(true)
    delete parentCounter.num
    expect(dummy).toBe(false)
    counter.num = 3
    expect(dummy).toBe(true)
  })

  it('能监听继承的属性', () => {
    let hiddenValue, dummy, parentDummy
    const obj = reactive<{ prop?: number }>({})
    const parent = reactive({
      get prop() {
        return hiddenValue
      },

      set prop(newValue) {
        hiddenValue = newValue
      },
    })

    Object.setPrototypeOf(obj, parent)
    effect(() => (dummy = obj.prop))
    effect(() => (parentDummy = parent.prop))
    expect(dummy).toBe(undefined)
    expect(parentDummy).toBe(undefined)
    obj.prop = 4
    expect(dummy).toBe(4)
    parent.prop = 2
    expect(dummy).toBe(2)
    expect(parentDummy).toBe(2)
  })

  it('可监听一个函数', () => {
    let dummy
    const counter = reactive({ num: 0 })
    effect(() => (dummy = getNum()))
    function getNum() {
      return counter.num
    }

    expect(dummy).toBe(0)
    counter.num++
    expect(dummy).toBe(1)
  })

  it('可监听数组变化 - join和数组下标', () => {
    let dummy
    const list = reactive(['hello'])
    effect(() => (dummy = list.join(' ')))
    expect(dummy).toBe('hello')
    list[1] = 'world!'
    expect(dummy).toBe('hello world!')
    list[3] = 'Hello!'
    expect(dummy).toBe('hello world!  Hello!')
  })

  it('监听数组变化 - push、shift', () => {
    let dummy
    const list = reactive(['Hello'])
    effect(() => (dummy = list.join(' ')))

    expect(dummy).toBe('Hello')
    list.push('World!')
    expect(dummy).toBe('Hello World!')
    list.shift()
    expect(dummy).toBe('World! ')
  })

  it.skip('监听数组变化 - pop', () => {
    let dummy
    const list = reactive<string[]>([])
    list[1] = 'World!'
    effect(() => (dummy = list.join(' ')))
    expect(dummy).toBe(' World!')

    list[0] = 'hello'
    expect(dummy).toBe('hello World!')
    list.pop()

    expect(dummy).toBe('hello')
  })

  it('能遍历enumerable对象', () => {
    const numbers = reactive<Record<string, number>>({ num1: 3 })
    let dummy

    effect(() => {
      dummy = 0
      for (const key in numbers) {
        dummy = numbers[key]
      }
    })

    expect(dummy).toBe(3)
    // numbers.num2 = 4
    // expect(dummy).toBe(7)
  })

  it('scheduler', () => {
    let dummy
    let run: any
    const obj = reactive({ foo: 1 })
    const scheduler = vi.fn(() => {
      run = runner
    })

    const runner = effect(
      () => {
        dummy = obj.foo
      },
      { scheduler },
    )

    expect(scheduler).not.toHaveBeenCalled()
    expect(dummy).toBe(1)
    obj.foo++
    expect(scheduler).toHaveBeenCalledTimes(1)
  })
})
