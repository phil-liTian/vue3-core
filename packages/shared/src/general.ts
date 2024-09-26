export const isObject = (val: unknown): boolean =>
  val !== null && typeof val === 'object'
