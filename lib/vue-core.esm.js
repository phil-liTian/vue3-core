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

function createComponentInstance(vnode) {
    const instance = {
        vnode,
        type: vnode.type,
    };
    return instance;
}
function setupComponent(instance) {
    // TODO
    // initProps()
    // initSlots()
    setupStatefulComponent(instance);
}
function setupStatefulComponent(instance) {
    const Component = instance.type;
    if (Component.setup) {
        const setupResult = Component.setup();
        handleSetupResult(instance, setupResult);
    }
}
function handleSetupResult(instance, setupResult) {
    if (typeof setupResult === 'object') {
        instance.setupState = setupResult;
    }
    finishComponentSetup(instance);
}
function finishComponentSetup(instance) {
    const Component = instance.type;
    if (Component.render) {
        instance.render = Component.render;
    }
}

function render(vnode, container) {
    patch(vnode, container);
}
function patch(vnode, container) {
    processComponent(vnode, container);
}
function processComponent(vnode, container) {
    if (typeof vnode.type === 'string') {
        mountElement(vnode, container);
    }
    else {
        mountComponent(vnode, container);
    }
}
function mountElement(vnode, container) {
    const el = document.createElement(vnode.type);
    el.textContent = vnode.children;
    container.appendChild(el);
}
function mountComponent(vnode, container) {
    const instance = createComponentInstance(vnode);
    setupComponent(instance);
    setupRenderEffect(instance, container);
}
function setupRenderEffect(instance, container) {
    const subTree = instance.render();
    patch(subTree, container);
}

function createVNode(type, props, children) {
    const VNoode = {
        type,
        props,
        children,
    };
    return VNoode;
}

function createApp(rootComponent) {
    return {
        mount: rootContainer => {
            const vnode = createVNode(rootComponent);
            render(vnode, rootContainer);
        },
    };
}

function h(type, props, children) {
    return createVNode(type, props, children);
}

export { EMPTY_OBJ, NOOP, createApp, def, extend, h, hasChanged, hasOwn, isArray, isFunction, isIntegerKey, isMap, isObject, isString, isSymbol, objectToString, toRawType, toTypeString };
