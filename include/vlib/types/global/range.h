// Author: Daan van den Bergh
// Copyright: © 2022 Daan van den Bergh.

// Header.
#ifndef VLIB_RANGE_H
#define VLIB_RANGE_H

// Namespace vlib.
namespace vlib {

// Normal iteration range type.
/* @docs {
	@chapter: global
	@title: Range
	@description:
		Iterate a certain range.
	@usage:
        #include <vlib/types.h>
 
		// Iterate from 0 till 1000000.
		for (auto& i: vlib::Range(1000000)) { ... }

		// Iterate from 0 till 100.
		for (auto& i: vlib::Range(0, 100)) { ... }

		// Safe while loop.
		auto x = vlib::Range(0, 10);
		while (++x) { ... }
		
		// Iterate from 1000000 till 0.
		for (auto& i: vlib::Range<vlib::Backwards>(1000000)) { ... }

		// Iterate from 100 till 0.
		for (auto& i: vlib::Range<vlib::Backwards>(100, 0)) { ... }

		// Warning!
		// This causes an infinite loop.
		while (++vlib::Range(0, 10)) { ... }
 
}*/
template <typename Iter = Forwards, typename Type = ullong>
struct Range {

// Public:
public:

	// ---------------------------------------------------------
	// Aliases.

	using 		This = 		Range;

	// ---------------------------------------------------------
	// Attributes.

	Type		m_min;
	Type		m_max;

	// ---------------------------------------------------------
	// Constructors.

	// Default constructor.
	inline constexpr
    Range() {};

	// Normal costructor from max.
	inline constexpr
    Range(const Type& max) : m_min(0), m_max(max) {
		if (m_max < 0) {
			m_min = m_max;
			m_max = 0;
		}
	}

	// Normal constructor from min & max.
	inline constexpr
    Range(const Type& min, const Type& max) : m_min(min), m_max(max) {
		if (m_max < 0 && m_min > 0) { // correct mistakes.
			m_min = m_max;
			m_max = 0;
		}
	}

	// ---------------------------------------------------------
	// Functions.

	// Get min & max.
	inline constexpr
	auto 		min() const	{
		return m_min;
	}
	inline constexpr
	auto 		max() const	{
		return m_max;
	}

	// Get min & max as reference.
	inline constexpr
	auto& 		rmin() {
		return m_min;
	}
	inline constexpr
	auto& 		rmax() {
		return m_max;
	}

	// Get the index.
	inline constexpr
	auto 		index() const {
		return m_min;
	}

	// Get the index as reference.
	inline constexpr
	auto& 		rindex() const {
		return m_min;
	}

	// ---------------------------------------------------------
	// Operators.

	// Operators "+"
	inline constexpr
	friend Type	operator +(const This& obj, const Type& x)	{
		return obj.m_min + x;
	}
	inline constexpr
	friend Type	operator +(const Type& x, const This& obj)	{
		return x + obj.m_min;
	}

	// Operators "-"
	inline constexpr
	friend Type	operator -(const This& obj, const Type& x)	{
		return obj.m_min - x;
	}
	inline constexpr
	friend Type	operator -(const Type& x, const This& obj)	{
		return x - obj.m_min;
	}



	// ---------------------------------------------------------
	// Iteration.

	// Start & end.
	inline constexpr
	auto& 		begin() const {
		return *this;
	}
	inline constexpr
	auto& 		end	() const {
		return *this;
	}

	// Operator "!=".
	inline constexpr
	bool 		operator !=(const This& x) const {
		return m_min < x.m_max;
	}
	inline constexpr
	operator 	bool() const {
		return m_min < m_max;
	}

	// Operator "*".
	inline constexpr
	auto& 		operator *() const {
		return m_min;
	}

	// Operator "++".
	inline constexpr
	auto& 		operator ++() {
        // std::cout << "Min: " << m_min << "\n";
		++m_min;
		return *this;
	}

	//
};

// Reversed range.
template <typename Type>
struct Range<Backwards, Type> {

// Public:
public:

	// ---------------------------------------------------------
	// Aliases.

	using 		This = 		Range;

	// ---------------------------------------------------------
	// Attributes.

	Type		m_index;
	Type		m_min;
	Type		m_max;
	bool 		m_stop;

	// ---------------------------------------------------------
	// Constructors.

	// Default constructor.
	inline constexpr
    Range() {};

	// Costructor from max.
    inline constexpr
    Range(const Type& max) requires (is_signed_numeric<Type>::value || is_floating<Type>::value) :
    m_index(max-1),
    m_min(0),
    m_max(max),
    m_stop(false)
    {
		if (m_max < 0) {
			m_min = m_max;
			m_index = (Type) -1;
			m_max = 0;
		}
	}
    inline constexpr
    Range(const Type& max) requires (is_unsigned_numeric<Type>::value) :
    m_index(max == 0 ? 0 : max-1),
    m_min(0),
    m_max(max),
    m_stop(false)
    {
        if (m_max < 0) {
            m_min = m_max;
            m_index = (Type) -1;
            m_max = 0;
        }
    }

	// Constructor from min & max.
    inline constexpr
    Range(const Type& min, const Type& max) requires (is_signed_numeric<Type>::value || is_floating<Type>::value) :
    m_index(max-1),
    m_min(min),
    m_max(max),
    m_stop(false)
    {
        if (m_max < 0 && m_min > 0) { // correct mistakes.
            m_min = m_max;
            m_index = (Type) -1;
            m_max = 0;
        }
    }
	inline constexpr
    Range(const Type& min, const Type& max) requires (is_unsigned_numeric<Type>::value) :
    m_index(max == 0 ? 0 : max-1),
    m_min(min),
    m_max(max),
    m_stop(false)
    {
		if (m_max < 0 && m_min > 0) { // correct mistakes.
			m_min = m_max;
			m_index = (Type) -1;
			m_max = 0;
		}
	}

	// ---------------------------------------------------------
	// Functions.

	// Get min & max.
	inline constexpr
	auto& 		min() const	{
		return m_min;
	}
	inline constexpr
	auto& 		max() const	{
		return m_max;
	}

	// Get the index.
	inline constexpr
	auto& 		index() const {
		return m_index;
	}

	// ---------------------------------------------------------
	// Operators.

	// Operators "+"
	inline constexpr
	friend Type	operator +(const This& obj, const Type& x)	{
		return obj.m_index + x;
	}
	inline constexpr
	friend Type	operator +(const Type& x, const This& obj)	{
		return x + obj.m_index;
	}

	// Operators "-"
	inline constexpr
	friend Type	operator -(const This& obj, const Type& x)	{
		return obj.m_index - x;
	}
	inline constexpr
	friend Type	operator -(const Type& x, const This& obj)	{
		return x - obj.m_index;
	}

	// ---------------------------------------------------------
	// Iteration.

	// Start & end.
	inline constexpr
	auto& 		begin() const {
		return *this;
	}
	inline constexpr
	auto& 		end	() const {
		return *this;
	}

	// Operator "!=".
	inline constexpr
	bool 		operator !=(const This& x) const {
		return !m_stop && m_index >= x.m_min;
	}
	inline constexpr
	operator 	bool() const {
		return !m_stop && m_index >= m_min;
	}

	// Operator "*".
	inline constexpr
	auto& 		operator *() const {
		return m_index;
	}

	// Operator "++".
	inline constexpr
	auto& 		operator ++() {
		if (m_index == 0) { m_stop = true; }
		--m_index;
		return *this;
	}

	//
};

// ---------------------------------------------------------
// Instances.

// Is type.
template <typename Iter = Forwards, typename Type = ullong>
struct is_Range { SICEBOOL value = false; };
template <typename Iter, typename Type>
struct is_Range<Range<Iter, Type>>    { SICEBOOL value = true;  };

// ---------------------------------------------------------
// Shortcuts.

namespace shortcuts {
namespace types {

template <typename Iter = Forwards, typename Type = ullong> inline constexpr
vlib::Range<Iter, Type> Range(const Type& max) {
    return vlib::Range<Iter, Type>(max);
}
template <typename Iter = Forwards, typename Type = ullong> inline constexpr
vlib::Range<Iter, Type> Range(const Type& min, const Type& max) {
    return vlib::Range<Iter, Type>(min, max);
}

};         // End namespace types.
};         // End namespace shortcuts.

// ---------------------------------------------------------
// End.


}; 		// End namespace vlib.
#endif 	// End header.
