const resolvedPromise = Promise.resolve() as Promise<any>

export enum SchedulerJobFlags {
  QUEUED = 1 << 0,
  PRE = 1 << 1,
  ALLOW_RECURSE = 1 << 2,
  DISPOSED = 1 << 3,
}

export interface SchedulerJob extends Function {
  id?: number
  flags?: SchedulerJobFlags
}

export type SchedulerJobs = SchedulerJob | SchedulerJob[]

let queue: SchedulerJob[] = []
let isFlushing = false
let isFlushPending = false
let flushIndex = 0

export function nextTick<T = void, R = void>(
  this: T,
  fn?: (this: T) => R,
): Promise<Awaited<R>> {
  const p = resolvedPromise

  return fn ? p.then(this ? fn.bind(this) : fn) : p
}

// 相同flags的job, id越小越靠前
export function queueJob(job: SchedulerJob) {
  // 排除入队的是相同job的情况
  if (!(job.flags! & SchedulerJobFlags.QUEUED)) {
    const jobId = getId(job)
    const lastJob = queue[queue.length - 1]
    if (
      !lastJob ||
      (jobId >= getId(lastJob) && !(job.flags! & SchedulerJobFlags.PRE))
    ) {
      // id大于或等于最后一个job，且不是pre job，则插入到数组的最后
      queue.push(job)
    } else {
      // 插入到id比它小的job后面
      queue.splice(findInsertionIndex(jobId), 0, job)
    }
    job.flags! |= SchedulerJobFlags.QUEUED
    queueFlush()
  }
}

// 执行掉flags为pre的job
export function flushPreFlushCbs(i: number = 0): void {
  for (; i < queue.length; i++) {
    const cb = queue[i]
    if (cb && cb.flags! & SchedulerJobFlags.PRE) {
      queue.splice(i, 1)
      // 这里queue的减1了, 所有下一次遍历的下标仍是上一次的i
      i--
      cb()
    }
  }
}

function queueFlush() {
  if (!isFlushing && !isFlushPending) {
    isFlushPending = true
    resolvedPromise.then(flushJobs)
  }
}

function flushJobs() {
  isFlushPending = false
  isFlushing = true
  try {
    for (flushIndex = 0; flushIndex < queue.length; flushIndex++) {
      queue[flushIndex]()
    }
  } finally {
    queue.length = 0
    isFlushing = false
    flushIndex = 0
  }
}

function getId(job: SchedulerJob): number {
  return job.id == null
    ? job.flags! & SchedulerJobFlags.PRE
      ? -1
      : Infinity
    : job.id
}

// 获取需要插入的位置下标, 在返回结果之后插入job
// 使用二分查找 找到合适的插入位置
function findInsertionIndex(id: number) {
  let start = isFlushing ? flushIndex + 1 : 0
  let end = queue.length
  while (start < end) {
    const middle = (start + end) >> 1 // 找到中间位置 相当于除以2的操作
    const middleJob = queue[middle]
    const middleJobId = getId(middleJob)
    if (
      middleJobId < id ||
      (middleJobId === id && middleJob.flags! & SchedulerJobFlags.PRE)
    ) {
      start = middle + 1
    } else {
      end = middle
    }
  }

  return start
}
