import { symbol } from './util.js';
import Transaction from './transaction.js';

function isArraySet(object, property){
  return Array.isArray(object) && !isNaN(+property);
}

function isArrayOrObject(object) {
  return Array.isArray(object) || typeof object === 'object';
}

function observe(o, fn) {
  var proxy = new Proxy(o, {
    get: function(target, property) {
      Transaction.observe(proxy, property);
      return target[property];
    },
    set: function(target, property, value) {
      var oldValue = target[property];
      if(!isModel(value) && isArrayOrObject(value)) {
        value = toModel(value, fn);
      }
      target[property] = value;

      // If the value hasn't changed, nothing else to do
      if(value === oldValue)
        return true;

      if(isArraySet(target, property)) {
        fn({
          prop: arrayChange,
          index: +property,
          type: 'set'
        }, value);
      } else {
        fn({
          prop: property,
          type: 'set'
        }, value)
      }

      return true;
    },
    deleteProperty: function(target, property, value){
      if(isArraySet(target, property)) {
        fn({
          prop: arrayChange,
          index: +property,
          type: 'delete'
        });
      }

      return true;
    }
  });
  return proxy;
}

var events = symbol('bram-events');
var arrayChange = symbol('bram-array-change');

var toModel = function(o, callback){
  if(isModel(o)) return o;

  o = deepModel(o) || {};

  Object.defineProperty(o, events, {
    value: {},
    enumerable: false
  });

  return observe(o, callback);
};

function deepModel(o) {
  return !o ? o : Object.keys(o).reduce(function(acc, prop){
    var val = o[prop];
    acc[prop] = (Array.isArray(val) || typeof val === 'object')
      ? toModel(val)
      : val;
    return acc;
  }, o);
}

var isModel = function(object){
  return object && !!object[events];
};

var on = function(model, prop, callback){
  var evs = model[events];
  if(!evs) return;
  var ev = evs[prop];
  if(!ev) {
    ev = evs[prop] = [];
  }
  ev.push(callback);
};

var off = function(model, prop, callback){
  var evs = model[events];
  if(!evs) return;
  var ev = evs[prop];
  if(!ev) return;
  var idx = ev.indexOf(callback);
  if(idx === -1) return;
  ev.splice(idx, 1);
  if(!ev.length) {
    delete evs[prop];
  }
};

export {
  arrayChange,
  on,
  off,
  isModel,
  toModel
};
