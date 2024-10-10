import { describe, expect, it } from 'vitest'
import { Ref, ref } from '../src/ref'
import { watch, WatchOptions } from '../src/watch'
import { effectScope } from '../src'

describe('watch', () => {
  it('should work', () => {
    let dummy
    const source = ref(0)
    watch(() => (dummy = source.value))
    expect(dummy).toBe(0)
    source.value++
    expect(dummy).toBe(1)
  })

  it('with callback', () => {
    let dummy
    const source = ref(0)
    watch(source, () => (dummy = source.value))
    expect(dummy).toBe(undefined)
    source.value++
    expect(dummy).toBe(1)
  })

  it.skip('call options with error handling', () => {
    const call: WatchOptions['call'] = function () {}

    watch(
      () => {
        throw 'oops is effect'
      },
      null,
      { call },
    )
  })

  it('watch with onWatcherCleanup', () => {
    let dummy = 0
    let source: Ref<number>
    const scope = effectScope()
    scope.run(() => {
      source = ref(0)

      watch(onCleanup => {
        source.value
        // onCleanup(() => (dummy += 2))
      })
    })
  })
})
