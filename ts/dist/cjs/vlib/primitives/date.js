var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);
var stdin_exports = {};
__export(stdin_exports, {
  Date: () => Date
});
module.exports = __toCommonJS(stdin_exports);
class Date extends globalThis.Date {
  constructor() {
    if (arguments.length === 0) {
      super();
    } else if (arguments.length === 1) {
      const arg = arguments[0];
      if (typeof arg === "object" && arg !== null && !(arg instanceof globalThis.Date) && "year" in arg) {
        const opts = arg;
        super(opts.year !== void 0 ? opts.year : new globalThis.Date().getFullYear(), opts.month !== void 0 ? opts.month : 0, opts.date !== void 0 ? opts.date : 1, opts.hours !== void 0 ? opts.hours : 0, opts.minutes !== void 0 ? opts.minutes : 0, opts.seconds !== void 0 ? opts.seconds : 0, opts.ms !== void 0 ? opts.ms : 0);
      } else {
        super(arg);
      }
    } else {
      super(arguments[0], arguments[1], arguments[2] || 1, arguments[3] || 0, arguments[4] || 0, arguments[5] || 0, arguments[6] || 0);
    }
  }
  /**
   * Format a date object to a string using various format specifiers
   * @param {string} format - The date format string using % specifiers (e.g., %Y-%m-%d)
   * @returns {string} The formatted date string
   * @docs
   */
  format(format) {
    let formatted = "";
    for (let i = 0; i < format.length; i++) {
      if (format[i] === "%") {
        switch (format[i + 1]) {
          // %% : a literal %.
          case "%":
            formatted += "%";
            ++i;
            break;
          // %a : locale's abbreviated weekday name (e.g., Sun).
          case "a":
            formatted += new Intl.DateTimeFormat("en-US", { weekday: "short" }).format(this);
            ++i;
            break;
          // %A : locale's full weekday name (e.g., Sunday).
          case "A":
            formatted += new Intl.DateTimeFormat("en-US", { weekday: "long" }).format(this);
            ++i;
            break;
          // %b : locale's abbreviated month name (e.g., Jan); same as %h.
          // %h : locale's abbreviated month name (e.g., Jan); same as %b.
          case "b":
          case "h":
            formatted += new Intl.DateTimeFormat("en-US", { month: "short" }).format(this);
            ++i;
            break;
          // %B : locale's full month name (e.g., January).
          case "B":
            formatted += new Intl.DateTimeFormat("en-US", { month: "long" }).format(this);
            ++i;
            break;
          // %C : century; like %Y, except omit last two digits (e.g., 21).
          case "C":
            formatted += Math.floor(this.getFullYear() / 100);
            ++i;
            break;
          // %d : day of month (e.g, 01).
          case "d":
            formatted += String(this.getDate()).padStart(2, "0");
            ++i;
            break;
          // %e : day of month, space padded; same as %_d.
          case "e":
            formatted += String(this.getDate());
            ++i;
            break;
          // %D : date; same as %m/%d/%y.
          case "D":
            formatted += this.format("%m/%d/%y");
            ++i;
            break;
          // %F : full date; same as %Y-%m-%d.
          case "F":
            formatted += this.format("%Y-%m-%d");
            ++i;
            break;
          // %H : hour (00..23).
          case "H":
            formatted += String(this.getHours()).padStart(2, "0");
            ++i;
            break;
          // %I : hour (01..12).
          case "I":
            formatted += String(this.getHours() % 12 || 12).padStart(2, "0");
            ++i;
            break;
          // %j : day of year (001..366) .
          case "j":
            formatted += String(Math.floor((this.getTime() - new globalThis.Date(this.getFullYear(), 0, 0).getTime()) / (86400 * 1e3))).padStart(3, "0");
            ++i;
            break;
          // %k : hour (0..23).
          case "k":
            formatted += String(this.getHours());
            ++i;
            break;
          // %l : hour ( 1..12) .
          case "l":
            formatted += String(this.getHours() % 12 || 12);
            ++i;
            break;
          // %m : month (01..12).
          case "m":
            formatted += String(this.getMonth() + 1).padStart(2, "0");
            ++i;
            break;
          // %M : minute (00..59).
          case "M":
            formatted += String(this.getMinutes()).padStart(2, "0");
            ++i;
            break;
          // %n : a newline.
          case "n":
            formatted += "\n";
            ++i;
            break;
          // %XN : milliseconds (X: 1..3) (0..9) (00..99) (000..999).
          case "N":
            formatted += String(this.getMilliseconds()).padStart(Number(format[i + 2]) || 3, "0");
            i += 2;
            break;
          // %p : locale's equivalent of either AM or PM.
          case "p":
            formatted += new Intl.DateTimeFormat("en-US", { hour: "numeric", hour12: true }).format(this);
            ++i;
            break;
          // %P : like %p, but lower case.
          case "P":
            formatted += new Intl.DateTimeFormat("en-US", { hour: "numeric", hour12: true }).format(this).toLowerCase();
            ++i;
            break;
          // %r : locale's 12-hour clock time (e.g., 11:11:04 PM).
          case "r":
            formatted += this.format("%I:%M:%S %p");
            ++i;
            break;
          // %R : 24-hour hour and minute; same as %H:%M.
          case "R":
            formatted += this.format("%H:%M");
            ++i;
            break;
          // %s : seconds since 1970-01-01 00:00:00 UTC.
          case "s":
            formatted += Math.floor(this.getTime() / 1e3);
            ++i;
            break;
          // %S : second (00..60).
          case "S":
            formatted += String(this.getSeconds()).padStart(2, "0");
            ++i;
            break;
          // %t : a tab.
          case "t":
            formatted += "	";
            ++i;
            break;
          // %T : time; same as %H:%M:%S.
          case "T":
            formatted += this.format("%H:%M:%S");
            ++i;
            break;
          // %u : day of week (1..7); 1 is Monday.
          case "u":
            formatted += this.getDay() || 7;
            ++i;
            break;
          // %U : week number of year, with Sunday as first day of week (00..53).
          case "U":
            formatted += String(Math.ceil((this.getTime() - new globalThis.Date(this.getFullYear(), 0, 1).getTime()) / (86400 * 1e3) + 1) / 7).padStart(2, "0");
            ++i;
            break;
          // %V : ISO week number, with Monday as first day of week (01..53).
          case "V":
            const jan4 = new globalThis.Date(this.getFullYear(), 0, 4);
            const startOfWeek = new globalThis.Date(this.getFullYear(), 0, 1);
            const daysSinceJan4 = Math.floor((this.getTime() - jan4.getTime()) / (86400 * 1e3));
            const weekNumber = Math.ceil((daysSinceJan4 + jan4.getDay() + 1) / 7);
            formatted += String(weekNumber).padStart(2, "0");
            ++i;
            break;
          // %w : day of week (0..6); 0 is Sunday.
          case "w":
            formatted += this.getDay();
            ++i;
            break;
          // %W : week number of year, with Monday as first day of week (00..53).
          case "W":
            formatted += String(Math.floor((this.getTime() - new globalThis.Date(this.getFullYear(), 0, 1).getTime()) / (86400 * 1e3) + 1) / 7).padStart(2, "0");
            ++i;
            break;
          // %x : locale's date representation (e.g., 12/31/99).
          case "x":
            formatted += new Intl.DateTimeFormat("en-US").format(this);
            ++i;
            break;
          // %X : locale's time representation (e.g., 23:13:48).
          case "X":
            formatted += new Intl.DateTimeFormat("en-US", { hour: "numeric", minute: "numeric", second: "numeric" }).format(this);
            ++i;
            break;
          // %y : last two digits of year (00..99).
          case "y":
            formatted += String(this.getFullYear()).slice(-2);
            ++i;
            break;
          // %Y : Full year.
          case "Y":
            formatted += String(this.getFullYear());
            ++i;
            break;
          // %z : +hhmm numeric timezone (e.g., -0400).
          // %:z : +hh:mm numeric timezone (e.g., -04:00)
          // %::z : +hh:mm:ss numeric time zone (e.g., -04:00:00).
          // %:::z : numeric time zone with : to necessary precision (e.g., -04, +05:30).
          case ":":
          case "z":
            const timezoneOffset = this.getTimezoneOffset();
            const sign = timezoneOffset > 0 ? "-" : "+";
            const hours = String(Math.floor(Math.abs(timezoneOffset) / 60)).padStart(2, "0");
            const minutes = String(Math.abs(timezoneOffset) % 60).padStart(2, "0");
            if (format[i + 1] === "z") {
              formatted += `${sign}${hours}${minutes}`;
              i += 1;
            } else if (format[i + 2] === "z") {
              formatted += `${sign}${hours}:${minutes}`;
              i += 2;
            } else if (format[i + 3] === "z") {
              formatted += `${sign}${hours}:${minutes}:${this.format("XN")}`;
              i += 3;
            } else if (format[i + 4] === "z") {
              formatted += `${sign}${hours}:${minutes}:${this.format("XN").slice(0, 2)}`;
              i += 4;
            }
            break;
          // %Z : alphabetic time zone abbreviation (e.g., EDT).
          case "Z":
            formatted += Intl.DateTimeFormat("en-US", { timeZoneName: "short" }).format(this);
            ++i;
            break;
          // Unknown.
          default:
            formatted += format[i];
            break;
        }
      } else {
        formatted += format[i];
      }
    }
    return formatted;
  }
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
  format_locale({ locale, time_zone, show_timezone = false }) {
    const resolved_locale = locale ?? Date.detect_locale();
    const resolved_time_zone = time_zone ?? Date.detect_time_zone();
    const formatter = new Intl.DateTimeFormat(resolved_locale, {
      day: "2-digit",
      month: "2-digit",
      year: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      timeZone: resolved_time_zone
      /** @todo set `hour12` based on user's time zone. */
    });
    let formatted = formatter.format(this);
    if (show_timezone) {
      formatted = `${formatted} ${resolved_time_zone ?? "local time"}`;
    }
    return formatted;
  }
  /**
   * Detect the preferred locale of the current environment.
   *
   * - In browsers, returns `navigator.languages[0]` or `navigator.language` when available.
   * - In Node/other envs, returns `Intl.DateTimeFormat().resolvedOptions().locale` when available.
   * - Returns `undefined` if no locale can be determined.
   *
   * @returns A BCP-47 locale string (e.g. "en-US") or `undefined`.
   */
  static detect_locale() {
    if (typeof navigator !== "undefined") {
      const nav_any = navigator;
      if (Array.isArray(nav_any.languages) && nav_any.languages.length > 0) {
        const candidate = nav_any.languages[0];
        if (typeof candidate === "string" && candidate.length > 0) {
          return candidate;
        }
      }
      if (typeof nav_any.language === "string" && nav_any.language.length > 0) {
        return nav_any.language;
      }
    }
    try {
      const opts = Intl.DateTimeFormat().resolvedOptions();
      if (typeof opts.locale === "string" && opts.locale.length > 0) {
        return opts.locale;
      }
    } catch {
    }
    return void 0;
  }
  /**
   * Detect the current time zone of the environment.
   *
   * Uses `Intl.DateTimeFormat().resolvedOptions().timeZone`, which typically
   * reflects the user's local time zone (e.g. "Europe/Amsterdam").
   *
   * @returns An IANA time zone string, or `undefined` if detection fails.
   */
  static detect_time_zone() {
    try {
      const opts = Intl.DateTimeFormat().resolvedOptions();
      if (typeof opts.timeZone === "string" && opts.timeZone.length > 0) {
        return opts.timeZone;
      }
    } catch {
    }
    return void 0;
  }
  /**
   * Get the unix timestamp in milliseconds
   * @returns {number} The timestamp in milliseconds
   * @docs
   */
  msec() {
    return this.getTime();
  }
  /**
   * Get the unix timestamp in seconds
   * @returns {number} The timestamp in seconds
   * @docs
   */
  sec() {
    return Math.floor(this.getTime() / 1e3);
  }
  /**
   * Get a new date object set to the start of the current minute
   * @returns {Date} A new date object set to the start of the minute
   * @docs
   */
  minute_start() {
    const date = new Date(this.getTime());
    date.setSeconds(0);
    date.setMilliseconds(0);
    return date;
  }
  /**
   * Get a new date object set to the end of the current minute
   * @returns {Date} A new date object set to the end of the minute (59 seconds, 999 milliseconds)
   * @docs
   */
  minute_end() {
    const date = new Date(this.getTime());
    date.setSeconds(59);
    date.setMilliseconds(999);
    return date;
  }
  /**
   * Get a new date object set to the start of the current hour
   * @returns {Date} A new date object set to the start of the hour
   * @docs
   */
  hour_start() {
    const date = new Date(this.getTime());
    date.setMinutes(0, 0, 0);
    return date;
  }
  /**
   * Get a new date object set to the end of the current hour
   * @returns {Date} A new date object set to the end of the hour (59 minutes, 59 seconds, 999 milliseconds)
   * @docs
   */
  hour_end() {
    const date = new Date(this.getTime());
    date.setMinutes(59, 59, 999);
    return date;
  }
  /**
   * Get a new date object set to the start of the current day
   * @returns {Date} A new date object set to the start of the day
   * @docs
   */
  day_start() {
    const date = new Date(this.getTime());
    date.setHours(0, 0, 0, 0);
    return date;
  }
  /**
   * Get a new date object set to the end of the current day
   * @returns {Date} A new date object set to the end of the day (23:59:59.999)
   * @docs
   */
  day_end() {
    const date = new Date(this.getTime());
    date.setHours(23, 59, 59, 999);
    return date;
  }
  /**
   * Get a new date object set to the start of the current week
   * @param {boolean} sunday_start - Whether to use Sunday (true) or Monday (false) as the start of the week
   * @returns {Date} A new date object set to the start of the week
   * @docs
   */
  week_start(sunday_start = true) {
    const diff = (this.getDay() + 7 - (sunday_start ? 0 : 1)) % 7;
    const date = new Date(this.getTime());
    date.setDate(this.getDate() - diff);
    date.setHours(0, 0, 0, 0);
    return date;
  }
  /**
   * Get a new date object set to the end of the current week
   * @param {boolean} sunday_start - Whether to use Sunday (true) or Monday (false) as the start of the week
   * @returns {Date} A new date object set to the end of the week (last day at 23:59:59.999)
   * @docs
   */
  week_end(sunday_start = true) {
    const diff = (this.getDay() + 7 - (sunday_start ? 0 : 1)) % 7;
    const date = new Date(this.getTime());
    date.setDate(this.getDate() + (6 - diff));
    date.setHours(23, 59, 59, 999);
    return date;
  }
  /**
   * Get a new date object set to the start of the current month
   * @returns {Date} A new date object set to the start of the month
   * @docs
   */
  month_start() {
    const date = new Date(this.getTime());
    date.setDate(1);
    date.setHours(0, 0, 0, 0);
    return date;
  }
  /**
   * Get a new date object set to the end of the current month
   * @returns {Date} A new date object set to the end of the month (last day at 23:59:59.999)
   * @docs
   */
  month_end() {
    const date = new Date(this.getTime());
    date.setMonth(date.getMonth() + 1, 0);
    date.setHours(23, 59, 59, 999);
    return date;
  }
  /**
   * Get a new date object set to the start of the current quarter
   * @returns {Date} A new date object set to the start of the quarter
   * @docs
   */
  quarter_year_start() {
    const date = new Date(this.getTime());
    const month = date.getMonth() + 1;
    if (month > 9) {
      date.setMonth(9 - 1, 1);
    } else if (month > 6) {
      date.setMonth(6 - 1, 1);
    } else if (month > 3) {
      date.setMonth(3 - 1, 1);
    } else {
      date.setMonth(0, 1);
    }
    date.setHours(0, 0, 0, 0);
    return date;
  }
  /**
   * Get a new date object set to the end of the current quarter
   * @returns {Date} A new date object set to the end of the quarter (last day at 23:59:59.999)
   * @docs
   */
  quarter_year_end() {
    const date = new Date(this.getTime());
    const month = date.getMonth() + 1;
    if (month > 9) {
      date.setMonth(11, 31);
    } else if (month > 6) {
      date.setMonth(8, 30);
    } else if (month > 3) {
      date.setMonth(5, 30);
    } else {
      date.setMonth(2, 31);
    }
    date.setHours(23, 59, 59, 999);
    return date;
  }
  /**
   * Get a new date object set to the start of the current half year
   * @returns {Date} A new date object set to the start of the half year
   * @docs
   */
  half_year_start() {
    const date = new Date(this.getTime());
    if (date.getMonth() + 1 > 6) {
      date.setMonth(5, 1);
    } else {
      date.setMonth(0, 1);
    }
    date.setHours(0, 0, 0, 0);
    return date;
  }
  /**
   * Get a new date object set to the end of the current half year
   * @returns {Date} A new date object set to the end of the half year (last day at 23:59:59.999)
   * @docs
   */
  half_year_end() {
    const date = new Date(this.getTime());
    if (date.getMonth() + 1 > 6) {
      date.setMonth(11, 31);
    } else {
      date.setMonth(5, 30);
    }
    date.setHours(23, 59, 59, 999);
    return date;
  }
  /**
   * Get a new date object set to the start of the current year
   * @returns {Date} A new date object set to the start of the year
   * @docs
   */
  year_start() {
    const date = new Date(this.getTime());
    date.setMonth(0, 1);
    date.setHours(0, 0, 0, 0);
    return date;
  }
  /**
   * Get a new date object set to the end of the current year
   * @returns {Date} A new date object set to the end of the year (December 31st at 23:59:59.999)
   * @docs
   */
  year_end() {
    const date = new Date(this.getTime());
    date.setMonth(11, 31);
    date.setHours(23, 59, 59, 999);
    return date;
  }
  /**
   * Create a new date incremented by the specified amounts
   * @param {IncrementOptions} options - Object containing increment values for various time units
   * @returns {Date} A new date object incremented by the specified amounts
   * @docs
   */
  increment({ seconds = 0, minutes = 0, hours = 0, days = 0, weeks = 0, months = 0, years = 0 }) {
    const date = new Date(this.getTime());
    if (seconds > 0)
      date.setSeconds(date.getSeconds() + seconds);
    if (minutes > 0)
      date.setMinutes(date.getMinutes() + minutes);
    if (hours > 0)
      date.setHours(date.getHours() + hours);
    if (days > 0 || weeks > 0)
      date.setDate(date.getDate() + days + weeks * 7);
    if (months > 0)
      date.setMonth(date.getMonth() + months);
    if (years > 0)
      date.setFullYear(date.getFullYear() + years);
    return date;
  }
  /**
   * Create a new date decremented by the specified amounts
   * @param {IncrementOptions} options - Object containing decrement values for various time units
   * @returns {Date} A new date object decremented by the specified amounts
   * @docs
   */
  decrement({ seconds = 0, minutes = 0, hours = 0, days = 0, weeks = 0, months = 0, years = 0 }) {
    const date = new Date(this.getTime());
    if (seconds > 0)
      date.setSeconds(date.getSeconds() - seconds);
    if (minutes > 0)
      date.setMinutes(date.getMinutes() - minutes);
    if (hours > 0)
      date.setHours(date.getHours() - hours);
    if (days > 0 || weeks > 0)
      date.setDate(date.getDate() - (days + weeks * 7));
    if (months > 0)
      date.setMonth(date.getMonth() - months);
    if (years > 0)
      date.setFullYear(date.getFullYear() - years);
    return date;
  }
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  Date
});
