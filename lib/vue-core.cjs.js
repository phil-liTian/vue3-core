'use strict';

const NOOP = () => { };
const EMPTY_OBJ = {};
// 判断是否是对象类型
const isObject = (val) => val !== null && typeof val === 'object';
const objectToString = Object.prototype.toString;
const toTypeString = (val) => objectToString.call(val);
const isArray = Array.isArray;
const isMap = (val) => toTypeString(val) === '[object Map]';
const isString = (val) => typeof val === 'string';
const isSymbol = (val) => typeof val === 'symbol';
// val is Function 类型谓词, 可更清晰地表达代码中的逻辑，更容易理解变量的类型在不同情况下的变化
const isFunction = (val) => typeof val === 'function';
const toRawType = (val) => toTypeString(val).slice(8, -1);
// 对象上是否存在某个属性
const hasOwnProperty = Object.prototype.hasOwnProperty;
const hasOwn = (val, key) => hasOwnProperty.call(val, key);
// 给可拓展对象添加属性
const def = (obj, key, val) => {
    Object.defineProperty(obj, key, { value: val });
};
const isIntegerKey = (key) => {
    return (isString(key) && key !== 'NAN' && '' + parseInt(key, 10) === key);
};
const extend = Object.assign;
const hasChanged = (value, oldValue) => !Object.is(value, oldValue);
const isOn = (key) => /^on[A-Z]/.test(key);

var ShapeFlags;
(function (ShapeFlags) {
    ShapeFlags[ShapeFlags["ELEMENT"] = 1] = "ELEMENT";
    ShapeFlags[ShapeFlags["STATEFUL_COMPONENT"] = 4] = "STATEFUL_COMPONENT";
    ShapeFlags[ShapeFlags["TEXT_CHILDREN"] = 8] = "TEXT_CHILDREN";
    ShapeFlags[ShapeFlags["ARRAY_CHILDREN"] = 16] = "ARRAY_CHILDREN";
    ShapeFlags[ShapeFlags["SLOTS_CHILDREN"] = 32] = "SLOTS_CHILDREN";
})(ShapeFlags || (ShapeFlags = {}));

var ReactiveFlags;
(function (ReactiveFlags) {
    ReactiveFlags["IS_REACTIVE"] = "__v_isReactive";
    ReactiveFlags["IS_SHALLOW"] = "__v_isShallow";
    ReactiveFlags["IS_READONLY"] = "__v_isReadonly";
    ReactiveFlags["IS_REF"] = "__v_isRef";
    ReactiveFlags["RAW"] = "__v_raw";
    ReactiveFlags["SKIP"] = "__v_skip";
})(ReactiveFlags || (ReactiveFlags = {}));
// 触发依赖收集的type
var TrackOpTypes;
(function (TrackOpTypes) {
    TrackOpTypes["GET"] = "get";
    TrackOpTypes["HAS"] = "has";
    TrackOpTypes["ITERATE"] = "iterate";
})(TrackOpTypes || (TrackOpTypes = {}));
// 触发依赖的type
var TriggerOpTypes;
(function (TriggerOpTypes) {
    TriggerOpTypes["SET"] = "set";
    TriggerOpTypes["ADD"] = "add";
    TriggerOpTypes["DELETE"] = "delete";
})(TriggerOpTypes || (TriggerOpTypes = {}));

function warn(msg, ...args) {
    console.warn(`[Vue warn] ${msg}`, ...args);
}

let activeEffectScope;
class EffectScope {
    constructor() {
        this._active = true;
        this.effects = [];
        this.cleanups = [];
    }
    get active() {
        return this._active;
    }
    run(fn) {
        if (this._active) {
            activeEffectScope = this;
            return fn();
        }
    }
    stop() {
        if (this._active) {
            let i;
            for (i = 0; i < this.effects.length; i++) {
                this.effects[i].stop();
            }
            for (i = 0; i < this.cleanups.length; i++) {
                this.cleanups[i]();
            }
            this._active = false;
        }
    }
}
function effectScope() {
    return new EffectScope();
}
// 如果存在activeEffectScope, 则向cleanups中收集fn, 当执行stop的时候, 依次执行这些fn
function onScopeDispose(fn, failSilently = false) {
    if (activeEffectScope) {
        activeEffectScope.cleanups.push(fn);
    }
    else if (!failSilently) {
        warn(`onScopeDispose() is called when there is no active effect scope` +
            ` to be associated with.`);
    }
}

/**
 * @description 当前正在收集的effect
 */
let activeEffect;
/**
 * @description 标识是否应该被收集
 */
let shouldTrack = true;
var EffectFlags;
(function (EffectFlags) {
    EffectFlags[EffectFlags["ACTIVE"] = 1] = "ACTIVE";
    EffectFlags[EffectFlags["RUNNING"] = 2] = "RUNNING";
    EffectFlags[EffectFlags["TRACKING"] = 4] = "TRACKING";
    EffectFlags[EffectFlags["NOTIFIED"] = 8] = "NOTIFIED";
    EffectFlags[EffectFlags["DIRTY"] = 16] = "DIRTY";
    EffectFlags[EffectFlags["ALLOW_RECURSE"] = 32] = "ALLOW_RECURSE";
    EffectFlags[EffectFlags["PAUSE"] = 64] = "PAUSE";
})(EffectFlags || (EffectFlags = {}));
class ReactiveEffect {
    constructor(fn) {
        this.fn = fn;
        this.flags = EffectFlags.ACTIVE | EffectFlags.TRACKING;
        // 用作反向收集dep, 实现stop方法
        this.deps = undefined;
        this.next = undefined;
        // 链表尾部
        this.depsTail = undefined;
        this.cleanup = undefined;
        if (activeEffectScope && activeEffectScope.active) {
            activeEffectScope.effects.push(this);
        }
    }
    run() {
        if (!(this.flags & EffectFlags.ACTIVE)) {
            return this.fn();
        }
        // 标识正在运行
        this.flags |= EffectFlags.RUNNING;
        // 依赖收集的函数内容
        // const prevEffect = activeEffect
        activeEffect = this;
        shouldTrack = true;
        try {
            return this.fn();
        }
        finally {
            // activeEffect = prevEffect
            // 避免effect函数中循环引用, effect内部的函数继续触发setter, 无限被收集的问题, 只有运行中的effect才被收集
            this.flags &= ~EffectFlags.RUNNING;
        }
    }
    stop() {
        shouldTrack = false;
        for (let link = this.deps; link; link = link.nextDep) {
            link.dep.cleanup();
        }
        this.onStop && this.onStop();
    }
    trigger() {
        if (this.flags & EffectFlags.PAUSE) ;
        else if (this.scheduler) {
            this.scheduler();
        }
        else {
            this.run();
        }
    }
    // 通知需要更新batchedSub
    notify() {
        if (this.flags & EffectFlags.RUNNING) {
            return;
        }
        // 已经通知过需要更新的sub, 无需再通知
        if (!(this.flags & EffectFlags.NOTIFIED)) {
            batch(this);
        }
    }
    pause() {
        this.flags |= EffectFlags.PAUSE;
    }
    resume() {
        if (this.flags & EffectFlags.PAUSE) {
            // 取消暂停状态
            this.flags &= ~EffectFlags.PAUSE;
            // 取消之后立即执行一次
            this.trigger();
        }
    }
    get dirty() {
        return true;
    }
}
function effect(fn, options) {
    const effect = new ReactiveEffect(fn);
    if (options) {
        extend(effect, options);
    }
    try {
        effect.run();
    }
    catch (err) {
        throw err;
    }
    const runner = effect.run.bind(effect);
    runner.effect = effect;
    return runner;
}
// 收集Subscriber
let batchedSub;
let batchDepth = 0;
function batch(sub) {
    sub.flags |= EffectFlags.NOTIFIED;
    sub.next = batchedSub;
    batchedSub = sub;
}
function startBatch() {
    batchDepth++;
}
// 遍历当前的batchedSub, 触发trigger函数
function endBatch() {
    if (--batchDepth > 0 || !batchedSub)
        return;
    while (batchedSub) {
        let e = batchedSub;
        let next;
        while (e) {
            e.flags &= ~EffectFlags.NOTIFIED;
            e = e.next;
        }
        e = batchedSub;
        batchedSub = undefined;
        while (e) {
            try {
                if (e.flags & EffectFlags.ACTIVE) {
                    ;
                    e.trigger();
                }
            }
            catch (error) { }
            next = e.next;
            e.next = undefined;
            e = next;
        }
    }
}
// 处理computed
function refreshComputed(computed) {
    // 不是DIRTY 不需要重新计算, 且不是在监听中, 则直接返回
    // if (
    //   !(computed.flags & EffectFlags.DIRTY) &&
    //   computed.flags & EffectFlags.TRACKING
    // ) {
    //   return
    // }
    // 清除DIRTY标志位
    // computed.flags &= ~EffectFlags.DIRTY
    if (globalVersion === computed.globalVersion) {
        return;
    }
    computed.globalVersion = globalVersion;
    const value = computed.fn(computed._value);
    if (hasChanged(value, computed._value)) {
        computed._value = value;
    }
}

const targetMap = new WeakMap();
const MAP_KEY_ITERATE_KEY = Symbol('Map keys iterate');
const ITERATE_KEY = Symbol('object iterate');
const ARRAY_ITERATE_KEY = Symbol('Array Iterate');
/**
 * 每次响应式数据发生变化时，自增1；在computed中使用, 如果值没有发生变化, 则computed不重新计算
 */
let globalVersion = 0;
// 创建一个双向链表
class Link {
    constructor(sub, // activeEffect
    dep) {
        this.sub = sub;
        this.dep = dep;
        this.nextDep =
            this.nextSub =
                this.prevDep =
                    this.nextSub =
                        this.prevSub =
                            this.prevActiveSub =
                                undefined;
    }
}
class Dep {
    constructor(computed) {
        this.computed = computed;
        this.deps = new Set();
        this.activeLink = undefined;
        // 双向链表的尾部
        this.subs = undefined;
        // 双向链表的头部
        this.subsHead = undefined;
        // SubScriber Counter
        this.sc = 0;
    }
    track() {
        if (!activeEffect || !shouldTrack)
            return;
        let link = this.activeLink;
        if (link === undefined || link.sub !== activeEffect) {
            // activeEffect反向收集当前deps, 执行stop方法的时候 清空当前activeEffect
            link = this.activeLink = new Link(activeEffect, this);
            if (!activeEffect.deps) {
                // 初始化activeEffect的deps和depsTail
                activeEffect.deps = activeEffect.depsTail = link;
            }
            else {
                // effect 形成一个链表
                activeEffect.depsTail.nextDep = link;
            }
            addSub(link);
        }
    }
    trigger() {
        globalVersion++;
        this.notify();
    }
    notify() {
        startBatch();
        // this.deps.forEach(effect => {
        //   if (effect) {
        //     // ;(effect as any).run()
        //     ;(effect as any).trigger()
        //   }
        // })
        try {
            for (let link = this.subs; link; link = link.prevSub) {
                if (link.sub.notify()) {
                    // link.sub.notify()
                }
            }
        }
        finally {
            endBatch();
        }
    }
    cleanup() {
        // this.deps.forEach(dep => dep.delete(this))
        // activeEffect.deps
        this.subs = undefined;
        this.deps.delete(activeEffect);
    }
}
function addSub(link) {
    // this.deps.add(activeEffect)
    // if (link.sub.flags & EffectFlags.DIRTY) {
    // }
    // 记录Subscriber 的数量
    // link.dep.sc++
    if (link.sub.flags & EffectFlags.TRACKING) {
        const computed = link.dep.computed;
        if (computed) {
            computed.flags |= EffectFlags.TRACKING | EffectFlags.DIRTY;
        }
        link.dep.deps.add(activeEffect);
        const currentTail = link.dep.subs;
        if (currentTail !== link) {
            link.prevSub = currentTail;
        }
        link.dep.subs = link;
        // 收集到deps 然后在effect中执行这些deps
        // link.sub.deps = link.dep.deps
    }
}
/**
 *
 * @param target 拥有反应属性的对象。
 * @param type  定义对反应属性的访问类型
 * @param key 要跟踪的反应属性的标识符
 */
function track(target, type, key) {
    if (shouldTrack && activeEffect) {
        let depsMap = targetMap.get(target);
        if (!depsMap) {
            targetMap.set(target, (depsMap = new Map()));
        }
        let dep = depsMap.get(key);
        if (!dep) {
            depsMap.set(key, (dep = new Dep()));
        }
        dep.track();
    }
}
// 通过target和key找到deps, 然后依次执行deps中的effect函数
function trigger(target, type, key) {
    const run = (dep) => {
        if (dep) {
            dep.trigger();
        }
    };
    // startBatch()
    const depsMap = targetMap.get(target);
    if (!depsMap) {
        // 没有被track过
        globalVersion++;
        return;
    }
    let dep = depsMap.get(key);
    const targetIsArray = isArray(target);
    // 操作数组的下标触发trigger
    const isArrayIndex = targetIsArray && isIntegerKey(key);
    if (isArray(target) && key === 'length') ;
    else {
        // ADD | SET | DELETE
        run(dep);
        // 如果此处通过数组下标 设置元素内容, 则通过ARRAY_ITERATE_KEY来派发依赖更新
        if (isArrayIndex) {
            run(depsMap.get(ARRAY_ITERATE_KEY));
        }
    }
    switch (type) {
        case TriggerOpTypes.ADD:
            if (!targetIsArray) {
                run(depsMap.get(ITERATE_KEY));
                // map才会run
                if (isMap(target)) {
                    run(depsMap.get(MAP_KEY_ITERATE_KEY));
                }
            }
            break;
        case TriggerOpTypes.SET:
            break;
        case TriggerOpTypes.DELETE:
            break;
    }
    // endBatch()
}

function reactiveReadArray(array) {
    const raw = toRaw(array);
    if (raw === array)
        return raw;
    track(raw, TrackOpTypes.ITERATE, ARRAY_ITERATE_KEY);
    return raw.map(toReactive);
}
const arrayInstrumentations = {
    __proto__: null,
    join(separator) {
        return reactiveReadArray(this).join(separator);
    },
    push(...args) {
        return noTracking(this, 'push', args);
    },
    shift() {
        return noTracking(this, 'shift');
    },
    pop() {
        return noTracking(this, 'pop');
    },
    unshift(...args) {
        return noTracking(this, 'unshift', args);
    },
};
// 不需要被track的方法
function noTracking(self, method, args = []) {
    const res = toRaw(self)[method].apply(self, args);
    return res;
}

const builtInSymbols = new Set(Object.getOwnPropertyNames(Symbol).map(key => Symbol[key]));
class BaseReactiveHandler {
    constructor(_isReadonly = false, _isShallow = false) {
        this._isReadonly = _isReadonly;
        this._isShallow = _isShallow;
    }
    get(target, key, receiver) {
        const isShallow = this._isShallow, isReadonly = this._isReadonly;
        if (key === ReactiveFlags.IS_REACTIVE) {
            return true;
        }
        if (key === ReactiveFlags.IS_SHALLOW) {
            return isShallow;
        }
        else if (key === ReactiveFlags.IS_READONLY) {
            return isReadonly;
        }
        // 通过toRaw获取原始类型时 直接返回target
        if (key === ReactiveFlags.RAW) {
            // 只有对象的原型相同时才返回target
            if (Object.getPrototypeOf(target) === Object.getPrototypeOf(receiver)) {
                return target;
            }
            return;
        }
        const targetIsArray = isArray(target);
        // 处理array的依赖收集 arrayInstrumentations对象中的所有key都能触发依赖收集
        let fn;
        if (targetIsArray && (fn = arrayInstrumentations[key])) {
            return fn;
        }
        const res = Reflect.get(target, key, receiver);
        // 不监听Symbol的静态属性
        if (isSymbol(key) && builtInSymbols.has(key)) {
            return res;
        }
        // 进行依赖收集
        track(target, TrackOpTypes.GET, key);
        // 响应式对象只处理到第一层
        if (isShallow) {
            return res;
        }
        // 如果是一个对象的话 需要重新执行reactive函数, 监听嵌套的对象
        if (isObject(target[key])) {
            return isReadonly ? readonly(target[key]) : reactive(target[key]);
        }
        return res;
    }
}
// 可以set
class MutableReactiveHandler extends BaseReactiveHandler {
    constructor(isShallow = false) {
        super(false, isShallow);
    }
    set(target, key, value, receiver) {
        let oldValue = target[key];
        if (!isShallow(value) && !isReadonly(value)) {
            // set的时候 如果set的是一个reactive对象, 则将这个reactive对象转化成原始类型, 因为reactive对象默认是递归都具有响应式的, 里面对象无需再包装
            value = toRaw(value);
        }
        // 判断是否是已经存在的属性
        const hadKey = isArray(target)
            ? Number[key] < target.length
            : hasOwn(target, key);
        const res = Reflect.set(target, key, value, receiver);
        // 控制只有receiver和target相同时才触发依赖(及当前对象自身的setter), 如果触发的是原型上的setter, 则当前依赖不会触发
        if (target === toRaw(receiver)) {
            if (!hadKey) {
                // 新增属性
                trigger(target, TriggerOpTypes.ADD, key);
            }
            else if (hasChanged(oldValue, value)) {
                // update(值发生改变时才需要更新)
                trigger(target, TriggerOpTypes.SET, key);
            }
        }
        return res;
    }
    deleteProperty(target, key) {
        const hadKey = hasOwn(target, key);
        const result = Reflect.deleteProperty(target, key);
        if (result && hadKey) {
            trigger(target, TriggerOpTypes.DELETE, key);
        }
        return result;
    }
    // in 操作符 会触发has操作，处理should observe has operations
    has(target, key) {
        const res = Reflect.has(target, key);
        // symbol 和 symbol原型上的方法 都不会触发当前依赖收集
        if (!isSymbol(key) || !builtInSymbols.has(key)) {
            track(target, TrackOpTypes.HAS, key);
        }
        return res;
    }
    // for ... in 操作符会触发 ownKeys。此处收集ITERATE_KEY, 当触发set时, 会匹配到TriggerOpTypes.ADD, trigger ITERATE_KEY
    ownKeys(target) {
        track(target, TrackOpTypes.ITERATE, ITERATE_KEY);
        return Reflect.ownKeys(target);
    }
}
class ReadonlyReactiveHandler extends BaseReactiveHandler {
    constructor(isShallow = false) {
        super(true, isShallow);
    }
    set(target, key, value) {
        warn(`set ${String(target)} failed: target is readonly.`, target);
        return true;
    }
}
const mutableHandlers = new MutableReactiveHandler();
const shallowReactiveHandlers = new MutableReactiveHandler(true);
const readonlyHandlers = new ReadonlyReactiveHandler();
const shallowReadonlyHandlers = new ReadonlyReactiveHandler(true);

const getProto = (v) => Reflect.getPrototypeOf(v);
// 创建一个可迭代的方法
function createIterableMethod(method) {
    return function (...args) {
        console.log('this', this);
    };
}
function get(target, key, isReadonly, isShallow) {
    target = target[ReactiveFlags.RAW];
    const rawTatget = toRaw(target);
    const wrap = toReactive;
    const { has } = getProto(rawTatget);
    if (has.call(rawTatget, key)) {
        return wrap(target.get(key));
    }
    track(target, TrackOpTypes.GET, key);
}
function set(key, value) {
    const target = toRaw(this);
    target.set(key, value);
    trigger(target, TriggerOpTypes.SET, value);
    return this;
}
function has(key) {
    const target = this[ReactiveFlags.RAW];
    const targetRaw = toRaw(target);
    track(targetRaw, TrackOpTypes.HAS, key);
    return targetRaw.has(key);
}
function add(value) {
    const target = toRaw(this);
    const targetRaw = toRaw(target);
    targetRaw.add(value);
    trigger(target, TriggerOpTypes.ADD, value);
    return this;
}
function createInstrucmentations() {
    const mutableInstrucmentations = {
        get(key) {
            return get(this, key);
        },
        set,
        has,
        add,
    };
    const iteratorMethods = ['keys', 'values', 'entries', Symbol.iterator];
    iteratorMethods.forEach(method => {
        mutableInstrucmentations[method] = createIterableMethod();
    });
    return {
        mutableInstrucmentations,
    };
}
const { mutableInstrucmentations } = createInstrucmentations();
const createInstrumentationGetter = (target, key, receiver) => {
    if (key === ReactiveFlags.IS_REACTIVE) {
        return true;
    }
    if (key === ReactiveFlags.RAW) {
        return target;
    }
    return Reflect.get(
    // hasOwn(mutableInstrucmentations, key) && key in target
    //   ? mutableInstrucmentations
    //   : target,
    mutableInstrucmentations, key, receiver);
};
const mutableCollectionHandlers = {
    get: createInstrumentationGetter,
};
const shallowCollectionHandlers = {
    get: createInstrumentationGetter,
};
const readonlyCollectionHandlers = {
    get: createInstrumentationGetter,
};

const reactiveMap = new WeakMap();
const shallowReactiveMap = new WeakMap();
const readonlyMap = new WeakMap();
const shallowReadonlyMap = new WeakMap();
var TargetType;
(function (TargetType) {
    // MarkRaw 可标记无需响应式的对象, 通过添加SKIP flag
    TargetType[TargetType["INVALID"] = 0] = "INVALID";
    // 标识是否是Set、Map, WeakMap, WeakSet等类型
    TargetType[TargetType["COLLECTION"] = 1] = "COLLECTION";
})(TargetType || (TargetType = {}));
function targetTypeMap(rawType) {
    switch (rawType) {
        case 'Map':
        case 'Set':
        case 'WeakMap':
        case 'WeakSet':
            return TargetType.COLLECTION;
    }
}
function getTargetType(value) {
    return value[ReactiveFlags.SKIP]
        ? TargetType.INVALID
        : targetTypeMap(toRawType(value));
}
function toRaw(observed) {
    const raw = observed && observed[ReactiveFlags.RAW];
    return raw ? toRaw(raw) : observed;
}
// 去掉响应式
function markRaw(value) {
    // 如果没有SKIP属性, 并且value是可扩展对象的话，添加属性SKIP
    if (!hasOwn(value, ReactiveFlags.SKIP) && Object.isExtensible(value)) {
        // value[ReactiveFlags.SKIP] = true
        // 添加属性SKIP
        def(value, ReactiveFlags.SKIP, true);
    }
    return value;
}
function reactive(target) {
    return createReactiveObject(target, mutableHandlers, mutableCollectionHandlers, reactiveMap);
}
function shallowReactive(target) {
    return createReactiveObject(target, shallowReactiveHandlers, shallowCollectionHandlers, shallowReactiveMap);
}
function readonly(target) {
    return createReactiveObject(target, readonlyHandlers, readonlyCollectionHandlers, readonlyMap);
}
function shallowReadonly(target) {
    return createReactiveObject(target, shallowReadonlyHandlers, readonlyCollectionHandlers, shallowReadonlyMap);
}
// 判断是否是reactive类型
function isReactive(value) {
    // 如果value是一个reactive对象, 那么必定会触发proxy的getter
    return !!(value && value[ReactiveFlags.IS_REACTIVE]);
}
function isShallow(value) {
    return !!(value && value[ReactiveFlags.IS_SHALLOW]);
}
function isReadonly(value) {
    return !!(value && value[ReactiveFlags.IS_READONLY]);
}
function isProxy(value) {
    return !!(value && value[ReactiveFlags.RAW]);
}
const toReactive = (value) => {
    return isObject(value) ? reactive(value) : value;
};
const toReadonly = (value) => isObject(value) ? readonly(value) : value;
function createReactiveObject(target, baseHandlers, collectionHandlers, proxyMap) {
    // 如果多次给同一对象(即target相同) 添加响应式 则返回同一对象
    const existingProxy = proxyMap.get(target);
    if (existingProxy) {
        return existingProxy;
    }
    // 如果监听的就是一个reactive对象, 则直接返回该对象
    if (target[ReactiveFlags.RAW] && target[ReactiveFlags.IS_REACTIVE]) {
        return target;
    }
    const targetType = getTargetType(target);
    // 标记INVALID后无需响应式
    if (targetType === TargetType.INVALID) {
        return target;
    }
    const proxy = new Proxy(target, targetType === TargetType.COLLECTION ? collectionHandlers : baseHandlers);
    proxyMap.set(target, proxy);
    return proxy;
}

var _a, _b, _c, _d, _e;
class CustomRefImpl {
    constructor(factory) {
        this[_a] = true;
        this._value = undefined;
        const dep = new Dep();
        // 此处向外抛出的是依赖收集Dep身上的track和trigger, 可用用户自定义track和trigger的逻辑, 例如vueuse中的refAutoReset就是利用这个api实现灵活控制ref自动重置
        const { get, set } = factory(dep.track.bind(dep), dep.trigger.bind(dep));
        this._get = get;
        this._set = set;
    }
    get value() {
        return (this._value = this._get());
    }
    set value(newValue) {
        this._set(newValue);
    }
}
_a = ReactiveFlags.IS_REF;
class RefImpl {
    constructor(rawValue, isShallow) {
        this.dep = new Dep();
        this[_b] = true;
        this._rawValue = isShallow ? rawValue : toRaw(rawValue);
        this._value = isShallow ? rawValue : toReactive(rawValue);
        this[ReactiveFlags.IS_SHALLOW] = isShallow;
    }
    get value() {
        this.dep.track();
        return this._value;
    }
    set value(newValue) {
        const oldValue = this._rawValue;
        // 重新set的值是shallow或者原始的类型是shallow, 则直接赋值, 否则toRaw再附值
        const useDirectValue = isShallow(newValue) || this[ReactiveFlags.IS_SHALLOW];
        newValue = useDirectValue ? newValue : toRaw(newValue);
        // 性能优化点: 只有值发生改变时,才触发更新
        if (hasChanged(oldValue, newValue)) {
            this._rawValue = newValue;
            this._value = newValue;
            this.dep.trigger();
        }
    }
}
_b = ReactiveFlags.IS_REF;
function createRef(value, shallow) {
    return new RefImpl(value, shallow);
}
function shallowRef(value) {
    return createRef(value, true);
}
function triggerRef(ref) {
    if (ref.dep) {
        ref.dep.trigger();
    }
}
function ref(value) {
    return createRef(value, false);
}
function customRef(factory) {
    return new CustomRefImpl(factory);
}
function isRef(r) {
    return !!(r && r[ReactiveFlags.IS_REF]);
}
function toRef(source, key, defaultValue) {
    if (isRef(source)) {
        return source;
    }
    else if (isFunction(source)) {
        return new GetterRefImpl(source);
    }
    else if (isObject(source) && arguments.length > 1) {
        // 保留原来source的响应式
        return propertyToRef(source, key, defaultValue);
    }
    else {
        return ref(source);
    }
}
function toRefs(object) {
    // toRefs的参数 必须是一个响应式对象
    if (!isProxy(object)) {
        warn('toRefs() expects a reactive object but received a plain one.');
    }
    let ret = isArray(object) ? new Array(object.length) : {};
    for (let key in object) {
        ret[key] = propertyToRef(object, key);
    }
    return ret;
}
function unRef(ref) {
    return isRef(ref) ? ref.value : ref;
}
function toValue(source) {
    return isFunction(source) ? source() : unRef(source);
}
// 作用: 在组件中可直接使用ref, 或computed返回的值, 而无需再.value调用了
function proxyRefs(objectWithRefs) {
    return isReactive(objectWithRefs)
        ? objectWithRefs
        : new Proxy(objectWithRefs, shallowUnwrapHandlers);
}
// toRef可保留object的响应式
class ObjectRefImpl {
    constructor(_object, _key, _defaultValue) {
        this._object = _object;
        this._key = _key;
        this._defaultValue = _defaultValue;
        this[_c] = true;
    }
    get value() {
        const val = this._object[this._key];
        return val !== null && val !== void 0 ? val : this._defaultValue;
    }
    set value(newVal) {
        this._object[this._key] = newVal;
    }
}
_c = ReactiveFlags.IS_REF;
// 处理函数, readonly
class GetterRefImpl {
    constructor(_getter) {
        this._getter = _getter;
        this[_d] = true;
        this[_e] = true;
    }
    get value() {
        return this._getter();
    }
}
_d = ReactiveFlags.IS_REF, _e = ReactiveFlags.IS_READONLY;
function propertyToRef(source, key, defaultValue) {
    const value = source[key];
    return isRef(value)
        ? value
        : new ObjectRefImpl(source, key, defaultValue);
}
const shallowUnwrapHandlers = {
    get(target, key) {
        return unRef(Reflect.get(target, key));
    },
    set(target, key, value) {
        const oldValue = target[key];
        if (isRef(oldValue) && !isRef(value)) {
            return (oldValue.value = value);
        }
        else {
            return Reflect.set(target, key, value);
        }
    },
};

class ComputedRefImpl {
    constructor(fn, setter) {
        this.fn = fn;
        this.setter = setter;
        this._value = undefined;
        // computed也是一个ref类型
        this.__v_isRef = true;
        this.dep = new Dep(this);
        this.flags = EffectFlags.DIRTY;
        this.globalVersion = globalVersion - 1;
        // 没有setter就是readonly
        this[ReactiveFlags.IS_READONLY] = !setter;
    }
    notify() {
        console.log('notify');
    }
    get value() {
        this.dep.track();
        // 处理computed中逻辑, 在getter时 才会调用fn, lazyComputed
        refreshComputed(this);
        return this._value;
    }
    set value(newValue) {
        if (this.setter) {
            this.setter(newValue);
        }
        else {
            warn('Write opeation failed: computed value is readonly');
        }
    }
}
function computed(getterOrOptions) {
    let getter;
    let setter;
    if (isFunction(getterOrOptions)) {
        getter = getterOrOptions;
    }
    else {
        getter = getterOrOptions.get;
        setter = getterOrOptions.set;
    }
    const cRef = new ComputedRefImpl(getter, setter);
    return cRef;
}

var WatchErrorCodes;
(function (WatchErrorCodes) {
    WatchErrorCodes[WatchErrorCodes["WATCH_GETTER"] = 2] = "WATCH_GETTER";
    WatchErrorCodes[WatchErrorCodes["WATCH_CALLBACK"] = 3] = "WATCH_CALLBACK";
    WatchErrorCodes[WatchErrorCodes["WATCH_CLEANUP"] = 4] = "WATCH_CLEANUP";
})(WatchErrorCodes || (WatchErrorCodes = {}));
// 存储cleanUp方法, 在触发更新时执行job
const cleanUpMap = new WeakMap();
let activeWatcher = undefined;
function getCurrentWatcher() {
    return activeWatcher;
}
/**
 * @description 注册一个清理函数，在当前侦听器即将重新运行时执行
 */
function onWatcherCleanup(cleanupFn, failSilently = false, // 设置成true之后, 不会向外抛出警告
owner = activeWatcher) {
    if (owner) {
        let cleanUps = cleanUpMap.get(owner);
        if (!cleanUps) {
            cleanUpMap.set(owner, (cleanUps = []));
        }
        cleanUps.push(cleanupFn);
    }
}
function watch(source, cb, options = EMPTY_OBJ) {
    let cleanUp;
    const { immediate } = options;
    let getter = NOOP;
    let effect;
    let boundCleanup;
    const reactiveGetter = (source) => { };
    if (isFunction(source)) {
        if (cb) ;
        else {
            getter = () => {
                if (cleanUp) {
                    try {
                        // TODO 处理竞态问题
                        cleanUp();
                    }
                    finally {
                    }
                }
                // 记录当前的watcherEffect, 目的在于可以向外暴露 当前监听的watcher, 也方便给onWatcherCleanup的第三个参数提供默认值
                activeWatcher = effect;
                try {
                    return source(boundCleanup);
                }
                catch (e) {
                }
                finally {
                }
            };
        }
    }
    else if (isReactive(source)) {
        getter = () => reactiveGetter();
    }
    // 是否是设置immediate为true第一次执行
    const job = (immediateFirstRun) => {
        if (!immediateFirstRun && !effect.dirty)
            return;
        if (cb) {
            effect.run();
            cb();
        }
        else {
            effect.run();
        }
    };
    effect = new ReactiveEffect(getter);
    effect.scheduler = job;
    // source可接收一个参数 onCleanUp
    boundCleanup = fn => onWatcherCleanup(fn, true, effect);
    // 处理cleanUp方法
    cleanUp = () => {
        const cleanUps = cleanUpMap.get(effect);
        if (cleanUps) {
            for (const cleanUp of cleanUps) {
                cleanUp();
            }
            cleanUpMap.delete(effect);
        }
    };
    if (cb) {
        if (immediate) {
            job(true);
        }
        else {
            effect.run();
        }
    }
    else {
        effect.run();
    }
    const wathchHandle = () => { };
    wathchHandle.pause = () => { };
    wathchHandle.resume = () => { };
    wathchHandle.stop = () => { };
    return wathchHandle;
}

const Comment = Symbol.for('v-cmt');
function isVNode(value) {
    return value ? value.__v_isVNode : false;
}
function createBaseVNode(type, props, children, shapeFlag) {
    if (!type) {
        if (__DEV__) {
            warn('Invalid vnode type when creating vnode:', type);
        }
        type = Comment;
    }
    const vnode = {
        __v_isVNode: true,
        type,
        props,
        children,
        shapeFlag,
    };
    if (children) {
        vnode.shapeFlag |=
            typeof children === 'string'
                ? ShapeFlags.TEXT_CHILDREN
                : ShapeFlags.ARRAY_CHILDREN;
    }
    return vnode;
}
const createVNode = _createVNode;
// internal createVNode
function _createVNode(type, props = null, children = null) {
    let shapeFlag = isString(type)
        ? ShapeFlags.ELEMENT
        : isObject(type)
            ? ShapeFlags.STATEFUL_COMPONENT
            : 0;
    if (isObject(children) && (shapeFlag & ShapeFlags.STATEFUL_COMPONENT)) {
        shapeFlag |= ShapeFlags.SLOTS_CHILDREN;
    }
    return createBaseVNode(type, props, children, shapeFlag);
}

/**
 * @description 创建虚拟的dom节点, 是createVNode的简写,也丰富了createVNode的使用
 * 1. propsOrChildren 可以不传, 如果是array类型, 则默认是children
 * 2. 如果propsOrChildren 是一个vnode, 作用同 createVNode(type, null, [propsOrChildren])
 */
// export function h(): VNode
function h(type, propsOrChildren, children) {
    const l = arguments.length;
    if (l === 2) {
        if (isObject(propsOrChildren) && !Array.isArray(propsOrChildren)) {
            if (isVNode(propsOrChildren)) {
                return createVNode(type, null, [propsOrChildren]);
            }
            return createVNode(type, propsOrChildren);
        }
        else {
            // 数组、字符串、函数
            return createVNode(type, null, propsOrChildren);
        }
    }
    else {
        if (l > 3) {
            // 如果数组长度大于3 则从第三个参数开始 都按children处理
            children = Array.prototype.slice.call(arguments, 2);
        }
        else if (l === 3 && isVNode(children)) {
            return createVNode(type, propsOrChildren, [children]);
        }
        return createVNode(type, propsOrChildren, children);
    }
}

function initProps(instance, rawProps) {
    instance.props = rawProps || {};
}

function initSlots(instance, children) {
    if (instance.vnode.shapeFlag & ShapeFlags.SLOTS_CHILDREN) {
        normalizeObjectSlots(instance.slots, children);
    }
}
function normalizeObjectSlots(slots, children) {
    for (const key in children) {
        const value = children[key];
        if (value) {
            slots[key] = props => normalizeSlotValue(value(props));
        }
    }
}
// 兼容value是对象或者数组的情况
function normalizeSlotValue(value) {
    return isArray(value) ? value : [value];
}

const PublicPropertiesMap = {
    $el: i => i.vnode.el,
    $props: i => i.props,
    $slots: i => i.slots,
};
// 处理组件代理对象(在render函数中 通过this访问相关属性)
const PublicInstanceProxyHandlers = {
    get: ({ _: instance }, key) => {
        if (key in instance.setupState) {
            return instance.setupState[key];
        }
        if (key in instance.props) {
            return instance.props[key];
        }
        const publicGetter = PublicPropertiesMap[key];
        if (publicGetter) {
            return publicGetter(instance);
        }
    },
};

// 添加parent 需要用到父级组件中提供的数据, provide/inject
function createComponentInstance(vnode, parent) {
    const instance = {
        vnode,
        type: vnode.type,
        setupState: {},
        props: {},
        provides: parent ? parent.provides : {},
        parent,
        component: null,
        slots: {},
        next: null,
    };
    return instance;
}
function setupComponent(instance) {
    const { children } = instance.vnode;
    // 处理props
    initProps(instance, instance.vnode.props);
    // 处理插槽
    initSlots(instance, children);
    setupStatefulComponent(instance);
}
function setupStatefulComponent(instance) {
    const Component = instance.type;
    // 实现组件代理对象
    instance.proxy = new Proxy({ _: instance }, PublicInstanceProxyHandlers);
    const { setup } = Component;
    if (setup) {
        setCurrentInstance(instance);
        const setupResult = Component.setup(instance.props);
        handleSetupResult(instance, setupResult);
    }
}
function handleSetupResult(instance, setupResult) {
    if (typeof setupResult === 'object') {
        instance.setupState = proxyRefs(setupResult);
    }
    finishComponentSetup(instance);
}
function finishComponentSetup(instance) {
    const Component = instance.type;
    if (Component.render) {
        instance.render = Component.render;
    }
}
let currentInstance = null;
const getCurrentInstance = () => currentInstance;
const setCurrentInstance = instance => (currentInstance = instance);

// 实现跨级组件通讯
function provide(key, value) {
    if (!currentInstance) {
        return;
    }
    let provides = currentInstance.provides;
    // 获取父组件的provides
    const parentProvides = currentInstance.parent && currentInstance.parent.provides;
    // 说明是第一次(如果当前组件有parentProvides，则provides和parentProvides指向同一个对象)
    if (provides === parentProvides) {
        // 将当前provides的原型指向父级组件中provides, 这样一来
        // 在inject中注入key时, 如果在当前父组件provides中找不到, 就会去parentProvides中找
        provides = currentInstance.provides = Object.create(parentProvides);
    }
    provides[key] = value;
}
function inject(key, defaultValue) {
    var _a;
    const instance = currentInstance;
    const provides = (instance && ((_a = instance.parent) === null || _a === void 0 ? void 0 : _a.provides)) || {};
    return provides[key];
}

// 实现自定义渲染器
function createRenderer() {
    function render(vnode, container, parentComponent) {
        patch(null, vnode, container, parentComponent);
    }
    function patch(n1, vnode, container, parentComponent) {
        if (vnode.shapeFlag & ShapeFlags.ELEMENT) {
            processElement(n1, vnode, container, parentComponent);
        }
        else {
            processComponent(n1, vnode, container, parentComponent);
        }
    }
    function processComponent(n1, n2, container, parentComponent) {
        if (n1 === null) {
            // 如果没有n1 说明是挂载组件
            mountComponent(n2, container, parentComponent);
        }
        else {
            // 如何更新component呢？？？
            updateComponent(n1, n2);
        }
    }
    function processElement(n1, vnode, container, parentComponent) {
        if (n1 === null) {
            mountElement(vnode, container, parentComponent);
        }
        else {
            // 更新Element
            patchElement(n1, vnode);
        }
    }
    function mountElement(vnode, container, parentComponent) {
        const el = (vnode.el = document.createElement(vnode.type));
        if (vnode.shapeFlag & ShapeFlags.ARRAY_CHILDREN) {
            // 注意这里的container 应该是el才对, 这样children中的元素才能正确的渲染到parentComponent中
            mountChildren(vnode.children, el, parentComponent);
        }
        else if (vnode.shapeFlag & ShapeFlags.TEXT_CHILDREN) {
            el.textContent = vnode.children;
        }
        if (vnode.props) {
            for (const key in vnode.props) {
                if (isOn(key)) {
                    const rawName = key.slice(2).toLowerCase();
                    el.addEventListener(rawName, vnode.props[key]);
                }
                else {
                    el.setAttribute(key, vnode.props[key]);
                }
            }
        }
        container.appendChild(el);
    }
    // TODO: 如何更新element
    function patchElement(n1, n2, container, parentComponent) {
        (n2.el = n1.el);
        // console.log('n1, n2', n1, n2)
        console.log('update element');
    }
    function mountChildren(children, container, parentComponent) {
        children.forEach(child => {
            patch(null, child, container, parentComponent);
        });
    }
    function mountComponent(vnode, container, parentComponent) {
        const instance = (vnode.component = createComponentInstance(vnode, parentComponent));
        setupComponent(instance);
        setupRenderEffect(instance, instance.vnode, container);
    }
    function updateComponent(n1, n2) {
        const instance = (n2.component = n1.component);
        instance.update();
        instance.next = n2;
    }
    function setupRenderEffect(instance, initialVNode, container) {
        instance.update = effect(() => {
            if (!instance.isMounted) {
                const subTree = instance.render.call(instance.proxy);
                patch(null, subTree, container, instance);
                instance.isMounted = true;
                instance.subTree = subTree;
            }
            else {
                const { next, vnode } = instance;
                // TODO: 更新逻辑
                if (next) {
                    next.el = vnode.el;
                    updateComponentPreRender(instance, next);
                }
                const prevTree = instance.subTree || null;
                const subTree = instance.render.call(instance.proxy);
                patch(prevTree, subTree, container, instance);
                instance.subTree = subTree;
                initialVNode.el = subTree.el;
            }
        });
    }
    function updateComponentPreRender(instance, nextVNode) {
        // let prevProps = instance.vnode.props
        // prevProps = nextVNode.props
        instance.vnode = nextVNode;
        instance.next = null;
        instance.props = nextVNode.props;
    }
    return {
        render,
        createApp: rooterComponent => {
            return {
                mount: container => {
                    const vnode = createVNode(rooterComponent);
                    render(vnode, container, null);
                },
            };
        },
    };
}

function renderSlots(slots, name, props) {
    const slot = slots[name];
    if (slot) {
        return createVNode('div', {}, slot(props));
    }
}

function createApp(rootComponent) {
    return createRenderer().createApp(rootComponent);
}

exports.computed = computed;
exports.createApp = createApp;
exports.createRenderer = createRenderer;
exports.customRef = customRef;
exports.effect = effect;
exports.effectScope = effectScope;
exports.getCurrentInstance = getCurrentInstance;
exports.getCurrentWatcher = getCurrentWatcher;
exports.h = h;
exports.inject = inject;
exports.isProxy = isProxy;
exports.isReactive = isReactive;
exports.isReadonly = isReadonly;
exports.isRef = isRef;
exports.isShallow = isShallow;
exports.markRaw = markRaw;
exports.onScopeDispose = onScopeDispose;
exports.onWatcherCleanup = onWatcherCleanup;
exports.provide = provide;
exports.proxyRefs = proxyRefs;
exports.reactive = reactive;
exports.readonly = readonly;
exports.ref = ref;
exports.renderSlots = renderSlots;
exports.shallowReactive = shallowReactive;
exports.shallowReadonly = shallowReadonly;
exports.shallowRef = shallowRef;
exports.toRaw = toRaw;
exports.toReactive = toReactive;
exports.toReadonly = toReadonly;
exports.toRef = toRef;
exports.toRefs = toRefs;
exports.toValue = toValue;
exports.track = track;
exports.trigger = trigger;
exports.triggerRef = triggerRef;
exports.unRef = unRef;
exports.watch = watch;
