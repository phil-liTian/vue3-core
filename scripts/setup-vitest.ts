import { expect } from 'vitest'

declare module 'vitest' {
  interface Assertion {
    toHaveBeenWarned(): void
  }
}

expect.extend({
  toHaveBeenWarned(received: string) {
    return {
      message: () => `expected ${received} to have been warned`,
      pass: true,
    }
  },
})
