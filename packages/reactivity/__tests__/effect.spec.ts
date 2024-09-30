import { describe, expect, it, vi } from 'vitest'
import { effect, stop } from '../src/effect'
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

  it.skip('监听数组变化 - push、shift', () => {
    let dummy
    const list = reactive(['Hello'])
    effect(() => (dummy = list.join(' ')))

    expect(dummy).toBe('Hello')
    list.push('World!')
    expect(dummy).toBe('Hello World!')
    list.shift()

    expect(list.join(' ')).toBe('World!')
    // expect(dummy).toBe('World!')
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

    expect(list.join(' ')).toBe('hello')

    expect(dummy).toBe('hello')
  })

  it('能遍历enumerable对象', () => {
    const numbers = reactive<Record<string, number>>({ num1: 3 })
    let dummy

    effect(() => {
      dummy = 0
      // 会触发ownKeys
      for (const key in numbers) {
        dummy += numbers[key]
      }
    })

    expect(dummy).toBe(3)
    numbers.num2 = 4
    expect(dummy).toBe(7)
    delete numbers.num1
    expect(dummy).toBe(4)
  })

  it('能监听用symbol作为key的对象', () => {
    const key = Symbol('symbol keyed')
    let dummy, dummyFlag
    const obj = reactive<{ [key]?: number }>({ [key]: 1 })
    effect(() => (dummy = obj[key]))
    effect(() => (dummyFlag = key in obj))
    expect(dummy).toBe(1)
    expect(dummyFlag).toBe(true)
    obj[key] = 2
    expect(dummy).toBe(2)
    delete obj[key]
    expect(dummy).toBe(undefined)
    expect(dummyFlag).toBe(false)
  })

  it('不监听常见symbol的静态属性', () => {
    const key = Symbol.isConcatSpreadable
    let dummy
    const array: any = reactive([])
    effect(() => (dummy = array[key]))
    expect(dummy).toBe(undefined)
    array[key] = true
    expect(array[key]).toBe(true)
    expect(dummy).toBe(undefined)
  })
  // has方法
  it('in操作不监听常见symbol的静态属性', () => {
    const key = Symbol.isConcatSpreadable
    const obj = reactive({
      [key]: true,
    }) as any
    const spyfn = vi.fn(() => {
      key in obj
    })
    effect(spyfn)
    expect(spyfn).toBeCalledTimes(1)

    obj[key] = false
    expect(spyfn).toBeCalledTimes(1)
  })

  it.skip('当key是一个symbol类型的时候 可操作数组', () => {
    const key = Symbol()
    let dummy
    const array = reactive([1, 2, 3])
    expect(() => (dummy = array[key]))
    expect(dummy).toBe(undefined)
    // array.pop()
    // array.shift()
    // array.splice(0, 1)
    expect(dummy).toBe(undefined)
    array[key] = 'value'
    // array.length = 0
    expect(dummy).toBe('value')
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
    expect(dummy).toBe(1)
    run()
    expect(dummy).toBe(2)
  })

  it('stop', () => {
    let dummy
    const obj = reactive({ prop: 1 })
    const runner = effect(() => {
      dummy = obj.prop
    })
    expect(dummy).toBe(1)
    obj.prop++
    expect(dummy).toBe(2)
    stop(runner)
    obj.prop = 3
    expect(dummy).toBe(2)
    runner()
    expect(dummy).toBe(3)
  })

  it('events: onStop', () => {
    const onStop = vi.fn()
    const runner = effect(() => {}, { onStop })
    stop(runner)
    expect(onStop).toHaveBeenCalled()
  })
})
