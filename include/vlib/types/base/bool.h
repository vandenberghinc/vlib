// Author: Daan van den Bergh
// Copyright: © 2022 Daan van den Bergh.

// Header.
#ifndef VLIB_BOOL_T_H
#define VLIB_BOOL_T_H

// Namespace vlib.
namespace vlib {

// Boolean type.
/*  @docs {
	@chapter: types
	@title: Boolean
	@description:
		A boolean type.
	@usage:
        #include <vlib/types.h>
		vlib::Bool x = true;
} */
struct Bool {

	// ---------------------------------------------------------
	// Aliases.

	using		This = 		Bool;

	// ---------------------------------------------------------
	// Attributes.

	bool		m_bool;

	// ---------------------------------------------------------
	// Constructors.

	// Default constructor.
	constexpr
	Bool() : m_bool(false) {}

	// Constructor from void.
	/*  @docs {
		@title: Constructor
		@description:
			Construct a `Bool` object.
		@usage:
			Bool x (true);
	} */
	constexpr
	Bool(bool x) : m_bool(x) {}

	// Copy constructor.
	constexpr
	Bool(const Bool& x) : m_bool(x.m_bool) {}

	// Move constructor.
	constexpr
	Bool(Bool&& x) : m_bool(x.m_bool) {}

	// ---------------------------------------------------------
	// Assignment operators.

	// Assignment operator from bool.
	constexpr
	This&	operator =(bool x) {
		m_bool = x;
		return *this;
	}

	// Copy assignment operator.
	constexpr
	This&	operator =(const Bool& x) {
		m_bool = x.m_bool;
		return *this;
	}

	// Move assignment operator.
	constexpr
	This&	operator =(Bool&& x) {
		m_bool = x.m_bool;
		return *this;
	}

	// ---------------------------------------------------------
	// Functions.

	// Is undefined.
	/*  @docs {
        @title: Is undefined
        @description:
			Check if the object is undefined.
        @usage:
			vlib::Bool x;
			x.is_undefined(); ==> true;
	} */
	constexpr
	bool	is_undefined() const { return m_bool == bool(); }

	// Reverse.
	/*  @docs {
        @title: Reverse
        @description:
			Reverses a `Bool` with value `true` to `false` and a `Bool` with value `false` to `true`.
        @return:
            Function `reverse` returns a new `Bool` object while function `reverse_r` updates the current object and returns a reference to the current object.
        @usage:
			vlib::Bool x = false;
			vlib::Bool y = x.reverse(); y ==> true;
        @funcs: 2
	} */
    constexpr
    This    reverse() {
        return !m_bool;
    }
	constexpr
	This&	reverse_r() {
        m_bool = !m_bool;
		return *this;
	}
	
	// Raw value.
	/*  @docs {
		@title: Value
		@type: bool&
		@description:
			Get the underlying bool attribute.
	} */
	constexpr
	auto&	value() {
		return m_bool;
	}

	// ---------------------------------------------------------
	// Casts.

	// Parse from a const char*.
    /*  @docs {
        @title: Parse
        @description:
            Parse a boolean from a char array with length.
        @return:
            Returns a `Bool` object.
        @usage:
            vlib::Bool x = vlib::Bool::parse("true", 4);
    } */
	SICE
	This	parse(const char*, ullong len) {
		switch (len) {
			case 4: 	return true;
			default: 	return false;
		}
	}

	// As str.
	/*  @docs {
		@title: String
		@type: String
		@description:
			Get as string.
	} */
	constexpr
	auto	str() const;

	// As json formatted String
	/*  @docs {
		@title: JSON
		@type: String
		@description:
			Get as json formatted `String`.
	} */
	constexpr
	auto	json() const;

	// As bool.
	constexpr
	operator bool() const { return m_bool; }

	// Dump to pipe.
	constexpr friend
	auto& 	operator <<(Pipe& pipe, const This& obj) {
		if (obj.m_bool) {
			pipe.dump("true", 4);
		} else {
			pipe.dump("false", 5);
		}
		return pipe;
	}

	//
};

// ---------------------------------------------------------
// Instances.

// Is type.
template<typename Type> struct is_Bool 					{ SICEBOOL value = false; };
template<> 				struct is_Bool<Bool> 			{ SICEBOOL value = true;  };

// ---------------------------------------------------------
// Shortcuts.

namespace types { namespace shortcuts {

using Bool =		vlib::Bool;

}; 		// End namespace sockets.
}; 		// End namespace shortcuts.

// ---------------------------------------------------------
// End.

}; 		// End namespace vlib.
#endif 	// End header.
