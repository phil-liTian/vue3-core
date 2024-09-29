export enum ReactiveFlags {
  IS_REACTIVE = '__v_isReactive',
  IS_SHALLOW = '__v_isShallow',
  IS_READONLY = '__v_isReadonly',
  IS_REF = '__v_isRef',
  RAW = '__v_raw',
  SKIP = '__v_skip',
}

// 触发依赖收集的type
export enum TrackOpTypes {
  GET = 'get',
  HAS = 'has',
  ITERATE = 'iterate',
}

// 触发依赖的type
export enum TriggerOpTypes {
  SET = 'set',
  ADD = 'add',
  DELETE = 'delete',
}
