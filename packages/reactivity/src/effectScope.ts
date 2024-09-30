export class EffectScope {
  constructor() {}
  run(fn) {
    return fn()
  }
}

export function effectScope() {
  return new EffectScope()
}
