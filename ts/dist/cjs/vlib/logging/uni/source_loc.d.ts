/**
 * @author Daan van den Bergh
 * @copyright © 2024 - 2025 Daan van den Bergh. All rights reserved.
 */
/**
 * Source location.
 * @note Accessible in the frontend web library as well.
 * @nav Logging
 * @docs
 */
export declare class SourceLoc {
    /** Attributes. */
    file: string | "<unknown>";
    filename: string | "<unknown>";
    line: number | "?";
    column: number | "?";
    caller: string | "<unknown>" | "<root>" | "<anonymous>";
    id: string | "<unknown>:?:?";
    abs_id: string | "<unknown>:?:?";
    private adjust;
    /**
     * Constructor.
     * @docs
     */
    constructor(adjust?: number);
    /** Helpers. */
    private _captureWithCallSite;
    private _captureWithStackString;
    /**
     * Is unknown.
     * @docs
     */
    is_unknown(): boolean;
    /** Assign as unknown. */
    private _as_unknown;
}
