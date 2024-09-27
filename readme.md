### 实现响应式原理

1. reactive函数
   _1.1_ 利用proxy实现对象代理, 可在get时实现依赖收集(track), 在set时实现派发更新(trigger)。

```js
const proxy = new Proxy(target, {
  get(target, key, receiver) {
    const res = Reflect.get(target, key, receiver)
    // 进行依赖收集
    track(target, key)

    if (key === ReactiveFlags.IS_REACTIVE) {
      return true
    }

    // 如果是一个对象的话 需要重新执行reactive函数
    if (isObject(target[key])) {
      return reactive(target[key])
    }

    return res
  },

  set(target, key, value, receiver) {
    const res = Reflect.set(target, key, value, receiver)
    // 当触发set的时候 派发更新
    trigger(target, key)
    return res
  },
})
```

2. effect函数
   _2.1_ 可实现监听响应式对象变化，当响应式对象发生变化时，触发effect函数执行

```js
class ReactiveEffect {
  private _fn: any
  constructor(fn) {
    this._fn = fn
    this.run()
  }

  run() {
    // 依赖收集的函数内容
    activeEffect = this._fn
    this._fn()
  }
}
```
