// Author: Daan van den Bergh
// Copyright: © 2022 Daan van den Bergh.

// Header.
#ifndef VLIB_NULL_T_H
#define VLIB_NULL_T_H

// Namespace vlib.
namespace vlib {

// Null type.
/* 	@docs {
	@chapter: types
	@title: Null
	@description:
		A null type.
        
        The global null value is accessable from `vlib::null`.
	@usage:
        #include <vlib/types.h>
		vlib::Null x;
} */
struct Null {

// Public:
public:

	// ---------------------------------------------------------
	// Aliases.

	using		This = 		Null;
	
	// ---------------------------------------------------------
	// Constructors.

	// Default constructor.
	constexpr
	Null() {}

	// ---------------------------------------------------------
	// Functions.

	// Is undefined.
	/* @docs {
	  @title: Is undefined
	  @description:
			Check if the object is undefined.
	  @usage:
			Null x;
			x.is_undefined(); ==> true;
	} */
	constexpr
	bool	is_undefined() const { return true; }

	// ---------------------------------------------------------
	// Operators.

	// Purely to avoid unused var warning.
	constexpr
	void	operator ++() const {}

	// Dump to pipe.
	constexpr friend
	auto& 	operator <<(Pipe& pipe, const This&) {
		pipe.dump("null", 4);
		return pipe;
	}

	// ---------------------------------------------------------
	// Casts.

	// Parse from a const char*.
	SICE
	This	parse(const char*, const ullong&) {
		return Null();
	}

	// As String
	constexpr
	auto 	str() const;

	// As json formatted String
	constexpr
	auto	json() const;

	// As bool.
	constexpr
	operator	bool() const {
		return false;
	}

	//
};

// ---------------------------------------------------------
// Global constant.

constexpr const Null null;

// ---------------------------------------------------------
// Instances.

// Is instance.
template<> 				struct is_instance<Null, Null>		{ SICEBOOL value = true;  };

// Is null type.
template<typename Type> struct is_Null 						{ SICEBOOL value = false; };
template<> 				struct is_Null<Null> 				{ SICEBOOL value = true;  };

// ---------------------------------------------------------
// Shortcuts.

namespace shortcuts {
namespace types {

constexpr const Null null;
using Null =		vlib::Null;

}; 		// End namespace sockets.
}; 		// End namespace shortcuts.

// ---------------------------------------------------------
// End.

}; 		// End namespace vlib.
#endif 	// End header.
