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

exports.ShapeFlags = void 0;
(function (ShapeFlags) {
    ShapeFlags[ShapeFlags["ELEMENT"] = 1] = "ELEMENT";
    ShapeFlags[ShapeFlags["STATEFUL_COMPONENT"] = 4] = "STATEFUL_COMPONENT";
    ShapeFlags[ShapeFlags["TEXT_CHILDREN"] = 8] = "TEXT_CHILDREN";
    ShapeFlags[ShapeFlags["ARRAY_CHILDREN"] = 16] = "ARRAY_CHILDREN";
})(exports.ShapeFlags || (exports.ShapeFlags = {}));

function createBaseVNode(type, props, children, shapeFlag) {
    const vnode = {
        type,
        props,
        children,
        shapeFlag,
    };
    if (children) {
        vnode.shapeFlag |=
            typeof children === 'string'
                ? exports.ShapeFlags.TEXT_CHILDREN
                : exports.ShapeFlags.ARRAY_CHILDREN;
    }
    return vnode;
}
function createVNode(type, props, children) {
    return _createVNode(type, props, children);
}
// internal createVNode
function _createVNode(type, props, children) {
    const shapeFlag = isString(type)
        ? exports.ShapeFlags.ELEMENT
        : isObject(type)
            ? exports.ShapeFlags.STATEFUL_COMPONENT
            : 0;
    return createBaseVNode(type, props, children, shapeFlag);
}

function h(type, props, children) {
    return createVNode(type, props, children);
}

function initProps(instance, rawProps) {
    instance.props = rawProps || {};
}

const PublicPropertiesMap = {
    $el: i => i.vnode.el,
    $props: i => i.props,
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
    };
    return instance;
}
function setupComponent(instance) {
    // TODO
    initProps(instance, instance.vnode.props);
    // initSlots()
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
        patch(vnode, container, parentComponent);
    }
    function patch(vnode, container, parentComponent) {
        processComponent(vnode, container, parentComponent);
    }
    function processComponent(vnode, container, parentComponent) {
        if (vnode.shapeFlag & exports.ShapeFlags.ELEMENT) {
            mountElement(vnode, container, parentComponent);
        }
        else {
            mountComponent(vnode, container, parentComponent);
        }
    }
    function mountElement(vnode, container, parentComponent) {
        const el = (vnode.el = document.createElement(vnode.type));
        if (vnode.shapeFlag & exports.ShapeFlags.ARRAY_CHILDREN) {
            // 注意这里的container 应该是el才对, 这样children中的元素才能正确的渲染到parentComponent中
            mountChildren(vnode.children, el, parentComponent);
        }
        else if (vnode.shapeFlag & exports.ShapeFlags.TEXT_CHILDREN) {
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
    function mountChildren(children, container, parentComponent) {
        children.forEach(child => {
            patch(child, container, parentComponent);
        });
    }
    function mountComponent(vnode, container, parentComponent) {
        const instance = createComponentInstance(vnode, parentComponent);
        setupComponent(instance);
        setupRenderEffect(instance, instance.vnode, container);
    }
    function setupRenderEffect(instance, initialVNode, container) {
        const subTree = instance.render.call(instance.proxy);
        patch(subTree, container, instance);
        initialVNode.el = subTree.el;
    }
    return {
        // render,
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

const abc = 123;

function createApp(rootComponent) {
    return createRenderer().createApp(rootComponent);
}

exports.EMPTY_OBJ = EMPTY_OBJ;
exports.NOOP = NOOP;
exports.abc = abc;
exports.createApp = createApp;
exports.createRenderer = createRenderer;
exports.def = def;
exports.extend = extend;
exports.getCurrentInstance = getCurrentInstance;
exports.h = h;
exports.hasChanged = hasChanged;
exports.hasOwn = hasOwn;
exports.inject = inject;
exports.isArray = isArray;
exports.isFunction = isFunction;
exports.isIntegerKey = isIntegerKey;
exports.isMap = isMap;
exports.isObject = isObject;
exports.isOn = isOn;
exports.isString = isString;
exports.isSymbol = isSymbol;
exports.objectToString = objectToString;
exports.provide = provide;
exports.toRawType = toRawType;
exports.toTypeString = toTypeString;
