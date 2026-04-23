(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
    typeof define === 'function' && define.amd ? define(factory) :
    (global = typeof globalThis !== 'undefined' ? globalThis : global || self, global.miHoYoH5log = factory());
})(this, (function () { 'use strict';

    /******************************************************************************
    Copyright (c) Microsoft Corporation.

    Permission to use, copy, modify, and/or distribute this software for any
    purpose with or without fee is hereby granted.

    THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH
    REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY
    AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
    INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM
    LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR
    OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR
    PERFORMANCE OF THIS SOFTWARE.
    ***************************************************************************** */
    /* global Reflect, Promise */

    var extendStatics = function(d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };

    function __extends(d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    }

    var __assign = function() {
        __assign = Object.assign || function __assign(t) {
            for (var s, i = 1, n = arguments.length; i < n; i++) {
                s = arguments[i];
                for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p)) t[p] = s[p];
            }
            return t;
        };
        return __assign.apply(this, arguments);
    };

    function __rest(s, e) {
        var t = {};
        for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
            t[p] = s[p];
        if (s != null && typeof Object.getOwnPropertySymbols === "function")
            for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
                if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                    t[p[i]] = s[p[i]];
            }
        return t;
    }

    function __decorate(decorators, target, key, desc) {
        var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
        if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
        else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
        return c > 3 && r && Object.defineProperty(target, key, r), r;
    }

    function __awaiter(thisArg, _arguments, P, generator) {
        function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
        return new (P || (P = Promise))(function (resolve, reject) {
            function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
            function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
            function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
            step((generator = generator.apply(thisArg, _arguments || [])).next());
        });
    }

    function __generator(thisArg, body) {
        var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
        return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
        function verb(n) { return function (v) { return step([n, v]); }; }
        function step(op) {
            if (f) throw new TypeError("Generator is already executing.");
            while (g && (g = 0, op[0] && (_ = 0)), _) try {
                if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
                if (y = 0, t) op = [op[0] & 2, t.value];
                switch (op[0]) {
                    case 0: case 1: t = op; break;
                    case 4: _.label++; return { value: op[1], done: false };
                    case 5: _.label++; y = op[1]; op = [0]; continue;
                    case 7: op = _.ops.pop(); _.trys.pop(); continue;
                    default:
                        if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                        if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                        if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                        if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                        if (t[2]) _.ops.pop();
                        _.trys.pop(); continue;
                }
                op = body.call(thisArg, _);
            } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
            if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
        }
    }

    function __spreadArray(to, from, pack) {
        if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
            if (ar || !(i in from)) {
                if (!ar) ar = Array.prototype.slice.call(from, 0, i);
                ar[i] = from[i];
            }
        }
        return to.concat(ar || Array.prototype.slice.call(from));
    }

    var EventEmitter = /** @class */ (function () {
        function EventEmitter() {
            Object.defineProperty(this, "listeners", {
                enumerable: true,
                configurable: true,
                writable: true,
                value: {}
            });
        }
        Object.defineProperty(EventEmitter.prototype, "on", {
            enumerable: false,
            configurable: true,
            writable: true,
            value: function (eventName, listener) {
                if (!this.listeners[eventName]) {
                    this.listeners[eventName] = [];
                }
                this.listeners[eventName].push(listener);
            }
        });
        Object.defineProperty(EventEmitter.prototype, "off", {
            enumerable: false,
            configurable: true,
            writable: true,
            value: function (eventName, listener) {
                var eventListeners = this.listeners[eventName];
                if (eventListeners) {
                    var index = eventListeners.indexOf(listener);
                    if (index !== -1) {
                        eventListeners.splice(index, 1);
                    }
                }
            }
        });
        Object.defineProperty(EventEmitter.prototype, "emit", {
            enumerable: false,
            configurable: true,
            writable: true,
            value: function (eventName) {
                var args = [];
                for (var _i = 1; _i < arguments.length; _i++) {
                    args[_i - 1] = arguments[_i];
                }
                var eventListeners = this.listeners[eventName];
                if (eventListeners) {
                    eventListeners.forEach(function (listener) {
                        listener.apply(void 0, args);
                    });
                }
            }
        });
        Object.defineProperty(EventEmitter.prototype, "clear", {
            enumerable: false,
            configurable: true,
            writable: true,
            value: function (eventName) {
                delete this.listeners[eventName];
            }
        });
        Object.defineProperty(EventEmitter.prototype, "clearAll", {
            enumerable: false,
            configurable: true,
            writable: true,
            value: function () {
                for (var eventName in this.listeners) {
                    delete this.listeners[eventName];
                }
            }
        });
        return EventEmitter;
    }());

    /* eslint-disable @typescript-eslint/ban-ts-comment */
    // @ts-ignore
    // @ts-nocheck
    function debounce$1(func, wait, options) {
        var lastArgs, lastThis, maxWait, result, timerId, lastCallTime;
        var lastInvokeTime = 0;
        var leading = false;
        var maxing = false;
        var trailing = true;
        // Bypass `requestAnimationFrame` by explicitly setting `wait=0`.
        var useRAF = !wait && wait !== 0 && typeof window.requestAnimationFrame === 'function';
        if (typeof func !== 'function') {
            throw new TypeError('Expected a function');
        }
        wait = +wait || 0;
        if (typeof options === 'object') {
            leading = !!options.leading;
            maxing = 'maxWait' in options;
            maxWait = maxing ? Math.max(+options.maxWait || 0, wait) : maxWait;
            trailing = 'trailing' in options ? !!options.trailing : trailing;
        }
        function invokeFunc(time) {
            var args = lastArgs;
            var thisArg = lastThis;
            lastArgs = lastThis = undefined;
            lastInvokeTime = time;
            result = func.apply(thisArg, args);
            return result;
        }
        function startTimer(pendingFunc, wait) {
            if (useRAF) {
                window.cancelAnimationFrame(timerId);
                return window.requestAnimationFrame(pendingFunc);
            }
            return setTimeout(pendingFunc, wait);
        }
        function cancelTimer(id) {
            if (useRAF) {
                return window.cancelAnimationFrame(id);
            }
            clearTimeout(id);
        }
        function leadingEdge(time) {
            // Reset any `maxWait` timer.
            lastInvokeTime = time;
            // Start the timer for the trailing edge.
            timerId = startTimer(timerExpired, wait);
            // Invoke the leading edge.
            return leading ? invokeFunc(time) : result;
        }
        function remainingWait(time) {
            var timeSinceLastCall = time - lastCallTime;
            var timeSinceLastInvoke = time - lastInvokeTime;
            var timeWaiting = wait - timeSinceLastCall;
            return maxing
                ? Math.min(timeWaiting, maxWait - timeSinceLastInvoke)
                : timeWaiting;
        }
        function shouldInvoke(time) {
            var timeSinceLastCall = time - lastCallTime;
            var timeSinceLastInvoke = time - lastInvokeTime;
            // Either this is the first call, activity has stopped and we're at the
            // trailing edge, the system time has gone backwards and we're treating
            // it as the trailing edge, or we've hit the `maxWait` limit.
            return (lastCallTime === undefined ||
                timeSinceLastCall >= wait ||
                timeSinceLastCall < 0 ||
                (maxing && timeSinceLastInvoke >= maxWait));
        }
        function timerExpired() {
            var time = Date.now();
            if (shouldInvoke(time)) {
                return trailingEdge(time);
            }
            // Restart the timer.
            timerId = startTimer(timerExpired, remainingWait(time));
        }
        function trailingEdge(time) {
            timerId = undefined;
            // Only invoke if we have `lastArgs` which means `func` has been
            // debounced at least once.
            if (trailing && lastArgs) {
                return invokeFunc(time);
            }
            lastArgs = lastThis = undefined;
            return result;
        }
        function cancel() {
            if (timerId !== undefined) {
                cancelTimer(timerId);
            }
            lastInvokeTime = 0;
            lastArgs = lastCallTime = lastThis = timerId = undefined;
        }
        function flush() {
            return timerId === undefined ? result : trailingEdge(Date.now());
        }
        function pending() {
            return timerId !== undefined;
        }
        function debounced() {
            var args = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                args[_i] = arguments[_i];
            }
            var time = Date.now();
            var isInvoking = shouldInvoke(time);
            lastArgs = args;
            // eslint-disable-next-line @typescript-eslint/no-this-alias
            lastThis = this;
            lastCallTime = time;
            if (isInvoking) {
                if (timerId === undefined) {
                    return leadingEdge(lastCallTime);
                }
                if (maxing) {
                    // Handle invocations in a tight loop.
                    timerId = startTimer(timerExpired, wait);
                    return invokeFunc(lastCallTime);
                }
            }
            if (timerId === undefined) {
                timerId = startTimer(timerExpired, wait);
            }
            return result;
        }
        debounced.cancel = cancel;
        debounced.flush = flush;
        debounced.pending = pending;
        return debounced;
    }

    function debounce(wait, maxWait) {
        return function (target, propertyKey, descriptor) {
            var originalMethod = descriptor.value;
            descriptor.value = debounce$1(originalMethod, wait, { maxWait: maxWait });
            return descriptor;
        };
    }

    var LocalStorageStore = /** @class */ (function () {
        function LocalStorageStore(storageKeySuffix) {
            var _this = this;
            Object.defineProperty(this, "storageKey", {
                enumerable: true,
                configurable: true,
                writable: true,
                value: void 0
            });
            Object.defineProperty(this, "innerStore", {
                enumerable: true,
                configurable: true,
                writable: true,
                value: void 0
            });
            this.storageKey = "MIHOYO_H5LOG_".concat(storageKeySuffix);
            var localData = this.getLocalData(localStorage.getItem(this.storageKey));
            this.innerStore = localData ? localData : [];
            this.updateLocalData();
            window.addEventListener('unload', function () {
                _this.updateLocalDataSync();
            });
        }
        Object.defineProperty(LocalStorageStore.prototype, "getLocalData", {
            enumerable: false,
            configurable: true,
            writable: true,
            value: function (data) {
                try {
                    if (!data)
                        return false;
                    var parsedData = JSON.parse(data);
                    if (!Array.isArray(parsedData))
                        return false;
                    return parsedData.filter(function (v) { return v.app_name; });
                }
                catch (error) {
                    return false;
                }
            }
        });
        Object.defineProperty(LocalStorageStore.prototype, "updateLocalData", {
            enumerable: false,
            configurable: true,
            writable: true,
            value: function () {
                try {
                    var data = this.innerStore;
                    var value = JSON.stringify(data);
                    localStorage.setItem(this.storageKey, value);
                }
                catch (error) {
                    if (error instanceof DOMException &&
                        (error.code === 22 ||
                            error.code === 1014 ||
                            error.name === 'QuotaExceededError' ||
                            error.name === 'NS_ERROR_DOM_QUOTA_REACHED')) {
                        // 处理 localStorage 容量不足的错误
                        this.innerStore.splice(0, this.innerStore.length / 2);
                    }
                }
            }
        });
        Object.defineProperty(LocalStorageStore.prototype, "updateLocalDataSync", {
            enumerable: false,
            configurable: true,
            writable: true,
            value: function () {
                try {
                    var data = this.innerStore;
                    var value = JSON.stringify(data);
                    localStorage.setItem(this.storageKey, value);
                }
                catch (error) {
                    // noop
                }
            }
        });
        Object.defineProperty(LocalStorageStore.prototype, "push", {
            enumerable: false,
            configurable: true,
            writable: true,
            value: function (data) {
                this.innerStore.push(data);
                this.updateLocalData();
            }
        });
        Object.defineProperty(LocalStorageStore.prototype, "length", {
            get: function () {
                return this.innerStore.length;
            },
            enumerable: false,
            configurable: true
        });
        Object.defineProperty(LocalStorageStore.prototype, "splice", {
            enumerable: false,
            configurable: true,
            writable: true,
            value: function (start, deleteCount) {
                var _a;
                var items = [];
                for (var _i = 2; _i < arguments.length; _i++) {
                    items[_i - 2] = arguments[_i];
                }
                var data;
                if (typeof deleteCount === 'number' && Array.isArray(items)) {
                    data = (_a = this.innerStore).splice.apply(_a, __spreadArray([start, deleteCount], items, false));
                }
                else {
                    data = this.innerStore.splice(start, deleteCount);
                }
                this.updateLocalData();
                return data;
            }
        });
        Object.defineProperty(LocalStorageStore.prototype, "getFirst", {
            enumerable: false,
            configurable: true,
            writable: true,
            value: function () {
                return this.innerStore[0];
            }
        });
        Object.defineProperty(LocalStorageStore.prototype, "getLast", {
            enumerable: false,
            configurable: true,
            writable: true,
            value: function () {
                if (this.innerStore.length === 0)
                    return undefined;
                return this.innerStore[this.innerStore.length - 1];
            }
        });
        __decorate([
            debounce(200, 1000)
        ], LocalStorageStore.prototype, "updateLocalData", null);
        return LocalStorageStore;
    }());

    var MemoryStore = /** @class */ (function () {
        function MemoryStore() {
            Object.defineProperty(this, "innerStore", {
                enumerable: true,
                configurable: true,
                writable: true,
                value: void 0
            });
            this.innerStore = [];
        }
        Object.defineProperty(MemoryStore.prototype, "push", {
            enumerable: false,
            configurable: true,
            writable: true,
            value: function (data) {
                this.innerStore.push(data);
            }
        });
        Object.defineProperty(MemoryStore.prototype, "length", {
            get: function () {
                return this.innerStore.length;
            },
            enumerable: false,
            configurable: true
        });
        Object.defineProperty(MemoryStore.prototype, "splice", {
            enumerable: false,
            configurable: true,
            writable: true,
            value: function (start, deleteCount) {
                var _a;
                var items = [];
                for (var _i = 2; _i < arguments.length; _i++) {
                    items[_i - 2] = arguments[_i];
                }
                var data;
                if (typeof deleteCount === 'number' && Array.isArray(items)) {
                    data = (_a = this.innerStore).splice.apply(_a, __spreadArray([start, deleteCount], items, false));
                }
                else {
                    data = this.innerStore.splice(start, deleteCount);
                }
                return data;
            }
        });
        Object.defineProperty(MemoryStore.prototype, "getFirst", {
            enumerable: false,
            configurable: true,
            writable: true,
            value: function () {
                return this.innerStore[0];
            }
        });
        Object.defineProperty(MemoryStore.prototype, "getLast", {
            enumerable: false,
            configurable: true,
            writable: true,
            value: function () {
                if (this.innerStore.length === 0)
                    return undefined;
                return this.innerStore[this.innerStore.length - 1];
            }
        });
        return MemoryStore;
    }());

    var IStorageType;
    (function (IStorageType) {
        IStorageType["Memory"] = "memory";
        IStorageType["Local"] = "local";
    })(IStorageType || (IStorageType = {}));

    var H5logCollector = /** @class */ (function (_super) {
        __extends(H5logCollector, _super);
        function H5logCollector(collectOptions) {
            var _a, _b, _c, _d;
            var _this = _super.call(this) || this;
            Object.defineProperty(_this, "collectOptions", {
                enumerable: true,
                configurable: true,
                writable: true,
                value: void 0
            });
            Object.defineProperty(_this, "store", {
                enumerable: true,
                configurable: true,
                writable: true,
                value: void 0
            });
            Object.defineProperty(_this, "prevBatchEventTimes", {
                enumerable: true,
                configurable: true,
                writable: true,
                value: void 0
            });
            Object.defineProperty(_this, "timer", {
                enumerable: true,
                configurable: true,
                writable: true,
                value: void 0
            });
            Object.defineProperty(_this, "dataIndex", {
                enumerable: true,
                configurable: true,
                writable: true,
                value: 0
            }); // 全局数据索引，用于配合快速查找所有error数据
            Object.defineProperty(_this, "errorIndexList", {
                enumerable: true,
                configurable: true,
                writable: true,
                value: []
            }); // error数据索引
            Object.defineProperty(_this, "isFlushing", {
                enumerable: true,
                configurable: true,
                writable: true,
                value: false
            }); // 是否正在flush
            if (collectOptions) {
                var DEFAULT_COLLECTOR_OPTIONS = H5logCollector.DEFAULT_COLLECTOR_OPTIONS;
                var batchSize = (_a = collectOptions.batchSize, _a === void 0 ? DEFAULT_COLLECTOR_OPTIONS.batchSize : _a), batchInterval = (_b = collectOptions.batchInterval, _b === void 0 ? DEFAULT_COLLECTOR_OPTIONS.batchInterval : _b);
                var highPriorityList = (_c = collectOptions.highPriorityList, _c === void 0 ? DEFAULT_COLLECTOR_OPTIONS.highPriorityList : _c), storageType = (_d = collectOptions.storageType, _d === void 0 ? DEFAULT_COLLECTOR_OPTIONS.storageType : _d);
                if (typeof batchSize === 'number' && (batchSize > 20 || batchSize <= 0)) {
                    console.warn("[h5log]: The parameter 'batchSize' is invalid.");
                    batchSize = DEFAULT_COLLECTOR_OPTIONS.batchSize;
                }
                if (typeof batchInterval === 'number' && batchInterval <= 0) {
                    console.warn("[h5log]: The parameter 'batchInterval' is invalid.\"");
                    batchInterval = DEFAULT_COLLECTOR_OPTIONS.batchInterval;
                }
                if (storageType === IStorageType.Local) {
                    var storageKeySuffix = collectOptions.storageKeySuffix;
                    _this.store = new LocalStorageStore(storageKeySuffix);
                    _this.collectOptions = {
                        batchSize: batchSize,
                        highPriorityList: highPriorityList,
                        storageType: storageType,
                        batchInterval: batchInterval,
                        storageKeySuffix: storageKeySuffix,
                    };
                }
                else {
                    _this.store = new MemoryStore();
                    _this.collectOptions = {
                        batchSize: batchSize,
                        highPriorityList: highPriorityList,
                        storageType: storageType,
                        batchInterval: batchInterval,
                    };
                }
            }
            else {
                _this.collectOptions = H5logCollector.DEFAULT_COLLECTOR_OPTIONS;
                _this.store = new MemoryStore();
            }
            _this.prevBatchEventTimes = 0;
            _this.flush = _this.flush.bind(_this);
            _this.findIndex = _this.findIndex.bind(_this);
            _this.initialInterval();
            return _this;
        }
        Object.defineProperty(H5logCollector.prototype, "first", {
            get: function () {
                return this.store.getFirst();
            },
            enumerable: false,
            configurable: true
        });
        Object.defineProperty(H5logCollector.prototype, "last", {
            get: function () {
                return this.store.getLast();
            },
            enumerable: false,
            configurable: true
        });
        Object.defineProperty(H5logCollector.prototype, "list", {
            get: function () {
                return this.store.innerStore;
            },
            enumerable: false,
            configurable: true
        });
        /**
         * find index of item that it's dataIndex === given dataIndex
         * @param dataIndex
         * @returns
         */
        Object.defineProperty(H5logCollector.prototype, "findIndex", {
            enumerable: false,
            configurable: true,
            writable: true,
            value: function (dataIndex) {
                var dataList = this.list;
                var lo = 0;
                var hi = dataList.length - 1;
                while (lo <= hi) {
                    var mid = Math.floor((lo + hi) / 2);
                    var currIndex = dataList[mid].dataIndex;
                    if (currIndex === dataIndex) {
                        return mid;
                    }
                    else if (currIndex < dataIndex) {
                        lo = mid + 1;
                    }
                    else {
                        hi = mid - 1;
                    }
                }
                return -1;
            }
        });
        Object.defineProperty(H5logCollector.prototype, "flush", {
            enumerable: false,
            configurable: true,
            writable: true,
            value: function (options) {
                var _a, _b, _c, _d, _e, _f;
                var _this = this;
                this.isFlushing = true;
                var tailFirst = (_a = options || {}, _b = _a.tailFirst, _b === void 0 ? false : _b), highPriorityFirst = (_c = _a.highPriorityFirst, _c === void 0 ? false : _c), batchSize = (_d = _a.batchSize, _d === void 0 ? this.collectOptions.batchSize : _d), interval = (_e = _a.interval, _e === void 0 ? this.collectOptions.batchInterval : _e), waitPrevious = (_f = _a.waitPrevious, _f === void 0 ? false : _f);
                if (this.store.length === 0) {
                    this.isFlushing = false;
                    this.resetInterval(1);
                    return;
                }
                this.disableInterval();
                var timeRemain = interval - (Date.now() - this.prevBatchEventTimes);
                if (waitPrevious && timeRemain > 0) {
                    setTimeout(function () {
                        _this.flush(options);
                    }, timeRemain + 1);
                }
                var data = [];
                // send error data first
                if (highPriorityFirst && this.errorIndexList.length > 0) {
                    var errorIndex = tailFirst
                        ? this.errorIndexList.splice(Math.max(this.errorIndexList.length - batchSize, 0), batchSize)
                        : this.errorIndexList.splice(0, batchSize);
                    data = errorIndex
                        .map(function (dIndex) {
                        var index = _this.findIndex(dIndex);
                        return index >= 0 ? _this.store.splice(index, 1) || [] : [];
                    })
                        .reduce(function (prev, curr) { return __spreadArray(__spreadArray([], prev, true), curr, true); }, []);
                }
                var sizeRemain = batchSize - data.length;
                if (sizeRemain > 0 && this.store.length > 0) {
                    data = __spreadArray(__spreadArray([], data, true), (tailFirst
                        ? this.store.splice(Math.max(0, this.store.length - sizeRemain), sizeRemain)
                        : this.store.splice(0, sizeRemain)), true);
                }
                this.prevBatchEventTimes = Date.now();
                this.emit('flush', data);
                setTimeout(function () {
                    _this.flush(options);
                }, interval);
            }
        });
        Object.defineProperty(H5logCollector.prototype, "collect", {
            enumerable: false,
            configurable: true,
            writable: true,
            value: function (data) {
                this.dataIndex += 1;
                this.store.push(__assign(__assign({}, data), { dataIndex: this.dataIndex }));
                if (data.level === 'error') {
                    this.errorIndexList.push(this.dataIndex);
                }
                this.shouldSend();
            }
        });
        Object.defineProperty(H5logCollector.prototype, "disableInterval", {
            enumerable: false,
            configurable: true,
            writable: true,
            value: function () {
                if (this.timer) {
                    clearInterval(this.timer);
                }
            }
        });
        Object.defineProperty(H5logCollector.prototype, "resetInterval", {
            enumerable: false,
            configurable: true,
            writable: true,
            value: function (rate) {
                if (this.isFlushing) {
                    console.info('is flushing, can not reset interval');
                    return;
                }
                this.disableInterval();
                var batchInterval = this.collectOptions.batchInterval;
                this.collectOptions.batchInterval = batchInterval * rate;
                this.initialInterval();
            }
        });
        Object.defineProperty(H5logCollector.prototype, "initialInterval", {
            enumerable: false,
            configurable: true,
            writable: true,
            value: function () {
                var _this = this;
                var batchInterval = this.collectOptions.batchInterval;
                this.timer = setInterval(function () {
                    _this.shouldSend(true);
                }, batchInterval);
            }
        });
        Object.defineProperty(H5logCollector.prototype, "emitBatch", {
            enumerable: false,
            configurable: true,
            writable: true,
            value: function () {
                var _a;
                var batchSize = (_a = this.collectOptions, _a.batchSize), batchInterval = _a.batchInterval;
                var dis = Date.now() - this.prevBatchEventTimes;
                if (dis < batchInterval) {
                    return;
                }
                var data = this.store.splice(0, batchSize);
                if (data.length > 0) {
                    this.removeErrorIndexRange(data[0].dataIndex, data[data.length - 1].dataIndex);
                }
                this.prevBatchEventTimes = Date.now();
                this.emit('flush', data);
            }
        });
        Object.defineProperty(H5logCollector.prototype, "shouldSend", {
            enumerable: false,
            configurable: true,
            writable: true,
            value: function (checkStoreSize) {
                var _a;
                if (checkStoreSize === void 0) { checkStoreSize = false; }
                var highPriorityList = (_a = this.collectOptions, _a.highPriorityList), batchSize = _a.batchSize;
                if (this.last && highPriorityList.includes(this.last.level)) {
                    this.emitBatch();
                    return;
                }
                if (this.store.length >= batchSize) {
                    this.emitBatch();
                    return;
                }
                if (checkStoreSize && this.store.length > 0) {
                    this.emitBatch();
                }
            }
        });
        /**
         * remove [start, endExclusive) from errorIndexList
         */
        Object.defineProperty(H5logCollector.prototype, "removeErrorIndexRange", {
            enumerable: false,
            configurable: true,
            writable: true,
            value: function (start, endExclusive) {
                if (start > endExclusive) {
                    return;
                }
                // find the index that indexList[index] >= target
                var binarySearch = function (target, indexList) {
                    var lo = 0;
                    var hi = indexList.length - 1;
                    while (lo <= hi) {
                        var mid = Math.floor((lo + hi) / 2);
                        if (indexList[mid] < target) {
                            lo = mid + 1;
                        }
                        else {
                            hi = mid - 1;
                        }
                    }
                    return lo;
                };
                var startIndex = binarySearch(start, this.errorIndexList);
                var endIndex = binarySearch(endExclusive, this.errorIndexList);
                this.errorIndexList.splice(startIndex, endIndex - startIndex);
            }
        });
        Object.defineProperty(H5logCollector, "DEFAULT_COLLECTOR_OPTIONS", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: {
                highPriorityList: ['error'],
                storageType: IStorageType.Memory,
                batchSize: 20,
                batchInterval: 3 * 1000,
            }
        });
        return H5logCollector;
    }(EventEmitter));

    /**
     * @link https://km.mihoyo.com/articleBase/351/722766
     */
    var CNBatchUrl;
    (function (CNBatchUrl) {
        CNBatchUrl["development"] = "https://testing-h5log-api-dualstack.mihoyo.com/common/h5log/log/batch?topic=";
        CNBatchUrl["test"] = "https://testing-h5log-api-dualstack.mihoyo.com/common/h5log/log/batch?topic=";
        CNBatchUrl["prerelease"] = "https://h5log-api-dualstack.mihoyo.com/common/h5log/log/batch?topic=";
        CNBatchUrl["beta"] = "https://h5log-api-dualstack.mihoyo.com/common/h5log/log/batch?topic=";
        CNBatchUrl["sandbox"] = "https://testing-h5log-api-dualstack.mihoyo.com/common/h5log/log/batch?topic=";
        CNBatchUrl["production"] = "https://h5log-api-dualstack.mihoyo.com/common/h5log/log/batch?topic=";
    })(CNBatchUrl || (CNBatchUrl = {}));
    var OSBatchUrl;
    (function (OSBatchUrl) {
        OSBatchUrl["development"] = "https://testing-h5log-api.hoyoverse.com/common/h5log/log/batch?topic=";
        OSBatchUrl["test"] = "https://testing-h5log-api.hoyoverse.com/common/h5log/log/batch?topic=";
        OSBatchUrl["prerelease"] = "https://minor-api-os.hoyoverse.com/common/h5log/log/batch?topic=";
        OSBatchUrl["beta"] = "https://minor-api-os.hoyoverse.com/common/h5log/log/batch?topic=";
        OSBatchUrl["sandbox"] = "https://testing-h5log-api.hoyoverse.com/common/h5log/log/batch?topic=";
        OSBatchUrl["production"] = "https://minor-api-os.hoyoverse.com/common/h5log/log/batch?topic=";
    })(OSBatchUrl || (OSBatchUrl = {}));

    /* eslint-disable @typescript-eslint/ban-ts-comment */
    // @ts-nocheck
    function chunk (arr, size) {
        var ret = [];
        size = size || 1;
        for (var i = 0, len = Math.ceil(arr.length / size); i < len; i++) {
            var start = i * size;
            var end = start + size;
            ret.push(arr.slice(start, end));
        }
        return ret;
    }

    /* eslint-disable @typescript-eslint/ban-ts-comment */
    // @ts-nocheck
    var ucs2 = {
        encode: function (arr) {
            if (arr.length < 32768) {
                // eslint-disable-next-line prefer-spread
                return String.fromCodePoint.apply(String, arr);
            }
            return (chunk(arr, 32767)
                // eslint-disable-next-line prefer-spread
                .map(function (nums) { return String.fromCodePoint.apply(String, nums); })
                .join(''));
        },
        decode: function (str) {
            var ret = [];
            var i = 0;
            var len = str.length;
            while (i < len) {
                var c = str.charCodeAt(i++);
                // A high surrogate
                if (c >= 0xd800 && c <= 0xdbff && i < len) {
                    var tail = str.charCodeAt(i++);
                    // nextC >= 0xDC00 && nextC <= 0xDFFF
                    if ((tail & 0xfc00) === 0xdc00) {
                        // C = (H - 0xD800) * 0x400 + L - 0xDC00 + 0x10000
                        ret.push(((c & 0x3ff) << 10) + (tail & 0x3ff) + 0x10000);
                    }
                    else {
                        ret.push(c);
                        i--;
                    }
                }
                else {
                    ret.push(c);
                }
            }
            return ret;
        },
    };

    /* eslint-disable @typescript-eslint/ban-ts-comment */
    // @ts-nocheck
    var utf8 = {
        encode: function (str) {
            var codePoints = ucs2.decode(str);
            var byteArr = '';
            for (var i = 0, len = codePoints.length; i < len; i++) {
                byteArr += encodeCodePoint(codePoints[i]);
            }
            return byteArr;
        },
        decode: function (str, safe) {
            byteArr = ucs2.decode(str);
            byteIdx = 0;
            byteCount = byteArr.length;
            codePoint = 0;
            bytesSeen = 0;
            bytesNeeded = 0;
            lowerBoundary = 0x80;
            upperBoundary = 0xbf;
            var codePoints = [];
            var tmp;
            while ((tmp = decodeCodePoint(safe)) !== false) {
                codePoints.push(tmp);
            }
            return ucs2.encode(codePoints);
        },
    };
    var fromCharCode = String.fromCharCode;
    function encodeCodePoint(codePoint) {
        // U+0000 to U+0080, ASCII code point
        if ((codePoint & 0xffffff80) === 0) {
            return fromCharCode(codePoint);
        }
        var ret = '', count, offset;
        // U+0080 to U+07FF, inclusive
        if ((codePoint & 0xfffff800) === 0) {
            count = 1;
            offset = 0xc0;
        }
        else if ((codePoint & 0xffff0000) === 0) {
            // U+0800 to U+FFFF, inclusive
            count = 2;
            offset = 0xe0;
        }
        else if ((codePoint & 0xffe00000) == 0) {
            // U+10000 to U+10FFFF, inclusive
            count = 3;
            offset = 0xf0;
        }
        ret += fromCharCode((codePoint >> (6 * count)) + offset);
        while (count > 0) {
            var tmp = codePoint >> (6 * (count - 1));
            ret += fromCharCode(0x80 | (tmp & 0x3f));
            count--;
        }
        return ret;
    }
    var byteArr, byteIdx, byteCount, codePoint, bytesSeen, bytesNeeded, lowerBoundary, upperBoundary;
    function decodeCodePoint(safe) {
        /* eslint-disable no-constant-condition */
        while (true) {
            if (byteIdx >= byteCount && bytesNeeded) {
                if (safe)
                    return goBack();
                throw new Error('Invalid byte index');
            }
            if (byteIdx === byteCount)
                return false;
            var byte = byteArr[byteIdx];
            byteIdx++;
            if (!bytesNeeded) {
                // 0x00 to 0x7F
                if ((byte & 0x80) === 0) {
                    return byte;
                }
                // 0xC2 to 0xDF
                if ((byte & 0xe0) === 0xc0) {
                    bytesNeeded = 1;
                    codePoint = byte & 0x1f;
                }
                else if ((byte & 0xf0) === 0xe0) {
                    // 0xE0 to 0xEF
                    if (byte === 0xe0)
                        lowerBoundary = 0xa0;
                    if (byte === 0xed)
                        upperBoundary = 0x9f;
                    bytesNeeded = 2;
                    codePoint = byte & 0xf;
                }
                else if ((byte & 0xf8) === 0xf0) {
                    // 0xF0 to 0xF4
                    if (byte === 0xf0)
                        lowerBoundary = 0x90;
                    if (byte === 0xf4)
                        upperBoundary = 0x8f;
                    bytesNeeded = 3;
                    codePoint = byte & 0x7;
                }
                else {
                    if (safe)
                        return goBack();
                    throw new Error('Invalid UTF-8 detected');
                }
                continue;
            }
            if (byte < lowerBoundary || byte > upperBoundary) {
                if (safe) {
                    byteIdx--;
                    return goBack();
                }
                throw new Error('Invalid continuation byte');
            }
            lowerBoundary = 0x80;
            upperBoundary = 0xbf;
            codePoint = (codePoint << 6) | (byte & 0x3f);
            bytesSeen++;
            if (bytesSeen !== bytesNeeded)
                continue;
            var tmp = codePoint;
            codePoint = 0;
            bytesNeeded = 0;
            bytesSeen = 0;
            return tmp;
        }
    }
    function goBack() {
        var start = byteIdx - bytesSeen - 1;
        byteIdx = start + 1;
        codePoint = 0;
        bytesNeeded = 0;
        bytesSeen = 0;
        lowerBoundary = 0x80;
        upperBoundary = 0xbf;
        return byteArr[start];
    }

    /* eslint-disable @typescript-eslint/ban-ts-comment */
    // @ts-nocheck
    function bytesToStr (bytes) {
        var str = [];
        for (var i = 0, len = bytes.length; i < len; i++) {
            str.push(String.fromCharCode(bytes[i]));
        }
        str = str.join('');
        str = utf8.decode(str);
        return str;
    }

    /* eslint-disable @typescript-eslint/ban-ts-comment */
    // @ts-nocheck
    function strToBytes (str) {
        var bytes = [];
        str = utf8.encode(str);
        for (var i = 0, len = str.length; i < len; i++) {
            bytes.push(str.charCodeAt(i) & 0xff);
        }
        return bytes;
    }

    /* eslint-disable @typescript-eslint/ban-ts-comment */
    // @ts-nocheck
    var base64 = {
        encode: function (bytes) {
            var ret = [];
            var len = bytes.length;
            var remain = len % 3;
            len = len - remain;
            for (var i = 0; i < len; i += 3) {
                ret.push(numToBase64((bytes[i] << 16) + (bytes[i + 1] << 8) + bytes[i + 2]));
            }
            len = bytes.length;
            var tmp;
            if (remain === 1) {
                tmp = bytes[len - 1];
                ret.push(code[tmp >> 2]);
                ret.push(code[(tmp << 4) & 0x3f]);
                ret.push('==');
            }
            else if (remain === 2) {
                tmp = (bytes[len - 2] << 8) + bytes[len - 1];
                ret.push(code[tmp >> 10]);
                ret.push(code[(tmp >> 4) & 0x3f]);
                ret.push(code[(tmp << 2) & 0x3f]);
                ret.push('=');
            }
            return ret.join('');
        },
        decode: function (str) {
            var len = str.length, remain = 0;
            if (str[len - 2] === '=')
                remain = 2;
            else if (str[len - 1] === '=')
                remain = 1;
            var ret = new Array((len * 3) / 4 - remain);
            len = remain > 0 ? len - 4 : len;
            var i, j;
            for (i = 0, j = 0; i < len; i += 4) {
                var num = base64ToNum(str[i], str[i + 1], str[i + 2], str[i + 3]);
                ret[j++] = (num >> 16) & 0xff;
                ret[j++] = (num >> 8) & 0xff;
                ret[j++] = num & 0xff;
            }
            var tmp;
            if (remain === 2) {
                tmp =
                    (codeMap[str.charCodeAt(i)] << 2) |
                        (codeMap[str.charCodeAt(i + 1)] >> 4);
                ret[j++] = tmp & 0xff;
            }
            else if (remain === 1) {
                tmp =
                    (codeMap[str.charCodeAt(i)] << 10) |
                        (codeMap[str.charCodeAt(i + 1)] << 4) |
                        (codeMap[str.charCodeAt(i + 2)] >> 2);
                ret[j++] = (tmp >> 8) & 0xff;
                ret[j++] = tmp & 0xff;
            }
            return ret;
        },
    };
    var codeMap = [];
    var code = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
    for (var i = 0, len = code.length; i < len; i++) {
        codeMap[code.charCodeAt(i)] = i;
    }
    function numToBase64(num) {
        return (code[(num >> 18) & 0x3f] +
            code[(num >> 12) & 0x3f] +
            code[(num >> 6) & 0x3f] +
            code[num & 0x3f]);
    }
    function base64ToNum(str1, str2, str3, str4) {
        return ((codeMap[str1.charCodeAt(0)] << 18) |
            (codeMap[str2.charCodeAt(0)] << 12) |
            (codeMap[str3.charCodeAt(0)] << 6) |
            codeMap[str4.charCodeAt(0)]);
    }

    /* eslint-disable @typescript-eslint/ban-ts-comment */
    // @ts-nocheck
    function rc4(key, str, decrypt) {
        key = strToBytes(key);
        if (!decrypt) {
            str = strToBytes(str);
        }
        else {
            str = base64.decode(str);
        }
        var result = [];
        var s = [];
        var j = 0;
        var i = 0;
        var x;
        for (i = 0; i < 256; i++) {
            s[i] = i;
        }
        for (i = 0; i < 256; i++) {
            j = (j + s[i] + key[i % key.length]) % 256;
            x = s[i];
            s[i] = s[j];
            s[j] = x;
        }
        i = 0;
        j = 0;
        for (var y = 0, len = str.length; y < len; y++) {
            i = (i + 1) % 256;
            j = (j + s[i]) % 256;
            x = s[i];
            s[i] = s[j];
            s[j] = x;
            result.push(str[y] ^ s[(s[i] + s[j]) % 256]);
        }
        return !decrypt ? base64.encode(result) : bytesToStr(result);
    }
    var rc4$1 = {
        encrypt: function (key, str) {
            return rc4(key, str, false);
        },
        decrypt: function (key, str) {
            return rc4(key, str, true);
        },
    };

    var SECRET_KEY = 'F#ju0q8I9HbmH8PMpJzzBee&p0b5h@Yb';
    function rc4EncryptWithBase64(str, key) {
        if (key === void 0) { key = SECRET_KEY; }
        try {
            return rc4$1.encrypt(key, str);
        }
        catch (error) {
            return '';
        }
    }

    function request(options) {
        var xhr = new XMLHttpRequest();
        var method = options.method || 'GET';
        var url = options.url;
        var async = options.async || true;
        var timeout = options.timeout || 0;
        xhr.open(method, url, async);
        xhr.timeout = timeout;
        if (options.headers) {
            for (var key in options.headers) {
                xhr.setRequestHeader(key, options.headers[key]);
            }
        }
        xhr.setRequestHeader('Content-Type', 'application/json');
        xhr.send(options.data);
        return new Promise(function (resolve, reject) {
            xhr.onload = function () {
                try {
                    if (xhr.status >= 200 && xhr.status < 300) {
                        var response = JSON.parse(xhr.responseText);
                        if (response.retcode === 0) {
                            resolve(response);
                        }
                        else {
                            reject(xhr);
                        }
                    }
                    else {
                        reject(xhr);
                    }
                }
                catch (error) {
                    reject(xhr);
                }
            };
            xhr.onerror = function () {
                reject(xhr);
            };
            xhr.ontimeout = function () {
                reject(__assign(__assign({}, xhr), { isTimeout: true }));
            };
        });
    }

    var BatchUrl;
    (function (BatchUrl) {
        BatchUrl["development"] = "https://devapi-takumi.mihoyo.com/common/h5log/log/batch?topic=";
        BatchUrl["test"] = "https://devapi-takumi.mihoyo.com/common/h5log/log/batch?topic=";
        BatchUrl["prerelease"] = "https://api-takumi.mihoyo.com/common/h5log/log/batch?topic=";
        BatchUrl["beta"] = "https://minor-api.mihoyo.com/common/h5log/log/batch?topic=";
        BatchUrl["sandbox"] = "https://devapi-takumi.mihoyo.com/common/h5log/log/batch?topic=";
        BatchUrl["production"] = "https://minor-api.mihoyo.com/common/h5log/log/batch?topic=";
    })(BatchUrl || (BatchUrl = {}));
    var SenderEnv;
    (function (SenderEnv) {
        SenderEnv["Development"] = "development";
        SenderEnv["Test"] = "test";
        SenderEnv["Prerelease"] = "prerelease";
        SenderEnv["Beta"] = "beta";
        SenderEnv["Sandbox"] = "sandbox";
        SenderEnv["Production"] = "production";
    })(SenderEnv || (SenderEnv = {}));
    var Region;
    (function (Region) {
        Region["CN"] = "cn";
        Region["OS"] = "os";
    })(Region || (Region = {}));

    var H5logSender = /** @class */ (function (_super) {
        __extends(H5logSender, _super);
        function H5logSender(opts) {
            var _this = _super.call(this) || this;
            Object.defineProperty(_this, "sendOptions", {
                enumerable: true,
                configurable: true,
                writable: true,
                value: void 0
            });
            _this.sendOptions = {
                topic: opts.topic,
                env: opts.env || H5logSender.DEFAULT_SENDER_OPTIONS.env,
                region: opts.region || H5logSender.DEFAULT_SENDER_OPTIONS.region,
            };
            return _this;
        }
        Object.defineProperty(H5logSender.prototype, "send", {
            enumerable: false,
            configurable: true,
            writable: true,
            value: function (data) {
                return __awaiter(this, void 0, void 0, function () {
                    var env, topic, region, baseUrl, url, error_1;
                    var _a;
                    return __generator(this, function (_b) {
                        switch (_b.label) {
                            case 0:
                                env = (_a = this.sendOptions, _a.env), topic = _a.topic, region = _a.region;
                                baseUrl = region === Region.CN ? CNBatchUrl : OSBatchUrl;
                                url = "".concat(baseUrl[env]).concat(topic);
                                _b.label = 1;
                            case 1:
                                _b.trys.push([1, 3, , 4]);
                                return [4 /*yield*/, request({
                                        url: url,
                                        method: 'POST',
                                        timeout: 5000,
                                        data: JSON.stringify({
                                            data: rc4EncryptWithBase64(JSON.stringify({ data: data })),
                                        }),
                                    })];
                            case 2:
                                _b.sent();
                                return [3 /*break*/, 4];
                            case 3:
                                error_1 = _b.sent();
                                if (error_1 instanceof XMLHttpRequest) {
                                    if (error_1.status > 400) {
                                        this.emit('serverError');
                                    }
                                }
                                this.emit('restoreData', data);
                                return [3 /*break*/, 4];
                            case 4: return [2 /*return*/];
                        }
                    });
                });
            }
        });
        Object.defineProperty(H5logSender, "SECRET_KEY", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: SECRET_KEY
        });
        Object.defineProperty(H5logSender, "DEFAULT_SENDER_OPTIONS", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: {
                env: SenderEnv.Production,
                region: Region.CN,
            }
        });
        return H5logSender;
    }(EventEmitter));

    var Level;
    (function (Level) {
        Level["Error"] = "error";
        Level["Warn"] = "warn";
        Level["Info"] = "info";
    })(Level || (Level = {}));
    var ErrorCode;
    (function (ErrorCode) {
        ErrorCode["Error"] = "-1";
    })(ErrorCode || (ErrorCode = {}));
    var Code;
    (function (Code) {
        Code["Warn"] = "0";
        Code["Info"] = "0";
    })(Code || (Code = {}));

    var H5log = /** @class */ (function () {
        function H5log(collector, sender, options) {
            var _this = this;
            var _a, _b;
            Object.defineProperty(this, "collector", {
                enumerable: true,
                configurable: true,
                writable: true,
                value: void 0
            });
            Object.defineProperty(this, "sender", {
                enumerable: true,
                configurable: true,
                writable: true,
                value: void 0
            });
            Object.defineProperty(this, "flushPromise", {
                enumerable: true,
                configurable: true,
                writable: true,
                value: null
            });
            Object.defineProperty(this, "flushResolve", {
                enumerable: true,
                configurable: true,
                writable: true,
                value: null
            });
            Object.defineProperty(this, "options", {
                enumerable: true,
                configurable: true,
                writable: true,
                value: void 0
            });
            Object.defineProperty(this, "commonInfo", {
                enumerable: true,
                configurable: true,
                writable: true,
                value: void 0
            });
            Object.defineProperty(this, "serverErrorCount", {
                enumerable: true,
                configurable: true,
                writable: true,
                value: void 0
            });
            this.collector = collector;
            this.sender = sender;
            this.commonInfo = null;
            this.options = {
                enable: (_a = options === null || options === void 0 ? void 0 : options.enable) !== null && _a !== void 0 ? _a : true,
                debug: (_b = options === null || options === void 0 ? void 0 : options.debug) !== null && _b !== void 0 ? _b : false,
            };
            this.serverErrorCount = 0;
            this.sender.send = this.sender.send.bind(this.sender);
            this.collector.on('flush', function (data) { return __awaiter(_this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            if (this.options.debug) {
                                console.log('flush', data.map(function (item) { return item.level; }));
                            }
                            return [4 /*yield*/, this.sender.send(data)];
                        case 1:
                            _a.sent();
                            if (this.collector.list.length === 0) {
                                this.flushResolve && this.flushResolve();
                            }
                            return [2 /*return*/];
                    }
                });
            }); });
            this.sender.on('serverError', function () {
                if (_this.options.debug) {
                    console.log('serverError');
                }
                _this.serverErrorCount += 1;
                if (_this.serverErrorCount >= H5log.MAX_SERVER_ERROR) {
                    _this.options.enable = false;
                    _this.collector.disableInterval();
                }
                else if (_this.serverErrorCount > 1) {
                    _this.collector.resetInterval(_this.serverErrorCount);
                }
            });
            this.sender.on('restoreData', function (data) {
                var _a;
                // 还原数据到队首
                (_a = _this.collector.store).splice.apply(_a, __spreadArray([0, 0], data, false));
            });
        }
        Object.defineProperty(H5log, "create", {
            enumerable: false,
            configurable: true,
            writable: true,
            value: function (options) {
                var _a, _b, _c;
                if (![
                    'development',
                    'test',
                    'prerelease',
                    'beta',
                    'sandbox',
                    'production',
                ].includes(options.env)) {
                    console.error("[h5log]: parameter env: ".concat(options.env, " is not allowed"));
                    options.env = 'production';
                }
                var env = options.env, topic = options.topic, region = (_a = options.region, _a === void 0 ? Region.CN : _a), enable = (_b = options.enable, _b === void 0 ? true : _b), debug = (_c = options.debug, _c === void 0 ? false : _c), collectorOptions = __rest(options, ["env", "topic", "region", "enable", "debug"]);
                var storageType = collectorOptions.storageType;
                if (!topic) {
                    console.error("[h5log]: parameter topic is required");
                }
                var collector = storageType === IStorageType.Local
                    ? new H5logCollector(__assign(__assign({}, collectorOptions), { storageKeySuffix: collectorOptions.storageKeySuffix || "".concat(env, "_").concat(topic, "_").concat(region) }))
                    : new H5logCollector(collectorOptions);
                var sender = new H5logSender({ env: env, topic: topic, region: region });
                return new H5log(collector, sender, {
                    enable: enable,
                    debug: debug,
                });
            }
        });
        Object.defineProperty(H5log.prototype, "setCommonInfo", {
            enumerable: false,
            configurable: true,
            writable: true,
            value: function (commonInfo) {
                this.commonInfo = commonInfo;
            }
        });
        Object.defineProperty(H5log.prototype, "error", {
            enumerable: false,
            configurable: true,
            writable: true,
            value: function (msg, code, additionalData) {
                if (code === void 0) { code = ErrorCode.Error; }
                this.log(msg, code, 'error', additionalData);
            }
        });
        Object.defineProperty(H5log.prototype, "warn", {
            enumerable: false,
            configurable: true,
            writable: true,
            value: function (msg, additionalData) {
                this.log(msg, Code.Warn, 'warn', additionalData);
            }
        });
        Object.defineProperty(H5log.prototype, "info", {
            enumerable: false,
            configurable: true,
            writable: true,
            value: function (msg, additionalData) {
                this.log(msg, Code.Info, 'info', additionalData);
            }
        });
        Object.defineProperty(H5log.prototype, "flush", {
            enumerable: false,
            configurable: true,
            writable: true,
            value: function (options) {
                return __awaiter(this, void 0, void 0, function () {
                    var _this = this;
                    return __generator(this, function (_a) {
                        switch (_a.label) {
                            case 0:
                                // avoid call flush multiple times
                                if (this.flushPromise) {
                                    return [2 /*return*/];
                                }
                                this.collector.flush(options);
                                this.flushPromise = new Promise(function (resolve) {
                                    _this.flushResolve = resolve;
                                });
                                return [4 /*yield*/, this.flushPromise];
                            case 1:
                                _a.sent();
                                this.flushPromise = null;
                                return [2 /*return*/];
                        }
                    });
                });
            }
        });
        Object.defineProperty(H5log.prototype, "log", {
            enumerable: false,
            configurable: true,
            writable: true,
            value: function (msg, code, level, additionalData) {
                var _a;
                var enable = (_a = this.options, _a.enable), debug = _a.debug;
                if (!enable) {
                    return;
                }
                var payload = __assign(__assign({ msg: msg, code: code, level: level, created_timestamp: "".concat(Date.now()), '@timestamp': "".concat(new Date().toISOString()) }, this.commonInfo), additionalData);
                if (debug && typeof console[level] === 'function') {
                    console[level]("[h5log]: ".concat(msg), payload);
                }
                if (!payload.app_name) {
                    console.warn("[h5log]: Invalid data, the app_name parameter is undefined.");
                    return;
                }
                this.collector.collect(this.normalizePayload(payload));
            }
        });
        Object.defineProperty(H5log.prototype, "normalizePayload", {
            enumerable: false,
            configurable: true,
            writable: true,
            value: function (payload) {
                if (!payload)
                    return payload;
                var keys = Object.keys(payload);
                return keys.reduce(function (cur, key) {
                    var data = payload[key];
                    if (typeof data === 'string') {
                        cur[key] = data;
                    }
                    else if (typeof data === 'object') {
                        try {
                            cur[key] = JSON.stringify(data);
                        }
                        catch (error) {
                            cur[key] = "[h5log]: data dropped, stringify err";
                        }
                    }
                    else {
                        cur[key] = data;
                    }
                    return cur;
                }, {});
            }
        });
        Object.defineProperty(H5log.prototype, "list", {
            get: function () {
                return this.collector.list;
            },
            enumerable: false,
            configurable: true
        });
        Object.defineProperty(H5log, "MAX_SERVER_ERROR", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: 5
        });
        Object.defineProperty(H5log, "H5logCollector", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: H5logCollector
        });
        Object.defineProperty(H5log, "H5logSender", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: H5logSender
        });
        Object.defineProperty(H5log, "H5logSenderEnv", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: SenderEnv
        });
        Object.defineProperty(H5log, "H5logSenderRegion", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: Region
        });
        return H5log;
    }());

    return H5log;

}));
