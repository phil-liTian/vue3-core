### 响应式原理

#### reactive函数

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

#### effect

- 可实现监听响应式对象变化，当响应式对象发生变化时，触发effect函数执行

```js
1. scheduler 第一次执行run, 后续触发trigger, 如果有scheduler则优先执行scheduler, 否则执行run。
2. stop 停止监听，不再触发effect函数执行。在effect上反向收集deps, 当执行stop时, 通过effect找到Dep上面的clean方法, 清除targetMap中的当前target。
3. 不监听Symbol原型上的属性作为key的对象变化, builtInSymbols找到当前Symbol上的所有属性名
```

#### ref

- 接受一个内部值，返回一个响应式的、可更改的 ref 对象，此对象只有一个指向其内部值的属性 .value

```js
1. ref createRef通过RefImpl类实现一个响应式对象, get时收集依赖, set时触发依赖。(通过调用Dep里面的trigger、track方法)
2. isRef 在RefImpl类中添加IS_REF标识。
3. unRef 当传入的参数为ref对象时，返回ref对象内部的value值，否则返回本身。
4. toRef 将一个对象转化成响应式对象, 如果带转化对象本身是reactive, 则这个对象与原本的对象变化保持一致。参数可以是对象ObjectRefImpl保持原来对象的响应式 或者函数 GetterRefImpl 不可编辑
5. toRefs 与 toRef不同点在于 一次可处理对象中的多个属性
6. toValue 将function或者computed、ref转化成一个值。
7. shallowRef 如果需要深度监听，在转化成reactive类型, 否则直接使用sourceValue进行监听
8. triggerRef 对于shallowRef对象, 如果值发生变化，不会自动触发依赖。这时候可以调用triggerRef手动触发依赖。触发当前ref身上dep。
9. customRef 自定义ref。通过向外抛出当前ref身上的dep, 实现自定义依赖收集及派发更新过程。vueuse中refAutoReset就是基于当前api实现
```
