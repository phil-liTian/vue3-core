import { describe, expect, it } from 'vitest'
import { effect, isReactive, reactive } from '../../src'

describe('reactivity/collections', () => {
  describe('weakMap', () => {
    it('instanceof', () => {
      const original = new WeakMap()
      const observed = reactive(original)
      expect(isReactive(observed)).toBe(true)
      expect(observed).toBeInstanceOf(WeakMap)
      expect(original).toBeInstanceOf(WeakMap)
    })

    it('should observe mutation', () => {
      let dummy
      const key = {}
      const map = reactive(new WeakMap())
      effect(() => {
        dummy = map.get(key)
      })

      // expect(dummy).toBe(undefined)
      // map.set(key, 'value')
      // expect(dummy).toBe('value')
      // map.set(key, 'value2')
      // expect(dummy).toBe('value2')
      // map.delete(key)
      // expect(dummy).toBe(undefined)
    })
  })
})
