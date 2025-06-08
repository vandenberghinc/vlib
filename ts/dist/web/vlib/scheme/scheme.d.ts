/**
 * @author Daan van den Bergh
 * @copyright © 2024 - 2025 Daan van den Bergh. All rights reserved.
 */
import { Entry } from "./entry.js";
/**
 * Scheme object.
 * Mainly to initialize all nested schemes.
 */
export declare class Scheme extends Map<string, Entry> {
    /** Initialize a scheme object. */
    constructor(
    /** The scheme to initialize. */
    scheme: Record<string, Entry | Entry.Opts>, 
    /**
     * The parent scheme.
     * When defined with parent_key then the attribute under this key will be replaced with the new scheme instance.
     * This is useful subsequent requests from cached objects.
     * For example when validating volt endpoint parameters.
     */
    parent?: object, 
    /** The key under which the entry is listed. */
    parent_key?: string);
    /**
     * A map of aliases. Is initialized be initialized on demand.
     */
    get aliases(): Map<string, Entry>;
    private _aliases?;
}
export declare namespace Scheme {
    /**
     * Type options.
     * Dont add `Entry` to this, even though it is a valid type.
     * We do this to keep the `Scheme.Opts` type inferrable.
     * @warning Never change this.
     *          If the user really needs the `Entry` type, they can use the
     *          constructor type or just invoke the constructor on that opts object.
     */
    type Opts = Record<string, Entry.Opts>;
}
