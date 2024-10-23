export function createVNode(type, props?, children?) {
  const VNoode = {
    type,
    props,
    children,
  }

  return VNoode
}
