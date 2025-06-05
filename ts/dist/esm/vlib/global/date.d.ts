/**
 * @author Daan van den Bergh
 * @copyright © 2024 - 2025 Daan van den Bergh. All rights reserved.
 */
interface IncrementOptions {
    seconds?: number;
    minutes?: number;
    hours?: number;
    days?: number;
    weeks?: number;
    months?: number;
    years?: number;
}
/**
 * {Date}
 *
 * A wrapper around the global Date object that extends its functionality.
 */
export declare class Date extends globalThis.Date {
    /** Constructors. */
    constructor();
    constructor(value: number | string);
    constructor(valueOfDate: globalThis.Date | Date);
    constructor(year: number, month: number, date?: number, hours?: number, minutes?: number, seconds?: number, ms?: number);
    constructor(valueOrYear?: string | number | globalThis.Date, month?: number, date?: number, hours?: number, minutes?: number, seconds?: number, ms?: number);
    /** @docs
     *  @title Format
     *  @desc Format a date object to a string using various format specifiers
     *  @param
     *      @name format
     *      @desc The date format string using % specifiers (e.g., %Y-%m-%d)
     *      @type string
     *  @returns
     *      @type string
     *      @desc The formatted date string
     */
    format(format: string): string;
    /** @docs
     *  @title Milliseconds
     *  @desc Get the timestamp in milliseconds
     *  @returns
     *      @type number
     *      @desc The timestamp in milliseconds
     */
    msec(): number;
    /** @docs
     *  @title Seconds
     *  @desc Get the timestamp in seconds
     *  @returns
     *      @type number
     *      @desc The timestamp in seconds
     */
    sec(): number;
    /** @docs
     *  @title Minute start
     *  @desc Get a new date object set to the start of the current minute
     *  @returns
     *      @type Date
     *      @desc A new date object set to the start of the minute
     */
    minute_start(): Date;
    /** @docs
     *  @title Hour start
     *  @desc Get a new date object set to the start of the current hour
     *  @returns
     *      @type Date
     *      @desc A new date object set to the start of the hour
     */
    hour_start(): Date;
    /** @docs
     *  @title Day start
     *  @desc Get a new date object set to the start of the current day
     *  @returns
     *      @type Date
     *      @desc A new date object set to the start of the day
     */
    day_start(): Date;
    /** @docs
     *  @title Week start
     *  @desc Get a new date object set to the start of the current week
     *  @param
     *      @name sunday_start
     *      @desc Whether to use Sunday (true) or Monday (false) as the start of the week
     *      @type boolean
     *  @returns
     *      @type Date
     *      @desc A new date object set to the start of the week
     */
    week_start(sunday_start?: boolean): Date;
    /** @docs
     *  @title Month start
     *  @desc Get a new date object set to the start of the current month
     *  @returns
     *      @type Date
     *      @desc A new date object set to the start of the month
     */
    month_start(): Date;
    /** @docs
     *  @title Quarter year start
     *  @desc Get a new date object set to the start of the current quarter
     *  @returns
     *      @type Date
     *      @desc A new date object set to the start of the quarter
     */
    quarter_year_start(): Date;
    /** @docs
     *  @title Half year start
     *  @desc Get a new date object set to the start of the current half year
     *  @returns
     *      @type Date
     *      @desc A new date object set to the start of the half year
     */
    half_year_start(): Date;
    /** @docs
     *  @title Year start
     *  @desc Get a new date object set to the start of the current year
     *  @returns
     *      @type Date
     *      @desc A new date object set to the start of the year
     */
    year_start(): Date;
    /** @docs
     *  @title Increment date
     *  @desc Create a new date incremented by the specified amounts
     *  @param
     *      @name options
     *      @desc Object containing increment values
     *      @type IncrementOptions
     *  @returns
     *      @type Date
     *      @desc A new date object incremented by the specified amounts
     */
    increment({ seconds, minutes, hours, days, weeks, months, years }: IncrementOptions): Date;
    /** @docs
     *  @title Decrement date
     *  @desc Create a new date decremented by the specified amounts
     *  @param
     *      @name options
     *      @desc Object containing decrement values
     *      @type IncrementOptions
     *  @returns
     *      @type Date
     *      @desc A new date object decremented by the specified amounts
     */
    decrement({ seconds, minutes, hours, days, weeks, months, years }: IncrementOptions): Date;
}
export {};
