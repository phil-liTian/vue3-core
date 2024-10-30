import { describe, expect, it } from 'vitest'
import { Ref, ref } from '../src/ref'
import {
  onWatcherCleanup,
  watch,
  WatchOptions,
  WatchScheduler,
} from '../src/watch'
import { computed, effectScope } from '../src'
import { EffectScope } from '../src/effectScope'

const queue: (() => void)[] = []
let isFlushPending = false
const resolvedPromise = /*@__PURE__*/ Promise.resolve() as Promise<any>
const scheduler: WatchScheduler = (job, isFirstRun) => {
  if (isFirstRun) {
    job()
  } else {
    queue.push(job)
    flushJobs()
  }
}

const flushJobs = () => {
  if (isFlushPending) return
  isFlushPending = true
  resolvedPromise.then(() => {
    queue.forEach(job => job())
    queue.length = 0
    isFlushPending = false
  })
}

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
    const scope = new EffectScope()
    scope.run(() => {
      source = ref(0)

      watch(onCleanup => {
        source.value

        onCleanup(() => (dummy += 2))
        onWatcherCleanup(() => (dummy += 3))
        onWatcherCleanup(() => (dummy += 5))
      })
    })

    expect(dummy).toBe(0)
    scope.run(() => {
      source.value++
    })
    expect(dummy).toBe(10)

    scope.run(() => {
      source.value++
    })
    expect(dummy).toBe(20)

    // TODO
    // scope.stop()
    // expect(dummy).toBe(30)
  })

  it('once option should be ignore by simple watch', () => {
    let dummy: any
    const source = ref(0)
    watch(
      () => {
        dummy = source.value
      },
      null,
      { once: true },
    )
    expect(dummy).toBe(0)

    source.value++
    expect(dummy).toBe(1)
  })

  it('嵌套调用watch和onWatcherCleanUp', () => {
    let calls: string[] = []
    let source: Ref<number>
    let copyist: Ref<number>
    const scope = new EffectScope()

    scope.run(() => {
      source = ref(0)
      copyist = ref(0)
      // sync by default
      watch(
        () => {
          const current = (copyist.value = source.value)
          onWatcherCleanup(() => calls.push(`sync ${current}`))
        },
        null,
        {},
      )
      watch(
        () => {
          const current = copyist.value
          onWatcherCleanup(() => calls.push(`post ${current}`))
        },
        null,
        { scheduler },
      )
    })
  })

  // 循环同步观察器
  it('recursive sync watcher on computed', () => {
    const r = ref(0)
    const c = computed(() => r.value)

    watch(c, v => {
      if (v > 1) {
        r.value--
      }
    })

    expect(r.value).toBe(0)
    expect(c.value).toBe(0)

    r.value = 10
    // expect(r.value).toBe(1)
    // expect(c.value).toBe(1)
  })
})
