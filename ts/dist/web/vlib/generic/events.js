/**
 * @author Daan van den Bergh
 * @copyright © 2022 - 2025 Daan van den Bergh.
 */
/** A map of events. */
export class Events extends Map {
    constructor() {
        super();
    }
    /** Check if an event exists. */
    has(name) {
        return super.has(name);
    }
    /** Get the number of registered callbacks for an event. */
    count(name) {
        return super.get(name)?.length ?? 0;
    }
    /** Get an event. */
    get(name) {
        return (super.get(name) ?? []);
    }
    /** Set an event. */
    set(name, value) {
        super.set(name, value);
        return this;
    }
    /** Add an event. */
    add(name, value) {
        let callbacks = super.get(name);
        if (callbacks === undefined) {
            callbacks = [];
            this.set(name, callbacks);
        }
        callbacks.push(value);
        return this;
    }
    /** Remove an event. */
    remove(name, value) {
        const callbacks = super.get(name);
        if (callbacks !== undefined) {
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
        if (callbacks !== undefined) {
            for (const callback of callbacks) {
                results.push(callback(...args));
            }
        }
        return results;
    }
}
//# sourceMappingURL=events.js.map