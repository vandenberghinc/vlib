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
 */
export type EventsMeta = Record<string, (...args: any) => any>;

/** Event name. */
export type EventName<M extends EventsMeta> = keyof M;

/** Event callback. */
export type EventCallback<M extends EventsMeta, N extends keyof M> = M[N];

/** Event parameters. */
export type EventParams<M extends EventsMeta, N extends keyof M> = Parameters<M[N]>;

/** Event result type. */
export type EventResult<M extends EventsMeta, N extends keyof M> = ReturnType<M[N]>;

/** A map of events. */
export class Events<M extends EventsMeta> extends Map<EventName<M>, Array<EventCallback<M, EventName<M>>>> {
    constructor() {
        super();
    }
    /** Check if an event exists. */
    has<N extends keyof M>(name: N): boolean {
        return super.has(name);
    }
    /** Get the number of registered callbacks for an event. */
    count<N extends keyof M>(name: N): number {
        return super.get(name)?.length ?? 0;
    }
    /** Get an event. */
    get<N extends keyof M>(name: N): Array<EventCallback<M, N>> {
        return (super.get(name) ?? []) as Array<EventCallback<M, N>>;
    }
    /** Set an event. */
    set<N extends keyof M>(name: N, value: Array<EventCallback<M, N>>): this {
        super.set(name, value);
        return this;
    }
    /** Add an event. */
    add<N extends keyof M>(name: N, value: EventCallback<M, N>): this {
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
        if (callbacks !== undefined) {
            for (const callback of callbacks) {
                results.push(callback(...args));
            }
        }
        return results;
    }
}