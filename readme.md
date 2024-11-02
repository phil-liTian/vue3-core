### 概述（核心要素）
1. 提升用户开发体验 warn函数会告诉开发者问题出现的地方。而不会直接抛出js层面的错误。帮助开发者快速的定位到问题。
2. 控制代码体积。通过 __DEV__ 控制开发环境和生产环境的包体积。在生产环境中会去掉不会执行的dead code。实现在开发环境中提供友好的提示，生产环境中不会出现警告。
3. 良好的tree-shaking支持。需要使用esm模块语法。如果一个函数没有副作用，切在系统中无导出的时候，该方法就不会打包到最终的生产环境的包中。/*@__PURE__*/

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
1. scheduler 第一次执行run, 后续触发trigger, 如果有scheduler则优先执行scheduler, 否则执行run。(调度函数)
2. stop 停止监听，不再触发effect函数执行。在effect上反向收集deps, 当执行stop时, 通过effect找到Dep上面的clean方法, 清除targetMap中的当前target。
3. 不监听Symbol原型上的属性作为key的对象变化, builtInSymbols找到当前Symbol上的所有属性名
```

#### ref

- 接受一个内部值，返回一个响应式的、可更改的 ref 对象，此对象只有一个指向其内部值的属性 .value

```js
1. ref createRef通过RefImpl类实现一个响应式对象, get时收集依赖, set时触发依赖。(通过调用Dep里面的trigger、track方法). computed和watch都深度依赖这个函数。
2. isRef 在RefImpl类中添加IS_REF标识。
3. unRef 当传入的参数为ref对象时，返回ref对象内部的value值，否则返回本身。
4. toRef 将一个对象转化成响应式对象, 如果带转化对象本身是reactive, 则这个对象与原本的对象变化保持一致。参数可以是对象ObjectRefImpl保持原来对象的响应式 或者函数 GetterRefImpl 不可编辑
5. toRefs 与 toRef不同点在于 一次可处理对象中的多个属性
6. toValue 将function或者computed、ref转化成一个值。
7. shallowRef 如果需要深度监听，在转化成reactive类型, 否则直接使用sourceValue进行监听
8. triggerRef 对于shallowRef对象, 如果值发生变化，不会自动触发依赖。这时候可以调用triggerRef手动触发依赖。触发当前ref身上dep。
9. customRef 自定义ref。通过向外抛出当前ref身上的dep, 实现自定义依赖收集及派发更新过程。vueuse中refAutoReset就是基于当前api实现
```

#### 用于存储数据的双向链表
```js
export class Link {
  nextDep?: Link
  prevDep?: Link
  nextSub?: Link
  prevSub?: Link
  prevActiveSub?: Link

  constructor(
    public sub: Subscriber, // activeEffect
    public dep: Dep, // dep(收集依赖的容器)
  ) {
    this.nextDep =
      this.nextSub =
      this.prevDep =
      this.nextSub =
      this.prevSub =
      this.prevActiveSub =
        undefined
  }
}
```

#### watch
1. 可以监听的source类型
2. callback 的参数可以有哪些 如何实现
3. options 可有哪些配置项
```js

```

### runtime-core 运行时核心

基本流程
```js
function createApp(rootComponent) {
  return {
    mount(rootContainer) {
      render(rootComponent, rootContainer)
    }
  }
}

// vnode可以是一个对象
function render(vnode, container) {
  patch(vnode, container)
}


function patch(vnode, container) {
  // element类型
  if ( typeof vnode.type === 'string' ) {
    processElement(vnode, container)
  } else {
    processComponent(vnode, container)
  }
}

// 处理element
function  processElement(vnode, container) {
  // init -> update
  mountElement(vnode, container)
}


// 处理组件
function processComponent(vnode, container) {
  mountComponent(vnode, container)
}

function mountComponent(vnode, container) {
  const instance = createComponentInstance(vnode, container)

  // 处理组件实例
  setupComponent(instance)

  // 拆箱（执行render)
  setupRenderEffect(instance, container)
}

function createComponentInstance(vnode, container) {
  const component = {
    vnode,
    type: vnode.type
  }

  return component
}

function setupComponent(component) {
  // 处理props
  initProps()
  // 处理插槽
  initSlots()
  // 调用setup
  setupStatefulComponent(component)
}

// 拆箱
function setupRenderEffect(instance, container) {
  const subTree = instance.render()
  patch(subTree, container)
}

function setupStatefulComponent(vnode) {
  const Component = vnode.type
  const { setup } = Component
  if ( setup ) {
    const setupResult = setup()
    handleSetupResult(instance, setupResult)
  }
}


// 处理setup返回值
function handleSetupResult(instance, setupResult) {
  if (typeof setupResult === 'object') {
    instance.setupState = setupResult
  }

  finishComponentSetup(instance)
}

// 挂载render函数
function finishComponentSetup(instance) {
  const Component = instance.type
  if (Component.render) {
    instance.render = Component.render
  }
}

// 创建元素
function mountElement(vnode, container) {
  const el = document.createElement(vnode.type)
  const { children } = vnode

  if ( Array.isArray(children)) {
    mountChildren(children, el)
  } else {
    el.textContent = vnode.children
  }

  el.setAttribute('id', '1231')

  container.append(el)
}

// 处理array children
function mountChildren (children, container) {
  children.forEach(child => {
    patch(child, container)
  })
}

```

```js
1. 实现组件代理对象 componentPublicInstance,可以在render函数中通过this访问到$el, $props, $slots等
2. 实现跨级组件通讯, provide/inject,使用parentComponent来获取到父级组件prvides提供的属性, 利用原型链的思想
3. 实现customRender实现自定义渲染器,通过runtime-dom中的api给renderer函数动态传参, 从而实现可在不同平台使用runtime-core中的逻辑，纯js逻辑
4. 双端对比diff算法, 使用i(共同的下标索引)、e1(n1的children的长度)、e2(n1的children的长度)，来动态锁定中间乱序的部分
  4.1 优化点1: 使用keyToNewIndexMap实现时间复杂度从o(n^2)降低到o(n)
  4.2 优化点2: 比较patch和tobePatched, 如果tobenPatched>patch,则说明后面的节点是需要删除的，无需继续比较了
  4.3 优化点3: 增加moved和maxNewIndexSoFar，比较当前的index和maxNewIndexSoFar， 如果maxNewIndexSoFar>index，说明当前节点需要移动，否则不需要移动。
  4.4 优化点4: 获取到newIndexToOldIndexMap的最长递增子序列, 来实现来中间乱序部分的移动
  4.5 优化点5: j < 0, 则节点需要移动
5. 实现slots, 具名插槽、作用域插槽以及默认插槽。SLOT_CHIDLREN 标识符,如果父级组件的是一个STATEFUL_COMPONENT，children是一个object类型，则认为是一个slot, renderSlot可处理具体内容
6. h函数是对createVNode函数的一个补充，第二个参数可以是props或者是children, 在h函数中已对其进行处理。另外，h函数的参数可以大于3个,从第三个参数开始，后续的参数都认为是children。
6. nextTick实现原理: Promise.resolve().then(flushJobs)， 本质上就是一个异步任务，当执行完当前任务后，再执行flushJobs
```

