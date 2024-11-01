const resolvedPromise = Promise.resolve() as Promise<any>

export interface SchedulerJob extends Function {
  id?: number
}

let queue: SchedulerJob[] = []
let isFlushing = false
let isFlushPending = false

export type SchedulerJobs = SchedulerJob | SchedulerJob[]
export function nextTick<T = void, R = void>(this, fn) {
  const p = resolvedPromise

  return fn ? p.then(this ? fn.bind(this) : fn) : p
}

export function queueJob(job: SchedulerJob) {
  if (!queue.includes(job)) {
    queue.push(job)
    queueFlush()
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
  for (let i = 0; i < queue.length; i++) {
    queue[i]()
    isFlushing = false
  }
}
