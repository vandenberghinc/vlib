/**
 * @author Daan van den Bergh
 * @copyright © 2024 - 2025 Daan van den Bergh. All rights reserved.
 */
declare namespace ObjectUtils {
    /**
     * Expands object x with properties from object y.
     * Modifies x in place and returns it.
     * @param x The target object to expand.
     * @param y The source object with properties to add to x.
     * @returns The expanded object x.
     */
    function expand<T extends object, U extends object>(x: T, y: U): T & U;
    /**
     * Performs a deep equality check between two values.
     * @param x The first value to compare.
     * @param y The second value to compare.
     * @returns True if x and y are deeply equal, false otherwise.
     */
    function eq(x: any, y: any): boolean;
    /**
     * Detects changed keys between two objects.
     * @param x The original object.
     * @param y The modified object.
     * @param include_nested Whether to include nested changed keys.
     * @returns An array of changed keys or null if no changes.
     */
    function detect_changes(x: any, y: any, include_nested?: boolean): string[] | null;
    /**
     * Renames keys in an object.
     * @param obj The object to rename keys in.
     * @param rename An array of [oldKey, newKey] pairs.
     * @param remove An array of keys to remove from the object.
     * @returns The modified object.
     */
    function rename_keys(obj: Record<string, any>, rename?: [string, string][], remove?: string[]): Record<string, any>;
    /**
     * Performs a deep copy of an object.
     * Does not support classes, only primitive objects.
     * @param obj The object to deep copy.
     * @returns A deep copy of the object.
     */
    function deep_copy<T>(obj: T): T;
    /**
     * Deletes keys from an object recursively, including nested objects and arrays.
     * @param obj The object to modify.
     * @param remove_keys An array of keys to remove.
     * @returns The modified object.
     */
    function delete_recursively<T>(obj: T, remove_keys?: string[]): T;
    /**
     * Create a partial copy of an object with only the specified keys.
     */
    function partial_copy<T extends object, K extends keyof T>(obj: T, keys: K[]): Pick<T, K>;
}
export { ObjectUtils as Object };
