import { describe, expect, it } from 'vitest'
import { ref } from '../src/ref'
import { watch } from '../src/watch'

describe('watch', () => {
  it('should work', () => {
    let dummy
    const source = ref(0)
    watch(() => (dummy = source.value))
    expect(dummy).toBe(0)
    source.value++
    expect(dummy).toBe(1)
  })
})
