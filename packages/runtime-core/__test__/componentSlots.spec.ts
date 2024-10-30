import { describe, expect, test } from 'vitest'
import { getCurrentInstance, h } from '../src'
import { nodeOps, render } from '@vue/runtime-test'

describe('component: slots', () => {
  test('initSlots: instance.slots should be set correctly', () => {
    let instance: any
    const Comp = {
      render() {
        instance = getCurrentInstance()
        return h('div')
      },
    }

    const slots = { foo: () => {}, _: 1 }

    // render(createBlock(Comp, null, slots), nodeOps.createElement('div'))

    // expect(instance.slots).toMatchObject(slots)
  })
})
