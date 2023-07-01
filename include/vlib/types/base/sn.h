// Author: Daan van den Bergh
// Copyright: © 2022 Daan van den Bergh.
//
// DEPRECATED
//

// Header.
#ifndef VLIB_SN_T_H
#define VLIB_SN_T_H

// Namespace vlib.
namespace vlib {

// Scientific notation type.
// Everything equal or greater than "999999.999999" will automatically be rounded to 1000000 by the compiler.
/*  @docs {
	@chapter: types
	@title: Scientific Notation
	@description:
		Scientific notation type.
	@usage:
		SN x (0);
} */
struct SN {

// Private:
private:

	// ---------------------------------------------------------
	// Aliases.

	using			This = 			SN;

	// ---------------------------------------------------------
	// Attributes.

	int 			m_pow;
	long double		m_double;
	const char*		m_arr;
	bool 			m_is_floating;

	// ---------------------------------------------------------
	// Utilities.

	// Private constructor.
	// When unsigned.
	template <typename Type> requires(is_unsigned<Type>::value) inline constexpr
	void 	construct (const Type& y) {
		// long double x = (long double) y;
	}
	// When signed.
	template <typename Type> requires(is_signed<Type>::value) inline constexpr
	void 	construct (const Type& y) {

	}
	// When any double.
	template <typename Type> requires(is_floating<Type>::value) inline constexpr
	void 	construct (const Type& y) {
	}

// Public:
public:

	// ---------------------------------------------------------
	// Static attributes.

	static inline const char* id = "SN";

	// ---------------------------------------------------------
	// Constructors.

	// Default onstructor.
	inline constexpr
	SN() {}

	// Constructor from any integral type.
	template <typename Type> inline constexpr
	SN (const Type& x) {
		construct(x);
	}

	// Copy constructor.
	inline constexpr
	SN(const SN& x) : m_pow(x.m_pow), m_double(x.m_double), m_is_floating(x.m_is_floating) {}

	// Move constructor.
	inline constexpr
	SN(SN&& x) : m_pow(x.m_pow), m_double(x.m_double), m_is_floating(x.m_is_floating) {}

	// ---------------------------------------------------------
	// Assignment operators.

	// Assignment operator from void.
	template <typename Type> inline constexpr
	auto&		operator =(const Type& x) {
		construct(x);
		return *this;
	}

	// Copy assignment operator.
	inline constexpr
	auto&		operator =(const SN& x) {
		m_pow = x.m_pow;
		m_double = x.m_double;
		m_is_floating = x.m_is_floating;
		return *this;
	}

	// Move assignment operator.
	inline constexpr
	auto&		operator =(SN&& x) {
		m_pow = x.m_pow;
		m_double = x.m_double;
		m_is_floating = x.m_is_floating;
		return *this;
	}

	// ---------------------------------------------------------
	// Functions.

	// Attribute funcs.
	inline constexpr
	int 		pow() const 			{ return m_pow; }

	// Is negative.
	inline constexpr
	bool 		is_neg() const 			{ return m_double < 0; }

	// Is negative pow.
	inline constexpr
	bool 		is_neg_pow() const 		{ return m_pow < 0; }

	// Get the original value.
	inline constexpr
	auto 		value() {
		if (m_pow < 0) { return m_double / vlib::pow(10, -m_pow); }
		return m_double * vlib::pow(10, m_pow);
	}

	// ---------------------------------------------------------
	// Casts.

	// As scientific notated String.
	inline constexpr
	auto		str(int precision = -1, const int& max_len = -1)  {

		// Set default precision.
		if (precision == -1) {
			precision = (int) vlib::cast<char*>::precision();
		}

		// Create pre.
		char* pre = nullptr;
        ullong pre_len = 0;
        ullong pre_capacity = 0;
		if (precision == 0) {
			vlib::array::append(pre, pre_len, pre_capacity, tochar(round<uint>(m_double)));
		} else {
            vlib::array::append(pre, pre_len, pre_capacity, tochar(floor<uint>(m_double)));
            vlib::array::append(pre, pre_len, pre_capacity, '.');
			uint l_precision;
			if (precision == -1) { l_precision = vlib::cast<char*>::precision(); }
			else { l_precision = (uint) precision; }
			for (auto& i: internal::math::iterate_decimals(todecimals(round(m_double, (int) l_precision)), l_precision, true)) {
                vlib::array::append(pre, pre_len, pre_capacity, tochar(i));
			}
		}

		// Create post.
        char* post = nullptr;
        ullong post_len = 0;
        ullong post_capacity = 0;
        vlib::array::append(post, post_len, post_capacity, 'e');
		if (m_pow >= 0) {
			vlib::array::append(post, post_len, post_capacity, '+');
			if (m_pow >= 0 && m_pow < 10) {
                vlib::array::append(post, post_len, post_capacity, '0');
                vlib::array::append(post, post_len, post_capacity, tochar(m_pow));
            }
			else {
				vlib::cast<char*>(post, post_len, post_capacity, m_pow);
            }
		} else {
            vlib::array::append(post, post_len, post_capacity, '-');
			if (m_pow <= 0 && m_pow > -10) {
                vlib::array::append(post, post_len, post_capacity, '0');
                vlib::array::append(post, post_len, post_capacity, tochar(-m_pow));
            }
			else {
				vlib::cast<char*>(post, post_len, post_capacity, -m_pow);
            }
		}

		// Concat.
		if (max_len > 0) {
			if ((ullong) max_len < post.len<ref_t>()) {
				throw std::runtime_error(tostr(
				    "Unable to create a scientific notation with max length of \"",
				    max_len,
				    "\" min length is \"",
				    post.len<ref_t>() + 1,
				    "\"."
			    ));
			}
			pre.len<ref_t>() = (ullong) max_len - post.len<ref_t>();
			if (pre.last() == '0') { --pre.len<ref_t>(); }
		}
		pre.concat_r(post);
		pre.null_terminate();
		return pre;

		//
	 }

	// As scientific notated String.
	inline constexpr
	auto		str(const ullong& precision = npos, const ullong& max_len = npos);

	// As json formatted String
	constexpr
	auto		json() const { return str(); }

	// ---------------------------------------------------------
	// Operators.

	//
};

// ---------------------------------------------------------
// Instances.

// Alias.
typedef SN scientific_notation_t;

// Is instance.
template<> 						struct is_instance<SN, SN> 				{ SICEBOOL value = true;  };

// Is sn type.
template<typename Type>			struct is_SN 								{ SICEBOOL value = false; };
template<> 						struct is_SN<SN> 						{ SICEBOOL value = true;  };

// ---------------------------------------------------------
// Shortcuts.

namespace shortcuts {
namespace types {

using SN =		vlib::SN;

}; 		// End namespace sockets.
}; 		// End namespace shortcuts.

// ---------------------------------------------------------
// End.

}; 		// End namespace vlib.
#endif 	// End header.
