/*
 * Author: Daan van den Bergh
 * Copyright: © 2022 - 2023 Daan van den Bergh.
 */

// The date class.
/*  @docs:
    @chapter: Types
    @title: Date
    @desc: The date class.
*/
vlib.Date = class D extends Date {
    
    // Constructor.
    constructor(...args) {
        super(...args);
        // if (args.length === 2 && typeof args[0] === "string" && typeof args[1] === "string") {
        //     console.log(args, libdatefns.parse(args[0], args[1], new Date()))
        //     // super(libmoment(args[0], args[1]).toDate());
        //     super(libdatefns.parse(args[0], args[1], new Date()).getTime())
        // } else {
        // }
    }

    // Format.
    /*  @docs:
        @title: Format
        @desc: Format a date object to a string.
        @param:
            @name: format
            @desc: The date format as string.
    */
    format(format) {
        let formatted = "";
        for (let i = 0; i < format.length; i++) {
            if (format[i] === "%") {
                switch (format[i + 1]) {
                    // %% : a literal %.
                    case '%':
                        formatted += "%";
                        ++i;
                        break;

                    // %a : locale’s abbreviated weekday name (e.g., Sun).
                    case 'a':
                        formatted += new Intl.DateTimeFormat('en-US', { weekday: 'short' }).format(this);
                        ++i;
                        break;

                    // %A : locale’s full weekday name (e.g., Sunday).
                    case 'A':
                        formatted += new Intl.DateTimeFormat('en-US', { weekday: 'long' }).format(this);
                        ++i;
                        break;

                    // %b : locale’s abbreviated month name (e.g., Jan); same as %h.
                    // %h : locale’s abbreviated month name (e.g., Jan); same as %b.
                    case 'b':
                    case 'h':
                        formatted += new Intl.DateTimeFormat('en-US', { month: 'short' }).format(this);
                        ++i;
                        break;

                    // %B : locale’s full month name (e.g., January).
                    case 'B':
                        formatted += new Intl.DateTimeFormat('en-US', { month: 'long' }).format(this);
                        ++i;
                        break;

                    // %C : century; like %Y, except omit last two digits (e.g., 21).
                    case 'C':
                        formatted += Math.floor(this.getFullYear() / 100);
                        ++i;
                        break;

                    // %d : day of month (e.g, 01).
                    case 'd':
                        formatted += String(this.getDate()).padStart(2, '0');
                        ++i;
                        break;

                    // %e : day of month, space padded; same as %_d.
                    case 'e':
                        formatted += String(this.getDate());
                        ++i;
                        break;

                    // %D : date; same as %m/%d/%y.
                    case 'D':
                        formatted += this.format("%m/%d/%y");
                        ++i;
                        break;

                    // %F : full date; same as %Y-%m-%d.
                    case 'F':
                        formatted += this.format("%Y-%m-%d");
                        ++i;
                        break;

                    // %H : hour (00..23).
                    case 'H':
                        formatted += String(this.getHours()).padStart(2, '0');
                        ++i;
                        break;

                    // %I : hour (01..12).
                    case 'I':
                        formatted += String((this.getHours() % 12) || 12).padStart(2, '0');
                        ++i;
                        break;

                    // %j : day of year (001..366) .
                    case 'j':
                        formatted += String(
                            Math.floor((this - new Date(this.getFullYear(), 0, 0)) / (86400 * 1000))
                        ).padStart(3, '0');
                        ++i;
                        break;

                    // %k : hour (0..23).
                    case 'k':
                        formatted += String(this.getHours());
                        ++i;
                        break;

                    // %l : hour ( 1..12) .
                    case 'l':
                        formatted += String((this.getHours() % 12) || 12);
                        ++i;
                        break;

                    // %m : month (01..12).
                    case 'm':
                        formatted += String(this.getMonth() + 1).padStart(2, '0');
                        ++i;
                        break;

                    // %M : minute (00..59).
                    case 'M':
                        formatted += String(this.getMinutes()).padStart(2, '0');
                        ++i;
                        break;

                    // %n : a newline.
                    case 'n':
                        formatted += "\n";
                        ++i;
                        break;

                    // %XN : milliseconds (X: 1..3) (0..9) (00..99) (000..999).
                    case 'N':
                        formatted += String(this.getMilliseconds()).padStart(Number(format[i + 2]) || 3, '0');
                        i += 2;
                        break;

                    // %p : locale’s equivalent of either AM or PM.
                    case 'p':
                        formatted += new Intl.DateTimeFormat('en-US', { hour: 'numeric', hour12: true }).format(this);
                        ++i;
                        break;

                    // %P : like %p, but lower case.
                    case 'P':
                        formatted += new Intl.DateTimeFormat('en-US', { hour: 'numeric', hour12: true }).format(this).toLowerCase();
                        ++i;
                        break;

                    // %r : locale’s 12-hour clock time (e.g., 11:11:04 PM).
                    case 'r':
                        formatted += this.format("%I:%M:%S %p");
                        ++i;
                        break;

                    // %R : 24-hour hour and minute; same as %H:%M.
                    case 'R':
                        formatted += this.format("%H:%M");
                        ++i;
                        break;

                    // %s : seconds since 1970-01-01 00:00:00 UTC.
                    case 's':
                        formatted += Math.floor(this.getTime() / 1000);
                        ++i;
                        break;

                    // %S : second (00..60).
                    case 'S':
                        formatted += String(this.getSeconds()).padStart(2, '0');
                        ++i;
                        break;

                    // %t : a tab.
                    case 't':
                        formatted += "\t";
                        ++i;
                        break;

                    // %T : time; same as %H:%M:%S.
                    case 'T':
                        formatted += this.format("%H:%M:%S");
                        ++i;
                        break;

                    // %u : day of week (1..7); 1 is Monday.
                    case 'u':
                        formatted += this.getDay() || 7;
                        ++i;
                        break;

                    // %U : week number of year, with Sunday as first day of week (00..53).
                    case 'U':
                        formatted += String(
                            Math.ceil((this - new Date(this.getFullYear(), 0, 1)) / (86400 * 1000) + 1) / 7
                        ).padStart(2, '0');
                        ++i;
                        break;

                    // %V : ISO week number, with Monday as first day of week (01..53).
                    case 'V':
                        const jan4 = new Date(this.getFullYear(), 0, 4);
                        const startOfWeek = new Date(this.getFullYear(), 0, 1);
                        const daysSinceJan4 = Math.floor((this - jan4) / (86400 * 1000));
                        const weekNumber = Math.ceil((daysSinceJan4 + jan4.getDay() + 1) / 7);
                        formatted += String(weekNumber).padStart(2, '0');
                        ++i;
                        break;

                    // %w : day of week (0..6); 0 is Sunday.
                    case 'w':
                        formatted += this.getDay();
                        ++i;
                        break;

                    // %W : week number of year, with Monday as first day of week (00..53).
                    case 'W':
                        formatted += String(
                            Math.floor((this - new Date(this.getFullYear(), 0, 1)) / (86400 * 1000) + 1) / 7
                        ).padStart(2, '0');
                        ++i;
                        break;

                    // %x : locale’s date representation (e.g., 12/31/99).
                    case 'x':
                        formatted += new Intl.DateTimeFormat('en-US').format(this);
                        ++i;
                        break;

                    // %X : locale’s time representation (e.g., 23:13:48).
                    case 'X':
                        formatted += new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: 'numeric', second: 'numeric' }).format(this);
                        ++i;
                        break;

                    // %y : last two digits of year (00..99).
                    case 'y':
                        formatted += String(this.getFullYear()).slice(-2);
                        ++i;
                        break;

                    // %Y : Full year.
                    case 'Y':
                        formatted += String(this.getFullYear());
                        ++i;
                        break;

                    // %z : +hhmm numeric timezone (e.g., -0400).
                    // %:z : +hh:mm numeric timezone (e.g., -04:00)
                    // %::z : +hh:mm:ss numeric time zone (e.g., -04:00:00).
                    // %:::z : numeric time zone with : to necessary precision (e.g., -04, +05:30).
                    case ':':
                    case 'z':
                        const timezoneOffset = this.getTimezoneOffset();
                        const sign = timezoneOffset > 0 ? '-' : '+';
                        const hours = String(Math.floor(Math.abs(timezoneOffset) / 60)).padStart(2, '0');
                        const minutes = String(Math.abs(timezoneOffset) % 60).padStart(2, '0');
                            
                        if (format[i + 1] === "z") {
                            formatted += `${sign}${hours}${minutes}`;
                            i += 1;
                        }
                        else if (format[i + 2] === "z") {
                            formatted += `${sign}${hours}:${minutes}`;
                            i += 2;
                        }
                        else if (format[i + 3] === "z") {
                            formatted += `${sign}${hours}:${minutes}:${this.format('XN')}`;
                            i += 3;
                        }
                        else if (format[i + 4] === "z") {
                            formatted += `${sign}${hours}:${minutes}:${this.format('XN').slice(0, 2)}`;
                            i += 4;
                        }
                        break;

                    // %Z : alphabetic time zone abbreviation (e.g., EDT).
                    case 'Z':
                        formatted += Intl.DateTimeFormat('en-US', { timeZoneName: 'short' }).format(this);
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

    // Milliseconds
    /*  @docs:
        @title: Milliseconds
        @desc: Get the timestamp in milliseconds.
    */
    msec() { return this.getTime(); }

    // Seconds
    /*  @docs:
        @title: Seconds
        @desc: Get the timestamp in seconds.
    */
    sec() { return parseInt(this.getTime() / 1000); }

    // Hour start.
    /*  @docs:
        @title: Hour start
        @desc: Get the timestamp of the start of the hour.
    */
    minute_start() {
        const date = new D(this.getTime())
        date.setSeconds(0);
        date.setMilliseconds(0);
        return date;
    }

    // Hour start.
    /*  @docs:
        @title: Hour start
        @desc: Get the timestamp of the start of the hour.
    */
    hour_start() {
        const date = new D(this.getTime())
        date.setMinutes(0, 0, 0);
        return date;
    }

    // Day start.
    /*  @docs:
        @title: Day start
        @desc: Get the timestamp of the start of the day.
    */
    day_start() {
        const date = new D(this.getTime())
        date.setHours(0, 0, 0, 0);
        return date;
    }

    // Week start.
    /*  @docs:
        @title: Week start
        @desc: Get the timestamp of the start of the week.
    */
    week_start(sunday_start = true) {
        const diff = (this.getDay() + 7 - (sunday_start ? 0 : 1)) % 7;
        const date = new D(this.getTime())
        date.setDate(this.getDate() - diff)
        date.setHours(0, 0, 0, 0);;
        return date;
    }

    // Month start.
    /*  @docs:
        @title: Month start
        @desc: Get the timestamp of the start of the month.
    */
    month_start() {
        const date = new D(this.getTime())
        date.setDate(1)
        date.setHours(0, 0, 0, 0, 0);
        return date;
    }

    // Quarter year start.
    /*  @docs:
        @title: Quarter year start
        @desc: Get the timestamp of the start of the quarter year.
    */
    quarter_year_start() {
        const date = new D(this.getTime())
        const month = date.getMonth()+1;
        if (month > 9) {
            date.setMonth(9 - 1, 1)
            date.setHours(0, 0, 0, 0, 0);
        } else if (month > 6) {
            date.setMonth(6 - 1, 1)
            date.setHours(0, 0, 0, 0, 0);
        } else if (month > 3) {
            date.setMonth(3 - 1, 1)
            date.setHours(0, 0, 0, 0, 0);
        } else {
            date.setMonth(0, 1)
            date.setHours(0, 0, 0, 0, 0);
        }
        return date;
    }

    // Half year start.
    /*  @docs:
        @title: Half year start
        @desc: Get the timestamp of the start of the half year.
    */
    half_year_start() {
        const date = new D(this.getTime())
        if (date.getMonth() + 1 > 6) {
            date.setMonth(5, 1)
            date.setHours(0, 0, 0, 0, 0);
        } else {
            date.setMonth(0, 1)
            date.setHours(0, 0, 0, 0, 0);
        }
        return date;
    }

    // Year start.
    /*  @docs:
        @title: Year start
        @desc: Get the timestamp of the start of the year.
    */
    year_start() {
        const date = new D(this.getTime())
        date.setMonth(0, 1)
        date.setHours(0, 0, 0, 0, 0);
        return date;
    }

    /*  @docs:
        @title: Increment date
        @desc: Increment the date by the given parameters.
        @param:
            @name: seconds
            @descr: The number of seconds to increment the current date by. Defaults to 0.
            @type: number
        @param:
            @name: minutes
            @descr: The number of minutes to increment the current date by. Defaults to 0.
            @type: number
        @param:
            @name: hours
            @descr: The number of hours to increment the current date by. Defaults to 0.
            @type: number
        @param:
            @name: days
            @descr: The number of days to increment the current date by. Defaults to 0.
            @type: number
        @param:
            @name: weeks
            @descr: The number of weeks to increment the current date by. Each week adds 7 days. Defaults to 0.
            @type: number
        @param:
            @name: months
            @descr: The number of months to increment the current date by. Defaults to 0. Handles month overflow.
            @type: number
        @param:
            @name: years
            @descr: The number of years to increment the current date by. Defaults to 0.
            @type: number
        @return:
            @type: vlib.Date
            @descr: Returns a new date object incremented by the specified values.
    */
    increment({seconds = 0, minutes = 0, hours = 0, days = 0, weeks = 0, months = 0, years = 0}) {
        const date = new D(this.getTime());
        if (seconds > 0)            date.setSeconds(date.getSeconds() + seconds);
        if (minutes > 0)            date.setMinutes(date.getMinutes() + minutes);
        if (hours > 0)              date.setHours(date.getHours() + hours);
        if (days > 0 || weeks > 0)  date.setDate(date.getDate() + days + weeks * 7); // Add both days and weeks
        if (months > 0)             date.setMonth(date.getMonth() + months);
        if (years > 0)              date.setFullYear(date.getFullYear() + years);
        return date;
    }

    /*  @docs:
        @title: Decrement date
        @desc: Decrement the date by the given parameters.
        @param:
            @name: seconds
            @descr: The number of seconds to decrement the current date by. Defaults to 0.
            @type: number
        @param:
            @name: minutes
            @descr: The number of minutes to decrement the current date by. Defaults to 0.
            @type: number
        @param:
            @name: hours
            @descr: The number of hours to decrement the current date by. Defaults to 0.
            @type: number
        @param:
            @name: days
            @descr: The number of days to decrement the current date by. Defaults to 0.
            @type: number
        @param:
            @name: weeks
            @descr: The number of weeks to decrement the current date by. Each week subtracts 7 days. Defaults to 0.
            @type: number
        @param:
            @name: months
            @descr: The number of months to decrement the current date by. Defaults to 0. Handles month underflow.
            @type: number
        @param:
            @name: years
            @descr: The number of years to decrement the current date by. Defaults to 0.
            @type: number
        @return:
            @type: vlib.Date
            @descr: Returns a new date object decremented by the specified values.
    */
    decrement({seconds = 0, minutes = 0, hours = 0, days = 0, weeks = 0, months = 0, years = 0}) {
        const date = new D(this.getTime());
        if (seconds > 0)            date.setSeconds(date.getSeconds() - seconds);
        if (minutes > 0)            date.setMinutes(date.getMinutes() - minutes);
        if (hours > 0)              date.setHours(date.getHours() - hours);
        if (days > 0 || weeks > 0)  date.setDate(date.getDate() - (days + weeks * 7)); // Subtract both days and weeks
        if (months > 0)             date.setMonth(date.getMonth() - months);
        if (years > 0)              date.setFullYear(date.getFullYear() - years);
        return date;
    }


}