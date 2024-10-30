export enum ShapeFlags {
  ELEMENT = 1, // 元素
  STATEFUL_COMPONENT = 1 << 2, // 组件
  TEXT_CHILDREN = 1 << 3,
  ARRAY_CHILDREN = 1 << 4,
  SLOTS_CHILDREN = 1 << 5,
}
