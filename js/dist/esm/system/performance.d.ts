/**
 * @author Daan van den Bergh
 * @copyright © 2024 - 2025 Daan van den Bergh. All rights reserved.
 */
/** @docs
 *  @chapter: System
 *  @title: Performance
 *  @desc: Performance measurement utility class
 */
export declare class Performance {
    private name;
    private times;
    private now;
    constructor(name?: string);
    /** @docs
     *  @title: Start
     *  @desc: Start a performance measurement
     *  @returns
     *      @type number
     *      @desc Current timestamp in milliseconds
     */
    start(): number;
    /** @docs
     *  @title: End
     *  @desc: End a performance measurement
     *  @param
     *      @name id
     *      @desc Identifier for the measurement
     *      @type string
     *  @param
     *      @name start
     *      @desc Optional start time, defaults to last recorded time
     *      @type number
     *  @returns
     *      @type number
     *      @desc Current timestamp in milliseconds
     */
    end(id: string, start?: number): number;
    /** @docs
     *  @title: Dump
     *  @desc: Print all recorded performance measurements sorted by duration
     */
    dump(filter?: (ms_performance: number) => boolean): string;
}
