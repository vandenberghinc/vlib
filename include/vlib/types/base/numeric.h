// Author: Daan van den Bergh
// Copyright: © 2022 Daan van den Bergh.

// Header.
#ifndef VLIB_NUMERIC_T_H
#define VLIB_NUMERIC_T_H

// Namespace vlib.
namespace vlib {


// ---------------------------------------------------------

// Numeric type.
//  -
/* 	@docs {
	@chapter: types
	@title: Numeric
	@description:
		Numeric type.
 
		The following aliases are defined:
		`typedef Numeric<int> Int`
		`typedef Numeric<uint> UInt`
		`typedef Numeric<float> Float`
		`typedef Numeric<double> Double`
		`typedef Numeric<ldouble> LDouble`
		`typedef Numeric<long> Long`
		`typedef Numeric<llong> LLong`
		`typedef Numeric<ullong> Len`
 
} */
template <typename Type> requires (is_any_numeric<Type>::value)
struct Numeric {

	// ---------------------------------------------------------
	// Aliases.
    
    using       This =      Numeric;
    typedef     Type        value_type;
    
    typedef     Numeric<short>      Short;
    typedef     Numeric<ushort>     UShort;
    typedef     Numeric<int>        Int;
    typedef     Numeric<uint>       UInt;
    typedef     Numeric<float>      Float;
    typedef     Numeric<double>     Double;
    typedef     Numeric<ldouble>    LDouble;
    typedef     Numeric<long>       Long;
    typedef     Numeric<llong>      LLong;
    typedef     Numeric<ullong>     Len;

    // Cant declare is_any_Numeric_h struct because g++ does not allow empty template params inside a struct.
    // template <typename Num> requires (
    //     !std::is_same<const Numeric, const UShort>::value &&
    //     !std::is_same<const Numeric, const UShort>::value &&
    //     !std::is_same<const Numeric, const Int>::value &&
    //     !std::is_same<const Numeric, const UInt>::value &&
    //     !std::is_same<const Numeric, const Float>::value &&
    //     !std::is_same<const Numeric, const Double>::value &&
    //     !std::is_same<const Numeric, const LDouble>::value &&
    //     !std::is_same<const Numeric, const Long>::value &&
    //     !std::is_same<const Numeric, const LLong>::value &&
    //     !std::is_same<const Numeric, const Len>::value
    // ) SICE
    // bool is_any_Numeric_h() { return false; }
    // template <typename Num> requires (std::is_same<const Numeric, const Short>::value) SICE
    // bool is_any_Numeric_h() { return true; }
    // template <typename Num> requires (std::is_same<const Numeric, const UShort>::value) SICE
    // bool is_any_Numeric_h() { return true; }
    // template <typename Num> requires (std::is_same<const Numeric, const Int>::value) SICE
    // bool is_any_Numeric_h() { return true; }
    // template <typename Num> requires (std::is_same<const Numeric, const UInt>::value) SICE
    // bool is_any_Numeric_h() { return true; }
    // template <typename Num> requires (std::is_same<const Numeric, const Float>::value) SICE
    // bool is_any_Numeric_h() { return true; }
    // template <typename Num> requires (std::is_same<const Numeric, const Double>::value) SICE
    // bool is_any_Numeric_h() { return true; }
    // template <typename Num> requires (std::is_same<const Numeric, const LDouble>::value) SICE
    // bool is_any_Numeric_h() { return true; }
    // template <typename Num> requires (std::is_same<const Numeric, const Long>::value) SICE
    // bool is_any_Numeric_h() { return true; }
    // template <typename Num> requires (std::is_same<const Numeric, const LLong>::value) SICE
    // bool is_any_Numeric_h() { return true; }
    // template <typename Num> requires (std::is_same<const Numeric, const Len>::value) SICE
    // bool is_any_Numeric_h() { return true; }

	// ---------------------------------------------------------
	// Attributes.

	Type    m_numeric = 0;

// Private.
private:
	
	// ---------------------------------------------------------
	// Private functions.
	
	// Get the numeric value.
	template <typename Cast = Type, typename Num> requires (is_any_numeric<Num>::value && is_instance<Cast, Num>::value)
	constexpr
	auto&	get_numeric(const Num& x) const {
		return x;
	}
	template <typename Cast = Type, typename Num> requires (is_any_numeric<Num>::value && !is_instance<Cast, Num>::value)
	constexpr
	auto	get_numeric(const Num& x) const {
		return (Cast) x;
	}
	template <typename Cast = Type, typename Num> requires (is_any_numeric<typename Num::value_type>::value && is_instance<Cast, typename Num::value_type>::value)
	constexpr
	auto&	get_numeric(const Num& x) const {
		return x.m_numeric;
	}
	template <typename Cast = Type, typename Num> requires (is_any_numeric<typename Num::value_type>::value && !is_instance<Cast, typename Num::value_type>::value)
	constexpr
	auto	get_numeric(const Num& x) const {
		return (Cast) x.m_numeric;
	}

// Public.
public:
	
	// ---------------------------------------------------------
	// Constructors.

	// Default constructor.
	constexpr
	Numeric () {}
	
	// Copy constructor.
	constexpr
	Numeric (const This& x) :
	m_numeric(x.m_numeric)
    {}

	// Constructor from type.
	/*  @docs {
		@title: Constructor
		@description:
			Construct an `Numeric` object.
		@usage:
			Int x (0);
	} */
	constexpr
	Numeric(const Type& x) :
	m_numeric(x)
    {}
	
	// Constructor from other Numeric.
	template <typename Num> requires (is_any_numeric<typename Num::value_type>::value && !is_instance<Type, typename Num::value_type>::value) constexpr
	Numeric(const Num& x) :
	m_numeric((Type) x.m_numeric)
    {}
	
	// Constructor from npos.
	constexpr
	Numeric(const NPos&) :
	m_numeric((Type) NPos::npos)
    {}

	// ---------------------------------------------------------
	// Assignment operators.

	// Copy assignment operator.
	constexpr
	auto&	operator =(const This& x) {
		m_numeric = x.m_numeric;
		return *this;
	}
	
	// Assignment operator from type.
	constexpr
	auto& 	operator =(const Type& x) {
		m_numeric = x;
		return *this;
	}
	
	// Constructor from other Numeric.
	template <typename Num> requires (is_any_numeric<typename Num::value_type>::value && !is_instance<typename Num::value_type, Type>::value) constexpr
	This&	operator =(const Num& x) {
		m_numeric = (Type) x.m_numeric;
		return *this;
	}
	
	// Constructor from npos.
	constexpr
	This&	operator =(const NPos&) {
		m_numeric = (Type) NPos::npos;
		return *this;
	}

	// ---------------------------------------------------------
	// Attribute functions.
	
	// Is floating.
	/*  @docs {
		@title: Is floating
		@description:
			Check if a numeric is floating.
		@usage:
			Int x;
			x.is_floating(); ==> false;
			Float y;
			y.is_floating(); ==> true;
	} */
	constexpr
	bool 	floating() const requires (is_floating<Type>::value){ return true; }
	constexpr
	bool 	floating() const requires (!is_floating<Type>::value){ return false; }

	// Get the integral value.
	/* 	@docs {
		@title: Value
		@description:
			Get the integral value.
		@usage:
			Int x = 100;
			x.value() ==> 100;
	} */
	constexpr
	auto&	value() { return m_numeric; }
    constexpr
    auto&    value() const { return m_numeric; }

	// ---------------------------------------------------------
	// Functions.

	// Create a copy.
	constexpr
	auto	copy() {
		return *this;
	}
	constexpr
	auto	copy() const {
		return *this;
	}

	// Equals.
	/*  @docs {
		@title: Equals
		@description:
			Check if the numeric equals another numeric or integral numeric.
	} */
	template <typename Num> requires (!is_floating<Type>::value && (is_any_numeric<Num>::value || is_any_numeric<typename Num::value_type>::value)) constexpr
	bool 	eq(const Num& x) const {
		return m_numeric == get_numeric(x);
	}
	template <typename Num> requires (is_floating<Type>::value && (is_any_numeric<Num>::value || is_any_numeric<typename Num::value_type>::value)) constexpr
	bool 	eq(const Num& x) const {
		return 	fabs(m_numeric - get_numeric(x)) <=
				limits<Type>::epsilon * std::max(fabs(m_numeric), fabs(get_numeric(x)));
	}
	
	// Less.
	/*  @docs {
		@title: Less
		@description:
			Check if the numeric is less than another numeric.
	} */
	template <typename Num> requires (is_any_numeric<Num>::value || is_any_numeric<typename Num::value_type>::value) constexpr
	bool 	less(const Num& x) const {
		return m_numeric < get_numeric(x);
	}
	
	// Less equals.
	/*  @docs {
		@title: Less equals
		@description:
			Check if the numeric is less than or equal to another numeric.
	} */
	template <typename Num> requires (is_any_numeric<Num>::value || is_any_numeric<typename Num::value_type>::value) constexpr
	bool 	less_eq(const Num& x) const {
		return m_numeric <= get_numeric(x);
	}
	
	// Greater.
	/*  @docs {
		@title: Greater
		@description:
			Check if the numeric is greater than another numeric.
	} */
	template <typename Num> requires (is_any_numeric<Num>::value || is_any_numeric<typename Num::value_type>::value) constexpr
	bool 	greater(const Num& x) const {
		return m_numeric > get_numeric(x);
	}
	
	// Greater equals.
	/*  @docs {
		@title: Greater equals
		@description:
			Check if the numeric is greater than or equal to another numeric.
	} */
	template <typename Num> requires (is_any_numeric<Num>::value || is_any_numeric<typename Num::value_type>::value) constexpr
	bool 	greater_eq(const Num& x) const {
		return m_numeric >= get_numeric(x);
	}

	// Min.
	/*  @docs {
		@title: Min
		@description:
			Get the minimum between two numerics.
	 
			Function `min_r` updates the current object, while `min` creates a copy.
		@funcs: 4
	} */
	constexpr
	This	min(const Type& x) const {
		if (greater(x)) {
			return x;
		} else {
			return m_numeric;
		}
	}
	constexpr
	This&	min_r(const Type& x) {
		if (greater(x)) {
			m_numeric = x;
		}
		return *this;
	}
	template <typename Num> requires (is_any_numeric<typename Num::value_type>::value) constexpr
	This	min(const Num& x) const {
		return min(x.m_numeric);
	}
	template <typename Num> requires (is_any_numeric<typename Num::value_type>::value) constexpr
	This&	min_r(const Num& x) {
		return min_r(x.m_numeric);
	}

	// Max.
	/*  @docs {
		@title: Max
		@description:
			Get the maximum between two numerics.
	 
			Function `max_r` updates the current object, while `max` creates a copy.
		@funcs: 4
	} */
	constexpr
	This 	max(const Type& x) const {
		if (less(x)) {
			return x;
		} else {
			return m_numeric;
		}
	}
	constexpr
	This& 	max_r(const Type& x) {
		if (less(x)) {
			m_numeric = x;
		}
		return *this;
	}
	template <typename Num> requires (is_any_numeric<typename Num::value_type>::value) constexpr
	This 	max(const Num& x) const {
		return max(x.m_numeric);
	}
	template <typename Num> requires (is_any_numeric<typename Num::value_type>::value) constexpr
	This& 	max_r(Num& x) {
		return max_r(x.m_numeric);
	}
	
	// Absolute value.
	/*  @docs {
		@title: Abs
		@description:
			Get the absolute value of a numeric.
	 
			Function `abs_r` updates the current object, while `abs` creates a copy.
		@funcs: 2
	} */
	constexpr
	This	abs() const requires (is_signed<Type>::value || is_floating<Type>::value) {
		if (m_numeric < 0) {
			return -m_numeric;
		} else {
			return m_numeric;
		}
	}
	constexpr
	This&	abs_r() requires (is_signed<Type>::value || is_floating<Type>::value) {
		if (m_numeric < 0) {
			m_numeric = -m_numeric;
		}
		return *this;
	}
	constexpr
	This	abs() const requires (is_unsigned<Type>::value) {
		return *this;
	}
	This&	abs_r() requires (is_unsigned<Type>::value) {
		return *this;
	}
	
	// Absolute value with cast.
	/*  @docs {
		@title: Abs with cast
		@description:
			Get the absolute value of a numeric with a cast.
	 
		@template: {
			@name: Cast
			@description:
				The type must be any integral numeric or a `Numeric`.
		}
	} */
	template <typename Cast> requires (is_any_numeric<Cast>::value) constexpr
	Cast	abs() const {
		return vlib::abs<Cast>(m_numeric);
	}
	template <typename Cast> requires (is_any_numeric<typename Cast::value_type>::value) constexpr
	Cast	abs() const {
		return vlib::abs<Cast::value_type>(m_numeric);
	}

	// Add.
	/*  @docs {
		@title: Add
		@description:
			Add a numeic to the object.
	 
			Function `add_r` updates the current object, while `add` creates a copy.
		@funcs: 2
	} */
	template <typename Num> requires (is_any_numeric<Num>::value || is_any_numeric<typename Num::value_type>::value) constexpr
	This 	add(const Num& x) const {
		return m_numeric + get_numeric(x);
	}
	template <typename Num> requires (is_any_numeric<Num>::value || is_any_numeric<typename Num::value_type>::value) constexpr
	This& 	add_r(const Num& x) {
		m_numeric += get_numeric(x);
		return *this;
	}

	// Substract.
	/*  @docs {
		@title: Subtract
		@description:
			Subtract a numeric from the object.
	 
			Function `sub_r` updates the current object, while `sub` creates a copy.
		@funcs: 2
	} */
	template <typename Num> requires (is_any_numeric<Num>::value || is_any_numeric<typename Num::value_type>::value) constexpr
	This 	sub(const Num& x) const {
		return m_numeric - get_numeric(x);
	}
	template <typename Num> requires (is_any_numeric<Num>::value || is_any_numeric<typename Num::value_type>::value) constexpr
	This& 	sub_r(const Num& x) {
		m_numeric -= get_numeric(x);
		return *this;
	}
	
	// Multiply.
	/*  @docs {
		@title: Multiply
		@description:
			Multiply the object by a numeric.
	 
			Function `mult_r` updates the current object, while `mult` creates a copy.
		@funcs: 2
	} */
	template <typename Num> requires (is_any_numeric<Num>::value || is_any_numeric<typename Num::value_type>::value) constexpr
	This 	mult(const Num& x) const {
		return m_numeric * get_numeric(x);
	}
	template <typename Num> requires (is_any_numeric<Num>::value || is_any_numeric<typename Num::value_type>::value) constexpr
	This& 	mult_r(const Num& x) {
		m_numeric *= get_numeric(x);
		return *this;
	}

	// Divide.
	/*  @docs {
		@title: Divide
		@description:
			Divide the object by a numeric.
	 
			Function `div_r` updates the current object, while `div` creates a copy.
		@funcs: 2
	} */
	template <typename Num> requires (is_any_numeric<Num>::value || is_any_numeric<typename Num::value_type>::value) constexpr
	This 	div(const Num& x) const {
		return m_numeric / get_numeric(x);
	}
	template <typename Num> requires (is_any_numeric<Num>::value || is_any_numeric<typename Num::value_type>::value) constexpr
	This& 	div_r(const Num& x) {
		m_numeric /= get_numeric(x);
		return *this;
	}
	
	// Modulo.
	/*  @docs {
		@title: Modulo
		@description:
			Calculate the modulo of a division.
	 
			Function `mod_r` updates the current object, while `mod` creates a copy.
		@funcs: 2
	} */
	template <typename Num> requires (is_any_integer<Type>::value && (is_any_numeric<Num>::value || is_any_numeric<typename Num::value_type>::value)) constexpr
	This	mod(const Num& x) const {
		return m_numeric % get_numeric(x);
	}
	template <typename Num> requires (is_any_integer<Type>::value && (is_any_numeric<Num>::value || is_any_numeric<typename Num::value_type>::value)) constexpr
	This&	mod_r(const Num& x) {
		m_numeric %= get_numeric(x);
		return *this;
	}

	// Power of.
	/*  @docs {
		@title: Power of
		@description:
			Calculate the power of with a numeric.
		
			Function `pow_r` updates the current object, while `pow` creates a copy.
	 
			Parameter `x` can be negative when the numeric is floating. The power of will than act as a division. For example `Double(10.0).pow(-1)` will return `0.1`. The underlying formula is `numeric / pow(abs(numeric), (-x)+1)`
		@funcs: 2
	} */
	template <typename Num> requires (!is_floating<Type>::value && (is_any_numeric<Num>::value || is_any_numeric<typename Num::value_type>::value)) constexpr
	This 	pow(const Num& x) const {
		return vlib::pow(m_numeric, (Type) get_numeric(x));
	}
	template <typename Num> requires (!is_floating<Type>::value && (is_any_numeric<Num>::value || is_any_numeric<typename Num::value_type>::value)) constexpr
	This& 	pow_r(const Num& x) {
		m_numeric = vlib::pow(m_numeric, (Type) get_numeric(x));
		return *this;
	}
	template <typename Num> requires (is_floating<Type>::value && (is_any_numeric<Num>::value || is_any_numeric<typename Num::value_type>::value)) constexpr
	This 	pow(const Num& x) const {
		if (x == 0) {
			return m_numeric;
		}
		else if (x < 0) {
			return m_numeric / vlib::pow(vlib::abs(m_numeric), (Type) ((-get_numeric(x)) + 1));
		} else {
			return vlib::pow(m_numeric, (Type) get_numeric(x));
		}
	}
	template <typename Num> requires (is_floating<Type>::value && (is_any_numeric<Num>::value || is_any_numeric<typename Num::value_type>::value)) constexpr
	This& 	pow_r(const Num& x) {
		if (x == 0) {
			return *this;
		}
		else if (x < 0) {
			m_numeric /= vlib::pow(vlib::abs(m_numeric), (Type) ((-get_numeric(x)) + 1));
		} else {
			m_numeric = vlib::pow(m_numeric, (Type) get_numeric(x));
		}
		return *this;
	}

	// Square root.
	/*  @docs {
		@title: Square root
		@description:
			Calculate the square root of the numeric.
		
			Function `sqrt_r` updates the current object, while `sqrt` creates a copy.
		@funcs: 2
	} */
    constexpr
	This	sqrt() const {
		return ::sqrt(m_numeric);
	}
	constexpr
	This&	sqrt_r() {
		m_numeric = ::sqrt(m_numeric);
		return *this;
	}
	
	// Round to decimals.
	/*  @docs {
		@title: Round
		@description:
			Round the numeric to a number of decimals.
		
			Function `round_r` updates the current object, while `round` creates a copy.
	 
			Only applicable for floating types.
		@funcs: 2
	} */
	constexpr
	This	round(const int& precision = 0) const requires (is_floating<Type>::value) {
		return vlib::round<Type>(m_numeric, precision);
	}
	constexpr
	This&	round_r(const int& precision = 0) const requires (is_floating<Type>::value) {
		m_numeric = vlib::round<Type>(m_numeric, precision);
		return *this;
	}

	// Random number.
	/*  @docs {
		@title: Round
		@description:
			Generate a random numeric within a range.
	} */
	SICE
	This 	random(const Type& min = 0, const Type& max = 999999999999999999) requires (is_any_integer<Type>::value) {
		return vlib::random::generate<Type>(min, max);
	}
	// SICE
	// This 	random(const Type& base = 1.0) requires (is_floating<Type>::value) {
	// 	return vlib::random::generate<Type>(base);
	// }
	
	// Subscript.
	/* @docs {
	  @title: subscript
	  @description:
			Subscript an index.
			Only enabled for unsigned types.
	  @usage:
			Len(9).subscript(10); ==> 9;
			Len(10).subscript(10); ==> 10;
			Len(11).subscript(10); ==> npos;
			Len(npos).subscript(10); ==> 10;
	} */
	template <typename Num> requires (is_unsigned<Type>::value && is_any_numeric<Num>::value) constexpr
	ullong 	subscript(const Num& x) const {
		if (m_numeric == NPos::npos) { return x; }
		else if (greater(x)) { return NPos::npos; }
		return m_numeric;
	}
	template <typename Num> requires (is_unsigned<Type>::value && is_any_numeric<typename Num::value_type>::value) constexpr
	ullong 	subscript(const Num& x) const {
		if (m_numeric == NPos::npos) { return x.m_numeric; }
		else if (greater(x.m_numeric)) { return NPos::npos; }
		return m_numeric;
	}
	template <typename Num> requires (is_unsigned<Type>::value && is_any_numeric<Num>::value) constexpr
	ullong 	subscript(const Num& x, const ullong& def) const {
		if (m_numeric == NPos::npos) { return def; }
		else if (greater(x)) { return def; }
		return m_numeric;
	}
	template <typename Num> requires (is_unsigned<Type>::value && is_any_numeric<typename Num::value_type>::value) constexpr
	ullong 	subscript(const Num& x, const ullong& def) const {
		if (m_numeric == NPos::npos) { return def; }
		else if (greater(x.m_numeric)) { return def; }
		return m_numeric;
	}

	// ---------------------------------------------------------
	// Casts.

	// Parse from a const char*.
	/*  @docs {
		@title: Parse
		@description:
			Parse from a `const char*`.
	} */
	SICE
	This	parse(const char* arr, const ullong& len) {
		return tonumeric<Type>(arr, len);
	}

	// As String
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
			Get as json formatted string.
	} */
	constexpr
	auto	json() const;
	
	// As numeric.
	/*  @docs {
		@title: As
		@description:
			Get as integral numeric or another Numeric.
	} */
	template <typename Cast> requires (is_instance<Type, Cast>::value) constexpr
	Cast	as() const {
		return m_numeric;
	}
	template <typename Cast> requires (!is_instance<Type, Cast>::value && is_any_numeric<Cast>::value) constexpr
	Cast	as() const {
		return (Cast) m_numeric;
	}
	template <typename Cast> requires (is_any_numeric<typename Cast::value_type>::value) constexpr
	Cast	as() const {
		return *this;
	}

	// ---------------------------------------------------------
	// Operators.

	// Operators "==, !=".
	template <typename Num> requires (is_any_numeric<Num>::value || is_any_numeric<typename Num::value_type>::value) constexpr friend
	bool	operator ==(const This& obj, const Num& x) {
		return obj.eq(x);
	}
	template <typename Num> requires (is_any_numeric<Num>::value || is_any_numeric<typename Num::value_type>::value) constexpr friend
	bool	operator !=(const This& obj, const Num& x) {
		return !obj.eq(x);
	}
	
	// Operators "<, <=, >, >=".
	template <typename Num> requires (is_any_numeric<Num>::value || is_any_numeric<typename Num::value_type>::value) constexpr friend
	bool	operator <(const This& obj, const Num& x) {
		return obj.less(x);
	}
	template <typename Num> requires (is_any_numeric<Num>::value || is_any_numeric<typename Num::value_type>::value) constexpr friend
	bool	operator <=(const This& obj, const Num& x) {
		return obj.less_eq(x);
	}
	template <typename Num> requires (is_any_numeric<Num>::value || is_any_numeric<typename Num::value_type>::value) constexpr friend
	bool	operator >(const This& obj, const Num& x) {
		return obj.greater(x);
	}
	template <typename Num> requires (is_any_numeric<Num>::value || is_any_numeric<typename Num::value_type>::value) constexpr friend
	bool	operator >=(const This& obj, const Num& x) {
		return obj.greater_eq(x);
	}

    // Operators "-".
    constexpr
    This     operator-() {
        return -m_numeric;
    }
    
	// Operators "++, --".
	constexpr
	This& 	operator++() {
		return add_r(1);
	}
	constexpr
	This& 	operator++(int) {
		return add_r(1);
	}
	constexpr
	This& 	operator--() {
		return sub_r(1);
	}
	constexpr
	This& 	operator--(int) {
		return sub_r(1);
	}

	// Operators "+, +=, -, -=".
	template <typename Num> requires (is_any_numeric<Num>::value || is_any_numeric<typename Num::value_type>::value) constexpr friend
	This	operator +(const This& obj, const Num& x) {
		return obj.add(x);
	}
	template <typename Num> requires (is_any_numeric<Num>::value || is_any_numeric<typename Num::value_type>::value) constexpr
	This&	operator +=(const Num& x) {
		return add_r(x);
	}
	template <typename Num> requires (is_any_numeric<Num>::value || is_any_numeric<typename Num::value_type>::value) constexpr friend
	This	operator -(const This& obj, const Num& x) {
		return obj.sub(x);
	}
	template <typename Num> requires (is_any_numeric<Num>::value || is_any_numeric<typename Num::value_type>::value) constexpr
	This&	operator -=(const Num& x) {
		return sub_r(x);
	}

	// Operators "*, *=".
	template <typename Num> requires (is_any_numeric<Num>::value || is_any_numeric<typename Num::value_type>::value) constexpr friend
	This 	operator *(const This& obj, const Num& x) {
		return obj.mult(x);
	}
	template <typename Num> requires (is_any_numeric<Num>::value || is_any_numeric<typename Num::value_type>::value) constexpr
	This&	operator *=(const Num& x) {
		return mult_r(x);
	}

	// Operators "/, /=".
	template <typename Num> requires (is_any_numeric<Num>::value || is_any_numeric<typename Num::value_type>::value) constexpr friend
	This	operator /(const This& obj, const Num& x) {
		return obj.div(x);
	}
	template <typename Num> requires (is_any_numeric<Num>::value || is_any_numeric<typename Num::value_type>::value) constexpr
	This&	operator /=(const Num& x) {
		return div_r(x);
	}

	// Operators "%, %=".
	template <typename Num> requires (is_any_numeric<Num>::value || is_any_numeric<typename Num::value_type>::value) constexpr friend
	This	operator %(const This& obj, const Num& x) {
		return obj.mod(x);
	}
	template <typename Num> requires (is_any_numeric<Num>::value || is_any_numeric<typename Num::value_type>::value) constexpr
	This&	operator %=(const Num& x) {
		return mod_r(x);
	}
	
	// Operators "^, ^=".
	template <typename Num> requires (is_any_numeric<Num>::value || is_any_numeric<typename Num::value_type>::value) constexpr friend
	This	operator ^(const This& obj, const Num& x) {
		return obj.pow(x);
	}
	template <typename Num> requires (is_any_numeric<Num>::value || is_any_numeric<typename Num::value_type>::value) constexpr
	This&	operator ^=(const Num& x) {
		return pow_r(x);
	}
    
    // Operators & |
    template <typename Value> constexpr
    Bool    operator &(const Value& x) {
        return m_numeric & x;
    }
    template <typename Value> constexpr
    Bool    operator |(const Value& x) {
        return m_numeric | x;
    }

	// Dump to pipe.
	constexpr friend
	Pipe& 	operator <<(Pipe& pipe, const This& obj) {
		return pipe << obj.m_numeric;
	}

	//
};

// ---------------------------------------------------------
// Type definitions.

typedef     Numeric<short>   Short;
typedef     Numeric<ushort>         UShort;
typedef		Numeric<int> 			Int;
typedef		Numeric<uint> 		UInt;
typedef		Numeric<float> 		Float;
typedef		Numeric<double> 		Double;
typedef		Numeric<ldouble> 		LDouble;
typedef		Numeric<long> 		Long;
typedef		Numeric<llong> 		LLong;
typedef		Numeric<ullong> 		Len;

// ---------------------------------------------------------
// Instances.

// Is instance.
template<>     struct is_instance<Short, Short>        { SICEBOOL value = true;  };
template<>     struct is_instance<UShort, UShort>        { SICEBOOL value = true;  };
template<> 	struct is_instance<Int, Int>		{ SICEBOOL value = true;  };
template<> 	struct is_instance<UInt, UInt>		{ SICEBOOL value = true;  };
template<> 	struct is_instance<Float, Float>	{ SICEBOOL value = true;  };
template<> 	struct is_instance<Double, Double>	{ SICEBOOL value = true;  };
template<> 	struct is_instance<Long, Long>		{ SICEBOOL value = true;  };
template<> 	struct is_instance<LLong, LLong>		{ SICEBOOL value = true;  };
template<> 	struct is_instance<Len, Len>		{ SICEBOOL value = true;  };

// Is short type.
template<typename Num>     struct is_Short                         { SICEBOOL value = false; };
template<>                 struct is_Short<Short>                     { SICEBOOL value = true;  };
template<>                 struct is_Short<const Short>             { SICEBOOL value = true;  };

template<typename Num>     struct is_UShort                         { SICEBOOL value = false; };
template<>                 struct is_UShort<UShort>                     { SICEBOOL value = true;  };
template<>                 struct is_UShort<const UShort>             { SICEBOOL value = true;  };

// Is int type.
template<typename Num>     struct is_Int                         { SICEBOOL value = false; };
template<>                 struct is_Int<Int>                     { SICEBOOL value = true;  };
template<>                 struct is_Int<const Int>             { SICEBOOL value = true;  };

// Is uint type.
template<typename Num>     struct is_UInt                         { SICEBOOL value = false; };
template<>                 struct is_UInt<UInt>                 { SICEBOOL value = true;  };
template<>                 struct is_UInt<UInt&>                 { SICEBOOL value = true;  };
template<>                 struct is_UInt<UInt&&>                 { SICEBOOL value = true;  };
template<>                 struct is_UInt<const UInt>             { SICEBOOL value = true;  };
template<>                 struct is_UInt<const UInt&>         { SICEBOOL value = true;  };

// Is float type.
template<typename Num>     struct is_Float                         { SICEBOOL value = false; };
template<>                 struct is_Float<Float>                 { SICEBOOL value = true;  };
template<>                 struct is_Float<Float&>             { SICEBOOL value = true;  };
template<>                 struct is_Float<Float&&>             { SICEBOOL value = true;  };
template<>                 struct is_Float<const Float>         { SICEBOOL value = true;  };
template<>                 struct is_Float<const Float&>         { SICEBOOL value = true;  };

// Is double type.
template<typename Num>     struct is_Double                         { SICEBOOL value = false; };
template<>                 struct is_Double<Double>             { SICEBOOL value = true;  };
template<>                 struct is_Double<Double&>             { SICEBOOL value = true;  };
template<>                 struct is_Double<Double&&>             { SICEBOOL value = true;  };
template<>                 struct is_Double<const Double>         { SICEBOOL value = true;  };
template<>                 struct is_Double<const Double&>     { SICEBOOL value = true;  };
template<typename Num>     struct is_LDouble                         { SICEBOOL value = false; };
template<>                 struct is_LDouble<LDouble>             { SICEBOOL value = true;  };
template<>                 struct is_LDouble<LDouble&>             { SICEBOOL value = true;  };
template<>                 struct is_LDouble<LDouble&&>             { SICEBOOL value = true;  };
template<>                 struct is_LDouble<const LDouble>         { SICEBOOL value = true;  };
template<>                 struct is_LDouble<const LDouble&>     { SICEBOOL value = true;  };

// Is long type.
template<typename Num>     struct is_Long                         { SICEBOOL value = false; };
template<>                 struct is_Long<Long>                 { SICEBOOL value = true;  };
template<>                 struct is_Long<Long&>                 { SICEBOOL value = true;  };
template<>                 struct is_Long<Long&&>                 { SICEBOOL value = true;  };
template<>                 struct is_Long<const Long>             { SICEBOOL value = true;  };
template<>                 struct is_Long<const Long&>         { SICEBOOL value = true;  };
template<typename Num>     struct is_LLong                         { SICEBOOL value = false; };
template<>                 struct is_LLong<LLong>                 { SICEBOOL value = true;  };
template<>                 struct is_LLong<LLong&>                 { SICEBOOL value = true;  };
template<>                 struct is_LLong<LLong&&>                 { SICEBOOL value = true;  };
template<>                 struct is_LLong<const LLong>             { SICEBOOL value = true;  };
template<>                 struct is_LLong<const LLong&>         { SICEBOOL value = true;  };

// Is ulong type.
template<typename Num>     struct is_Len                         { SICEBOOL value = false; };
template<>                 struct is_Len<Len>                     { SICEBOOL value = true;  };
template<>                 struct is_Len<Len&>                 { SICEBOOL value = true;  };
template<>                 struct is_Len<Len&&>                 { SICEBOOL value = true;  };
template<>                 struct is_Len<const Len>             { SICEBOOL value = true;  };
template<>                 struct is_Len<const Len&>             { SICEBOOL value = true;  };

// Is any int numeric type.
template<typename Num>     struct is_any_integer_Numeric                     { SICEBOOL value = false; };
template<>                 struct is_any_integer_Numeric<Short>                 { SICEBOOL value = true;  };
template<>                 struct is_any_integer_Numeric<const Short>         { SICEBOOL value = true;  };
template<>                 struct is_any_integer_Numeric<Int>                 { SICEBOOL value = true;  };
template<>                 struct is_any_integer_Numeric<const Int>         { SICEBOOL value = true;  };
template<>                 struct is_any_integer_Numeric<UInt>             { SICEBOOL value = true;  };
template<>                 struct is_any_integer_Numeric<const UInt>         { SICEBOOL value = true;  };
template<>                 struct is_any_integer_Numeric<Long>             { SICEBOOL value = true;  };
template<>                 struct is_any_integer_Numeric<const Long>         { SICEBOOL value = true;  };
template<>                 struct is_any_integer_Numeric<LLong>             { SICEBOOL value = true;  };
template<>                 struct is_any_integer_Numeric<const LLong>         { SICEBOOL value = true;  };
template<>                 struct is_any_integer_Numeric<Len>                 { SICEBOOL value = true;  };
template<>                 struct is_any_integer_Numeric<const Len>         { SICEBOOL value = true;  };

// Is any double numeric type.
template<typename Num>     struct is_floating_Numeric                     { SICEBOOL value = false; };
template<>                 struct is_floating_Numeric<Float>             { SICEBOOL value = true;  };
template<>                 struct is_floating_Numeric<Float&>             { SICEBOOL value = true;  };
template<>                 struct is_floating_Numeric<Float&&>             { SICEBOOL value = true;  };
template<>                 struct is_floating_Numeric<const Float>         { SICEBOOL value = true;  };
template<>                 struct is_floating_Numeric<const Float&>     { SICEBOOL value = true;  };
template<>                 struct is_floating_Numeric<Double>             { SICEBOOL value = true;  };
template<>                 struct is_floating_Numeric<Double&>             { SICEBOOL value = true;  };
template<>                 struct is_floating_Numeric<Double&&>         { SICEBOOL value = true;  };
template<>                 struct is_floating_Numeric<const Double>     { SICEBOOL value = true;  };
template<>                 struct is_floating_Numeric<const Double&>     { SICEBOOL value = true;  };
template<>                 struct is_floating_Numeric<LDouble>             { SICEBOOL value = true;  };
template<>                 struct is_floating_Numeric<LDouble&>             { SICEBOOL value = true;  };
template<>                 struct is_floating_Numeric<LDouble&&>         { SICEBOOL value = true;  };
template<>                 struct is_floating_Numeric<const LDouble>     { SICEBOOL value = true;  };
template<>                 struct is_floating_Numeric<const LDouble&>     { SICEBOOL value = true;  };



// Is any signed numeric type.
template<typename Num>     struct is_signed_Numeric                     { SICEBOOL value = false; };
template<>                 struct is_signed_Numeric<Short>                 { SICEBOOL value = true;  };
template<>                 struct is_signed_Numeric<const Short>         { SICEBOOL value = true;  };
template<>                 struct is_signed_Numeric<Int>                 { SICEBOOL value = true;  };
template<>                 struct is_signed_Numeric<const Int>         { SICEBOOL value = true;  };
template<>                 struct is_signed_Numeric<Long>             { SICEBOOL value = true;  };
template<>                 struct is_signed_Numeric<const Long>         { SICEBOOL value = true;  };
template<>                 struct is_signed_Numeric<LLong>             { SICEBOOL value = true;  };
template<>                 struct is_signed_Numeric<const LLong>     { SICEBOOL value = true;  };


// Is any unsigned numeric type.
template<typename Num>     struct is_unsigned_Numeric                     { SICEBOOL value = false; };
template<>                 struct is_unsigned_Numeric<UShort>             { SICEBOOL value = true;  };
template<>                 struct is_unsigned_Numeric<const UShort>         { SICEBOOL value = true;  };
template<>                 struct is_unsigned_Numeric<UInt>             { SICEBOOL value = true;  };
template<>                 struct is_unsigned_Numeric<const UInt>         { SICEBOOL value = true;  };
template<>                 struct is_unsigned_Numeric<Len>                 { SICEBOOL value = true;  };
template<>                 struct is_unsigned_Numeric<const Len>         { SICEBOOL value = true;  };

// Is any numeric type.
template<typename Num>  struct is_any_Numeric                     { SICEBOOL value = false; };
template <>              struct is_any_Numeric<Short>                 { SICEBOOL value = true;  };
template <>              struct is_any_Numeric<const Short>                 { SICEBOOL value = true;  };
template <>              struct is_any_Numeric<UShort>             { SICEBOOL value = true;  };
template <>              struct is_any_Numeric<const UShort>             { SICEBOOL value = true;  };
template <>              struct is_any_Numeric<Int>                 { SICEBOOL value = true;  };
template <>              struct is_any_Numeric<const Int>                 { SICEBOOL value = true;  };
template <>              struct is_any_Numeric<UInt>             { SICEBOOL value = true;  };
template <>              struct is_any_Numeric<const UInt>             { SICEBOOL value = true;  };
template <>              struct is_any_Numeric<Float>             { SICEBOOL value = true;  };
template <>              struct is_any_Numeric<const Float>             { SICEBOOL value = true;  };
template <>              struct is_any_Numeric<Double>             { SICEBOOL value = true;  };
template <>              struct is_any_Numeric<const Double>             { SICEBOOL value = true;  };
template <>              struct is_any_Numeric<LDouble>             { SICEBOOL value = true;  };
template <>              struct is_any_Numeric<const LDouble>             { SICEBOOL value = true;  };
template <>              struct is_any_Numeric<Long>             { SICEBOOL value = true;  };
template <>              struct is_any_Numeric<const Long>             { SICEBOOL value = true;  };
template <>              struct is_any_Numeric<LLong>             { SICEBOOL value = true;  };
template <>              struct is_any_Numeric<const LLong>             { SICEBOOL value = true;  };
template <>              struct is_any_Numeric<Len>                 { SICEBOOL value = true;  };
template <>              struct is_any_Numeric<const Len>                 { SICEBOOL value = true;  };

// ---------------------------------------------------------
// Global functions.

// As absolute (with cast).
template <typename From>  requires (is_any_Numeric<From>::value)
inline constexpr
auto&	abs(const From& x) {
	return x.abs();
}
template <typename To, typename From>  requires (is_any_Numeric<From>::value && !is_instance<To, From>::value)
inline constexpr
auto	abs(const From& x) {
	return x.template abs<To>();
}
template <typename To, typename From>  requires (is_any_Numeric<From>::value && is_instance<To, From>::value)
inline constexpr
auto&	abs(const From& x) {
	return x;
}

// ---------------------------------------------------------
// Shortcuts.

namespace shortcuts {
namespace types {

using Short =        vlib::Short;
using UShort =    vlib::UShort;
using Int =		vlib::Int;
using UInt =	vlib::UInt;
using Float =	vlib::Float;
using Double =	vlib::Double;
using LDouble =	vlib::LDouble;
using Long =	vlib::Long;
using LLong =	vlib::LLong;
using Len =		vlib::Len;

}; 		// End namespace sockets.
}; 		// End namespace shortcuts.

// ---------------------------------------------------------
// End.

}; 		// End namespace vlib.
#endif 	// End header.
