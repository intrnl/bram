
(function(undefined) {
'use strict';
/*[global-shim-start]*/
(function (exports, global){
	var origDefine = global.define;

	var get = function(name){
		var parts = name.split("."),
			cur = global,
			i;
		for(i = 0 ; i < parts.length; i++){
			if(!cur) {
				break;
			}
			cur = cur[parts[i]];
		}
		return cur;
	};
	var modules = (global.define && global.define.modules) ||
		(global._define && global._define.modules) || {};
	var ourDefine = global.define = function(moduleName, deps, callback){
		var module;
		if(typeof deps === "function") {
			callback = deps;
			deps = [];
		}
		var args = [],
			i;
		for(i =0; i < deps.length; i++) {
			args.push( exports[deps[i]] ? get(exports[deps[i]]) : ( modules[deps[i]] || get(deps[i]) )  );
		}
		// CJS has no dependencies but 3 callback arguments
		if(!deps.length && callback.length) {
			module = { exports: {} };
			var require = function(name) {
				return exports[name] ? get(exports[name]) : modules[name];
			};
			args.push(require, module.exports, module);
		}
		// Babel uses the exports and module object.
		else if(!args[0] && deps[0] === "exports") {
			module = { exports: {} };
			args[0] = module.exports;
			if(deps[1] === "module") {
				args[1] = module;
			}
		} else if(!args[0] && deps[0] === "module") {
			args[0] = { id: moduleName };
		}

		global.define = origDefine;
		var result = callback ? callback.apply(null, args) : undefined;
		global.define = ourDefine;

		// Favor CJS module.exports over the return value
		modules[moduleName] = module && module.exports ? module.exports : result;
	};
	global.define.orig = origDefine;
	global.define.modules = modules;
	global.define.amd = true;
	ourDefine("@loader", [], function(){
		// shim for @@global-helpers
		var noop = function(){};
		return {
			get: function(){
				return { prepareGlobal: noop, retrieveGlobal: noop };
			},
			global: global,
			__exec: function(__load){
				eval("(function() { " + __load.source + " \n }).call(global);");
			}
		};
	});
})({},window)
/*can@2.3.8#util/can*/
define('can/util/can', [], function () {
    var glbl = typeof window !== 'undefined' ? window : typeof WorkerGlobalScope !== 'undefined' && self instanceof WorkerGlobalScope ? self : global;
    var can = {};
    if (typeof GLOBALCAN === 'undefined' || GLOBALCAN !== false) {
        glbl.can = can;
    }
    can.global = glbl;
    can.k = function () {
    };
    can.isDeferred = can.isPromise = function (obj) {
        return obj && typeof obj.then === 'function' && typeof obj.pipe === 'function';
    };
    can.isMapLike = function (obj) {
        return can.Map && (obj instanceof can.Map || obj && obj.___get);
    };
    var cid = 0;
    can.cid = function (object, name) {
        if (!object._cid) {
            cid++;
            object._cid = (name || '') + cid;
        }
        return object._cid;
    };
    can.VERSION = '@EDGE';
    can.simpleExtend = function (d, s) {
        for (var prop in s) {
            d[prop] = s[prop];
        }
        return d;
    };
    can.last = function (arr) {
        return arr && arr[arr.length - 1];
    };
    can.isDOM = function (el) {
        return (el.ownerDocument || el) === can.global.document;
    };
    can.childNodes = function (node) {
        var childNodes = node.childNodes;
        if ('length' in childNodes) {
            return childNodes;
        } else {
            var cur = node.firstChild;
            var nodes = [];
            while (cur) {
                nodes.push(cur);
                cur = cur.nextSibling;
            }
            return nodes;
        }
    };
    var protoBind = Function.prototype.bind;
    if (protoBind) {
        can.proxy = function (fn, context) {
            return protoBind.call(fn, context);
        };
    } else {
        can.proxy = function (fn, context) {
            return function () {
                return fn.apply(context, arguments);
            };
        };
    }
    can.frag = function (item, doc) {
        var document = doc || can.document || can.global.document;
        var frag;
        if (!item || typeof item === 'string') {
            frag = can.buildFragment(item == null ? '' : '' + item, document);
            if (!frag.childNodes.length) {
                frag.appendChild(document.createTextNode(''));
            }
            return frag;
        } else if (item.nodeType === 11) {
            return item;
        } else if (typeof item.nodeType === 'number') {
            frag = document.createDocumentFragment();
            frag.appendChild(item);
            return frag;
        } else if (typeof item.length === 'number') {
            frag = document.createDocumentFragment();
            can.each(item, function (item) {
                frag.appendChild(can.frag(item));
            });
            return frag;
        } else {
            frag = can.buildFragment('' + item, document);
            if (!can.childNodes(frag).length) {
                frag.appendChild(document.createTextNode(''));
            }
            return frag;
        }
    };
    can.scope = can.viewModel = function (el, attr, val) {
        el = can.$(el);
        var scope = can.data(el, 'scope') || can.data(el, 'viewModel');
        if (!scope) {
            scope = new can.Map();
            can.data(el, 'scope', scope);
            can.data(el, 'viewModel', scope);
        }
        switch (arguments.length) {
        case 0:
        case 1:
            return scope;
        case 2:
            return scope.attr(attr);
        default:
            scope.attr(attr, val);
            return el;
        }
    };
    var parseURI = function (url) {
        var m = String(url).replace(/^\s+|\s+$/g, '').match(/^([^:\/?#]+:)?(\/\/(?:[^:@]*(?::[^:@]*)?@)?(([^:\/?#]*)(?::(\d*))?))?([^?#]*)(\?[^#]*)?(#[\s\S]*)?/);
        return m ? {
            href: m[0] || '',
            protocol: m[1] || '',
            authority: m[2] || '',
            host: m[3] || '',
            hostname: m[4] || '',
            port: m[5] || '',
            pathname: m[6] || '',
            search: m[7] || '',
            hash: m[8] || ''
        } : null;
    };
    can.joinURIs = function (base, href) {
        function removeDotSegments(input) {
            var output = [];
            input.replace(/^(\.\.?(\/|$))+/, '').replace(/\/(\.(\/|$))+/g, '/').replace(/\/\.\.$/, '/../').replace(/\/?[^\/]*/g, function (p) {
                if (p === '/..') {
                    output.pop();
                } else {
                    output.push(p);
                }
            });
            return output.join('').replace(/^\//, input.charAt(0) === '/' ? '/' : '');
        }
        href = parseURI(href || '');
        base = parseURI(base || '');
        return !href || !base ? null : (href.protocol || base.protocol) + (href.protocol || href.authority ? href.authority : base.authority) + removeDotSegments(href.protocol || href.authority || href.pathname.charAt(0) === '/' ? href.pathname : href.pathname ? (base.authority && !base.pathname ? '/' : '') + base.pathname.slice(0, base.pathname.lastIndexOf('/') + 1) + href.pathname : base.pathname) + (href.protocol || href.authority || href.pathname ? href.search : href.search || base.search) + href.hash;
    };
    can['import'] = function (moduleName, parentName) {
        var deferred = new can.Deferred();
        if (typeof window.System === 'object' && can.isFunction(window.System['import'])) {
            window.System['import'](moduleName, { name: parentName }).then(can.proxy(deferred.resolve, deferred), can.proxy(deferred.reject, deferred));
        } else if (window.define && window.define.amd) {
            window.require([moduleName], function (value) {
                deferred.resolve(value);
            });
        } else if (window.steal) {
            steal.steal(moduleName, function (value) {
                deferred.resolve(value);
            });
        } else if (window.require) {
            deferred.resolve(window.require(moduleName));
        } else {
            deferred.resolve();
        }
        return deferred.promise();
    };
    can.__observe = function () {
    };
    can.isNode = typeof process === 'object' && {}.toString.call(process) === '[object process]';
    can.isBrowserWindow = typeof window !== 'undefined' && typeof document !== 'undefined' && typeof SimpleDOM === 'undefined';
    can.isWebWorker = typeof WorkerGlobalScope !== 'undefined' && self instanceof WorkerGlobalScope;
    return can;
});
/*extend@3.0.0#index*/
define('extend/index', function (require, exports, module) {
    'use strict';
    var hasOwn = Object.prototype.hasOwnProperty;
    var toStr = Object.prototype.toString;
    var isArray = function isArray(arr) {
        if (typeof Array.isArray === 'function') {
            return Array.isArray(arr);
        }
        return toStr.call(arr) === '[object Array]';
    };
    var isPlainObject = function isPlainObject(obj) {
        if (!obj || toStr.call(obj) !== '[object Object]') {
            return false;
        }
        var hasOwnConstructor = hasOwn.call(obj, 'constructor');
        var hasIsPrototypeOf = obj.constructor && obj.constructor.prototype && hasOwn.call(obj.constructor.prototype, 'isPrototypeOf');
        if (obj.constructor && !hasOwnConstructor && !hasIsPrototypeOf) {
            return false;
        }
        var key;
        for (key in obj) {
        }
        return typeof key === 'undefined' || hasOwn.call(obj, key);
    };
    module.exports = function extend() {
        var options, name, src, copy, copyIsArray, clone, target = arguments[0], i = 1, length = arguments.length, deep = false;
        if (typeof target === 'boolean') {
            deep = target;
            target = arguments[1] || {};
            i = 2;
        } else if (typeof target !== 'object' && typeof target !== 'function' || target == null) {
            target = {};
        }
        for (; i < length; ++i) {
            options = arguments[i];
            if (options != null) {
                for (name in options) {
                    src = target[name];
                    copy = options[name];
                    if (target !== copy) {
                        if (deep && copy && (isPlainObject(copy) || (copyIsArray = isArray(copy)))) {
                            if (copyIsArray) {
                                copyIsArray = false;
                                clone = src && isArray(src) ? src : [];
                            } else {
                                clone = src && isPlainObject(src) ? src : {};
                            }
                            target[name] = extend(deep, clone, copy);
                        } else if (typeof copy !== 'undefined') {
                            target[name] = copy;
                        }
                    }
                }
            }
        }
        return target;
    };
});
/*ccompute@0.0.1#util*/
define('ccompute/util', function (require, exports, module) {
    var can = require('can/util/can');
    var has = Object.prototype.hasOwnProperty;
    var slice = Array.prototype.slice;
    can.simpleExtend = function (a, b) {
        for (var p in b) {
            if (has.call(b, p)) {
                a[p] = b[p];
            }
        }
    };
    can.extend = require('extend/index');
    can.makeArray = function (arr) {
        return slice.call(arr);
    };
    can.each = function (arr, cb) {
        var i = 0, len = arr.length;
        if (len) {
            for (; i < len; i++) {
                cb(i, arr[i]);
            }
        } else {
            for (var p in arr) {
                if (has.call(arr, p)) {
                    cb(p, arr[p]);
                }
            }
        }
        return this;
    };
    can.isEmptyObject = function (obj) {
        for (var p in obj) {
            if (has.call(obj, p)) {
                return false;
            }
        }
        return true;
    };
    module.exports = can;
});
/*ccompute@0.0.1#other/batch*/
define('ccompute/other/batch', function (require, exports, module) {
    var batchNum = 1, transactions = 0, dispatchingBatch = null, collectingBatch = null, batches = [], dispatchingBatches = false;
    module.exports = {
        start: function (batchStopHandler) {
            transactions++;
            if (transactions === 1) {
                var batch = {
                    events: [],
                    callbacks: [],
                    number: batchNum++
                };
                batches.push(batch);
                if (batchStopHandler) {
                    batch.callbacks.push(batchStopHandler);
                }
                collectingBatch = batch;
            }
        },
        stop: function (force, callStart) {
            if (force) {
                transactions = 0;
            } else {
                transactions--;
            }
            if (transactions === 0) {
                collectingBatch = null;
                var batch;
                if (dispatchingBatches === false) {
                    dispatchingBatches = true;
                    while (batch = batches.shift()) {
                        var events = batch.events;
                        var callbacks = batch.callbacks;
                        dispatchingBatch = batch;
                        can.batch.batchNum = batch.number;
                        var i, len;
                        if (callStart) {
                            can.batch.start();
                        }
                        for (i = 0, len = events.length; i < len; i++) {
                            can.dispatch.apply(events[i][0], events[i][1]);
                        }
                        can.batch._onDispatchedEvents(batch.number);
                        for (i = 0; i < callbacks.length; i++) {
                            callbacks[i]();
                        }
                        dispatchingBatch = null;
                        can.batch.batchNum = undefined;
                    }
                    dispatchingBatches = false;
                }
            }
        },
        _onDispatchedEvents: function () {
        },
        trigger: function (item, event, args) {
            if (!item.__inSetup) {
                event = typeof event === 'string' ? { type: event } : event;
                if (collectingBatch) {
                    event.batchNum = collectingBatch.number;
                    collectingBatch.events.push([
                        item,
                        [
                            event,
                            args
                        ]
                    ]);
                } else {
                    if (dispatchingBatch) {
                        event.batchNum = dispatchingBatch.number;
                    }
                    can.dispatch.call(item, event, args);
                }
            }
        },
        afterPreviousEvents: function (handler) {
            var batch = can.last(batches);
            if (batch) {
                batch.callbacks.push(handler);
            } else {
                handler({});
            }
        },
        after: function (handler) {
            var batch = collectingBatch || dispatchingBatch;
            if (batch) {
                batch.callbacks.push(handler);
            } else {
                handler({});
            }
        }
    };
});
/*ccompute@0.0.1#other/event*/
define('ccompute/other/event', function (require, exports, module) {
    var can = require('ccompute/util');
    exports.addEvent = function (event, handler) {
        var allEvents = this.__bindEvents || (this.__bindEvents = {}), eventList = allEvents[event] || (allEvents[event] = []);
        eventList.push({
            handler: handler,
            name: event
        });
        return this;
    };
    exports.listenTo = function (other, event, handler) {
        var idedEvents = this.__listenToEvents;
        if (!idedEvents) {
            idedEvents = this.__listenToEvents = {};
        }
        var otherId = can.cid(other);
        var othersEvents = idedEvents[otherId];
        if (!othersEvents) {
            othersEvents = idedEvents[otherId] = {
                obj: other,
                events: {}
            };
        }
        var eventsEvents = othersEvents.events[event];
        if (!eventsEvents) {
            eventsEvents = othersEvents.events[event] = [];
        }
        eventsEvents.push(handler);
        can.bind.call(other, event, handler);
    };
    exports.stopListening = function (other, event, handler) {
        var idedEvents = this.__listenToEvents, iterIdedEvents = idedEvents, i = 0;
        if (!idedEvents) {
            return this;
        }
        if (other) {
            var othercid = can.cid(other);
            (iterIdedEvents = {})[othercid] = idedEvents[othercid];
            if (!idedEvents[othercid]) {
                return this;
            }
        }
        for (var cid in iterIdedEvents) {
            var othersEvents = iterIdedEvents[cid], eventsEvents;
            other = idedEvents[cid].obj;
            if (!event) {
                eventsEvents = othersEvents.events;
            } else {
                (eventsEvents = {})[event] = othersEvents.events[event];
            }
            for (var eventName in eventsEvents) {
                var handlers = eventsEvents[eventName] || [];
                i = 0;
                while (i < handlers.length) {
                    if (handler && handler === handlers[i] || !handler) {
                        can.unbind.call(other, eventName, handlers[i]);
                        handlers.splice(i, 1);
                    } else {
                        i++;
                    }
                }
                if (!handlers.length) {
                    delete othersEvents.events[eventName];
                }
            }
            if (can.isEmptyObject(othersEvents.events)) {
                delete idedEvents[cid];
            }
        }
        return this;
    };
    exports.removeEvent = function (event, fn, __validate) {
        if (!this.__bindEvents) {
            return this;
        }
        var events = this.__bindEvents[event] || [], i = 0, ev, isFunction = typeof fn === 'function';
        while (i < events.length) {
            ev = events[i];
            if (__validate ? __validate(ev, event, fn) : isFunction && ev.handler === fn || !isFunction && (ev.cid === fn || !fn)) {
                events.splice(i, 1);
            } else {
                i++;
            }
        }
        return this;
    };
    can.dispatch = exports.dispatch = function (event, args) {
        var events = this.__bindEvents;
        if (!events) {
            return;
        }
        var eventName;
        if (typeof event === 'string') {
            eventName = event;
            event = { type: event };
        } else {
            eventName = event.type;
        }
        var handlers = events[eventName];
        if (!handlers) {
            return;
        } else {
            handlers = handlers.slice(0);
        }
        var passed = [event];
        if (args) {
            passed.push.apply(passed, args);
        }
        for (var i = 0, len = handlers.length; i < len; i++) {
            handlers[i].handler.apply(this, passed);
        }
        return event;
    };
    exports.one = function (event, handler) {
        var one = function () {
            can.unbind.call(this, event, one);
            return handler.apply(this, arguments);
        };
        can.bind.call(this, event, one);
        return this;
    };
    exports.event = {
        on: function () {
            return exports.addEvent.apply(this, arguments);
        },
        off: function () {
            return can.removeEvent.apply(this, arguments);
        },
        bind: exports.addEvent,
        unbind: exports.removeEvent,
        delegate: function (selector, event, handler) {
            return exports.addEvent.call(this, event, handler);
        },
        undelegate: function (selector, event, handler) {
            return exports.removeEvent.call(this, event, handler);
        },
        trigger: exports.dispatch,
        one: exports.one,
        addEvent: exports.addEvent,
        removeEvent: exports.removeEvent,
        listenTo: exports.listenTo,
        stopListening: exports.stopListening,
        dispatch: exports.dispatch
    };
});
/*ccompute@0.0.1#other/bind*/
define('ccompute/other/bind', function (require, exports, module) {
    var eevent = require('ccompute/other/event');
    exports.bindAndSetup = function () {
        eevent.addEvent.apply(this, arguments);
        if (!this.__inSetup) {
            if (!this._bindings) {
                this._bindings = 1;
                if (this._bindsetup) {
                    this._bindsetup();
                }
            } else {
                this._bindings++;
            }
        }
        return this;
    };
    exports.unbindAndTeardown = function (event, handler) {
        if (!this.__bindEvents) {
            return this;
        }
        var handlers = this.__bindEvents[event] || [];
        var handlerCount = handlers.length;
        eevent.removeEvent.apply(this, arguments);
        if (this._bindings === null) {
            this._bindings = 0;
        } else {
            this._bindings = this._bindings - (handlerCount - handlers.length);
        }
        if (!this._bindings && this._bindteardown) {
            this._bindteardown();
        }
        return this;
    };
});
/*ccompute@0.0.1#read*/
define('ccompute/read', ['ccompute/util'], function (can) {
    var proxy = function (fn, context) {
        return fn.bind(context);
    };
    var read = function (parent, reads, options) {
        options = options || {};
        var state = { foundObservable: false };
        var cur = readValue(parent, 0, reads, options, state), type, prev, readLength = reads.length, i = 0;
        while (i < readLength) {
            prev = cur;
            for (var r = 0, readersLength = read.propertyReaders.length; r < readersLength; r++) {
                var reader = read.propertyReaders[r];
                if (reader.test(cur)) {
                    cur = reader.read(cur, reads[i], i, options, state);
                    break;
                }
            }
            i = i + 1;
            cur = readValue(cur, i, reads, options, state, prev);
            type = typeof cur;
            if (i < reads.length && (cur === null || type !== 'function' && type !== 'object')) {
                if (options.earlyExit) {
                    options.earlyExit(prev, i - 1, cur);
                }
                return {
                    value: undefined,
                    parent: prev
                };
            }
        }
        if (cur === undefined) {
            if (options.earlyExit) {
                options.earlyExit(prev, i - 1);
            }
        }
        return {
            value: cur,
            parent: prev
        };
    };
    var isAt = function (index, reads) {
        var prevRead = reads[index - 1];
        return prevRead && prevRead.at;
    };
    var readValue = function (value, index, reads, options, state, prev) {
        var usedValueReader;
        do {
            usedValueReader = false;
            for (var i = 0, len = read.valueReaders.length; i < len; i++) {
                if (read.valueReaders[i].test(value, index, reads, options)) {
                    value = read.valueReaders[i].read(value, index, reads, options, state, prev);
                }
            }
        } while (usedValueReader);
        return value;
    };
    read.valueReaders = [
        {
            name: 'compute',
            test: function (value, i, reads, options) {
                return value && value.isComputed && !isAt(i, reads);
            },
            read: function (value, i, reads, options, state) {
                if (options.isArgument && i === reads.length) {
                    return value;
                }
                if (!state.foundObservable && options.foundObservable) {
                    options.foundObservable(value, i);
                    state.foundObservable = true;
                }
                return value instanceof can.Compute ? value.get() : value();
            }
        },
        {
            name: 'function',
            test: function (value, i, reads, options) {
                var type = typeof value;
                return type === 'function' && !value.isComputed && !(can.Construct && value.prototype instanceof can.Construct) && !(can.route && value === can.route);
            },
            read: function (value, i, reads, options, state, prev) {
                if (isAt(i, reads)) {
                    return i === reads.length ? proxy(value, prev) : value;
                } else if (options.callMethodsOnObservables && can.isMapLike(prev)) {
                    return value.apply(prev, options.args || []);
                } else if (options.isArgument && i === reads.length) {
                    return options.proxyMethods !== false ? proxy(value, prev) : value;
                }
                return value.apply(prev, options.args || []);
            }
        }
    ];
    read.propertyReaders = [
        {
            name: 'map',
            test: can.isMapLike,
            read: function (value, prop, index, options, state) {
                if (!state.foundObservable && options.foundObservable) {
                    options.foundObservable(value, index);
                    state.foundObservable = true;
                }
                var val = value[prop.key];
                if (typeof val === 'function' && value.constructor.prototype[prop.key] === val && !val.isComputed) {
                    return val;
                } else {
                    return value.attr(prop.key);
                }
            }
        },
        {
            name: 'promise',
            test: function (value) {
                return can.isPromise(value);
            },
            read: function (value, prop, index, options, state) {
                if (!state.foundObservable && options.foundObservable) {
                    options.foundObservable(value, index);
                    state.foundObservable = true;
                }
                var observeData = value.__observeData;
                if (!value.__observeData) {
                    observeData = value.__observeData = {
                        isPending: true,
                        state: 'pending',
                        isResolved: false,
                        isRejected: false,
                        value: undefined,
                        reason: undefined
                    };
                    can.cid(observeData);
                    can.simpleExtend(observeData, can.event);
                    value.then(function (value) {
                        observeData.isPending = false;
                        observeData.isResolved = true;
                        observeData.value = value;
                        observeData.state = 'resolved';
                        observeData.dispatch('state', [
                            'resolved',
                            'pending'
                        ]);
                    }, function (reason) {
                        observeData.isPending = false;
                        observeData.isRejected = true;
                        observeData.reason = reason;
                        observeData.state = 'rejected';
                        observeData.dispatch('state', [
                            'rejected',
                            'pending'
                        ]);
                    });
                }
                can.__observe(observeData, 'state');
                return prop.key in observeData ? observeData[prop.key] : value[prop.key];
            }
        },
        {
            name: 'object',
            test: function () {
                return true;
            },
            read: function (value, prop) {
                if (value == null) {
                    return undefined;
                } else {
                    if (prop.key in value) {
                        return value[prop.key];
                    } else if (prop.at && specialRead[prop.key] && '@' + prop.key in value) {
                        prop.at = false;
                        return value['@' + prop.key];
                    }
                }
            }
        }
    ];
    var specialRead = {
        index: true,
        key: true,
        event: true,
        element: true,
        viewModel: true
    };
    read.write = function (parent, key, value, options) {
        options = options || {};
        if (can.isMapLike(parent)) {
            if (!options.isArgument && parent._data && parent._data[key] && parent._data[key].isComputed) {
                return parent._data[key](value);
            } else {
                return parent.attr(key, value);
            }
        }
        if (parent[key] && parent[key].isComputed) {
            return parent[key](value);
        }
        if (typeof parent === 'object') {
            parent[key] = value;
        }
    };
    read.reads = function (key) {
        var keys = [];
        var last = 0;
        var at = false;
        if (key.charAt(0) === '@') {
            last = 1;
            at = true;
        }
        var keyToAdd = '';
        for (var i = last; i < key.length; i++) {
            var character = key.charAt(i);
            if (character === '.' || character === '@') {
                if (key.charAt(i - 1) !== '\\') {
                    keys.push({
                        key: keyToAdd,
                        at: at
                    });
                    at = character === '@';
                    keyToAdd = '';
                } else {
                    keyToAdd = keyToAdd.substr(0, keyToAdd.length - 1) + '.';
                }
            } else {
                keyToAdd += character;
            }
        }
        keys.push({
            key: keyToAdd,
            at: at
        });
        return keys;
    };
    return read;
});
/*ccompute@0.0.1#get_value_and_bind*/
define('ccompute/get_value_and_bind', function (require, exports, module) {
    var batch = require('ccompute/other/batch');
    exports.ObservedInfo = ObservedInfo;
    function ObservedInfo(func, context, compute) {
        this.newObserved = {};
        this.oldObserved = null;
        this.func = func;
        this.context = context;
        this.compute = compute;
        this.onDependencyChange = can.proxy(this.onDependencyChange, this);
        this.depth = null;
        this.childDepths = {};
        this.ignore = 0;
        this.inBatch = false;
        this.ready = false;
        compute.observedInfo = this;
        this.setReady = can.proxy(this._setReady, this);
    }
    can.simpleExtend(ObservedInfo.prototype, {
        _setReady: function () {
            this.ready = true;
        },
        getDepth: function () {
            if (this.depth !== null) {
                return this.depth;
            } else {
                return this.depth = this._getDepth();
            }
        },
        _getDepth: function () {
            var max = 0, childDepths = this.childDepths;
            for (var cid in childDepths) {
                if (childDepths[cid] > max) {
                    max = childDepths[cid];
                }
            }
            return max + 1;
        },
        addEdge: function (objEv) {
            objEv.obj.bind(objEv.event, this.onDependencyChange);
            if (objEv.obj.observedInfo) {
                this.childDepths[objEv.obj._cid] = objEv.obj.observedInfo.getDepth();
                this.depth = null;
            }
        },
        removeEdge: function (objEv) {
            objEv.obj.unbind(objEv.event, this.onDependencyChange);
            if (objEv.obj.observedInfo) {
                delete this.childDepths[objEv.obj._cid];
                this.depth = null;
            }
        },
        onDependencyChange: function (ev) {
            if (this.bound && this.ready) {
                if (ev.batchNum !== undefined) {
                    if (ev.batchNum !== this.batchNum) {
                        ObservedInfo.registerUpdate(this);
                        this.batchNum = ev.batchNum;
                    }
                } else {
                    this.updateCompute(ev.batchNum);
                }
            }
        },
        updateCompute: function (batchNum) {
            var oldValue = this.value;
            this.getValueAndBind();
            this.compute.updater(this.value, oldValue, batchNum);
        },
        getValueAndBind: function () {
            this.bound = true;
            this.oldObserved = this.newObserved || {};
            this.ignore = 0;
            this.newObserved = {};
            this.ready = false;
            observedInfoStack.push(this);
            this.value = this.func.call(this.context);
            observedInfoStack.pop();
            this.updateBindings();
            batch.afterPreviousEvents(this.setReady);
        },
        updateBindings: function () {
            var newObserved = this.newObserved, oldObserved = this.oldObserved, name, obEv;
            for (name in newObserved) {
                obEv = newObserved[name];
                if (!oldObserved[name]) {
                    this.addEdge(obEv);
                } else {
                    oldObserved[name] = null;
                }
            }
            for (name in oldObserved) {
                obEv = oldObserved[name];
                if (obEv) {
                    this.removeEdge(obEv);
                }
            }
        },
        teardown: function () {
            this.bound = false;
            for (var name in this.newObserved) {
                var ob = this.newObserved[name];
                this.removeEdge(ob);
            }
            this.newObserved = {};
        }
    });
    var updateOrder = [], curDepth = Infinity, maxDepth = 0;
    ObservedInfo.registerUpdate = function (observeInfo, batchNum) {
        var depth = observeInfo.getDepth() - 1;
        curDepth = Math.min(depth, curDepth);
        maxDepth = Math.max(maxDepth, depth);
        var objs = updateOrder[depth];
        if (!objs) {
            objs = updateOrder[depth] = [];
        }
        objs.push(observeInfo);
    };
    ObservedInfo.batchEnd = function (batchNum) {
        var cur;
        while (curDepth <= maxDepth) {
            var last = updateOrder[curDepth];
            if (last && (cur = last.pop())) {
                cur.updateCompute(batchNum);
            } else {
                curDepth++;
            }
        }
        updateOrder = [];
        curDepth = Infinity;
        maxDepth = 0;
    };
    var observedInfoStack = [];
    exports.__observe = function (obj, event) {
        var top = observedInfoStack[observedInfoStack.length - 1];
        if (top) {
            var evStr = event + '', name = obj._cid + '|' + evStr;
            if (top.traps) {
                top.traps.push({
                    obj: obj,
                    event: evStr,
                    name: name
                });
            } else if (!top.ignore && !top.newObserved[name]) {
                top.newObserved[name] = {
                    obj: obj,
                    event: evStr
                };
            }
        }
    };
    exports.__reading = exports.__observe;
    exports.__trapObserves = function () {
        if (observedInfoStack.length) {
            var top = observedInfoStack[observedInfoStack.length - 1];
            var traps = top.traps = [];
            return function () {
                top.traps = null;
                return traps;
            };
        } else {
            return function () {
                return [];
            };
        }
    };
    exports.__observes = function (observes) {
        var top = observedInfoStack[observedInfoStack.length - 1];
        if (top) {
            for (var i = 0, len = observes.length; i < len; i++) {
                var trap = observes[i], name = trap.name;
                if (!top.newObserved[name]) {
                    top.newObserved[name] = trap;
                }
            }
        }
    };
    exports.__isRecordingObserves = function () {
        var len = observedInfoStack.length;
        return len && observedInfoStack[len - 1].ignore === 0;
    };
    exports.__notObserve = function (fn) {
        return function () {
            if (observedInfoStack.length) {
                var top = observedInfoStack[observedInfoStack.length - 1];
                top.ignore++;
                var res = fn.apply(this, arguments);
                top.ignore--;
                return res;
            } else {
                return fn.apply(this, arguments);
            }
        };
    };
    batch._onDispatchedEvents = ObservedInfo.batchEnd;
});
/*ccompute@0.0.1#proto_compute*/
define('ccompute/proto_compute', function (require, exports, module) {
    var can = require('ccompute/util');
    var bbatch = require('ccompute/other/batch');
    var bbind = require('ccompute/other/bind');
    var eevent = require('ccompute/other/event');
    var read = require('ccompute/read');
    var getValueAndBind = require('ccompute/get_value_and_bind');
    var __notObserve = getValueAndBind.__notObserve;
    var __observe = getValueAndBind.__observe;
    var ObservedInfo = getValueAndBind.ObservedInfo;
    var extend = require('extend/index');
    var noop = function () {
    };
    can.__observe = getValueAndBind.__observe;
    var proxy = function (fn, context) {
        return fn.bind(context);
    };
    var Compute = function (getterSetter, context, eventName, bindOnce) {
        can.cid(this, 'compute');
        var args = [];
        for (var i = 0, arglen = arguments.length; i < arglen; i++) {
            args[i] = arguments[i];
        }
        var contextType = typeof args[1];
        if (typeof args[0] === 'function') {
            this._setupGetterSetterFn(args[0], args[1], args[2], args[3]);
        } else if (args[1]) {
            if (contextType === 'string') {
                this._setupProperty(args[0], args[1], args[2]);
            } else if (contextType === 'function') {
                this._setupSetter(args[0], args[1], args[2]);
            } else {
                if (args[1] && args[1].fn) {
                    this._setupAsyncCompute(args[0], args[1]);
                } else {
                    this._setupSettings(args[0], args[1]);
                }
            }
        } else {
            this._setupSimpleValue(args[0]);
        }
        this._args = args;
        this.isComputed = true;
    };
    extend(Compute.prototype, {
        _setupGetterSetterFn: function (getterSetter, context, eventName) {
            this._set = context ? proxy(getterSetter, context) : getterSetter;
            this._get = context ? proxy(getterSetter, context) : getterSetter;
            this._canObserve = eventName === false ? false : true;
            var handlers = setupComputeHandlers(this, getterSetter, context || this);
            this._on = handlers.on;
            this._off = handlers.off;
        },
        _setupProperty: function (target, propertyName, eventName) {
            var isObserve = can.isMapLike(target), self = this, handler;
            if (isObserve) {
                handler = function (ev, newVal, oldVal) {
                    self.updater(newVal, oldVal, ev.batchNum);
                };
                this.hasDependencies = true;
                this._get = function () {
                    return target.attr(propertyName);
                };
                this._set = function (val) {
                    target.attr(propertyName, val);
                };
            } else {
                handler = function () {
                    self.updater(self._get(), self.value);
                };
                this._get = function () {
                    return can.getObject(propertyName, [target]);
                };
                this._set = function (value) {
                    var properties = propertyName.split('.'), leafPropertyName = properties.pop(), targetProperty = can.getObject(properties.join('.'), [target]);
                    targetProperty[leafPropertyName] = value;
                };
            }
            this._on = function (update) {
                eevent.addEvent.call(target, eventName || propertyName, handler);
                this.value = this._get();
            };
            this._off = function () {
                return eevent.unbind.call(target, eventName || propertyName, handler);
            };
        },
        _setupSetter: function (initialValue, setter, eventName) {
            this.value = initialValue;
            this._set = setter;
            extend(this, eventName);
        },
        _setupSettings: function (initialValue, settings) {
            this.value = initialValue;
            this._set = settings.set || this._set;
            this._get = settings.get || this._get;
            if (!settings.__selfUpdater) {
                var self = this, oldUpdater = this.updater;
                this.updater = function () {
                    oldUpdater.call(self, self._get(), self.value);
                };
            }
            this._on = settings.on ? settings.on : this._on;
            this._off = settings.off ? settings.off : this._off;
        },
        _setupAsyncCompute: function (initialValue, settings) {
            var self = this;
            this.value = initialValue;
            this._setUpdates = true;
            this.lastSetValue = new Compute(initialValue);
            this._set = function (newVal) {
                if (newVal === self.lastSetValue.get()) {
                    return this.value;
                }
                return self.lastSetValue.set(newVal);
            };
            this._get = function () {
                return getter.call(settings.context, self.lastSetValue.get());
            };
            var getter = settings.fn, bindings;
            if (getter.length === 0) {
                bindings = setupComputeHandlers(this, getter, settings.context);
            } else if (getter.length === 1) {
                bindings = setupComputeHandlers(this, function () {
                    return getter.call(settings.context, self.lastSetValue.get());
                }, settings);
            } else {
                var oldUpdater = this.updater, setValue = function (newVal) {
                        oldUpdater.call(self, newVal, self.value);
                    };
                this.updater = function (newVal) {
                    oldUpdater.call(self, newVal, self.value);
                };
                bindings = setupComputeHandlers(this, function () {
                    var res = getter.call(settings.context, self.lastSetValue.get(), setValue);
                    return res !== undefined ? res : this.value;
                }, this);
            }
            this._on = bindings.on;
            this._off = bindings.off;
        },
        _setupSimpleValue: function (initialValue) {
            this.value = initialValue;
        },
        _bindsetup: __notObserve(function () {
            this.bound = true;
            this._on(this.updater);
        }),
        _bindteardown: function () {
            this._off(this.updater);
            this.bound = false;
        },
        bind: bbind.bindAndSetup,
        unbind: bbind.unbindAndTeardown,
        clone: function (context) {
            if (context && typeof this._args[0] === 'function') {
                this._args[1] = context;
            } else if (context) {
                this._args[2] = context;
            }
            return new Compute(this._args[0], this._args[1], this._args[2], this._args[3]);
        },
        _on: function () {
        },
        _off: function () {
        },
        get: function () {
            if (getValueAndBind.__isRecordingObserves() && this._canObserve !== false) {
                __observe(this, 'change');
                if (!this.bound) {
                    Compute.temporarilyBind(this);
                }
            }
            if (this.bound) {
                return this.value;
            } else {
                return this._get();
            }
        },
        _get: function () {
            return this.value;
        },
        set: function (newVal) {
            var old = this.value;
            var setVal = this._set(newVal, old);
            if (this._setUpdates) {
                return this.value;
            }
            if (this.hasDependencies) {
                return this._get();
            }
            if (setVal === undefined) {
                this.value = this._get();
            } else {
                this.value = setVal;
            }
            updateOnChange(this, this.value, old);
            return this.value;
        },
        _set: function (newVal) {
            return this.value = newVal;
        },
        updater: function (newVal, oldVal, batchNum) {
            this.value = newVal;
            updateOnChange(this, newVal, oldVal, batchNum);
        },
        toFunction: function () {
            return proxy(this._computeFn, this);
        },
        _computeFn: function (newVal) {
            if (arguments.length) {
                return this.set(newVal);
            }
            return this.get();
        }
    });
    var updateOnChange = function (compute, newValue, oldValue, batchNum) {
        var valueChanged = newValue !== oldValue && !(newValue !== newValue && oldValue !== oldValue);
        if (valueChanged) {
            bbatch.trigger(compute, {
                type: 'change',
                batchNum: batchNum
            }, [
                newValue,
                oldValue
            ]);
        }
    };
    var setupComputeHandlers = function (compute, func, context) {
        var readInfo = new ObservedInfo(func, context, compute);
        return {
            on: function () {
                readInfo.getValueAndBind();
                compute.value = readInfo.value;
                compute.hasDependencies = !can.isEmptyObject(readInfo.newObserved);
            },
            off: function () {
                readInfo.teardown();
            }
        };
    };
    Compute.temporarilyBind = function (compute) {
        var computeInstance = compute.computeInstance || compute;
        computeInstance.bind('change', noop);
        if (!computes) {
            computes = [];
            setTimeout(unbindComputes, 10);
        }
        computes.push(computeInstance);
    };
    var computes, unbindComputes = function () {
            for (var i = 0, len = computes.length; i < len; i++) {
                computes[i].unbind('change', noop);
            }
            computes = null;
        };
    Compute.async = function (initialValue, asyncComputer, context) {
        return new Compute(initialValue, {
            fn: asyncComputer,
            context: context
        });
    };
    Compute.truthy = function (compute) {
        return new Compute(function () {
            var res = compute.get();
            if (typeof res === 'function') {
                res = res.get();
            }
            return !!res;
        });
    };
    Compute.read = read;
    Compute.set = read.write;
    module.exports = Compute;
});
/*ccompute@0.0.1#compute*/
define('ccompute/compute', function (require, exports, module) {
    var can = require('ccompute/util');
    var Compute = require('ccompute/proto_compute');
    can.Compute = Compute;
    can.compute = exports.compute = function (getterSetter, context, eventName, bindOnce) {
        var internalCompute = new Compute(getterSetter, context, eventName, bindOnce);
        var bind = internalCompute.bind;
        var unbind = internalCompute.unbind;
        var compute = function (val) {
            if (arguments.length) {
                return internalCompute.set(val);
            }
            return internalCompute.get();
        };
        var cid = can.cid(compute, 'compute');
        var handlerKey = '__handler' + cid;
        compute.bind = function (ev, handler) {
            var computeHandler = handler && handler[handlerKey];
            if (handler && !computeHandler) {
                computeHandler = handler[handlerKey] = function () {
                    handler.apply(compute, arguments);
                };
            }
            return bind.call(internalCompute, ev, computeHandler);
        };
        compute.unbind = function (ev, handler) {
            var computeHandler = handler && handler[handlerKey];
            if (computeHandler) {
                delete handler[handlerKey];
                return internalCompute.unbind(ev, computeHandler);
            }
            return unbind.apply(internalCompute, arguments);
        };
        compute.isComputed = internalCompute.isComputed;
        compute.clone = function (ctx) {
            if (typeof getterSetter === 'function') {
                context = ctx;
            }
            return exports.compute(getterSetter, context, ctx, bindOnce);
        };
        compute.computeInstance = internalCompute;
        return compute;
    };
    exports.compute.truthy = function (compute) {
        return exports.compute(function () {
            var res = compute();
            if (typeof res === 'function') {
                res = res();
            }
            return !!res;
        });
    };
    exports.compute.async = function (initialValue, asyncComputer, context) {
        return exports.compute(initialValue, {
            fn: asyncComputer,
            context: context
        });
    };
    exports.compute.read = Compute.read;
    exports.compute.set = Compute.set;
    exports.compute.temporarilyBind = Compute.temporarilyBind;
    can.compute = module.exports = exports.compute;
});
/*[global-shim-end]*/
(function (){
	window._define = window.define;
	window.define = window.define.orig;
})();
var ccompute = can.compute;

var Bram = {};

var INTERNAL_PROPS = typeof Symbol === "function" ? Symbol("[[Computes]]") : "[[Computes]]";

function setupProps(obj, props) {
  props.forEach(function (prop){
    Object.defineProperty(obj, prop, {
      get: function(){
        return getProps(this)[prop]();
      },
      set: function(val){
        getProps(this)[prop](val);
      }
    });
  });
}

function ensureProp(el, name) {
  if(!getProps(el))
    defineProps(el);
  if(!getProps(el)[name])
    getProps(el)[name] = ccompute();
}

function defineProps(obj) {
  Object.defineProperty(obj, INTERNAL_PROPS, {
    enumerable: false, writable: false, configurable: false,
    value: {}
  });
}

function getProps(obj) {
  return obj[INTERNAL_PROPS];
}

var forEach = Array.prototype.forEach;

Bram.element = function(defn){
  var parentProto;
  if(defn.extends) {
    parentProto = defn.extends.proto ? defn.extends.proto : defn.extends;
  } else {
    parentProto = HTMLElement.prototype;
  }

  var proto = Object.create(parentProto);

  var protoFunctions = defn.proto || defn.prototype || {};
  Object.keys(protoFunctions).forEach(function(key){
    var desc = Object.getOwnPropertyDescriptor(protoFunctions, key);
    if(typeof desc.value === "function" || desc.get) {
      Object.defineProperty(proto, key, desc);
    }
  });

  if(defn.props) {
    setupProps(proto, defn.props);
  }

  proto.createdCallback = function(){
    if(defn.props) {
      if(!getProps(this)) defineProps(this);
      defn.props.forEach(function(name){
        if(!getProps(this)[name])
          getProps(this)[name] = ccompute();
      }.bind(this));
    }

    var root;
    if(defn.template) {
      var t = document.querySelector(defn.template);
      var clone = document.importNode(t.content, true);

      root = (defn.useShadow !== false && this.createShadowRoot) ?
        this.createShadowRoot() : this;
      root.appendChild(clone);

      this._bindings = new Bind(this, root);
    }

    if(defn.created) {
      defn.created.call(this, this._bindings, root);
    }
  };

  if(defn.attr) {
    proto.attributeChangedCallback = defn.attr;
  }

  proto.attachedCallback = function(){
    if(this._bindings)
      this._bindings._bind();
    if(defn.attached)
      return defn.attached.apply(this, arguments);
  }

  proto.detachedCallback = function(){
    if(this._bindings)
      this._bindings._unbind();
    if(defn.detached)
      return defn.detached.apply(this, arguments);
  };

  var registerOptions = {
    prototype: proto
  };
  if(defn.extends && defn.extends.tag)
    registerOptions.extends = defn.extends.tag;

  return document.registerElement(defn.tag, registerOptions);
};

Bram.getOwnCompute = function(el, name){
  var props = getProps(el);
  return props ? props[name] : undefined;
};

Bram.observableToCompute = function(observable){
  var compute = ccompute();
  observable.subscribe(function(val){
    compute(val);
  });
  return compute;
};

Bram.compute = function(){
  return ccompute.apply(can, arguments);
};

function createStateProperty(obj, name){
  var desc = Object.getOwnPropertyDescriptor(obj, name);
  var compute;
  if(desc && desc.value) {
    compute = ccompute(desc.value);
  } else {
    compute = ccompute();
  }
  getProps(obj)[name] = compute;

  Object.defineProperty(obj, name, {
    get: function(){
      return getProps(this)[name]();
    },
    set: function(val){
      getProps(this)[name](val);
    }
  });
}

Bram.state = function(obj){
  var keys = Object.keys(obj);
  defineProps(obj);
  keys.forEach(function(key){
    createStateProperty(obj, key);
  });
  return obj;
};

function Binding(on, off){
  this._on = on;
  this._off = off;
};

Binding.prototype.on = function(){
  if(!this.bound) {
    this._on();
    this.bound = true;
  }
};

Binding.prototype.off = function(){
  if(this.bound) {
    this._off();
    this.bound = false;
  }
};

function Bind(el, shadow){
  this.el = el;
  this.shadow = shadow;
  this._bindings = [];
}

Bind.prototype._getElement = function(selector, root){
  root = root || this.shadow;
  return typeof selector === "string" ? root.querySelector(selector) : selector;
};

Bind.prototype._getCompute = function(prop){
  if(typeof prop !== "string") return prop;
  var el = this.el;

  var compute = Bram.getOwnCompute(el, prop);
  if(compute) {
    return compute;
  }

  var proto = Object.getPrototypeOf(el);
  var desc = Object.getOwnPropertyDescriptor(proto, prop);
  if(desc.get) {
    compute = ccompute(desc.get, el);
  } else {
    compute = desc.value;
  }
  return compute;
};

Bind.prototype._register = function(binding){
  this._bindings.push(binding);
  binding.on();
};

Bind.prototype._bind = function(){
  this._bindings.forEach(function(binding){
    binding.on();
  });
};

Bind.prototype._unbind = function(){
  this._bindings.forEach(function(binding){
    binding.off();
  });
};

Bind.prototype._setup = function(selector, prop, setter){
  var el = this._getElement(selector);
  var compute = this._getCompute(prop);
  var fn = function(){
    setter(el, compute);
  };

  this._register(new Binding(function(){
    compute.bind("change", fn);
  }, function(){
    compute.unbind("change", fn);
  }));
  fn();

};

Bind.prototype.text = function(prop, selector){
  this._setup(selector, prop, function(el, compute){
    el.textContent = compute();
  });
};

Bind.prototype.attr = function(prop, selector, attrName){
  this._setup(selector, prop, function(el, compute){
    el.setAttribute(attrName, compute());
  });
};

Bind.prototype.form = function(prop, selector, event){
  event = event || "change";
  var el = this._getElement(selector);
  var compute = this._getCompute(prop);

  var setForm = function(){
    el.value = compute();
  };
  var setCompute = function(){
    compute(el.value);
  };

  var binding = new Binding(function(){
    el.addEventListener(event, setCompute);
    compute.bind("change", setForm);
  }, function(){
    el.removeEventListener(event, setCompute);
    compute.unbind("change", setForm);
  });
  this._register(binding);

  if(compute()) {
    setForm();
  } else if(el.value) {
    setCompute();
  }
};

Bind.prototype.prop = function(prop, selector, name, observable){
  var nameType = typeof name;
  if(nameType === "object") {
    observable = name;
    name = prop;
  } else if(nameType === "function") {
    var nn = prop;
    prop = name;
    name = nn;
  }

  name = name || prop;
  var compute = this._getCompute(prop);
  var el = this._getElement(selector, this.el);

  ensureProp(el, name);
  ensureProp(this.el, name);

  var child = getProps(el)[name];
  var parent = compute;

  // If we are binding an observable
  if(observable) {
    parent = Bram.observableToCompute(observable);
  }

  var childToParent = function(ev, val){
    parent(child());
  };
  var parentToChild = function(ev, val){
    child(parent());
  };

  this._register(new Binding(function(){
    child.bind("change", childToParent);
    parent.bind("change", parentToChild);
  }, function(){
    child.unbind("change", childToParent);
    parent.unbind("change", parentToChild);
  }));

  if(parent() != null) {
    parentToChild();
  } else if(child() != null) {
    childToParent();
  }
};

Bind.prototype.cond = function(prop, selector){
  var el = this._getElement(selector);
  var compute = this._getCompute(prop);
  var parent = el.parentNode;
  var ref = el.nextSibling;

  var position = function(){
    var inDom = !!el.parentNode;
    var show = compute();

    if(show) {
      if(!inDom) {
        if(parent !== ref.parentNode) {
          parent = ref.parentNode;
        }

        parent.insertBefore(el, ref);
      }
    } else {
      if(inDom) {
        ref = el.nextSibling;
        parent = el.parentNode;
        parent.removeChild(el);
      }
    }
  };

  this._register(new Binding(function(){
    compute.bind("change", position);
  }, function(){
    compute.unbind("change", position);
  }));

  position();
};

Bind.prototype.each = function(list, selector, callback){
  var t = this._getElement(selector);

  var frag = document.createDocumentFragment();
  forEach.call(list, function(item, i){
    var clone = document.importNode(t.content, true);
    //var bindings = new Bind(this.el, clone);
    callback.call(this.el, clone, item, i);
    frag.appendChild(clone);
  }.bind(this));

  var parent = t.parentNode;
  if(t.nextSibling)
    parent.insertBefore(frag, t.nextSibling);
  else
    parent.appendChild(frag);
};

if(typeof module !== "undefined" && module.exports) {
  module.exports = Bram;
} else {
  window.Bram = Bram;
}

})();
