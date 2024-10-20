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

exports.EMPTY_OBJ = EMPTY_OBJ;
exports.NOOP = NOOP;
exports.def = def;
exports.extend = extend;
exports.hasChanged = hasChanged;
exports.hasOwn = hasOwn;
exports.isArray = isArray;
exports.isFunction = isFunction;
exports.isIntegerKey = isIntegerKey;
exports.isMap = isMap;
exports.isObject = isObject;
exports.isString = isString;
exports.isSymbol = isSymbol;
exports.objectToString = objectToString;
exports.toRawType = toRawType;
exports.toTypeString = toTypeString;
