var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);
var stdin_exports = {};
__export(stdin_exports, {
  Events: () => Events
});
module.exports = __toCommonJS(stdin_exports);
class Events extends Map {
  /** A set of events that should only have a single callback. */
  single_events;
  constructor(opts) {
    super();
    this.single_events = new Set(opts?.single_events ?? []);
  }
  /** Check if an event exists. */
  has(name) {
    return super.has(name);
  }
  /** Get the number of registered callbacks for an event. */
  count(name) {
    return super.get(name)?.length ?? 0;
  }
  /**
   * Get the callback(s) for an event.
   * If the event is a single event, it will always return an array with max 1 callback.
   */
  get(name) {
    return super.get(name) ?? [];
  }
  /** Set an event. */
  set(name, value) {
    if (this.single_events.has(name) && value.length > 1) {
      throw new Error(`Event "${String(name)}" is a single event and cannot have multiple callbacks.`);
    }
    super.set(name, value);
    return this;
  }
  /** Add an event. */
  add(name, value) {
    if (this.single_events.has(name)) {
      super.set(name, [value]);
      return this;
    }
    let callbacks = super.get(name);
    if (callbacks === void 0) {
      callbacks = [];
      this.set(name, callbacks);
    }
    callbacks.push(value);
    return this;
  }
  /** Remove an event. */
  remove(name, value) {
    const callbacks = super.get(name);
    if (callbacks !== void 0) {
      const index = callbacks.indexOf(value);
      if (index !== -1) {
        callbacks.splice(index, 1);
      }
    }
    return this;
  }
  /** Remove all events. */
  remove_all(name) {
    super.delete(name);
    return this;
  }
  /**
   * Trigger all callbacks in a specific event, executing them in parallel (if the callback is async).
   * @returns A list of callback results in the order they were added, note that if a callback is async, the result will be a promise.
   */
  trigger(name, ...args) {
    const callbacks = super.get(name);
    const results = [];
    if (callbacks != null) {
      for (const callback of callbacks) {
        results.push(callback(...args));
      }
    }
    return results;
  }
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  Events
});
