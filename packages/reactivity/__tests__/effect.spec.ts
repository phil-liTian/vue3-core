import { describe, expect, it, vi } from 'vitest'
import {
  effect,
  endBatch,
  onEffectCleanup,
  startBatch,
  stop,
} from '../src/effect'
import { reactive, toRaw } from '../src/reactive'
import { Dep, getDepFromReactive } from '../src/dep'
import { ref } from '../src'

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
    expect(dummy).toBe('World!')
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

  it('当key是一个symbol类型的时候 可操作数组', () => {
    const key = Symbol()
    let dummy
    const array = reactive([1, 2, 3])
    expect(() => (dummy = array[key]))
    expect(dummy).toBe(undefined)
    array.pop()
    array.shift()
    array.splice(0, 1)
    expect(dummy).toBe(undefined)

    array[key] = 'value'

    // array.length = 0
    // expect(dummy).toBe('value')
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

  it('stop with multiple effects', () => {
    let dummy1, dummy2
    const obj1 = reactive({ prop: 1 })
    const obj2 = reactive({ prop: 2 })
    const runner = effect(() => {
      dummy1 = obj1.prop
      dummy2 = obj2.prop
    })

    obj1.prop = 2
    obj2.prop = 4
    expect(dummy1).toBe(2)
    expect(dummy2).toBe(4)

    stop(runner)
    obj1.prop = 3
    obj2.prop = 5

    expect(dummy1).toBe(2)
    expect(dummy2).toBe(4)
  })

  it('events: onStop', () => {
    const onStop = vi.fn()
    const runner = effect(() => {}, { onStop })
    stop(runner)
    expect(onStop).toHaveBeenCalled()
  })

  it('stop: a stopped effect is nested in a normal effect', () => {
    let dummy
    const obj = reactive({ prop: 1 })
    const runner = effect(() => (dummy = obj.prop))
    stop(runner)
    obj.prop++
    expect(dummy).toBe(1)
    effect(() => runner())
    expect(dummy).toBe(2)

    obj.prop = 3
    // expect(dummy).toBe(3)
  })

  it('当value都是NaN的时候, effect不执行', () => {
    const obj = reactive({ prop: NaN })
    const spy = vi.fn(() => obj.prop)
    effect(spy)
    obj.prop = NaN
    expect(spy).toHaveBeenCalledTimes(1)
  })

  it('should observe function valued property', () => {
    let dummy
    const oldFunc = () => {}
    const newFunc = () => {}
    const obj = reactive({ prop: oldFunc })
    effect(() => (dummy = obj.prop))
    expect(dummy).toBe(oldFunc)
    obj.prop = newFunc
    expect(dummy).toBe(newFunc)
  })

  it('should observe getter rely on this', () => {
    const obj = reactive({
      a: 1,
      get b() {
        return this.a
      },
    })

    let dummy
    effect(() => (dummy = obj.b))
    expect(dummy).toBe(1)

    obj.a = 2
    expect(dummy).toBe(2)
  })

  it('should observe methods rely on this', () => {
    const obj = reactive({
      a: 1,
      b() {
        return this.a
      },
    })
    let dummy
    effect(() => (dummy = obj.b()))
    expect(dummy).toBe(1)
    obj.a = 2
    expect(dummy).toBe(2)
  })

  it('监听的值不改变时, 不触发fn', () => {
    let hasDummy, getDummy
    const obj = reactive({ prop: 'value' })
    const getSpy = vi.fn(() => {
      getDummy = obj.prop
    })

    const hasSpy = vi.fn(() => {
      hasDummy = 'prop' in obj
    })

    effect(getSpy)
    effect(hasSpy)

    expect(getSpy).toHaveBeenCalledTimes(1)
    expect(hasSpy).toHaveBeenCalledTimes(1)

    obj.prop = 'value'
    expect(getSpy).toHaveBeenCalledTimes(1)
    expect(hasSpy).toHaveBeenCalledTimes(1)
  })

  it('非响应式对象发生变化, 不触发更新', () => {
    const obj = reactive<{ props?: string; key?: string }>({})
    let dummy, dummy1
    // const fn = vi.fn(() => (dummy = toRaw(obj).props))
    effect(() => (dummy = toRaw(obj).props))
    expect(dummy).toBe(undefined)
    obj.props = 'value'
    expect(dummy).toBe(undefined)

    effect(() => (dummy1 = obj.key))
    toRaw(obj).key = 'value'
    expect(dummy1).toBe(undefined)
  })

  it('set 原型上的属性 不触发effect', () => {
    let dummy, parentDummy, hiddenValue: any
    const obj = reactive<{ props?: number }>({})

    const parent = reactive({
      get props() {
        return hiddenValue
      },

      set props(val) {
        hiddenValue = val
      },
    })

    Object.setPrototypeOf(obj, parent)

    effect(() => (dummy = obj.props))
    effect(() => (parentDummy = parent.props))

    expect(dummy).toBe(undefined)
    expect(parentDummy).toBe(undefined)

    toRaw(obj).props = 1

    expect(dummy).toBe(undefined)
    expect(parentDummy).toBe(undefined)
  })

  it('避免effect中循环引用 造成死循环', () => {
    const counter = reactive({ num: 0 })

    const counterSpy = vi.fn(() => counter.num++)
    effect(counterSpy)
    expect(counter.num).toBe(1)
    expect(counterSpy).toHaveBeenCalledTimes(1)
    counter.num = 4
    expect(counter.num).toBe(5)
    expect(counterSpy).toHaveBeenCalledTimes(2)
  })

  it('避免 在effect中循环调用array 的push、unshift、shift、pop 等方法造成死循环', () => {
    ;['push', 'unshift'].map(key => {
      const arr = reactive<number[]>([])
      const counterSpy1 = vi.fn(() => (arr[key] as any)(1))
      const counterSpy2 = vi.fn(() => (arr[key] as any)(2))
      effect(counterSpy1)
      effect(counterSpy2)
      expect(arr.length).toBe(2)
      expect(counterSpy1).toHaveBeenCalledTimes(1)
      expect(counterSpy2).toHaveBeenCalledTimes(1)
    })
    ;(['pop'] as const).forEach(key => {
      const arr = reactive<number[]>([1, 2, 3, 4])
      const counterSpy1 = vi.fn(() => (arr[key] as any)())
      const counterSpy2 = vi.fn(() => (arr[key] as any)())
      effect(counterSpy1)
      effect(counterSpy2)
      expect(arr.length).toBe(2)
      expect(counterSpy1).toHaveBeenCalledTimes(1)
      expect(counterSpy2).toHaveBeenCalledTimes(1)
    })
  })

  it('should allow explicitly recursive raw function loops', () => {
    const count = reactive({ num: 0 })
    const numSpy = vi.fn(() => {
      count.num++
      if (count.num < 10) {
        numSpy()
      }
    })

    effect(numSpy)
    expect(count.num).toBe(10)
    expect(numSpy).toHaveBeenCalledTimes(10)
  })

  it('effect中引用其它effect时，避免死循环', () => {
    const nums = reactive({ num1: 0, num2: 1 })
    const spy1 = vi.fn(() => (nums.num1 = nums.num2))
    const spy2 = vi.fn(() => (nums.num2 = nums.num1))
    effect(spy1)
    effect(spy2)
    expect(nums.num1).toBe(1)
    expect(nums.num2).toBe(1)

    // nums.num2 = 4
    // expect(nums.num1).toBe(4)
    // expect(nums.num2).toBe(4)
    // expect(spy1).toHaveBeenCalledTimes(2)
    // expect(spy2).toHaveBeenCalledTimes(2)

    // nums.num1 = 10
    // expect(nums.num1).toBe(10)
    // expect(nums.num2).toBe(10)
    // expect(spy1).toHaveBeenCalledTimes(3)
    // expect(spy2).toHaveBeenCalledTimes(3)
  })

  it('effect每次都返回一个新函数', () => {
    function greet() {
      return 'hello'
    }
    const effect1 = effect(greet)
    const effect2 = effect(greet)
    expect(typeof effect1).toBe('function')
    expect(typeof effect2).toBe('function')
    expect(effect1).not.toBe(effect2)
  })

  it('should trigger once with batching', () => {
    const counter = reactive({ num: 0 })
    const countSpy = vi.fn(() => counter.num)
    effect(countSpy)
    countSpy.mockClear()

    startBatch()
    counter.num++
    counter.num++
    endBatch()
    expect(countSpy).toHaveBeenCalledTimes(1)
  })

  it('should pause/resume effect & 执行resume立即执行一次trigger', () => {
    const obj = reactive({ foo: 1 })
    const fnSpy = vi.fn(() => obj.foo)
    const runner = effect(fnSpy)
    expect(fnSpy).toHaveBeenCalledTimes(1)

    runner.effect.pause()
    obj.foo++
    expect(fnSpy).toHaveBeenCalledTimes(1)
    expect(obj.foo).toBe(2)

    runner.effect.resume()
    expect(fnSpy).toHaveBeenCalledTimes(2)
    obj.foo++
    expect(fnSpy).toHaveBeenCalledTimes(3)
  })

  describe('dep unsubscribe', () => {
    function getSubCount(dep: Dep | undefined) {
      let sub = dep?.subs
      let count = 0

      while (sub) {
        count++
        sub = sub.prevSub
      }

      return count
    }

    it('effect stop时, 移除当前dep', () => {
      const obj = reactive({ foo: 1 })
      const runner = effect(() => obj.foo)
      const dep = getDepFromReactive(toRaw(obj), 'foo')
      expect(getSubCount(dep)).toBe(1)
      obj.foo = 2
      expect(getSubCount(dep)).toBe(1)
      stop(runner)
      expect(getSubCount(dep)).toBe(0)
      obj.foo = 3
      runner()
      expect(getSubCount(dep)).toBe(0)
    })
  })

  // TODO
  describe('onEffectCleanup', () => {
    it('should get called correctly', () => {
      const count = ref(0)
      const cleanupEffect = vi.fn()
      const e = effect(() => {
        onEffectCleanup(cleanupEffect)
        count.value
      })

      count.value++
    })
  })
})
