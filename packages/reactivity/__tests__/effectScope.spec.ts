import { describe, expect, it, vi } from 'vitest'
import { effectScope } from '../src'

describe('reactivity/effectScope', () => {
  it('should run', () => {
    const fnSpy = vi.fn()
    effectScope().run(fnSpy)
    expect(fnSpy).toHaveBeenCalledTimes(1)
  })
})
