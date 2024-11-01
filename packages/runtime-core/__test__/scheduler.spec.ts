import { describe, expect, it } from 'vitest'
import { nextTick } from '../src/scheduler'

describe('scheduler', () => {
  it('nextTick', async () => {
    const calls: string[] = []
    const dummyThen = Promise.resolve().then()
    const job1 = () => {
      calls.push('job1')
    }
    const job2 = () => {
      calls.push('job2')
    }

    nextTick(job1)
    job2()
    expect(calls.length).toBe(1)
    await dummyThen
    expect(calls.length).toBe(2)
    expect(calls).toEqual(['job2', 'job1'])
  })
})
