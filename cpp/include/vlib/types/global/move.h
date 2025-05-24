// Author: Daan van den Bergh
// Copyright: © 2022 Daan van den Bergh.

// Header.
#ifndef VLIB_MOVE_H
#define VLIB_MOVE_H

// Namespace vlib.
namespace vlib {

// Invoke a copy type.
template <typename Type> inline constexpr
auto copy(const Type& type) {
	return type;
}

// Invoke a move type.
template <typename Type> inline constexpr
auto&& move(Type& type) {
	return static_cast<Type&&>(type);
}

}; 		// End namespace vlib.
#endif 	// End header.
