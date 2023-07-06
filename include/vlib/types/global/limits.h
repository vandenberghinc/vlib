// Author: Daan van den Bergh
// Copyright: © 2022 Daan van den Bergh.

// Header.
#ifndef VLIB_LIMITS_H
#define VLIB_LIMITS_H

// Includes.
#include <limits.h>
#include <float.h>

// Namespace vlib.
namespace vlib {

// ---------------------------------------------------------
// Static limits type.

/* @docs {
	@chapter: types
	@title: Limits
	@description:
		Numeric limits structure.
	@usage:
		#include <vlib/types.h>
		int int_max = vlib::limits<int>::max;
} */
template <typename Type>
struct limits {};

// Type: char.
template <>
struct limits<char> {
	SICE int max = SCHAR_MAX;
	SICE int min = SCHAR_MIN;
};

// Type: ushort.
template <>
struct limits<uchar> {
	SICE int max = UCHAR_MAX;
};

// Type: short.
template <>
struct limits<short> {
	SICE int max = SHRT_MAX;
	SICE int min = SHRT_MIN;
};

// Type: ushort.
template <>
struct limits<ushort> {
	SICE int max = USHRT_MAX;
};

// Type: int.
template <>
struct limits<int> {
	SICE int max = INT_MAX;
	SICE int min = INT_MIN;
};

// Type: uint.
template <>
struct limits<uint> {
	SICE int max = UINT_MAX;
};

// Type: long.
template <>
struct limits<long> {
	SICE llong max = LONG_MAX;
	SICE llong min = LONG_MIN;
};

// Type: ulong.
template <>
struct limits<ulong> {
	SICE ullong max = ULONG_MAX;
};

// Type: llong.
template <>
struct limits<llong> {
	SICE llong max = LONG_MAX;
	SICE llong min = LONG_MIN;
};

// Type: ulong.
template <>
struct limits<ullong> {
	SICE ullong max = ULONG_MAX;
};

// Type: float.
template <>
struct limits<float> {
	SICE float max = FLT_MAX;
	SICE float min = FLT_MIN;
	SICE float epsilon = FLT_EPSILON;
};

// Type: float.
template <>
struct limits<double> {
	SICE double max = DBL_MAX;
	SICE double min = DBL_MIN;
	SICE double epsilon = DBL_EPSILON;
};

// Type: float.
template <>
struct limits<ldouble> {
	SICE ldouble max = LDBL_MAX;
	SICE ldouble min = LDBL_MIN;
	SICE ldouble epsilon = LDBL_EPSILON;
};

// ---------------------------------------------------------
// End.

}; 		// End namespace vlib.
#endif 	// End header.
