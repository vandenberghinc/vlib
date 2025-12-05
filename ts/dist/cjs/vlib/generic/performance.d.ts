/**
 * @author Daan van den Bergh
 * @copyright © 2024 - 2025 Daan van den Bergh. All rights reserved.
 */
/**
 * Performance measurement utility class
 * @docs
 */
export declare class Performance {
    private name;
    private times;
    private now;
    /**
     * Create a new Performance measurement utility.
     * @param name Optional name for this performance tracker.
     * @docs
     */
    constructor(name?: string);
    /**
     * Start a performance measurement
     * @returns Current timestamp in milliseconds
     * @docs
     */
    start(): number;
    /**
     * End a performance measurement
     * @param id Identifier for the measurement
     * @param start Optional start time, defaults to last recorded time
     * @returns Current timestamp in milliseconds
     * @docs
     */
    end(id: string, start?: number): number;
    /**
     * Print all recorded performance measurements sorted by duration
     * @docs
     */
    dump(filter?: (ms_performance: number) => boolean): string;
}
