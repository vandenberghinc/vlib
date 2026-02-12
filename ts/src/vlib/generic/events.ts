/**
 * @author Daan van den Bergh
 * @copyright © 2022 - 2025 Daan van den Bergh.
 */

/**
 * A type map of all events and their callback types.
 * @example
 * ```ts
 * type EventsMeta = {
 *   'data': (data: string) => void;
 *   'error': (error: Error) => void;
 * }
 * ```
 * @nav Events
 * @docs
 */
export type EventsMeta = Record<string, (...args: any) => any>;

/**
 * Event name.
 * @nav Events
 * @docs
 */
export type EventName<M extends EventsMeta> = keyof M;

/**
 * Event callback.
 * @nav Events
 * @docs
 */
export type EventCallback<M extends EventsMeta, N extends keyof M> = M[N];

/**
 * Event parameters.
 * @nav Events
 * @docs
 */
export type EventParams<M extends EventsMeta, N extends keyof M> = Parameters<M[N]>;

/**
 * Event result type.
 * @nav Events
 * @docs
 */
export type EventResult<M extends EventsMeta, N extends keyof M> = ReturnType<M[N]>;

/**
 * Create a map of events.
 * @example
 * ```ts
 * const events = new Events<{
 *   'data': (data: string) => void;
 *   'error': (error: Error) => void;
 * }>();
 * events.add("data", (data) => {
 *   console.log("Data received:", data);
 * });
 * events.add("error", (error) => {
 *   console.error("Error occurred:", error);
 * });
 * ...
 * events.trigger("data", "Hello World!");
 * ```
 * @nav Events
 * @docs
 */
export class Events<M extends EventsMeta> extends Map<EventName<M>, Array<EventCallback<M, EventName<M>>>> {

    /** A set of events that should only have a single callback. */
    private single_events: Set<EventName<M>>;

    constructor(opts?: {
        /**
         * A list of events that should only have a single callback.
         * If a callback is added to a single event that already has a callback, it will replace the existing callback.
         */
        single_events?: EventName<M>[];
    }) {
        super();
        this.single_events = new Set(opts?.single_events ?? []);
    }
    /** Check if an event exists. */
    has<N extends keyof M>(name: N): boolean {
        return super.has(name);
    }
    /** Get the number of registered callbacks for an event. */
    count<N extends keyof M>(name: N): number {
        return super.get(name)?.length ?? 0;
    }
    /**
     * Get the callback(s) for an event.
     * If the event is a single event, it will always return an array with max 1 callback.
     */
    get<N extends keyof M>(name: N): EventCallback<M, N>[] {
        return (super.get(name) ?? []) as EventCallback<M, N>[];
    }
    /** Set an event. */
    set<N extends keyof M>(name: N, value: EventCallback<M, N>[]): this {
        if (this.single_events.has(name) && value.length > 1) {
            throw new Error(`Event "${String(name)}" is a single event and cannot have multiple callbacks.`);
        }
        super.set(name, value);
        return this;
    }
    /** Add an event. */
    add<N extends keyof M>(name: N, value: EventCallback<M, N>): this {
        if (this.single_events.has(name)) {
            super.set(name, [value]);
            return this;
        }
        let callbacks = super.get(name);
        if (callbacks === undefined) {
            callbacks = [];
            this.set(name, callbacks);
        }
        callbacks.push(value);
        return this;
    }
    /** Remove an event. */
    remove<N extends keyof M>(name: N, value: EventCallback<M, N>): this {
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
    remove_all<N extends keyof M>(name: N): this {
        super.delete(name);
        return this;
    }
    /**
     * Trigger all callbacks in a specific event, executing them in parallel (if the callback is async).
     * @returns A list of callback results in the order they were added, note that if a callback is async, the result will be a promise.
     */
    trigger<N extends keyof M>(name: N, ...args: EventParams<M, N>): EventResult<M, N>[] {
        const callbacks = super.get(name);
        const results: EventResult<M, N>[] = [];
        if (callbacks != null) {
            for (const callback of callbacks) {
                results.push(callback(...args));
            }
        }
        return results;
    }
}