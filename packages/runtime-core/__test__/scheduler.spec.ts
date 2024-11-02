import { describe, expect, it } from 'vitest'
import {
  flushPreFlushCbs,
  nextTick,
  queueJob,
  SchedulerJob,
  SchedulerJobFlags,
} from '../src/scheduler'

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

  describe('queueJob', () => {
    it('basic usage', async () => {
      const calls: string[] = []
      const job1 = () => calls.push('job1')
      const job2 = () => calls.push('job2')
      queueJob(job1)
      queueJob(job2)
      expect(calls).toEqual([])
      await nextTick()
      expect(calls).toEqual(['job1', 'job2'])
    })

    it('在flushing过程中job应该按id递增的顺序执行', async () => {
      const calls: string[] = []
      const job1 = () => {
        calls.push('job1')
        queueJob(job2)
        queueJob(job3)
      }

      const job2 = () => {
        calls.push('job2')
        queueJob(job4)
        queueJob(job5)
      }
      job2.id = 10

      const job3 = () => {
        calls.push('job3')
      }
      job3.id = 1
      const job4 = () => {
        calls.push('job4')
      }

      const job5 = () => {
        calls.push('job5')
      }

      queueJob(job1)
      expect(calls).toEqual([])
      await nextTick()
      // console.log('calls', calls)

      expect(calls).toEqual(['job1', 'job3', 'job2', 'job4', 'job5'])
    })

    it('排除重复数据', async () => {
      const calls: string[] = []
      const job1 = () => {
        calls.push('job1')
      }

      const job2 = () => {
        calls.push('job2')
      }

      queueJob(job1)
      queueJob(job2)
      queueJob(job1)
      queueJob(job2)

      expect(calls).toEqual([])

      await nextTick()
      expect(calls).toEqual(['job1', 'job2'])
    })

    it('test', async () => {
      const calls: string[] = []
      const job1 = () => {
        calls.push('job1')
        queueJob(job2)
      }

      const job2 = () => {
        calls.push('job2')
      }

      queueJob(job1)
      await nextTick()
      expect(calls).toEqual(['job1', 'job2'])
    })
  })
  describe('pre flush job', () => {
    it('在preFlush的回调中执行queueJob', async () => {
      const calls: string[] = []
      const job1 = () => {
        calls.push('job1')
      }

      const cb1: SchedulerJob = () => {
        calls.push('cb1')
        queueJob(job1)
      }

      cb1.flags! |= SchedulerJobFlags.PRE

      queueJob(cb1)
      await nextTick()
      expect(calls).toEqual(['cb1', 'job1'])
    })

    it('将flags设置成PRE之后, job插入到非PRE之前的位置', async () => {
      const calls: string[] = []
      const job1 = () => {
        calls.push('job1')
      }
      job1.id = 1

      const cb1: SchedulerJob = () => {
        calls.push('cb1')
        queueJob(job1)
        // cb2 should execute before the job
        queueJob(cb2)
        queueJob(cb3)
      }
      cb1.flags! |= SchedulerJobFlags.PRE

      const cb2: SchedulerJob = () => {
        calls.push('cb2')
      }
      cb2.flags! |= SchedulerJobFlags.PRE
      cb2.id = 1

      const cb3: SchedulerJob = () => {
        calls.push('cb3')
      }
      cb3.flags! |= SchedulerJobFlags.PRE
      cb3.id = 1

      queueJob(cb1)
      await nextTick()
      expect(calls).toEqual(['cb1', 'cb2', 'cb3', 'job1'])
    })

    it('id相同的PRE, 应该插入到后面', async () => {
      const calls: string[] = []
      const job1: SchedulerJob = () => {
        calls.push('job1')
      }
      job1.id = 1
      job1.flags! |= SchedulerJobFlags.PRE
      const job2: SchedulerJob = () => {
        calls.push('job2')
        queueJob(job5)
        queueJob(job6)
      }
      job2.id = 2
      job2.flags! |= SchedulerJobFlags.PRE
      const job3: SchedulerJob = () => {
        calls.push('job3')
      }
      job3.id = 2
      job3.flags! |= SchedulerJobFlags.PRE
      const job4: SchedulerJob = () => {
        calls.push('job4')
      }
      job4.id = 3
      job4.flags! |= SchedulerJobFlags.PRE
      const job5: SchedulerJob = () => {
        calls.push('job5')
      }
      job5.id = 2
      const job6: SchedulerJob = () => {
        calls.push('job6')
      }
      job6.id = 2
      job6.flags! |= SchedulerJobFlags.PRE

      // We need several jobs to test this properly, otherwise
      // findInsertionIndex can yield the correct index by chance
      queueJob(job4)
      queueJob(job2)
      queueJob(job3)
      queueJob(job1)

      await nextTick()
      expect(calls).toEqual(['job1', 'job2', 'job3', 'job6', 'job5', 'job4'])
    })

    it('flushPreFlushCbs 在执行掉flags为Pre的job', async () => {
      const calls: string[] = []
      const job1 = () => {
        queueJob(cb1)
        queueJob(cb2)

        flushPreFlushCbs()
        // 这行代码是同步执行的, 会最先进入到calls中, 加入flushPreFlushCbs后会执行掉flags为PRE的job
        calls.push('job1')
      }

      const cb1: SchedulerJob = () => {
        calls.push('cb1')
      }

      cb1.flags! |= SchedulerJobFlags.PRE

      const cb2: SchedulerJob = () => {
        calls.push('cb2')
      }

      cb2.flags! |= SchedulerJobFlags.PRE

      queueJob(job1)
      await nextTick()
      expect(calls).toEqual(['cb1', 'cb2', 'job1'])
    })
  })
})
