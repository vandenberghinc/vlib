/**
 * @author Daan van den Bergh
 * @copyright © 2024 - 2025 Daan van den Bergh. All rights reserved.
 */
/**
 * Options for incrementing or decrementing date values
 */
interface IncrementOptions {
    /** Number of seconds to add or subtract */
    seconds?: number;
    /** Number of minutes to add or subtract */
    minutes?: number;
    /** Number of hours to add or subtract */
    hours?: number;
    /** Number of days to add or subtract */
    days?: number;
    /** Number of weeks to add or subtract */
    weeks?: number;
    /** Number of months to add or subtract */
    months?: number;
    /** Number of years to add or subtract */
    years?: number;
}
/**
 * Options for constructing a Date object with named parameters
 */
interface DateConstructorOptions {
    /** The year value (e.g., 2024) */
    year?: number;
    /** The month value (0-11, where 0 is January) */
    month?: number;
    /** The day of the month (1-31) */
    date?: number;
    /** The hour value (0-23) */
    hours?: number;
    /** The minute value (0-59) */
    minutes?: number;
    /** The second value (0-59) */
    seconds?: number;
    /** The millisecond value (0-999) */
    ms?: number;
}
/**
 * A wrapper around the global Date object that extends its functionality.
 */
export declare class Date extends globalThis.Date {
    /** Constructors. */
    constructor();
    constructor(value: number | string);
    constructor(valueOfDate: globalThis.Date | Date);
    constructor(options: DateConstructorOptions);
    constructor(year: number, month: number, date?: number, hours?: number, minutes?: number, seconds?: number, ms?: number);
    constructor(valueOrYearOrOptions?: string | number | globalThis.Date | DateConstructorOptions, month?: number, date?: number, hours?: number, minutes?: number, seconds?: number, ms?: number);
    /**
     * Format a date object to a string using various format specifiers
     * @param {string} format - The date format string using % specifiers (e.g., %Y-%m-%d)
     * @returns {string} The formatted date string
     * @docs
     */
    format(format: string): string;
    /**
     * Format a UNIX timestamp (in seconds) as a locale-aware date/time string.
     *
     * - In browsers, `locale` and `time_zone` default to the user's settings
     *   (`navigator.language` / `navigator.languages` and the browser's time zone).
     * - In Node or other environments, defaults come from the runtime's Intl config.
     *
     * @param unix_seconds  UNIX timestamp in **seconds** since epoch.
     * @param locale        Optional BCP-47 locale (e.g. "en-US", "nl-NL").
     * @param time_zone     Optional IANA time zone (e.g. "Europe/Amsterdam").
     */
    format_locale({ locale, time_zone, show_timezone, }: {
        locale?: string;
        time_zone?: string;
        show_timezone?: boolean;
    }): string;
    /**
     * Detect the preferred locale of the current environment.
     *
     * - In browsers, returns `navigator.languages[0]` or `navigator.language` when available.
     * - In Node/other envs, returns `Intl.DateTimeFormat().resolvedOptions().locale` when available.
     * - Returns `undefined` if no locale can be determined.
     *
     * @returns A BCP-47 locale string (e.g. "en-US") or `undefined`.
     */
    static detect_locale(): string | undefined;
    /**
     * Detect the current time zone of the environment.
     *
     * Uses `Intl.DateTimeFormat().resolvedOptions().timeZone`, which typically
     * reflects the user's local time zone (e.g. "Europe/Amsterdam").
     *
     * @returns An IANA time zone string, or `undefined` if detection fails.
     */
    static detect_time_zone(): string | undefined;
    /**
     * Get the unix timestamp in milliseconds
     * @returns {number} The timestamp in milliseconds
     * @docs
     */
    msec(): number;
    /**
     * Get the unix timestamp in seconds
     * @returns {number} The timestamp in seconds
     * @docs
     */
    sec(): number;
    /**
     * Get a new date object set to the start of the current minute
     * @returns {Date} A new date object set to the start of the minute
     * @docs
     */
    minute_start(): Date;
    /**
     * Get a new date object set to the end of the current minute
     * @returns {Date} A new date object set to the end of the minute (59 seconds, 999 milliseconds)
     * @docs
     */
    minute_end(): Date;
    /**
     * Get a new date object set to the start of the current hour
     * @returns {Date} A new date object set to the start of the hour
     * @docs
     */
    hour_start(): Date;
    /**
     * Get a new date object set to the end of the current hour
     * @returns {Date} A new date object set to the end of the hour (59 minutes, 59 seconds, 999 milliseconds)
     * @docs
     */
    hour_end(): Date;
    /**
     * Get a new date object set to the start of the current day
     * @returns {Date} A new date object set to the start of the day
     * @docs
     */
    day_start(): Date;
    /**
     * Get a new date object set to the end of the current day
     * @returns {Date} A new date object set to the end of the day (23:59:59.999)
     * @docs
     */
    day_end(): Date;
    /**
     * Get a new date object set to the start of the current week
     * @param {boolean} sunday_start - Whether to use Sunday (true) or Monday (false) as the start of the week
     * @returns {Date} A new date object set to the start of the week
     * @docs
     */
    week_start(sunday_start?: boolean): Date;
    /**
     * Get a new date object set to the end of the current week
     * @param {boolean} sunday_start - Whether to use Sunday (true) or Monday (false) as the start of the week
     * @returns {Date} A new date object set to the end of the week (last day at 23:59:59.999)
     * @docs
     */
    week_end(sunday_start?: boolean): Date;
    /**
     * Get a new date object set to the start of the current month
     * @returns {Date} A new date object set to the start of the month
     * @docs
     */
    month_start(): Date;
    /**
     * Get a new date object set to the end of the current month
     * @returns {Date} A new date object set to the end of the month (last day at 23:59:59.999)
     * @docs
     */
    month_end(): Date;
    /**
     * Get a new date object set to the start of the current quarter
     * @returns {Date} A new date object set to the start of the quarter
     * @docs
     */
    quarter_year_start(): Date;
    /**
     * Get a new date object set to the end of the current quarter
     * @returns {Date} A new date object set to the end of the quarter (last day at 23:59:59.999)
     * @docs
     */
    quarter_year_end(): Date;
    /**
     * Get a new date object set to the start of the current half year
     * @returns {Date} A new date object set to the start of the half year
     * @docs
     */
    half_year_start(): Date;
    /**
     * Get a new date object set to the end of the current half year
     * @returns {Date} A new date object set to the end of the half year (last day at 23:59:59.999)
     * @docs
     */
    half_year_end(): Date;
    /**
     * Get a new date object set to the start of the current year
     * @returns {Date} A new date object set to the start of the year
     * @docs
     */
    year_start(): Date;
    /**
     * Get a new date object set to the end of the current year
     * @returns {Date} A new date object set to the end of the year (December 31st at 23:59:59.999)
     * @docs
     */
    year_end(): Date;
    /**
     * Create a new date incremented by the specified amounts
     * @param {IncrementOptions} options - Object containing increment values for various time units
     * @returns {Date} A new date object incremented by the specified amounts
     * @docs
     */
    increment({ seconds, minutes, hours, days, weeks, months, years }: IncrementOptions): Date;
    /**
     * Create a new date decremented by the specified amounts
     * @param {IncrementOptions} options - Object containing decrement values for various time units
     * @returns {Date} A new date object decremented by the specified amounts
     * @docs
     */
    decrement({ seconds, minutes, hours, days, weeks, months, years }: IncrementOptions): Date;
}
export {};
