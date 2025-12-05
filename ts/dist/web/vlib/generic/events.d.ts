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
export declare class Events<M extends EventsMeta> extends Map<EventName<M>, Array<EventCallback<M, EventName<M>>>> {
    constructor();
    /** Check if an event exists. */
    has<N extends keyof M>(name: N): boolean;
    /** Get the number of registered callbacks for an event. */
    count<N extends keyof M>(name: N): number;
    /** Get an event. */
    get<N extends keyof M>(name: N): Array<EventCallback<M, N>>;
    /** Set an event. */
    set<N extends keyof M>(name: N, value: Array<EventCallback<M, N>>): this;
    /** Add an event. */
    add<N extends keyof M>(name: N, value: EventCallback<M, N>): this;
    /** Remove an event. */
    remove<N extends keyof M>(name: N, value: EventCallback<M, N>): this;
    /** Remove all events. */
    remove_all<N extends keyof M>(name: N): this;
    /**
     * Trigger all callbacks in a specific event, executing them in parallel (if the callback is async).
     * @returns A list of callback results in the order they were added, note that if a callback is async, the result will be a promise.
     */
    trigger<N extends keyof M>(name: N, ...args: EventParams<M, N>): EventResult<M, N>[];
}
