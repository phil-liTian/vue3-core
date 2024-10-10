import { describe, expect, it, vi } from 'vitest'
import { effect, effectScope, reactive, ref } from '../src'
import { onScopeDispose } from '../src/effectScope'

describe('reactivity/effectScope', () => {
  it('should run', () => {
    const fnSpy = vi.fn()
    effectScope().run(fnSpy)
    expect(fnSpy).toHaveBeenCalledTimes(1)
  })

  it('should accept zero arguments', () => {
    const scope = effectScope()
    expect(scope.effects.length).toBe(0)
  })

  it('should return run value', () => {
    const scope = effectScope()
    expect(scope.run(() => 1)).toBe(1)
  })

  it('should work active property', () => {
    const scope = effectScope()
    scope.run(() => 1)
    expect(scope.active).toBe(true)

    scope.stop()
    expect(scope.active).toBe(false)
  })

  it('stop', () => {
    const scope = effectScope()

    const counter = reactive({ num: 0 })
    let dummy, double
    scope.run(() => {
      effect(() => (dummy = counter.num))
      effect(() => (double = counter.num * 2))
    })

    expect(dummy).toBe(0)

    counter.num = 7
    expect(dummy).toBe(7)
    expect(double).toBe(14)
    expect(scope.effects.length).toBe(2)

    scope.stop()

    counter.num = 6
    // expect(dummy).toBe(7)
    // expect(double).toBe(14)
  })

  it('should fire onScopeDispose hook', () => {
    let dummy = 0
    const scope = effectScope()
    scope.run(() => {
      onScopeDispose(() => (dummy += 1))
      onScopeDispose(() => (dummy += 2))
    })

    scope.run(() => {
      onScopeDispose(() => (dummy += 4))
    })

    expect(dummy).toBe(0)

    scope.stop()
    expect(dummy).toBe(7)
  })

  it('should warn onScopeDispose called outside of effectScope', () => {
    const scope = effectScope()
    const spy = vi.fn()
    scope.run(() => {
      onScopeDispose(spy)
    })

    onScopeDispose(spy)
    expect(
      '[Vue warn] onScopeDispose() is called when there is no active effect scope to be associated with.',
    ).toHaveBeenWarned()

    expect(spy).not.toHaveBeenCalled()

    scope.stop()
    expect(spy).toHaveBeenCalled()
  })
})
