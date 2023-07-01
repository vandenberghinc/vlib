// Author: Daan van den Bergh
// Copyright: © 2022 Daan van den Bergh.

// Header.
#ifndef VLIB_MATH_H
#define VLIB_MATH_H

// Includes.
#include <math.h> // for sqrt.

// Namespace vlib.
namespace vlib {

// Check if any integral type is negative.
template <typename Type> requires (is_any_numeric<Type>::value) inline constexpr
bool	 	is_neg(Type x) {
	return x < 0;
}

// Check if T is inf.
template <typename Type> requires (is_floating<Type>::value) inline constexpr
bool 		isinf(Type x) {
	return __builtin_isinf(x);
}

// Ceiling.
template <typename Length = long long, typename Type = long double> requires (is_any_numeric<Length>::value && is_floating<Type>::value) inline constexpr
Length 		ceil(Type x) {
	if (x < 0) { return -ceil<Length,Type>(-x) + 1; }
	else if (x == (Type) (Length) x) { return (Length) x; }
	return (Length) (x + 1);
}

// Floor.
template <typename Length = long long, typename Type = long double> requires (is_any_numeric<Length>::value && is_floating<Type>::value) inline constexpr
Length 		floor(Type x) {
	if (x < 0) { return -floor<Length,Type>(-x) - 1; }
	return (Length) x;
}

// As absolute.
template <typename Type>  requires (is_floating<Type>::value) inline constexpr
auto 		abs(Type x) {
	if (x < 0) { return -x; }
	return x;
}
template <typename Type>  requires (is_signed_numeric<Type>::value) inline constexpr
auto 		abs(Type x) {
	if (x < 0) { return (unsigned) -x; }
	return (unsigned) x;
}
// template <typename Type>  requires (is_unsigned_numeric<Type>::value) inline constexpr
// auto& 			abs(Type x) {
// 	return x;
// }

// As absolute with cast.
// - Cast any signed int / double to an uint.
// - Double types are rounded down.
template <typename To, typename From>  requires (is_unsigned_numeric<To>::value && (is_signed_numeric<From>::value || is_floating<From>::value)) inline constexpr
auto	 	abs(const From& x) {
	if (x < 0) { return (To) -x; }
	return (To) x;
}
template <typename To, typename From>  requires (is_unsigned_numeric<To>::value && is_unsigned_numeric<From>::value) inline constexpr
auto&		abs(const From& x) {
	return x;
}

// Max between numbers.
template <typename Type> inline constexpr
Type 		max(Type x) {
	return x;
}
template <typename Type, typename... Args> inline constexpr
Type 		max(Type x, Type y, Args&&... args) {
	if (x > y) { return max(x, args...); }
	return max(y, args...);
}

// Min between numbers.
template <typename Type> inline constexpr
Type 		min(Type x) {
	return x;
}
template <typename Type, typename... Args> inline constexpr
Type 		min(Type x, Type y, Args&&... args) {
	if (x < y) { return min(x, args...); }
	return min(y, args...);
}

// Power of.
// - WARNING: Keep seperate since tonumeric will fail otherwise.
template <typename Type> requires (!is_floating<Type>::value) inline constexpr
ullong pow(Type x, Type y) {
	// if (isinf(x)) { return x; } // for fix inf loop when doing "pow(any out of range unsigned value, ...)".
	if (x < 0) { return -pow(-x, y); }
	ullong l = 1;
	ullong lx = (Type) x;
	for (Type i = 0; i < y; ++i) { l *= lx; }
	return l;
}
template <typename Type> requires (is_floating<Type>::value) inline constexpr
Type pow(Type x, Type y) {
	// if (isinf(x)) { return x; } // for fix inf loop when doing "pow(any out of range unsigned value, ...)".
	if (x < 0) { return -pow(-x, y); }
	Type l = 1;
	Type lx = (Type) x;
	for (Type i = 0; i < y; ++i) { l *= lx; }
	return l;
}

// Get the square root.
template <typename Type> inline constexpr
Type 		sqrt(Type number) {
	return ::sqrt(number);
	// Type error = 0.00001; // precision.
	// Type s = number;
	// while ((s - number / s) > error) { // loop.
	// 	s = (s + number / s) / 2.0;
	// }
	// return s;
}

// Check if any integer value is even.
template <typename Type> requires (vlib::is_any_integer<Type>::value) inline constexpr
bool 		is_even(Type x) {
	return x / 2 == ((long double) x) / 2;
}

// Round double.
template <typename Length = int, typename Type> requires (vlib::is_any_numeric<Length>::value || vlib::is_floating<Type>::value) inline constexpr
Length 		round(Type x) {
	// Without logs.
	// if (x - floor<Length>(x) <= ceil<Length>(x) - x) {
	// 	return floor<Length>(x);
	// } else {
	// 	return ceil<Length>(x);
	// }
	// With logs.
	Type up = x - floor(x);
	Type down = ceil(x) - x;
	// std::cout << "up: " << up << "\n";
	// std::cout << "down: " << down << "\n";
	if (up <= down) {
		return (Length) floor(x);
	} else {
		return (Length) ceil(x);
	}
}
template <typename Type> requires (is_floating<Type>::value) inline constexpr
Type 		round(Type x, int precision) {
	if (precision == 0) { return round(x); }
	else if (x < 0) {
		x = -x;
		auto p = pow(10, precision);
		x = (ullong) ((x * p) + 0.5);
		x /= p;
		return -x;
	} else {
		auto p = pow(10, precision);
		x = (ullong) ((x * p) + 0.5);
		x /= p;
		return x;
	}
}
template <typename Type>  requires (!is_floating<Type>::value) inline constexpr
Type 		round(Type x) { return x; }
template <typename Type>  requires (!is_floating<Type>::value) inline constexpr
Type 		round(Type x, int) { return x; }

// Machine dependent epsilon.
template <typename Type = long double> requires (is_floating<Type>::value) inline constexpr
Type 		epsilon(Type x = 1) {
	Type y = 0.0;
	while ((1 + x) != 1) { y = x; x /= 2; }
	return y;
}

// Get the decimals from a double.
// So "todecimals(125.0235)" will return ".0235".
template <typename Type>  requires (is_floating<Type>::value) inline constexpr
Type 		todecimals(Type x) {
	if (x < 0) { return x + ceil(x); }
	return x - floor(x);
}
template <typename Type>  requires (!is_floating<Type>::value) inline constexpr
Type 		todecimals(Type x) {
	return 0;
	if (x) {}
}

// Check if a T has decimals.
// Will always return false when the double's full length is greater than "".
template <typename Type>  requires (is_floating<Type>::value) inline constexpr
bool 		has_decimals(Type x) {
	if (x < 0) { return x + ceil(x) != 0; }
	return x - floor(x) != 0;
}
template <typename Type>  requires (!is_floating<Type>::value) inline constexpr
bool 		has_decimals(Type x) {
	return false;
	if (x) {}
}

// Get the last digits from an integer type.
// @TODO not entirely safe with casting - should only combine unsigned and signed etc.
template <typename Type>  requires (is_any_integer<Type>::value) inline constexpr
long long 	last_digits(Type x, int decimals) {
	long long pow = (long long) vlib::pow(10, decimals);
	return x - ((x / pow) * pow);
}

// Numeric static type.
// Not in use, perhaps for the future.
// struct numeric {
//
// // Public:
// public:
//
// 	// ---------------------------------------------------------
// 	// Functions.
//
// 	// Max.
// 	template <typename Type> SICE
// 	auto max() { return Type(); }
//
// 	// Min.
// 	template <typename Type> SICE
// 	auto min() { return Type(); }
//
// 	//
// };

// Namespace internal.
namespace internal {

// Namespace math.
// namespace math {

// Get the length before the "." of a numeric.
// Beware: every all nine numeric above "9.9e16" will be casted to 1000.0 by the compiler #BUG.
// template 	 	<typename Type> requires (is_floating<Type>::value) inline constexpr
// uint 	len_before_dot(Type x) {
// 	uint len = 1;
// 	x = abs(x);
// 	if (x == 0 || x == 1)
// 		return 1;
// 	while (x > 1) {
// 		len++;
// 		x /= 10;
// 		if (x == 0) { --len; break; }
// 		else if (x < 1) { --len; break; }
// 	}
// 	// if (len >= 17) { --len; }
// 	return len;
// }

// }; 		// End namespace math.
}; 		// End namespace internal.
}; 		// End namespace vlib.
#endif 	// End header.
