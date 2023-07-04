// Author: Daan van den Bergh
// Copyright: © 2022 Daan van den Bergh.

// Header.
#ifndef VLIB_NPOS_T_H
#define VLIB_NPOS_T_H

// Namespace vlib.
namespace vlib {

// Null position type.
/*  @docs {
	@chapter: types
	@title: Null position
	@description:
		Null position type
	@usage:
        #include <vlib/types.h>
		vlib::NPos npos;
		if (... == npos) {
		}
		if (... == NPos::npos) {
		}
} */

struct NPos {

// Private:
private:

	// ---------------------------------------------------------
	// Aliases.

	using 		This = 		NPos;

// Public:
public:

	// ---------------------------------------------------------
	// Static attributes.

	static inline const char* 		id = 		"NPos";
	static inline const ullong 		npos = 		internal::npos;
	static inline constexpr ullong 	ncnpos = 	internal::npos;

	// ---------------------------------------------------------
	// Constructors.

	// Default constructor.
	constexpr
	NPos() {}
	
	// ---------------------------------------------------------
	// Casts.

	// Parse from const char*.
	SICE
	This	parse(const char*, const ullong) {
		return NPos();
	}

	// As str.
	constexpr
	auto	str() const;

	// As json formatted String
	constexpr
	auto	json() const;

	// ---------------------------------------------------------
	// Operators.

	// For unused var warnings.
	void operator ++() const {}

	// Operator ==.
	template <typename Type> requires (is_ullong<Type>::value) inline constexpr friend
	bool	operator ==(const This& obj, const Type& x) {
		return NPos::npos == x;
		++obj;
	}
	template <typename Type> requires (!is_ullong<Type>::value && is_any_integer<Type>::value) inline constexpr friend
	bool	operator ==(const This& obj, const Type& x) {
		return NPos::npos == (ullong) x;
		++obj;
	}

	// Operator !=.
	template <typename Type> requires (is_ullong<Type>::value) inline constexpr friend
	bool	operator !=(const This& obj, const Type& x) {
		return NPos::npos != x;
		++obj;
	}
	template <typename Type> requires (!is_ullong<Type>::value && is_any_integer<Type>::value) inline constexpr friend
	bool	operator !=(const This& obj, const Type& x) {
		return NPos::npos != (ullong) x;
		++obj;
	}

	// Dump to pipe.
	constexpr friend
	auto& 	operator <<(Pipe& pipe, const This&) {
		pipe.dump("npos", 4);
		return pipe;
	}

	//
};

// ---------------------------------------------------------
// Global constants.

const NPos npos;

// ---------------------------------------------------------
// Instances.

// Is instance.
template<> 	struct is_instance<NPos, NPos>		{ SICEBOOL value = true;  };

// Is type.
template<typename T> 	struct is_NPos 					{ SICEBOOL value = false; };
template<> 				struct is_NPos<NPos> 				{ SICEBOOL value = true;  };

// ---------------------------------------------------------
// Shortcuts.

namespace types { namespace shortcuts {

using NPos =		vlib::NPos;

}; 		// End namespace sockets.
}; 		// End namespace shortcuts.

// ---------------------------------------------------------
// End.

}; 		// End namespace vlib.
#endif 	// End header.
