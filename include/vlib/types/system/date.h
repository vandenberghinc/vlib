// Author: Daan van den Bergh
// Copyright: © 2022 Daan van den Bergh.

// Header.
#ifndef VLIB_DATE_T_H
#define VLIB_DATE_T_H

// Namespace vlib.
namespace vlib {

// Includes.
#include <time.h>

// ---------------------------------------------------------
// Type definitions.

typedef long mtime_t;

// ---------------------------------------------------------
// Date type
// - Most of the const property functions are omitted since these are intensive functions.
// - Valid till the year 10000 (lol).
/* 	@docs {
	@chapter: system
	@title: Date
	@description:
		Date type.
	@usage:
        #include <vlib/types.h>
		vlib::Date date = vlib::Date::now();
} */
struct Date {

// ---------------------------------------------------------
// Public.
public:
	
	// ---------------------------------------------------------
	// Enums.
	
	enum days {
		sun = 0,
		mon = 1,
		tue = 2,
		wed = 3,
		thu = 4,
		fri = 5,
		sat = 6,
	};
	enum months {
		jan = 0,
		feb = 1,
		mar = 2,
		apr = 3,
		may = 4,
		jun = 5,
		jul = 6,
		aug = 7,
		sep = 8,
		oct = 9,
		nov = 10,
		dec = 11,
	};
	
	// ---------------------------------------------------------
	// Is instance.
    
    // Is string template for g++ compiler.
    template <typename LType> requires (!std::is_same<const LType, const Date>::value) SICE
    bool is_Date_h() { return false; }
    template <typename LType> requires (std::is_same<const LType, const Date>::value) SICE
    bool is_Date_h() { return true; }

// Private.
public:
	
	// ---------------------------------------------------------
	// Aliases.
	
	using 			This = 		Date;
	
	// ---------------------------------------------------------
	// Private functions.
	
	// Parse tm.
	void	parse_tm() {
		time_t x = m_mtime / 1000;
		::localtime_r(&x, &m_tm);
		m_parsed = true;
	}
	constexpr
	void	safe_parse_tm() {
		if (!m_parsed) {
			const time_t x = m_mtime / 1000;
			::localtime_r(&x, &m_tm);
			m_parsed = true;
		}
	}
	
	// Build tm.
	struct tm	build_tm() const {
		struct tm time;
		time_t x = m_mtime / 1000;
		::localtime_r(&x, &time);
		return time;
	}
	
	// Math helper.
	// - Returns the given types as a integral numeric.
	// - Does not support Len due to numeric limitations.
    template <typename Type> requires (is_any_integer<Type>::value || is_floating<Type>::value) SICE
    auto&    math_h(const Type& x) { return x; }
	template <typename Type> requires (is_Long<Type>::value) SICE
	auto&	math_h(const Type& x) { return x.value(); }
    template <typename Type> requires (!is_Long<Type>::value && is_signed_Numeric<Type>::value) SICE
    auto    math_h(const Type& x) { return x.template as<mtime_t>(); }
	template <typename Type> requires (is_unsigned_Numeric<Type>::value) SICE
	auto	math_h(const Type& x) { return x.template as<mtime_t>(); }
	template <typename Type> requires (is_Date_h<Type>()) SICE
	auto&	math_h(const Type& x) { return x.m_mtime; }
	
	// Post m_mtime edit reset.
	constexpr
	void 	post_mtime_edit() {
		m_parsed = false;
		delete m_str;
		m_str = nullptr;
	}

	// As string helper.
	// - Causes undefined behaviour when the format ends with one of the following invalid formatting strings:
	//   * "%:"
	//   * "%1"
	//   * "%2"
	//   * "%3"
	constexpr
	void	str_h(String& formatted, struct tm& time, const char* format) const {
		bool literal = false;
		int opt = 0;
		for (; *format; ++format) {
			if (literal) {
				switch (*format) {
					case ':':
					case '_':
						++opt;
						break;
					case '1':
						opt = 1;
						break;
					case '2':
						opt = 2;
						break;
					case '3':
						opt = 3;
						break;
					default:
						str_format_h(formatted, time, *format, opt);
						literal = false;
						opt = 0;
						break;
				}
			}
			else if (*format == '%') {
				literal = true;
			}
			else {
				formatted.append(*format);
			}
		}
		formatted.null_terminate_safe_h();
	}

	// String format helper.
	// - Based on the GNU/date command.
	// - Combine format & opt for multi char formatting strings.
	// - Opt: [0..3] (0 is undefined).
	constexpr
	void	str_format_h(String& str, struct tm& time, char format, int opt = 0) const {
		switch (format) {

			// %% : a literal %.
			case '%':
				str.append('%');
				break;

			// %a : locale’s abbreviated weekday name (e.g., Sun).
			case 'a':
				switch (time.tm_wday) {
					case days::sun: str.concat_r("Sun", 3); break;
					case days::mon: str.concat_r("Mon", 3); break;
					case days::tue: str.concat_r("Tue", 3); break;
					case days::wed: str.concat_r("Wed", 3); break;
					case days::thu: str.concat_r("Thu", 3); break;
					case days::fri: str.concat_r("Fri", 3); break;
					case days::sat: str.concat_r("Sat", 3); break;
				}
				break;

			// %A : locale’s full weekday name (e.g., Sunday).
			case 'A':
				switch (time.tm_wday) {
					case days::sun: str.concat_r("Sunday", 6); break;
					case days::mon: str.concat_r("Monday", 6); break;
					case days::tue: str.concat_r("Tuesday", 7); break;
					case days::wed: str.concat_r("Wednesday", 9); break;
					case days::thu: str.concat_r("Thursday", 8); break;
					case days::fri: str.concat_r("Friday", 6); break;
					case days::sat: str.concat_r("Saturday", 8); break;
				}
				break;

			// %b : locale’s abbreviated month name (e.g., Jan); same as %h.
			case 'b':
			case 'h':
				switch (time.tm_mon) {
					case months::jan: str.concat_r("Jan", 3); break;
					case months::feb: str.concat_r("Feb", 3); break;
					case months::mar: str.concat_r("Mar", 3); break;
					case months::apr: str.concat_r("Apr", 3); break;
					case months::may: str.concat_r("May", 3); break;
					case months::jun: str.concat_r("Jun", 3); break;
					case months::jul: str.concat_r("Jul", 3); break;
					case months::aug: str.concat_r("Aug", 3); break;
					case months::sep: str.concat_r("Sep", 3); break;
					case months::oct: str.concat_r("Oct", 3); break;
					case months::nov: str.concat_r("Nov", 3); break;
					case months::dec: str.concat_r("Dec", 3); break;
				}
				break;

			// %B : locale’s full month name (e.g., January).
			case 'B':
				switch (time.tm_mon) {
					case months::jan: str.concat_r("January", 7); break;
					case months::feb: str.concat_r("February", 8); break;
					case months::mar: str.concat_r("March", 5); break;
					case months::apr: str.concat_r("April", 5); break;
					case months::may: str.concat_r("May", 3); break;
					case months::jun: str.concat_r("June", 4); break;
					case months::jul: str.concat_r("July", 4); break;
					case months::aug: str.concat_r("August", 6); break;
					case months::sep: str.concat_r("September", 9); break;
					case months::oct: str.concat_r("October", 7); break;
					case months::nov: str.concat_r("November", 8); break;
					case months::dec: str.concat_r("December", 8); break;
				}
				break;

			// %c : locale’s date and time (e.g., Thu Mar 3 23:05:25 2005).

			// %C : century; like %Y, except omit last two digits (e.g., 21).
			case 'C':
				str.concat_r(tostr(1900 + time.tm_year).ensure_end_padding_r('0', 4).data(), 2);
				break;

			// %d : day of month (e.g, 01).
			// %_d : day of month, space padded; same as %e.
			case 'd':
				switch (opt) {
					// %d : day of month (e.g, 01).
					default:
					case 0:
						str.concat_r(tostr(time.tm_mday).ensure_start_padding_r('0', 2));
						break;
					// %_d : day of month, space padded; same as %e.
					case 1:
						str.concat_r(tostr(time.tm_mday).ensure_start_padding_r(' ', 2));
						break;
				}
				break;

			// %e : day of month, space padded; same as %_d.
			case 'e':
				str.concat_r(tostr(time.tm_mday).ensure_start_padding_r(' ', 2));
				break;

			// %D : date; same as %m/%d/%y.
			case 'D':
				str_format_h(str, time, 'm');
				str.append('/');
				str_format_h(str, time, 'd');
				str.append('/');
				str_format_h(str, time, 'y');
				break;

			// %F : full date; same as %Y-%m-%d.
			case 'F':
				str_format_h(str, time, 'Y');
				str.append('-');
				str_format_h(str, time, 'm');
				str.append('-');
				str_format_h(str, time, 'd');
				break;

			// %g : last two digits of year of ISO week number (see %G).

			// %G : year of ISO week number (see %V); normally useful only with %V.

			// %H : hour (00..23).
			case 'H':
				str.concat_r(tostr(time.tm_hour).ensure_start_padding_r('0', 2));
				break;

			// %I : hour (01..12).
			case 'I':
				str.concat_r(
					tostr(
						(time.tm_hour + 1 <= 12) ?
						time.tm_hour :
						(time.tm_hour + 1) / 2
					).ensure_start_padding_r('0', 2)
				);
				break;

			// %j : day of year (001..366) .
			case 'j':
				str.concat_r(tostr(time.tm_yday + 1).ensure_start_padding_r('0', 3));
				break;

			// %k : hour (0..23).
			case 'k':
				str.concat_r(time.tm_hour);
				break;

			// %l : hour ( 1..12) .
			case 'l':
				str.concat_r(
					tostr(
						(time.tm_hour + 1 <= 12) ?
						time.tm_hour :
						(time.tm_hour + 1) / 2
					)
				);
				break;

			// %m : month (01..12).
			case 'm':
				str.concat_r(tostr(time.tm_mon+1).ensure_start_padding_r('0', 2));
				break;

			// %M : minute (00..59).
			case 'M':
				str.concat_r(tostr(time.tm_min).ensure_start_padding_r('0', 2));
				break;

			// %n : a newline.
			case 'n':
				str.append('\n');
				break;

			// %XN : milliseconds (X: 1..3) (0..9) (00..99) (000..999).
			case 'N':
				switch (opt) {
					case 1:
						str.concat_r(
							(m_mtime - ((m_mtime / 1000) * 1000)) / 100
						);
						break;
					case 2:
						str.concat_r(tostr(
							(m_mtime - ((m_mtime / 1000) * 1000)) / 10
						).ensure_start_padding_r('0', 2));
						break;
					default:
					case 3:
						str.concat_r(tostr(
							m_mtime - ((m_mtime / 1000) * 1000)
						).ensure_start_padding_r('0', 3));
						break;
				}
				break;

			// %p : locale’s equivalent of either AM or PM.
			case 'p':
				if (time.tm_hour <= 11) { str.concat_r("AM", 2); }
				else { str.concat_r("PM", 2); }
				break;

			// %P : like %p, but lower case.
			case 'P':
				if (time.tm_hour <= 11) { str.concat_r("am", 2); }
				else { str.concat_r("pm", 2); }
				break;

			// %r : locale’s 12-hour clock time (e.g., 11:11:04 PM).
			case 'r':
				str_format_h(str, time, 'l');
				str.append(':');
				str_format_h(str, time, 'M');
				str.append(':');
				str_format_h(str, time, 'S');
				str.append(' ');
				str_format_h(str, time, 'p');
				break;

			// %R : 24-hour hour and minute; same as %H:%M.
			case 'R':
				str_format_h(str, time, 'H');
				str.append(':');
				str_format_h(str, time, 'M');
				break;

			// %s : seconds since 1970-01-01 00:00:00 UTC.
			case 's':
				str.concat_r(m_mtime / 1000);
				break;

			// %S : second (00..60).
			case 'S':
				str.concat_r(tostr(time.tm_sec).ensure_start_padding_r('0', 2));
				break;

			// %t : a tab.
			case 't':
				str.append('\t');
				break;

			// %T : time; same as %H:%M:%S.
			case 'T':
				str_format_h(str, time, 'H');
				str.append(':');
				str_format_h(str, time, 'M');
				str.append(':');
				str_format_h(str, time, 'S');
				break;

			// %u : day of week (1..7); 1 is Monday.
			case 'u':
				if (time.tm_wday == 0) { str.concat_r(7); }
				else { str.concat_r(time.tm_wday); }
				break;

			// %U : week number of year, with Sunday as first day of week (00..53).
			case 'U':
				str.concat_r(tostr(week_h(time, true)).ensure_start_padding_r('0', 2));
				break;

			// %V : ISO week number, with Monday as first day of week (01..53).
			case 'V':
				str.concat_r(tostr(week_h(time, false)).ensure_start_padding_r('0', 2));
				break;

			// %w : day of week (1..7); 1 is Monday.
			case 'w':
				str.concat_r(time.tm_wday);
				break;

			// %W : week number of year, with Monday as first day of week (00..53).
			case 'W':
				str.concat_r(tostr(week_h(time, false)).ensure_start_padding_r('0', 2));
				break;

			// %x : locale’s date representation (e.g., 12/31/99).

			// %x : locale’s time representation (e.g., 23:13:48).

			// %y : last two digits of year (00..99).
			case 'y':
				str.concat_r(tostr(1900 + time.tm_year).ensure_end_padding_r('0', 4).data() + 2, 2);
				break;

			// %Y : year.
			case 'Y':
				str.concat_r(tostr(1900 + time.tm_year).ensure_end_padding_r('0', 4));
				break;

			// %z : +hhmm numeric timezone (e.g., -0400).
			// %:z : +hh:mm numeric timezone (e.g., -04:00)
			// %::z : +hh:mm:ss numeric time zone (e.g., -04:00:00).
			// %:::z : numeric time zone with : to necessary precision (e.g., -04, +05:30).
			case 'z':
			{
				const long off = abs(time.tm_gmtoff);
				const long hours = off / 3600;
				const long min = (off - (hours * 3600)) / 60;
				const long sec = off - (hours * 3600) - (min * 60);
				if (time.tm_gmtoff < 0) { str.append('-'); }
				else { str.append('+'); }
				switch (opt) {
					// %z : +hhmm numeric timezone (e.g., -0400).
					default:
					case 0:
						str.concat_r(tostr(hours).ensure_start_padding_r('0', 2));
						str.concat_r(tostr(min).ensure_start_padding_r('0', 2));
						break;
					// %:z : +hh:mm numeric timezone (e.g., -04:00)
					case 1:
						str.concat_r(tostr(hours).ensure_start_padding_r('0', 2));
						str.append(':');
						str.concat_r(tostr(min).ensure_start_padding_r('0', 2));
						break;
					// %::z : +hh:mm:ss numeric time zone (e.g., -04:00:00).
					case 2:
						str.concat_r(tostr(hours).ensure_start_padding_r('0', 2));
						str.append(':');
						str.concat_r(tostr(min).ensure_start_padding_r('0', 2));
						str.append(':');
						str.concat_r(tostr(sec).ensure_start_padding_r('0', 2));
						break;
					// %:::z : numeric time zone with : to necessary precision (e.g., -04, +05:30).
					case 3:
						str.concat_r(tostr(hours).ensure_start_padding_r('0', 2));
						if (min > 0) {
							str.append(':');
							str.concat_r(tostr(min).ensure_start_padding_r('0', 2));
							if (sec > 0) {
								str.append(':');
								str.concat_r(tostr(sec).ensure_start_padding_r('0', 2));
							}
						}
						break;
				}
				break;
			}

			// %Z : alphabetic time zone abbreviation (e.g., EDT).
			case 'Z':
				str.concat_r(time.tm_zone);
				break;

			// Unknown.
			default:
				break;

		}

	}

	// Parse a Date from a formatted string.
	// @TODO

// Public.
public:
	
	// ---------------------------------------------------------
	// Static attributes.
	
	static inline const char* default_format = "%Y-%m-%dT%H:%M:%S%:z"; // ISO 8601
	
	// ---------------------------------------------------------
	// Attributes.
	
	mtime_t			m_mtime;
	struct tm 		m_tm;
	bool 			m_parsed; // whether "m_tm" is parsed / valid.
	String* 			m_str;
	
	// ---------------------------------------------------------
	// Construct functions.
	
	// Construct from a unix timestamp in milliseconds.
	constexpr
	auto&	construct(const mtime_t& time) {
		m_mtime = time;
		m_parsed = false;
		delete m_str;
		m_str = nullptr;
		return *this;
	}
	
	// Copy.
	constexpr
	auto&	copy(const This& obj) {
		m_mtime = obj.m_mtime;
		m_tm = obj.m_tm;
		m_parsed = obj.m_parsed;
		vlib::ptr::copy(m_str, obj.m_str);
		return *this;
	}

	// Swap.
	constexpr
	auto&	swap(This& obj) {
		m_mtime = obj.m_mtime;
		m_tm = obj.m_tm;
		m_parsed = obj.m_parsed;
		vlib::ptr::swap(m_str, obj.m_str);
		return *this;
	}
	
	// ---------------------------------------------------------
	// Constructors.
	
	// Default constructor.
	constexpr
	Date() :
	m_mtime(-1), m_parsed(false), m_str(nullptr) {}
	constexpr
	Date(const Null&) :
	m_mtime(-1), m_parsed(false), m_str(nullptr) {}
	
	// Constructor from a unix timestamp in milliseconds.
	/*  @docs {
		@title: Constructor
		@description:
			Constructor from a unix timestamp in milliseconds.
		@parameter: {
			@name: time
			@description: The unix timestamp in milliseconds.
		}
		@usage:
			vlib::Date date(0);
	} */
	constexpr
	Date	(const mtime_t& time) :
	m_mtime(time), m_parsed(false), m_str(nullptr) {}
	template <typename Type> requires (is_any_Numeric<Type>::value) constexpr
	Date	(const Type& time) :
	m_mtime(time.template as<mtime_t>()), m_parsed(false), m_str(nullptr) {}
	
	// Copy constructor.
	constexpr
	Date	(const This& obj) :
	m_mtime(obj.m_mtime), m_tm(obj.m_tm), m_parsed(obj.m_parsed), m_str(nullptr)
	{ vlib::ptr::copy(m_str, obj.m_str); }
	
	// Move constructor.
	constexpr
	Date	(This&& obj) :
	m_mtime(obj.m_mtime), m_tm(obj.m_tm), m_parsed(obj.m_parsed), m_str(nullptr)
	{ vlib::ptr::swap(m_str, obj.m_str); }
	
	// Destructor.
	constexpr
	~Date() {
		delete m_str;
	}
	
	// ---------------------------------------------------------
	// Assignment operators.
	
	// Assignment operator from a unix timestamp in milliseconds.
	constexpr
	This&	operator =(const mtime_t& time) { return construct(time); }
    template <typename Type> requires (is_any_Numeric<Type>::value) constexpr
	This&	operator =(const Type& time) { return construct(time.template as<mtime_t>()); }
	
	// Copy assignment operator.
	constexpr
	This&	operator =(const This& obj) { return copy(obj); }
	
	// Move assignment operator.
	constexpr
	This&	operator =(This&& obj) { return swap(obj); }
	
	// ---------------------------------------------------------
	// Property functions.
	
	// Get as unix timestamp in milliseconds.
	/* 	@docs {
		@title: Milliseconds
		@description: Get as unix timestamp in milliseconds.
	} */
	constexpr
	auto& 	mtime() const {
		return m_mtime;
	}
	
	// Get as seconds.
	/* @docs {
	   @title: Seconds
	   @description: Get as seconds (0-60).
	} */
	constexpr
	auto& 	seconds() {
		safe_parse_tm();
		return m_tm.tm_sec;
	}
	
	// Get as minutes.
	/* @docs {
	   @title: Minutes
	   @description: Get as minutes (0-59).
	} */
	constexpr
	auto& 	minutes() {
		safe_parse_tm();
		return m_tm.tm_min;
	}
	
	// Get as hour.
	/* @docs {
	   @title: Hour
	   @description: Get as hour (0-23).
	} */
	constexpr
	auto& 	hour() {
		safe_parse_tm();
        return m_tm.tm_hour;
        // return m_tm.tm_hour + m_tm.tm_isdst != 0 ? 1 : 0;
	}
	
	// Get as day of the month.
	/* @docs {
	   @title: Day of the month
	   @description: Get as day of the month (1-31).
	} */
	constexpr
	auto& 	mday() {
		safe_parse_tm();
		return m_tm.tm_mday;
	}
	
	// Get as day of the week.
	/* @docs {
	   @title: Day of the week
	   @description: Get as day of the week (0-6, Sunday = 0).
	} */
	constexpr
	auto& 	wday() {
		safe_parse_tm();
		return m_tm.tm_wday;
	}
	
	// Get as day of the year.
	/* @docs {
	   @title: Day of the year
	   @description: Get as day of the year (0-365, 1 Jan = 0).
	} */
	constexpr
	auto& 	yday() {
		safe_parse_tm();
		return m_tm.tm_yday;
	}
	
	// Get the day name.
	/* @docs {
	   @title: Day name
	   @description: Get the day name (e.g., Sunday).
	} */
	constexpr
	auto 	day_name() {
		safe_parse_tm();
		switch (m_tm.tm_wday) {
			case days::sun: return String("Sunday", 6);
			case days::mon: return String("Monday", 6);
			case days::tue: return String("Tuesday", 7);
			case days::wed: return String("Wednesday", 9);
			case days::thu: return String("Thursday", 8);
			case days::fri: return String("Friday", 6);
			case days::sat: return String("Saturday", 8);
			default: return String("Unknown", 7);
		}
	}
	
	// Get the day name abbreviation.
	/* @docs {
	   @title: Day name abbreviation
	   @description: Get the day name abbreviation (e.g., Sun).
	} */
	constexpr
	auto 	day_name_abr() {
		safe_parse_tm();
		switch (m_tm.tm_wday) {
			case days::sun: return String("Sun", 3);
			case days::mon: return String("Mon", 3);
			case days::tue: return String("Tue", 3);
			case days::wed: return String("Wed", 3);
			case days::thu: return String("Thu", 3);
			case days::fri: return String("Fri", 3);
			case days::sat: return String("Sat", 3);
			default: return String("Unknown", 7);
		}
	}
	
	// Get as month.
	/* @docs {
	   @title: Month
	   @description: Get as month (0-11).
	} */
	constexpr
	auto& 	month() {
		safe_parse_tm();
		return m_tm.tm_mon;
	}
	
	// Get the month name.
	/* @docs {
	   @title: Month name
	   @description: Get the month name (e.g., January).
	} */
	constexpr
	auto 	month_name() {
		safe_parse_tm();
		switch (m_tm.tm_mon) {
			case months::jan: return String("January", 7);
			case months::feb: return String("February", 8);
			case months::mar: return String("March", 5);
			case months::apr: return String("April", 5);
			case months::may: return String("May", 3);
			case months::jun: return String("June", 4);
			case months::jul: return String("July", 4);
			case months::aug: return String("August", 6);
			case months::sep: return String("September", 9);
			case months::oct: return String("October", 7);
			case months::nov: return String("November", 8);
			case months::dec: return String("December", 8);
			default: return String("Unknown", 7);
		}
	}
	
	// Get the month name abbreviation.
	/* @docs {
	   @title: Month name abbreviation
	   @description: Get the month name abbreviation (e.g., Jan).
	} */
	constexpr
	auto 	month_name_abr() {
		safe_parse_tm();
		switch (m_tm.tm_mon) {
			case months::jan: return String("Jan", 3);
			case months::feb: return String("Feb", 3);
			case months::mar: return String("Mar", 3);
			case months::apr: return String("Apr", 3);
			case months::may: return String("May", 3);
			case months::jun: return String("Jun", 3);
			case months::jul: return String("Jul", 3);
			case months::aug: return String("Aug", 3);
			case months::sep: return String("Sep", 3);
			case months::oct: return String("Oct", 3);
			case months::nov: return String("Nov", 3);
			case months::dec: return String("Dec", 3);
			default: return String("Unknown", 7);
		}
	}
	
	// Get as year.
	/* @docs {
	   @title: Year
	   @description: Get as year (YYYY).
	} */
	constexpr
	auto 	year() {
		safe_parse_tm();
		return 1900 + m_tm.tm_year;
	}
	
	// Get the timezone offset from UTC in seconds.
	/* @docs {
	   @title: Offset
	   @description: Get the timezone offset from UTC in seconds.
	} */
	constexpr
	auto& 	offset() {
		safe_parse_tm();
		return m_tm.tm_gmtoff;
	}
	template <typename As> requires (is_String<As>::value) constexpr
	auto 	offset(int opt = -1) {
		safe_parse_tm();
		const long off = abs(m_tm.tm_gmtoff);
		const long hours = off / 3600;
		const long min = (off - (hours * 3600)) / 60;
		const long sec = off - (hours * 3600) - (min * 60);
		String str;
		if (m_tm.tm_gmtoff < 0) { str.append('-'); }
		else { str.append('+'); }
		switch (opt) {
			
			// +hhmm numeric timezone (e.g., -0400).
			case 0:
				str.concat_r(tostr(hours).ensure_start_padding_r('0', 2));
				str.concat_r(tostr(min).ensure_start_padding_r('0', 2));
				break;
		
			// +hh:mm numeric timezone (e.g., -04:00)
			default:
			case 1:
				str.concat_r(tostr(hours).ensure_start_padding_r('0', 2));
				str.append(':');
				str.concat_r(tostr(min).ensure_start_padding_r('0', 2));
				break;
			
			// +hh:mm:ss numeric time zone (e.g., -04:00:00).
			case 2:
				str.concat_r(tostr(hours).ensure_start_padding_r('0', 2));
				str.append(':');
				str.concat_r(tostr(min).ensure_start_padding_r('0', 2));
				str.append(':');
				str.concat_r(tostr(sec).ensure_start_padding_r('0', 2));
				break;
			
			// numeric time zone with : to necessary precision (e.g., -04, +05:30).
			case 3:
				str.concat_r(tostr(hours).ensure_start_padding_r('0', 2));
				if (min > 0) {
					str.append(':');
					str.concat_r(tostr(min).ensure_start_padding_r('0', 2));
					if (sec > 0) {
						str.append(':');
						str.concat_r(tostr(sec).ensure_start_padding_r('0', 2));
					}
				}
				break;
		}
		return str;
	}
	
	// Get the timezone name.
	/* @docs {
	   @title: Timezone
	   @description: Get the timezone name.
	} */
	constexpr
	const char* timezone() {
		safe_parse_tm();
		return m_tm.tm_zone;
	}
	template <typename As> requires (is_String<As>::value) constexpr
	String 	timezone() {
		safe_parse_tm();
		return m_tm.tm_zone;
	}
	
	// Get the week number.
	/* @docs {
	   @title: Week
	   @description: Get the week number (1..52).
	} */
	constexpr
	int 	week(bool start_at_sunday = true) {
		safe_parse_tm();
		return week_h(m_tm, start_at_sunday);
	}
	constexpr
	int 	week_h(struct tm& time, bool sunday_as_start = true) const {
		
		// Variables.
		int leap = 0;
		int week_day = time.tm_wday - 1;
		if (week_day < 0) { week_day = 7; }
		int week_start = sunday_as_start ? 6 : 7;
		// int week_incr = start_at_zero ? 0 : 1;
		constexpr int year_days[2][13] = {
			 {0, 0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334}, // normal year
			 {0, 0, 31, 60, 91, 121, 152, 182, 213, 244, 274, 305, 335} // leap year
		};
		
		// Check for leap year.
		if (((time.tm_year % 4) == 0) && (((time.tm_year % 100) != 0) || ((time.tm_year % 400) == 0))) {
			leap = 1;
		}
		
		// Calculate the year week.
		return (((year_days[leap][time.tm_mon+1] + time.tm_mday) - (week_day + week_start) % 7 + 7) / 7);// + week_incr;
	}
	
	// ---------------------------------------------------------
	// Functions.
	
	// Copy the object.
	/* @docs {
	   @title: Copy
	   @description: Copy the object.
	} */
	constexpr
	auto 	copy() {
		return *this;
	}
	constexpr
	auto 	copy() const {
		return *this;
	}
	
	// Reset all attributes.
	/* @docs {
	   @title: Reset
	   @description: Reset all attributes.
	} */
	constexpr
	auto& 	reset() {
		m_mtime = -1;
		post_mtime_edit();
		return *this;
	}
	
	// Is undefined.
	/* @docs {
	   @title: Is undefined
	   @description: Check if the object is undefined.
	   @usage:
			timestamp_t x;
			x.is_undefined(); ==> true;
	} */
	constexpr
	bool 	is_undefined() const {
		return m_mtime == -1;
	}
	
	// Get a Date with the present time data.
	/* @docs {
	   @title: Now
	   @description: Get a Date with the present time data.
	   @usage:
			Date now = Date::now();
	} */
	static
	This 	now() {
		struct timespec time;
		clock_gettime(CLOCK_REALTIME, &time);
		return Date::get_mseconds(time);
	}
	
	// Add.
	/* 	@docs {
		@title: Add
		@description: Add milliseconds to attribute `m_time`.
		@usage:
			Date date (0);
			now.add_r(10); ==> 10
		@return:
			Function `add` returns a new object while function `add_r` updates the current object and returns a reference to the current object.
		@parameter {
			@name: x
			@description: The type to perform the math operation with, supports be the following types: any integral numeric, `Numeric` & `Date`.
		}
		@funcs: 2
	} */
	template <typename Type> constexpr
	This 	add(const Type& x) const {
		return copy().add_r(x);
	}
	template <typename Type> constexpr
	This& 	add_r(const Type& x) {
		m_mtime += math_h(x);
		post_mtime_edit();
		return *this;
	}
	
	// Subtract.
	/* 	@docs {
		@title: Subtract
		@description: Subtract milliseconds from attribute `m_time`.
		@usage:
			Date date (10);
			now.sub_r(10); ==> 0
		@return:
			Function `sub` returns a new object while function `sub_r` updates the current object and returns a reference to the current object.
		@parameter {
			@name: x
			@description: The type to perform the math operation with, supports be the following types: any integral numeric, `Numeric` & `Date`.
		}
		@funcs: 2
	} */
	template <typename Type> constexpr
	This 	sub(const Type& x) const {
		return copy().sub_r(x);
	}
	template <typename Type> constexpr
	This& 	sub_r(const Type& x) {
		m_mtime -= math_h(x);
		post_mtime_edit();
		return *this;
	}
	
	// mult.
	/* 	@docs {
		@title: Multiply
		@description: Multiply attribute `m_time`.
		@usage:
			Date date (10);
			now.mult_r(2); ==> 20
		@return:
			Function `mult` returns a new object while function `mult_r` updates the current object and returns a reference to the current object.
		@parameter {
			@name: x
			@description: The type to perform the math operation with, supports be the following types: any integral numeric, `Numeric` & `Date`.
		}
		@funcs: 2
	} */
	template <typename Type> constexpr
	This 	mult(const Type& x) const {
		return copy().mult(x);
	}
	template <typename Type> constexpr
	This& 	mult_r(const Type& x) {
		m_mtime *= math_h(x);
		post_mtime_edit();
		return *this;
	}
	
	// div.
	/* 	@docs {
		@title: Divide
		@description: Divide attribute `m_time`.
		@usage:
			Date date (10);
			now.div_r(2); ==> 5
		@return:
			Function `div` returns a new object while function `div_r` updates the current object and returns a reference to the current object.
		@parameter {
			@name: x
			@description: The type to perform the math operation with, supports be the following types: any integral numeric, `Numeric` & `Date`.
		}
		@funcs: 2
	} */
	template <typename Type> constexpr
	This 	div(const Type& x) const {
		return copy().div_r(x);
	}
	template <typename Type> constexpr
	This& 	div_r(const Type& x) {
		m_mtime /= math_h(x);
		post_mtime_edit();
		return *this;
	}
	
	// mod.
	/* 	@docs {
		@title: Modulo
		@description: Calculate the modulo of attribute `m_time` divided by x.
		@usage:
			Date date (10);
			now.mod_r(3); ==> 1
		@return:
			Function `mod` returns a new object while function `mod_r` updates the current object and returns a reference to the current object.
		@parameter {
			@name: x
			@description: The type to perform the math operation with, supports be the following types: any integral numeric, `Numeric` & `Date`.
		}
		@funcs: 2
	} */
	template <typename Type> constexpr
	This 	mod(const Type& x) const {
		return copy().mod_r(x);
	}
	template <typename Type> constexpr
	This& 	mod_r(const Type& x) {
		m_mtime %= math_h(x);
		post_mtime_edit();
		return *this;
	}
	
	// ---------------------------------------------------------
	// Casts.
	
	// Parse from const char*.
	/* 	@docs {
		@title: parse
		@description: Parse from a const char* (unix timestamp milliseconds).
	} */
	SICE
	This	parse(const char* unix, ullong len) {
		return tonumeric<long>(unix, len);
	}
	SICE
	This	parse(const char* unix) {
		return tonumeric<long>(unix);
	}
	
	// Parse from a formatted date string.
	/* 	@docs {
		@title: parse
		@description: Parse from a const char* (unix timestamp milliseconds).
	} */
	static inline
	This	parse(const char* timestamp, const char* format) {
		struct tm tm = {};
		if (strptime(timestamp, format, &tm) == NULL) {
			throw ParseError(tostr("Unable to parse date string \"", timestamp, "\" with format \"", format, "\"."));
		}
		return (mktime(&tm) - (tm.tm_isdst != 0 ? 3600 : 0)) * 1000;
	}
	
	// As json.
	/* 	@docs {
		@title: JSON
		@description: Cast to a unix milliseconds json formatted string.
		@usage:
			vlib::Date date(0);
			date.json(); ==> "0"
	} */
	constexpr
	String	json() const {
		return String(m_mtime);
	}
	
	// As str.
	/* @docs {
		@title: String
		@description:
			Cast to string formatted like `%Y-%m-%dT%H:%M:%S%:z`.
				
			The default format can be changed by editing static attribute `vlib::Date::default_format`.
		@usage:
			vlib::Date date(0);
			date.str(); ==> "1970-01-01T01:00:00+01:00"
	} */
	// @TODO perhaps switch to strptime like.
	String&	str() {
		// if (m_str) { return *m_str; }
		safe_parse_tm();
		String formatted;
		str_h(formatted, m_tm, default_format);
		delete m_str;
		m_str = new String (formatted);
		return *m_str;
	}
	/* 	@docs {
		@title: String
		@description: Cast to string.
		@parameter: {
			@name: format
			@description: The date format (posix formats).
		@usage:
			vlib::Date date(0);
			date.str("%Y-%m-%dT%H:%M:%S%:z"); ==> "1970-01-01T01:00:00+01:00"
	} */
	constexpr
	String&	str(const char* format) {
		// if (m_str) { return *m_str; }
		safe_parse_tm();
		String formatted;
		str_h(formatted, m_tm, format);
		delete m_str;
		m_str = new String (formatted);
		return *m_str;
	}
	
	String		str() const {
		struct tm time = build_tm();
		String formatted;
		str_h(formatted, time, default_format);
		return formatted;
	}
	String		str(const char* format) const {
		struct tm time = build_tm();
		String formatted;
		str_h(formatted, time, format);
		return formatted;
	}

	// Get milliseconds.
	/* @docs {
		@title: Milliseconds
		@description: Get the current milliseconds.
		@usage:
			vlib::mtime_t now = vlib::Date::get_mseconds();
	} */
	static inline
	mtime_t	get_mseconds() {
		struct timespec time;
		clock_gettime(CLOCK_REALTIME, &time);
		return (time.tv_sec * 1000) + (time.tv_nsec / 1000000);
	}
	SICE
	mtime_t	get_mseconds(struct timespec& time) {
		return (time.tv_sec * 1000) + (time.tv_nsec / 1000000);
	}
	
	// Get seconds.
	/* @docs {
		@title: Seconds
		@description: Get the current seconds.
		@usage:
			time_t now = vlib::Date::get_mseconds();
	} */
	static inline
	time_t	get_seconds() {
		struct timespec time;
		clock_gettime(CLOCK_REALTIME, &time);
		return time.tv_sec;
	}
	SICE
	time_t	get_seconds(struct timespec& time) {
		return time.tv_sec;
	}
	
	// ---------------------------------------------------------
	// Operators.
	
	// Operators "==, !=".
	template <typename Type> constexpr friend
	bool	operator ==(const This& obj, const Type& x) {
		return obj.m_mtime == obj.math_h(x);
	}
	template <typename Type> constexpr friend
	bool	operator !=(const This& obj, const Type& x) {
		return obj.m_mtime != obj.math_h(x);
	}
	
	// Operators "==, !=".
	constexpr friend
	bool	operator ==(const This& obj, const Null&) {
		return obj.m_mtime == -1;
	}
	constexpr friend
	bool	operator !=(const This& obj, const Null&) {
		return obj.m_mtime != -1;
	}

	// Operators "<, <=, >, >=".
	template <typename Type> constexpr friend
	bool	operator <(const This& obj, const Type& x) {
		return obj.m_mtime < obj.math_h(x);
	}
	template <typename Type> constexpr friend
	bool	operator <=(const This& obj, const Type& x) {
		return obj.m_mtime <= obj.math_h(x);
	}
	template <typename Type> constexpr friend
	bool	operator >(const This& obj, const Type& x) {
		return obj.m_mtime > obj.math_h(x);
	}
	template <typename Type> constexpr friend
	bool	operator >=(const This& obj, const Type& x) {
		return obj.m_mtime >= obj.math_h(x);
	}

	// Operators "++, --".
	constexpr
	This& 	operator++() {
		return add_r(1);
	}
	constexpr
	This& 	operator++(int) {
		return add_r(1);
	}
	constexpr
	This& 	operator--() {
		return sub_r(1);
	}
	constexpr
	This& 	operator--(int) {
		return sub_r(1);
	}

	// Operators "+, +=, -, -=".
	template <typename Type> constexpr friend
	This	operator +(const This& obj, const Type& x) {
		return obj.add(x);
	}
	template <typename Type> constexpr
	This&	operator +=(const Type& x) {
		return add_r(x);
	}
	template <typename Type> constexpr friend
	This	operator -(const This& obj, const Type& x) {
		return obj.sub(x);
	}
	template <typename Type> constexpr
	This&	operator -=(const Type& x) {
		return sub_r(x);
	}

	// Operators "*, *=".
	template <typename Type> constexpr friend
	This	operator *(const This& obj, const Type& x) {
		return obj.mult(x);
	}
	template <typename Type> constexpr
	This&	operator *=(const Type& x) {
		return mult_r(x);
	}

	// Operators "/, /=".
	template <typename Type> constexpr friend
	This	operator /(const This& obj, const Type& x) {
		return obj.div(x);
	}
	template <typename Type> constexpr
	This&	operator /=(const Type& x) {
		return div_r(x);
	}

	// Operators "%, %=".
	template <typename Type> constexpr friend
	This	operator %(const This& obj, const Type& x) {
		return obj.mod(x);
	}
	template <typename Type> constexpr
	This&	operator %=(const Type& x) {
		return mod_r(x);
	}

	// Dump to pipe.
	constexpr friend
	auto& 	operator <<(Pipe& x, const This& y) {
		return x << y.m_mtime;
	}
	
};

// ---------------------------------------------------------
// Instances.

// Is instance.
template<> 				struct is_instance<Date, Date>	{ SICEBOOL value = true;  };

// Is path type.
template<typename Type> struct is_Date 					{ SICEBOOL value = false; };
template<> 				struct is_Date<Date> 			{ SICEBOOL value = true;  };

// ---------------------------------------------------------
// Shortcuts.

namespace shortcuts {
namespace types {

using Date =		vlib::Date;

}; 		// End namespace types.
}; 		// End namespace shortcuts.

// ---------------------------------------------------------
// End.

}; 		// End namespace vlib.
#endif 	// End header.
