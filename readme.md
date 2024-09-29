### 实现响应式原理

reactive函数

- 使用的核心api: Proxy. 在get时实现依赖收集(track), 在set时实现派发更新(trigger)。

```js
1. reactive // 创建一个响应式对象, 如果响应式对象的值仍为一个对象, 递归调用reacitve方法。get时 收集effect, set时 触发依赖。
  1.1 将Map、WeakMap、Set、WeakSet处理成响应式对象的方法, 通过getTargetType来分别处理, collectionHandlers中为具体处理方式. 将get方法中的target进行拦截处理,可实现对target上面的set、has、add、delete等方法进行拦截
  1.2 处理数组下标及原始数组中的push、get、pop、reduce等方法进行拦截处理, 在get中收集依赖, 将收集依赖的key标记为ARRAY_ITERATE_KEY, 在通过下标修改array中元素的时候, trigger当前key, 触发依赖。
2. shallowReactive // 创建一个响应式对象, 如果响应式对象的值仍为一个对象, 不再监听对象内部属性的变化. 可作为性能优化的点。
3. isReactive // 判断一个对象是否为响应式对象。判断一个对象上是否有__v_isReactive, 触发getter则返回true 反之为false
4. toRaw // 将一个响应式对象转换为普通对象。在getter中处理, 如果获取的是__v_raw, 则直接返回target, 不再代理当前对象。
5. markRaw // 标记一个对象，使其永远不会转换为代理。标记__v_skip， 不再代理当前对象.
6. readonly // 创建一个只读的对象。get时 不收集依赖，set时 不触发依赖。
7. shallowReadonly // 创建一个只读的对象，如果对象内部属性仍为一个对象，则不会递归处理。
8. isReadonly // 判断一个对象是否为只读对象。判断一个对象上是否有__v_isReadonly, 触发getter则返回true 反之为false
9. isProxy // 判断是代理对象 很简单 只需要判断对象是否存在__v_raw即可
10. isShallow // 判断当前对象是否是__v_isShallow 判断方法同isReadonly
11. toReactive // 将一个普通对象转化成reactive对象
12. toReadonly // 将一个普通对象转化成readonly对象
```

2. effect函数(很重要)

- 可实现监听响应式对象变化，当响应式对象发生变化时，触发effect函数执行
