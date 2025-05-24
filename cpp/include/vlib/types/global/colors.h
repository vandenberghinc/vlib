// Author: Daan van den Bergh
// Copyright: © 2022 Daan van den Bergh.

// Header.
#ifndef VLIB_COLORS_H
#define VLIB_COLORS_H

// Namespace vlib.
namespace vlib {

// Color type.
struct color_t {

// Private:
private:

	// ---------------------------------------------------------
	// Aliases.

	using 			This = 			color_t;
	using 			Type = 			char;
	using 			Length = 		ullong;

	// ---------------------------------------------------------
	// Attributes.

	const Type*		m_arr;
	Length			m_len;

// Public:
public:

	// ---------------------------------------------------------
	// Constructors.

	// Default constructor.
	inline constexpr
	color_t() : m_arr(""), m_len(0) {}

	// Constructor Type*.
	inline constexpr
	color_t(const Type* arr) : m_arr(arr), m_len(vlib::len(arr)) {}

	// Constructor Type* with length.
	inline constexpr
	color_t(const Type* arr, const Length len) : m_arr(arr), m_len(len) {}

	// Copy constructor.
	inline constexpr
	color_t(const This& x) : m_arr(x.m_arr), m_len(x.m_len) {}

	// Move constructor.
	inline constexpr
	color_t(This&& x) : m_arr(x.m_arr), m_len(x.m_len) {}

	// ---------------------------------------------------------
	// Assignment operators.

	// Assignment operator from void.
	inline constexpr
	auto&   operator =(const Type* arr) {
		m_arr = arr;
		m_len = vlib::len(arr);
		return *this;
	}

	// ---------------------------------------------------------
	// Functions.

	// Length.
	inline constexpr
	auto 	len() const {
		return m_len;
	}

	// Data.
	inline constexpr
	auto& 	data() {
		return m_arr;
	}
	inline constexpr
	auto&   data() const {
		return m_arr;
	}
    
    // C string.
    inline constexpr
    auto&   c_str() const {
        return m_arr;
    }

	// ---------------------------------------------------------
	// Operators.

	// Length.
	inline constexpr
	operator    const Type*() {
		return m_arr;
	}

	//
};

// Colors.
/* 	@docs
	@chapter: Types
	@title: Colors
	@description:
		Static colors structure.
 
        The available colors are:
        <bullet> `vlib::colors::black` </bullet>
        <bullet> `vlib::colors::red` </bullet>
        <bullet> `vlib::colors::green` </bullet>
        <bullet> `vlib::colors::yellow` </bullet>
        <bullet> `vlib::colors::blue` </bullet>
        <bullet> `vlib::colors::magenta` </bullet>
        <bullet> `vlib::colors::cyan` </bullet>
        <bullet> `vlib::colors::gray` </bullet>
        <bullet> `vlib::colors::bold` </bullet>
        <bullet> `vlib::colors::italic` </bullet>
        <bullet> `vlib::colors::end` </bullet>
 
    @usage:
        #include <vlib/types.h>
        vlib::print(to_str(vlib::colors::bold, "Hello World!", vlib::colors::end));
*/
struct colors {

	// ---------------------------------------------------------
	// Attributes.

	#if DEBUG == 0
		static inline color_t black = "\u001b[30m";
		static inline color_t red = "\u001b[31m";
		static inline color_t green = "\u001b[32m";
		static inline color_t yellow = "\u001b[33m";
		static inline color_t blue = "\u001b[34m";
		static inline color_t magenta = "\u001b[35m";
		static inline color_t cyan = "\u001b[36m";
		static inline color_t gray = "\u001b[37m";
		static inline color_t bold = "\u001b[1m";
		static inline color_t italic = "\u001b[3m";
		static inline color_t end = "\u001b[0m";
	#else
		static inline color_t black = "";
		static inline color_t red = "";
		static inline color_t green = "";
		static inline color_t yellow = "";
		static inline color_t blue = "";
		static inline color_t magenta = "";
		static inline color_t cyan = "";
		static inline color_t gray = "";
		static inline color_t bold = "";
		static inline color_t italic = "";
		static inline color_t end = "";
	#endif

	// ---------------------------------------------------------
	// Functions.

	// Enable colors.
	/* 	@docs
		@title: Enable
		@description:
			Enable the colors.
		@usage:
			vlib::colors::enable();
	*/
	SICE
	void 	enable() {
		black = "\u001b[30m";
		red = "\u001b[31m";
		green = "\u001b[32m";
		yellow = "\u001b[33m";
		blue = "\u001b[34m";
		magenta = "\u001b[35m";
		cyan = "\u001b[36m";
		gray = "\u001b[37m";
		bold = "\u001b[1m";
		italic = "\u001b[3m";
		end = "\u001b[0m";
	};

	// Disable colors.
	/* 	@docs
		@title: Disable
		@description:
			Disable the colors.
		@usage:
			vlib::colors::disable();
	*/
	SICE
	void 	disable() {
		black = "";
		red = "";
		green = "";
		yellow = "";
		blue = "";
		magenta = "";
		cyan = "";
		gray = "";
		bold = "";
		italic = "";
		end = "";
	}

};
}; 		// End namespace vlib.
#endif 	// End header.
