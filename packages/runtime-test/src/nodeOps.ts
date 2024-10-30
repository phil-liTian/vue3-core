function createElement(tag) {
  const node = {
    tag,
  }

  return node
}

export const nodeOps: {
  createElement: typeof createElement
} = {
  createElement,
}
