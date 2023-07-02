// Author: Daan van den Bergh
// Copyright: © 2022 Daan van den Bergh.

// Header.
#ifndef VLIB_CSTR_T_H
#define VLIB_CSTR_T_H

// Namespace vlib.
namespace vlib {

// CString type.
/* 	@docs {
	@chapter: types
	@title: CString
	@description:
		CString type.
	@warning:
		Causes undefined behaviour when the constructed pointer goes out of scope.
	@usage:
        #include <vlib/types.h>
		vlib::CString x ("Hello World!", 12);
} */
struct CString {

	// ---------------------------------------------------------
	// Aliases.

	using 		This = 		CString;
	using 		Type =		char;
	using 		Length =	ullong;
	using		array_h = 	vlib::array<Type, Length>;

	// ---------------------------------------------------------
	// Attributes.

	const Type*			m_arr;
	Length				m_len;

	// ---------------------------------------------------------
	// Construct functions.

	// Construct from array and length.
	constexpr
	auto&	construct(const Type* arr, const Length len) {
		m_arr = arr;
		m_len = len;
		return *this;
	}

	// ---------------------------------------------------------
	// Constructors.

	// Default constructor.
	inline constexpr
	CString		()
	:			m_arr(nullptr), m_len(0) {}

	// Constructor from const char* with length.
	inline constexpr
	CString		(const Type* arr)
	: 			m_arr(arr), m_len(vlib::len(arr)) {}
	
	// Constructor from const char*.
	inline constexpr
	CString		(const Type* arr, const Length len)
	: 			m_arr(arr), m_len(len) {}

	// Copy constructor.
	inline constexpr
	CString		(const This& obj)
	: 			m_arr(obj.m_arr), m_len(obj.m_len) {}

	// Move constructor.
	inline constexpr
	CString		(This&& obj)
	:			m_arr(obj.m_arr), m_len(obj.m_len) {
		obj.m_arr = nullptr;
	}

	// ---------------------------------------------------------
	// Assignment operators.

	// Assignment operator from int.
	template <typename Type> requires (is_cstr<Type>::value) inline constexpr
	auto&	operator =(
		Type	 		arr			// the constant char array.
	) {
		m_arr = arr;
		m_len = vlib::len(arr);
		return *this;
	}

	// Copy assignment operator.
	inline constexpr
	auto&	operator =(
		const This& 	obj			// the object to copy.
	) {
		m_arr = obj.m_arr;
		m_len = obj.m_len;
		return *this;
	}

	// Move assignment operator.
	inline constexpr
	auto&	operator =(
		This&& 			obj			// the object to move.
	) {
		m_arr = obj.m_arr;
		m_len = obj.m_len;
		obj.m_arr = nullptr;
		obj.m_len = 0;
		return *this;
	}
	
	// ---------------------------------------------------------
	// Construct functions.
	
	inline constexpr
	auto&	swap(
		This& 			obj			// the object to move.
	) {
		m_arr = obj.m_arr;
		m_len = obj.m_len;
		obj.m_arr = nullptr;
		obj.m_len = 0;
		return *this;
	}

	// ---------------------------------------------------------
	// Functions.
	
	// Is undefined.
	/* @docs {
	  @title: Is undefined
	  @description:
			Check if the object is undefined.
	  @usage:
			CString x;
			x.is_undefined(); ==> true;
	} */
	inline constexpr
	bool 		is_undefined() const {
		return m_len == 0;
	}

	
	// Length.
	/* @docs {
	  @title: Len
	  @description:
			Get the length of the object.
	} */
	inline constexpr
	auto&	len() const {
		return m_len;
	}

	// Allocated length purely for "String::construct".
	// - Do not return this by reference.
	inline constexpr
	auto	capacity() const {
		return m_len;
	}
	
	// Reset all attributes.
	/* @docs {
	  @title: Reset
	  @description:
			Reset all attributes.
	  @usage:
			Array<char> x = "Hello World!";
			x.reset(); ==> nullptr
	} */
	inline constexpr
	auto& 	reset() {
		m_arr = nullptr;
		m_len = 0;
		return *this;
	}
	
	// First element.
	inline constexpr
	auto& 	first() const {
		return m_arr[0];
	}

	// Last element.
	inline constexpr
	auto& 	last() const {
		return m_arr[m_len-1];
	}

	// Get by reference.
	//  - Does not support negative indexes.
	inline constexpr
	auto& 	get(const Length index) const {
		return m_arr[index];
	}
	inline constexpr
	auto& 	rget(const Length index) const {
		return m_arr[m_len - index];
	}
	
	// Equals.
	inline constexpr
	bool 	eq(
		const Type* 	arr,	// the second array of the comparison.
		const Length 	len		// the length to check.
	) const {
		return array_h::eq(m_arr, len, arr, len);
	}

	// Equals a char array.
	inline constexpr
	bool 	eq(
		const Type* 	arr				// the second array of the comparison.
	) const {
		return array_h::eq(m_arr, m_len, arr, vlib::len(m_arr));
	}

	// Equals a Array.
	inline constexpr
	bool 	eq(
		const This& 	obj				// the second array of the comparison.
	) const {
		return array_h::eq(m_arr, m_len, obj.m_arr, obj.m_len);
	}
	
	// Data.
	inline constexpr
	auto& 	data() const {
		return m_arr;
	}
	
	// ---------------------------------------------------------
	// Iterations.

	// Begin.
	constexpr
	auto& 	begin() const {
		return m_arr;
	}
	constexpr
	auto 	begin(const Length index) const {
		return m_arr + index;
	}

	// End
	constexpr
	auto 	end() const {
		return m_arr + m_len;
	}
	constexpr
	auto 	end(const Length index) const {
		return m_arr + index;
	}

	// Iterate.
	template <typename Iter = Forwards, typename... Air> requires (
		is_Forwards<Iter>::value ||
		is_Backwards<Iter>::value
	) constexpr
	auto 	iterate() const {
		return vlib::internal::array::iter_t<Iter, Type, Length>(
			0,
			m_len,
			m_arr );
	}
	template <typename Iter = Forwards, typename... Air> requires (
		is_Forwards<Iter>::value ||
		is_Backwards<Iter>::value
	) constexpr
	auto 	iterate(const Length sindex, const Length eindex = internal::npos) const {
		switch (eindex) {
			case internal::npos:
				return vlib::internal::array::iter_t<Iter, Type, Length>(
					sindex,
					m_len,
					m_arr );
			default:
				return vlib::internal::array::iter_t<Iter, Type, Length>(
					sindex,
					eindex,
					m_arr );
		}
	}

	// Iterate indexes.
	template <typename Iter = Forwards, typename... Air> requires (
		is_Forwards<Iter>::value ||
		is_Backwards<Iter>::value
	) constexpr
	auto 	indexes() const {
		return Range<Iter, Length>(0, m_len);
	}
	template <typename Iter = Forwards, typename... Air> requires (
		is_Forwards<Iter>::value ||
		is_Backwards<Iter>::value
	) constexpr
	auto 	indexes(const Length sindex, const Length eindex = internal::npos) const {
		switch (eindex) {
			case internal::npos:
				return Range<Iter, Length>(sindex, m_len);
			default:
				return Range<Iter, Length>(sindex, eindex);
		}

	}
	
	// ---------------------------------------------------------
	// Casts.

	// As const char*.
	inline constexpr
	const char*	c_str() const {
		if (m_arr == nullptr) { return ""; }
		return m_arr;
	}

	// Parse from a const char*.
	SICE
	This	parse(const char* arr, ullong len) {
		return CString(arr, len);
	}
	
	// As String
	constexpr
	auto 	str() const;

	// As json formatted String
	constexpr
	auto 	json() const;

	// ---------------------------------------------------------
	// Operators.
	
	// Operator "*".
	inline constexpr
	auto& 		operator *() const {
		return *m_arr;
	}

	// Equals.
	inline constexpr friend
	bool	 	operator ==(const This& x, const This& y) {
		return x.eq(y);
	}
	inline constexpr friend
	bool	 	operator !=(const This& x, const This& y) {
		return !x.eq(y);
	}

	// Equals with char array.
	inline constexpr friend
	bool	 	operator ==(const This& x, const char* y) {
		return x.eq(y);
	}
	inline constexpr friend
	bool	 	operator !=(const This& x, const char* y) {
		return !x.eq(y);
	}
	
	// Compare array lengths.
	inline constexpr
	bool 		operator >(const This& x) const {
		return m_len > x.m_len;
	}
	inline constexpr
	bool 		operator <(const This& x) const {
		return m_len < x.m_len;
	}
	inline constexpr
	bool 		operator >=(const This& x) const {
		return m_len >= x.m_len;
	}
	inline constexpr
	bool 		operator <=(const This& x) const {
		return m_len <= x.m_len;
	}

	// Compare array lengths with any numeric.
	template <typename nT> requires (is_any_numeric<nT>::value) inline constexpr
	bool 		operator >(const nT& x) const {
		return m_len > abs<Length>(x);
	}
	template <typename nT> requires (is_any_numeric<nT>::value) inline constexpr
	bool 		operator <(const nT& x) const {
		return m_len < abs<Length>(x);
	}
	template <typename nT> requires (is_any_numeric<nT>::value) inline constexpr
	bool 		operator >=(const nT& x) const {
		return m_len >= abs<Length>(x);
	}
	template <typename nT> requires (is_any_numeric<nT>::value) inline constexpr
	bool 		operator <=(const nT& x) const {
		return m_len <= abs<Length>(x);
	}

	// Operators "+, ++, +=" with any numeric.
	inline constexpr
	auto& 		operator ++() {
		if (m_len == 0) { return *this; }
		++m_arr;
		return *this;
	}
	inline constexpr
	auto& 		operator ++(int) {
		if (m_len == 0) { return *this; }
		++m_arr;
		return *this;
	}
	template <typename Numeric> requires (is_any_numeric<Numeric>::value) inline constexpr
	auto 		operator +(const Numeric& x) const {
		if (m_len == 0) { return *this; }
		This obj (*this);
		obj.m_arr += abs<Length>(x);
		return obj;
	}
	template <typename Numeric> requires (is_any_numeric<Numeric>::value) inline constexpr
	auto& 		operator +=(const Numeric& x) {
		if (m_len == 0) { return *this; }
		m_arr += abs<Length>(x);
		return *this;
	}

	// Operators "-, --, -=" with any numeric.
	inline constexpr
	auto& 		operator --() {
		if (m_len == 0) { return *this; }
		--m_len;
		return *this;
	}
	inline constexpr
	auto& 		operator --(int) {
		if (m_len == 0) { return *this; }
		--m_len;
		return *this;
	}
	template <typename Numeric> requires (is_any_numeric<Numeric>::value) inline constexpr
	auto 		operator -(const Numeric& x) const {
		if (m_len == 0) { return *this; }
		This obj (*this);
		obj.m_len = max((Length) 0, x.m_len - abs<Length>(x));
		return obj;
	}
	template <typename Numeric> requires (is_any_numeric<Numeric>::value) inline constexpr
	auto& 		operator -=(const Numeric& x) {
		if (m_len == 0) { return *this; }
		m_len = max((Length) 0, m_len - abs<Length>(x));
		return *this;
	}
	
	// Subscript operator
	inline constexpr
	auto& 		operator [](const Length index) const {
		if (index == npos) {
			throw IndexError("The specified index was out of range.");
		}
		return m_arr[index];
	}

	// Dump to pipe.
	constexpr friend
	auto& 	operator <<(Pipe& pipe, const This& obj) {
		pipe.dump(obj.m_arr, obj.m_len);
		return pipe;
	}

	//
};

// ---------------------------------------------------------
// Instances.

// Is instance.
template<> 				struct is_instance<CString, CString>	{ SICEBOOL value = true;  };

// Is type.
template<typename Type> struct is_CString 					{ SICEBOOL value = false; };
template<> 				struct is_CString<CString> 			{ SICEBOOL value = true;  };

// ---------------------------------------------------------
// Shortcuts.

namespace shortcuts {
namespace types {

using CString =		vlib::CString;

}; 		// End namespace sockets.
}; 		// End namespace shortcuts.

// ---------------------------------------------------------
// End.

}; 		// End namespace vlib.
#endif 	// End header.
