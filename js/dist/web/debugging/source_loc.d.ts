/**
 * @author Daan van den Bergh
 * @copyright © 2024 - 2025 Daan van den Bergh. All rights reserved.
 */
/**
 * Source location.
 * @note Accessable in the frontend web library as well.
 */
export declare class SourceLoc {
    file: string | "<unknown>";
    filename: string | "<unknown>";
    line: number | "?";
    column: number | "?";
    caller: string | "<unknown>" | "<root>" | "<anonymous>";
    id: string | "<unknown>:?:?";
    abs_id: string | "<unknown>:?:?";
    private adjust;
    constructor(adjust?: number);
    private _captureWithCallSite;
    private _captureWithStackString;
    /** Is unknown. */
    is_unknown(): boolean;
    /** Assign as unknown. */
    private _as_unknown;
}
