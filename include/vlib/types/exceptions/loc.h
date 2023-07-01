// Author: Daan van den Bergh
// Copyright: © 2022 Daan van den Bergh.

// Header.
#ifndef VLIB_LOC_T_H
#define VLIB_LOC_T_H

// Namespace vlib.
namespace vlib {

// Location type.
/* 	@docs {
	@chapter: exceptions
	@title: Location
	@description:
		Source location type.
	@usage:
		// Get the source location.
        #include <vlib/types.h>
		vlib::Loc x = vlib::Loc::get();
		vlib::print(x.path(), ':', x.line(), ':', x.column(), ": ", x.path());
} */
struct Loc {

// Private:
private:

	// ---------------------------------------------------------
	// Aliases.

	using 		This = 		Loc;

	// ---------------------------------------------------------
	// Attributes.

	int 				m_line;
	int 				m_column;
	const char* 		m_path;
	const char* 		m_func;
	const char* 		m_code;
	bool 				m_parsed;

// Public:
public:

	// ---------------------------------------------------------
	// Constructors.

	// Default constructor.
	inline constexpr
	Loc() {}

	// Constructor.
	inline constexpr
	Loc(
		  const int& line,
		  const int& column,
		  const char* path,
		  const char* func
	) : m_line(line), m_column(column), m_path(path), m_func(func), m_code(""), m_parsed(false) {}

	// Copy constructor.
	inline constexpr
	Loc(const This& x) : m_line(x.m_line), m_column(x.m_column), m_path(x.m_path), m_func(x.m_func), m_code(x.m_code), m_parsed(x.m_parsed) {}

	// Move constructor.
	inline constexpr
	Loc(This&& x) : m_line(x.m_line), m_column(x.m_column), m_path(x.m_path), m_func(x.m_func), m_code(x.m_code), m_parsed(x.m_parsed) {}

	// ---------------------------------------------------------
	// Assignment operators.

	// Copy assignment operator.
	inline constexpr
	auto&		operator =(const This& x) {
		m_line = x.m_line;
		m_column = x.m_column;
		m_path = x.m_path;
		m_func = x.m_func;
		m_code = x.m_code;
		m_parsed = x.m_parsed;
		return *this;
	}

	// Move assignment operator.
	inline constexpr
	auto&		operator =(This&& x) {
		m_line = x.m_line;
		m_column = x.m_column;
		m_path = x.m_path;
		m_func = x.m_func;
		m_code = x.m_code;
		m_parsed = x.m_parsed;
		return *this;
	}

	// ---------------------------------------------------------
	// Functions.

	// Check if attribute is not null.
	inline constexpr
	bool 	has_path() const {
		return m_path;
	}
	inline constexpr
	bool 	has_func() const {
		return m_func;
	}
	inline constexpr
	bool 	has_code() const {
		return m_code;
	}

	// Get attributes.
	/*  @docs {
		@title: Line
		@type: int&
		@description:
			Get the line number attribute.
	} */
	inline constexpr
	auto& 	line() const {
		return m_line;
	}
	/*  @docs {
		@title: Column
		@type: int&
		@description:
			Get the column number attribute.
	} */
	inline constexpr
	auto& 	column() const {
		return m_column;
	}
	/*  @docs {
		@title: Path
		@description:
			Get the file path attribute.
	} */
	inline constexpr
	const char* path() const {
		if (!m_path) {
			return "";
		} else {
			return m_path;
		}
	}
	/*  @docs {
		@title: Func
		@description:
			Get the function name attribute.
	} */
	inline constexpr
	const char* func() const {
		if (!m_func) {
			return "";
		} else {
			return m_func;
		}
	}
	inline constexpr
	const char* code() const {
		if (!m_code) {
			return "";
		} else {
			return m_code;
		}
	}

	// Parse code.
	// inline constexpr
	void parse() { m_code = ""; }
	// void parse();
	/* Old:
	{
		if (not m_parsed) {

			// Load data.
			std::string data = load_file(m_path);

			// Retrieve code line.
			int starti;
			int lcount = 0;
			for (auto& i: data.iterate_code()) {
				if (not i.is_string() and not i.is_char_t() and i.prev() != '\\' and i.character() == '\n') {
					if (lcount == line - 2) {
						starti = i.index;
					} else if (lcount >= line - 1) {
						int n = i.index - starti + 1;
						if (n > 0) {
							code = data.slice_r(starti + 1, i.index).cstr();
						}
						break;
					}
					++lcount;
				}
			}

			// Set parsed.
			m_parsed = true;

		}
	}*/

	// Get current location.
	// Every preprocessor needs a func for vdocs.
	#if __has_builtin(__builtin_COLUMN) || (defined(_MSC_VER) && _MSC_VER > 1925)
	/*  @docs {
		@title: Get
		@description:
			Construct a `Loc` object.
	} */
	inline static constexpr Loc get(
		 const int& line = __builtin_LINE(),
		 const int& column = __builtin_COLUMN(),
		 const char* path = __builtin_FILE(),
		 const char* func = __builtin_FUNCTION()
	) noexcept
	{ return Loc(line, column, path, func); }
	#elif defined(__GNUC__) and (__GNUC__ > 4 or (__GNUC__ == 4 and __GNUC_MINOR__ >= 8))
	inline static constexpr Loc get(
		 const int& line = __builtin_LINE(),
		 const int& column = -1,
		 const char* path = __builtin_FILE(),
		 const char* func = __builtin_FUNCTION()
	) noexcept
	{ return Loc(line, column, path, func); }
	#else
	inline static constexpr Loc get(
		 const int& line = -1,
		 const int& column = -1,
		 const char* path = "Unknown",
		 const char* func = "Unknown"
	) noexcept
	{ return Loc(line, column, path, func); }
	#endif


	//
};

// ---------------------------------------------------------
// Shortcuts.

namespace shortcuts {
namespace types {

using Loc =		vlib::Loc;

}; 		// End namespace types.
}; 		// End namespace shortcuts.

// ---------------------------------------------------------
// Instances.

// Is instance.
template<> 				struct is_instance<Loc, Loc>	{ SICEBOOL value = true;  };

// Is type.
template<typename Type> struct is_Loc 					{ SICEBOOL value = false; };
template<> 				struct is_Loc<Loc> 				{ SICEBOOL value = true;  };

}; 		// End namespace vlib.
#endif 	// End header.
