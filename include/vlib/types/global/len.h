// Author: Daan van den Bergh
// Copyright: © 2022 Daan van den Bergh.

// Header.
#ifndef VLIB_LEN_H
#define VLIB_LEN_H

// Namespace vlib.
namespace vlib {

// Length of char*.
template		<typename Type = ullong> requires (is_any_numeric<Type>::value) inline constexpr
Type	len(const char* x) {
	Type n = 0;
	while (*x) { ++n; ++x; }
	return n;
}
template		<typename Type = ullong> requires (is_any_numeric<Type>::value) inline constexpr
Type	len(char* x) {
	Type n = 0;
	while (*x) { ++n; ++x; }
	return n;
}

// Length of init list.
template <typename Type> inline constexpr
ullong	len(std::initializer_list<Type> x) { return x.size(); }

// Length of vector.
template <typename Type> inline constexpr
ullong	len(std::vector<Type> x) { return x.size(); }

// Get the length of a bool as string.
template <typename Type = const bool&> requires (is_bool<Type>::value) inline constexpr
ullong	len(Type x) { if (x) { return 4; } return 5; }

// Get the length of a char.
template <typename Type = const char&> requires (is_char<Type>::value) inline constexpr
ullong	len(Type x) { if (x == Type()) { return 0; } return 1; }

// Check if char is a space.
inline constexpr
bool 		is_space(const char& c) {
	return c == ' ' || c == '\t';
}

}; 		// End namespace vlib.
#endif 	// End header.
