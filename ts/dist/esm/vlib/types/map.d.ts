/**
 * @author Daan van den Bergh
 * @copyright © 2024 - 2025 Daan van den Bergh. All rights reserved.
 */
/** Types for default `Map` class. */
export declare namespace Map {
    /**
     * Extracts the value type from a Map.
     *
     * @template M - A Map whose value type you want to extract.
     * @example
     *   type MyMap   = Map<string, number>;
     *   type ValueOf = MapValue<MyMap>; // number
     */
    type Value<M extends Map<any, any>> = M extends Map<any, infer V> ? V : never;
    /**
     * Extracts the key type from a Map.
     *
     * @template M - A Map whose key type you want to extract.
     * @example
     *   type MyMap = Map<string, number>;
     *   type KeyOf = MapKey<MyMap>; // string
     */
    type Key<M extends Map<any, any>> = M extends Map<infer K, any> ? K : never;
}
export { Map as map };
