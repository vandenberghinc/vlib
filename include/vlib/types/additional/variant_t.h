// Author: Daan van den Bergh
// Copyright: © 2022 Daan van den Bergh.
//
// DEPRECATED.
//

// Header.
#ifndef VLIB_VARIANT_T_H
#define VLIB_VARIANT_T_H

// Namespace vlib.
namespace vlib {

// Variant type.
/* @docs {
  @title: variant_t
  @description:
		Variant type.
		- Can be inherited to create custom a `variant_t` that supports new types, though it is hard.
  @usage:
		variant_t x;
} */
// @TODO should still add a lot of other types that are defined before variant_t.
// @TODO should not use Int but Long.
// @TODO the construct functions of a Int/Long and Len should also include all smaller types, just like http::json::value_t.
template <typename Status = Shared> requires (is_Unique<Status>::value || is_Shared<Status>::value)
struct variant_t {

// Private:
private:
	
	//
	// Perhaps do something like : "using m_str::find"
	//
	// ---------------------------------------------------------
	// Aliases.

	using 		This = 		variant_t;

	// ---------------------------------------------------------
	// Attributes.

	uint							m_type; // by default the type is Null.
	Ptr<Bool, Status>			m_bool;
	Ptr<Int, Status>			m_int;
	Ptr<Double, Status>			m_double;
	Ptr<Len, Status>			m_len;
	Ptr<String, Status>			m_str;
	Ptr<Array<This>, Status>	m_arr;
	Ptr<Dict<This, This>, Status>		m_dict;

// Public:
public:

	// ---------------------------------------------------------
	// Static attributes.

	static inline const char* id = "variant_t";

	// ---------------------------------------------------------
	// Constructors.

	// Default constructor.
	constexpr
	variant_t()
	: m_type(0) {}
	
	// Template constructor.
	template <typename Type> constexpr
	variant_t(const Type& x) {
		construct(x);
	}

	// Copy constructor.
	constexpr
	variant_t(const This& obj) {
		copy(obj);
	}

	// Move constructor.
	constexpr
	variant_t(This&& obj) {
		swap(obj);
	}
	
	// ---------------------------------------------------------
	// Assignment operators.
	
	// Template constructor.
	template <typename Type> constexpr
	auto& 		operator =(const Type& x) {
		reset();
		return construct(x);
	}

	// Copy constructor.
	constexpr
	auto& 		operator =(const This& obj) {
		return copy(obj);
	}

	// Move constructor.
	constexpr
	auto& 		operator =(This&& obj) {
		return swap(obj);
	}
	
	// ---------------------------------------------------------
	// Construct functions.

	// Copy.
	constexpr
	auto& 		copy(const This& obj) {
		m_type =	obj.m_type;
		m_bool = 	obj.m_bool;
		m_int = 	obj.m_int;
		m_double = 	obj.m_double;
		m_len = 	obj.m_len;
		m_str = 	obj.m_str;
		m_arr = 	obj.m_arr;
		m_dict = 	obj.m_dict;
		return *this;
	}

	// Swap.
	constexpr
	auto& 		swap(This& obj) {
		m_type = obj.m_type;
		m_bool.swap(obj.m_bool);
		m_int.swap(obj.m_int);
		m_double.swap(obj.m_double);
		m_len.swap(obj.m_len);
		m_str.swap(obj.m_str);
		m_arr.swap(obj.m_arr);
		m_dict.swap(obj.m_dict);
		return *this;
	}
	
	// Construct.
	constexpr
	auto& 		construct(const Null&) {
		m_type = 0;
		return *this;
	}
	template <typename Type> requires (is_Bool<Type>::value || is_bool<Type>::value) constexpr
	auto& 		construct(const Type& x) {
		m_bool = x;
		m_type = 1;
		return *this;
	}
	template <typename Type> requires (is_Int<Type>::value || is_int<Type>::value) constexpr
	auto& 		construct(const Type& x) {
		m_int = x;
		m_type = 2;
		return *this;
	}
	template <typename Type> requires (is_Double<Type>::value || is_floating<Type>::value) constexpr
	auto& 		construct(const Type& x) {
		m_double = x;
		m_type = 3;
		return *this;
	}
	template <typename Type> requires (is_Len<Type>::value || is_unsigned_numeric<Type>::value || is_long<Type>::value) constexpr
	auto& 		construct(const Type& x) {
		m_len = x;
		m_type = 4;
		return *this;
	}
	template <typename Type> requires (is_String<Type>::value) constexpr
	auto& 		construct(const Type& x) {
		m_str = x;
		m_type = 5;
		return *this;
	}
	constexpr
	auto& 		construct(const char* x) {
		m_str = x;
		m_type = 5;
		return *this;
	}
	template <typename Type> requires (is_Array<Type>::value && !is_String<Type>::value) constexpr
	auto& 		construct(const Type& x) {
		m_arr = x;
		m_type = 6;
		return *this;
	}
	template <typename Type> requires (is_Dict<Type>::value) constexpr
	auto& 		construct(const Type& x) {
		m_dict = x;
		m_type = 7;
		return *this;
	}
	
	// Reconstruct.
	template <typename... Args>constexpr
	auto& 		reconstruct(Args&&... args) {
		reset();
		construct(args...);
		return *this;
	}
	
	// Reset.
	constexpr
	auto& 		reset() {
		m_type = 0;
		m_bool.reset();
		m_int.reset();
		m_double.reset();
		m_len.reset();
		m_str.reset();
		m_arr.reset();
		m_dict.reset();
		return *this;
	}

	// ---------------------------------------------------------
	// Functions.

	// Get type.
	constexpr
	auto		type() {
		if 		(m_type == 0) { return CString("Null", 6); }
		else if (m_type == 1) { return CString("Bool", 6); }
		else if (m_type == 2) { return CString("Int", 5); }
		else if (m_type == 3) { return CString("Double", 8); }
		else if (m_type == 4) { return CString("Len", 5); }
		else if (m_type == 5) { return CString("String", 5); }
		else if (m_type == 6) { return CString("Array", 7); }
		else if (m_type == 7) { return CString("Dict", 6); }
		return CString("unknown", 7);
	}
	constexpr
	auto		dtype() { return type(); }
	constexpr
	auto&		itype() { return m_type; }

	// Convert type.
	// - Each type that variant_t utilizes must have the static attribute "CString id" with as value the type name (for example Int's id is "Int").
	/*template <typename Type> constexpr
	auto&		atype() {

		// From null.
		if 	(m_type == 0) {
			// @TODO should still init the pointer.
			if 		(Type::id == "Null") {
				m_type = 0;
			}
			else if (Type::id == "Bool") {
				m_type = 1;
			}
			else if (Type::id == "Int") {
				m_type = 2;
			}
			else if (Type::id == "Double") {
				m_type = 3;
			}
			else if (Type::id == "Len") {
				m_type = 4;
			}
			else if (Type::id == "String") {
				m_type = 5;
			}
			else if (Type::id == "Array") {
				m_type = 6;
			}
			else if (Type::id == "Dict") {
				m_type = 7;
			}
			return *this;
		}

		// From bool.
		if 	(m_type == 1) {
			if 		(Type::id == "Null") {
				m_type = 0;
			}
			else if (Type::id == "Bool") {
				return *this;
			}
			else if (Type::id == "Int") {
				m_int = m_bool->template as<Type>();
				m_type = 2;
			}
			else if (Type::id == "Double") {
				m_double = m_bool->template as<Type>();
				m_type = 3;
			}
			else if (Type::id == "Len") {
				m_len = m_bool->template as<Type>();
				m_type = 4;
			}
			else if (Type::id == "String") {
				m_str = m_bool->template as<Type>();
				m_type = 5;
			}
			else if (Type::id == "Array") {
				m_arr = m_bool->template as<Type>();
				m_type = 6;
			}
			else if (Type::id == "Dict") {
				m_dict = m_bool->template as<Type>();
				m_type = 7;
			}
			m_bool.reset();
			return *this;
		}
		
		// From int.
		if 	(m_type == 2) {
			if 		(Type::id == "Null") {
				m_type = 0;
			}
			else if (Type::id == "Bool") {
				m_bool = m_int->template as<Type>();
				m_type = 1;
			}
			else if (Type::id == "Int") {
				return *this;
			}
			else if (Type::id == "Double") {
				m_double = m_int->template as<Type>();
				m_type = 3;
			}
			else if (Type::id == "Len") {
				m_len = m_int->template as<Type>();
				m_type = 4;
			}
			else if (Type::id == "String") {
				m_str = m_int->template as<Type>();
				m_type = 5;
			}
			else if (Type::id == "Array") {
				m_arr = m_int->template as<Type>();
				m_type = 6;
			}
			else if (Type::id == "Dict") {
				m_dict = m_int->template as<Type>();
				m_type = 7;
			}
			m_int.reset();
			return *this;
		}
		
		// From double.
		if 	(m_type == 3) {
			if 		(Type::id == "Null") {
				m_type = 0;
			}
			else if (Type::id == "Bool") {
				m_bool = m_double->template as<Type>();
				m_type = 1;
			}
			else if (Type::id == "Int") {
				m_int = m_double->template as<Type>();
				m_type = 2;
			}
			else if (Type::id == "Double") {
				return *this;
			}
			else if (Type::id == "Len") {
				m_len = m_double->template as<Type>();
				m_type = 3;
			}
			else if (Type::id == "String") {
				m_str = m_double->template as<Type>();
				m_type = 4;
			}
			else if (Type::id == "Array") {
				m_arr = m_double->template as<Type>();
				m_type = 5;
			}
			else if (Type::id == "Dict") {
				m_dict = m_double->template as<Type>();
				m_type = 6;
			}
			m_double.reset();
			return *this;
		}

		// From len.
		if 	(m_type == 4) {
			if 		(Type::id == "Null") {
				m_type = 0;
			}
			else if (Type::id == "Bool") {
				m_bool = m_int->template as<Type>();
				m_type = 5;
			}
			else if (Type::id == "Int") {
				m_int = m_len->template as<Type>();
				m_type = 5;
			}
			else if (Type::id == "Double") {
				m_double = m_len->template as<Type>();
				m_type = 5;
			}
			else if (Type::id == "Len") {
				return *this;
			}
			else if (Type::id == "String") {
				m_str = m_len->template as<Type>();
				m_type = 5;
			}
			else if (Type::id == "Array") {
				m_arr = m_len->template as<Type>();
				m_type = 5;
			}
			else if (Type::id == "Dict") {
				m_dict = m_len->template as<Type>();
				m_type = 5;
			}
			m_len.reset();
			return *this;
		}
		
		// From str.
		if 	(m_type == 5) {
			if 		(Type::id == "Null") {
				m_type = 0;
			}
			else if (Type::id == "Bool") {
				m_bool = m_str->template as<Type>();
				m_type = 1;
			}
			else if (Type::id == "Int") {
				m_int = m_str->template as<Type>();
				m_type = 2;
			}
			else if (Type::id == "Double") {
				m_double = m_str->template as<Type>();
				m_type = 3;
			}
			else if (Type::id == "Len") {
				m_len = m_str->template as<Type>();
				m_type = 4;
			}
			else if (Type::id == "String") {
				return *this;
			}
			else if (Type::id == "Array") {
				m_arr = m_str->template as<Type>();
				m_type = 6;
			}
			else if (Type::id == "Dict") {
				m_dict = m_str->template as<Type>();
				m_type = 7;
			}
			m_str.reset();
			return *this;
		}
		
		// From array.
		if 	(m_type == 6) {
			if 		(Type::id == "Null") {
				m_type = 0;
			}
			else if (Type::id == "Bool") {
				m_bool = m_arr->template as<Type>();
				m_type = 1;
			}
			else if (Type::id == "Int") {
				m_int = m_arr->template as<Type>();
				m_type = 2;
			}
			else if (Type::id == "Double") {
				m_double = m_arr->template as<Type>();
				m_type = 3;
			}
			else if (Type::id == "Len") {
				m_len = m_arr->template as<Type>();
				m_type = 4;
			}
			else if (Type::id == "String") {
				m_str = m_arr->template as<Type>();
				m_type = 5;
			}
			else if (Type::id == "Array") {
				return *this;
			}
			else if (Type::id == "Dict") {
				m_dict = m_arr->template as<Type>();
				m_type = 7;
			}
			m_arr.reset();
			return *this;
		}
		
		// From dict.
		if 	(m_type == 7) {
			if 		(Type::id == "Null") {
				m_type = 0;
			}
			else if (Type::id == "Bool") {
				m_bool = m_dict->template as<Type>();
				m_type = 1;
			}
			else if (Type::id == "Int") {
				m_int = m_dict->template as<Type>();
				m_type = 2;
			}
			else if (Type::id == "Double") {
				m_double = m_dict->template as<Type>();
				m_type = 3;
			}
			else if (Type::id == "Len") {
				m_len = m_dict->template as<Type>();
				m_type = 4;
			}
			else if (Type::id == "String") {
				m_str = m_dict->template as<Type>();
				m_type = 5;
			}
			else if (Type::id == "Array") {
				m_arr = m_dict->template as<Type>();
				m_type = 6;
			}
			else if (Type::id == "Dict") {
				return *this;
			}
			m_dict.reset();
			return *this;
		}
	}*/
	
	// As type.
	/* @docs {
	  @title: as
	  @description:
			As type.
	 @warning:
			Casting the variant to an incorrect type will cause undefined behaviour.
	  @usage:
			variant_t x = 100.0;
			Double y = x.as<Double>();
	} */
	template <typename Type> requires (is_Bool<Type>::value) constexpr
	auto& 		as() {
		return *m_bool;
	}
	template <typename Type> requires (is_Int<Type>::value) constexpr
	auto& 		as() {
		return *m_int;
	}
	template <typename Type> requires (is_Double<Type>::value) constexpr
	auto& 		as() {
		return *m_double;
	}
	template <typename Type> requires (is_Len<Type>::value) constexpr
	auto& 		as() {
		return *m_len;
	}
	template <typename Type> requires (is_String<Type>::value) constexpr
	auto& 		as() {
		return *m_str;
	}
	template <typename Type> requires (is_Array<Type>::value && !is_String<Type>::value) constexpr
	auto& 		as() {
		return *m_arr;
	}
	template <typename Type> requires (is_Dict<Type>::value) constexpr
	auto& 		as() {
		return *m_dict;
	}

	// As type by function name.
	constexpr
	auto& 		asbool() {
		return *m_bool;
	}
	constexpr
	auto& 		asint() {
		return *m_int;
	}
	constexpr
	auto& 		asdouble() {
		return *m_double;
	}
	constexpr
	auto& 		len() {
		return *m_len;
	}
	constexpr
	auto& 		str() {
		return *m_str;
	}
	constexpr
	auto& 		array() {
		return *m_arr;
	}
	constexpr
	auto& 		dict() {
		return *m_dict;
	}

	// As json formatted String.
	constexpr
	String 	json() const {
		switch (m_type) {
			case 0:
				return vlib::null.json();
			case 1:
				return m_bool->json();
			case 2:
				return m_int->json();
			case 3:
				return m_double->json();
			case 4:
				return m_len->json();
			case 5:
				return m_str->json();
			case 6:
				return m_arr->json();
			case 7:
				return m_dict->json();
			default:
				return "ERROR";
		}
	}

	// ---------------------------------------------------------
	// Copy functions.

	// Find.
	// template <typename... Args> constexpr
	// auto		find(Args&&... args) {
	// 	if (m_type == 5) { return m_str->find(args...); }
	// 	else if (m_type == 6) { return m_arr->find(args...); }
	// 	else if (m_type == 7) { return m_dict->find(args...); }
	// 	else {
	// 		throw TypeError("vlib::variant_t", to_str(
	// 			"Function \"",
	// 			__FUNCTION__,
	// 			"\" is not applicable for type \"",
	// 			dtype(),
	// 			"\"." ));
	// 	}
	// }

	// ---------------------------------------------------------
	// Operators.

	// Equals.
	constexpr friend
	bool	 	operator ==(const This& x, const This& y) {
		if (x.m_type != y.m_type) { return false; }
		if (x.m_type == 0) {
			return true;
		} else if (x.m_type == 1) {
			return *x.m_bool == *y.m_bool;
		} else if (x.m_type == 2) {
			return *x.m_int == *y.m_int;
		} else if (x.m_type == 3) {
			return *x.m_double == *y.m_double;
		} else if (x.m_type == 4) {
			return *x.m_len == *y.m_len;
		} else if (x.m_type == 5) {
			return *x.m_str == *y.m_str;
		} else if (x.m_type == 6) {
			return *x.m_arr == *y.m_arr;
		} else if (x.m_type == 7) {
			return *x.m_dict == *y.m_dict;
		}
		throw TypeError("vlib::variant_t", to_str(
			"Unknown type id \"",
			x.m_type,
			"\"." ));
		return false;
	}
	constexpr friend
	bool	 	operator !=(const This& x, const This& y) {
		return !operator ==(x, y);
	}

	// Less / greater.
	inline constexpr
	bool 		operator >(const This& x) const {
		if (m_type != x.m_type) {
			throw TypeError("vlib::variant_t", to_str(
				"Function \"",
				__FUNCTION__,
				"\" is not applicable for types \"",
				dtype(),
				"\" and \"",
				x.dtype(),
				"\"." ));
		}
		if (m_type == 0) {
			return true;
		} else if (m_type == 1) {
			return *m_bool > *x.m_bool;
		} else if (m_type == 2) {
			return *m_int > *x.m_int;
		} else if (m_type == 3) {
			return *m_double > *x.m_double;
		} else if (m_type == 4) {
			return *m_len > *x.m_len;
		} else if (m_type == 5) {
			return *m_str > *x.m_str;
		} else if (m_type == 6) {
			return *m_arr > *x.m_arr;
		} else if (m_type == 7) {
			return *m_dict > *x.m_dict;
		}
		throw TypeError("vlib::variant_t", to_str(
			"Unknown type id \"",
			m_type,
			"\"." ));
		return false;
	}
	inline constexpr
	bool 		operator <(const This& x) const {
		if (m_type != x.m_type) {
			throw TypeError("vlib::variant_t", to_str(
				"Function \"",
				__FUNCTION__,
				"\" is not applicable for types \"",
				dtype(),
				"\" and \"",
				x.dtype(),
				"\"." ));
		}
		if (m_type == 0) {
			return true;
		} else if (m_type == 1) {
			return *m_bool < *x.m_bool;
		} else if (m_type == 2) {
			return *m_int < *x.m_int;
		} else if (m_type == 3) {
			return *m_double < *x.m_double;
		} else if (m_type == 4) {
			return *m_len < *x.m_len;
		} else if (m_type == 5) {
			return *m_str < *x.m_str;
		} else if (m_type == 6) {
			return *m_arr < *x.m_arr;
		} else if (m_type == 7) {
			return *m_dict < *x.m_dict;
		}
		throw TypeError("vlib::variant_t", to_str(
			"Unknown type id \"",
			m_type,
			"\"." ));
		return false;
	}
	inline constexpr
	bool 		operator >=(const This& x) const {
		if (m_type != x.m_type) {
			throw TypeError("vlib::variant_t", to_str(
				"Function \"",
				__FUNCTION__,
				"\" is not applicable for types \"",
				dtype(),
				"\" and \"",
				x.dtype(),
				"\"." ));
		}
		if (m_type == 0) {
			return true;
		} else if (m_type == 1) {
			return *m_bool >= *x.m_bool;
		} else if (m_type == 2) {
			return *m_int >= *x.m_int;
		} else if (m_type == 3) {
			return *m_double >= *x.m_double;
		} else if (m_type == 4) {
			return *m_len >= *x.m_len;
		} else if (m_type == 5) {
			return *m_str >= *x.m_str;
		} else if (m_type == 6) {
			return *m_arr >= *x.m_arr;
		} else if (m_type == 7) {
			return *m_dict >= *x.m_dict;
		}
		throw TypeError("vlib::variant_t", to_str(
			"Unknown type id \"",
			m_type,
			"\"." ));
		return false;
	}
	inline constexpr
	bool 		operator <=(const This& x) const {
		if (m_type != x.m_type) {
			throw TypeError("vlib::variant_t", to_str(
				"Function \"",
				__FUNCTION__,
				"\" is not applicable for types \"",
				dtype(),
				"\" and \"",
				x.dtype(),
				"\"." ));
		}
		if (m_type == 0) {
			return true;
		} else if (m_type == 1) {
			return *m_bool <= *x.m_bool;
		} else if (m_type == 2) {
			return *m_int <= *x.m_int;
		} else if (m_type == 3) {
			return *m_double <= *x.m_double;
		} else if (m_type == 4) {
			return *m_len <= *x.m_len;
		} else if (m_type == 5) {
			return *m_str <= *x.m_str;
		} else if (m_type == 6) {
			return *m_arr <= *x.m_arr;
		} else if (m_type == 7) {
			return *m_dict <= *x.m_dict;
		}
		throw TypeError("vlib::variant_t", to_str(
			"Unknown type id \"",
			m_type,
			"\"." ));
		return false;
	}

	// Operators "+, ++, +=".
	inline constexpr
	auto& 		operator ++() {
		if (m_type <= 1) {
			throw TypeError("vlib::variant_t", to_str(
				"Function \"",
				__FUNCTION__,
				"\" is not applicable for type \"",
				dtype(),
				"\"." ));
		} else if (m_type == 2) {
			++(*m_int);
		} else if (m_type == 3) {
			++(*m_double);
		} else if (m_type == 4) {
			++(*m_len);
		} else if (m_type == 5) {
			++(*m_str);
		} else if (m_type == 6) {
			++(*m_arr);
		} else if (m_type == 7) {
			++(*m_dict);
		}
		return *this;
	}
	template <typename Type> constexpr //@TODO wont work with "const char*"
	This 		operator +(const Type& x) const {
		if (m_type <= 1) {
			throw TypeError("vlib::variant_t", to_str(
				"Function \"",
				__FUNCTION__,
				"\" is not applicable for type \"",
				dtype(),
				"\"." ));
		} else if (m_type == 2) {
			return *m_int + x;
		} else if (m_type == 3) {
			return *m_double + x;
		} else if (m_type == 4) {
			return *m_len + x;
		} else if (m_type == 5) {
			return *m_str + x;
		} else if (m_type == 6) {
			return *m_arr + x;
		} else if (m_type == 7) {
			return *m_dict + x;
		}
	}
	template <typename Type> constexpr //@TODO wont work with "const char*"
	auto& 		operator +=(const Type& x) const {
		if (m_type <= 1) {
			throw TypeError("vlib::variant_t", to_str(
				"Function \"",
				__FUNCTION__,
				"\" is not applicable for type \"",
				dtype(),
				"\"." ));
		} else if (m_type == 2) {
			*m_int += x;
		} else if (m_type == 3) {
			*m_double += x;
		} else if (m_type == 4) {
			*m_len += x;
		} else if (m_type == 5) {
			*m_str += x;
		} else if (m_type == 6) {
			*m_arr += x;
		} else if (m_type == 7) {
			*m_dict += x;
		}
		return *this;
	}

	// Operators "-, --, -=".
	inline constexpr
	auto& 		operator --() {
		if (m_type <= 1) {
			throw TypeError("vlib::variant_t", to_str(
				"Function \"",
				__FUNCTION__,
				"\" is not applicable for type \"",
				dtype(),
				"\"." ));
		} else if (m_type == 2) {
			--(*m_int);
		} else if (m_type == 3) {
			--(*m_double);
		} else if (m_type == 4) {
			--(*m_len);
		} else if (m_type == 5) {
			--(*m_str);
		} else if (m_type == 6) {
			--(*m_arr);
		} else if (m_type == 7) {
			--(*m_dict);
		}
		return *this;
	}
	template <typename Type> constexpr //@TODO wont work with "const char*"
	This 		operator -(const Type& x) const {
		if (m_type == 0 || m_type == 1) {
			throw TypeError("vlib::variant_t", to_str(
				"Function \"",
				__FUNCTION__,
				"\" is not applicable for type \"",
				dtype(),
				"\"." ));
		} else if (m_type == 2) {
			return *m_int - x;
		} else if (m_type == 3) {
			return *m_double - x;
		} else if (m_type == 4) {
			return *m_len - x;
		} else if (m_type == 5) {
			return *m_str - x;
		} else if (m_type == 6) {
			return *m_arr - x;
		} else if (m_type == 7) {
			return *m_dict - x;
		}
	}
	template <typename Type> constexpr //@TODO wont work with "const char*"
	auto& 		operator -=(const Type& x) const {
		if (m_type <= 1) {
			throw TypeError("vlib::variant_t", to_str(
				"Function \"",
				__FUNCTION__,
				"\" is not applicable for type \"",
				dtype(),
				"\"." ));
		} else if (m_type == 2) {
			*m_int -= x;
		} else if (m_type == 3) {
			*m_double -= x;
		} else if (m_type == 4) {
			*m_len -= x;
		} else if (m_type == 5) {
			*m_str -= x;
		} else if (m_type == 6) {
			*m_arr -= x;
		} else if (m_type == 7) {
			*m_dict -= x;
		}
		return *this;
	}

	// Operators "*, *=" with any numeric.
	template <typename Numeric> requires (
		is_any_numeric<Numeric>::value ||
		is_any_Numeric<Numeric>::value
	) inline constexpr
	auto	 	operator *(const Numeric& x) const {
		This obj(*this);
		obj *= x;
		return obj;
	}
	template <typename Numeric> requires (
		is_any_numeric<Numeric>::value ||
		is_any_Numeric<Numeric>::value
	) inline constexpr
	auto& 		operator *=(const Numeric& x) {
		if (m_type <= 1) {
			throw TypeError("vlib::variant_t", to_str(
				"Function \"",
				__FUNCTION__,
				"\" is not applicable for type \"",
				dtype(),
				"\"." ));
		} else if (m_type == 2) {
			*m_int *= x;
		} else if (m_type == 3) {
			*m_double *= x;
		} else if (m_type == 4) {
			*m_len *= x;
		} else if (m_type == 5) {
			*m_str *= x;
		} else if (m_type == 6) {
			*m_arr *= x;
		} else if (m_type == 7) {
			*m_dict *= x;
		}
		return *this;
	}

	// Operators "/, /=" with any numeric.
	template <typename Numeric> requires (
		is_any_numeric<Numeric>::value ||
		is_any_Numeric<Numeric>::value
	) inline constexpr
	auto	 	operator /(const Numeric& x) const {
		This obj(*this);
		obj /= x;
		return obj;
	}
	template <typename Numeric> requires (
		is_any_numeric<Numeric>::value ||
		is_any_Numeric<Numeric>::value
	) inline constexpr
	auto& 		operator /=(const Numeric& x) {
		if (m_type <= 1) {
			throw TypeError("vlib::variant_t", to_str(
				"Function \"",
				__FUNCTION__,
				"\" is not applicable for type \"",
				dtype(),
				"\"." ));
		} else if (m_type == 2) {
			*m_int /= x;
		} else if (m_type == 3) {
			*m_double /= x;
		} else if (m_type == 4) {
			*m_len /= x;
		} else if (m_type == 5) {
			*m_str /= x;
		} else if (m_type == 6) {
			*m_arr /= x;
		} else if (m_type == 7) {
			*m_dict /= x;
		}
		return *this;
	}

	// Operators "%, %=" with any numeric.
	template <typename Numeric> requires (
		is_any_integer<Numeric>::value ||
		is_any_integer_Numeric<Numeric>::value
	) inline constexpr
	auto	 	operator %(const Numeric& x) const {
		This obj(*this);
		obj %= x;
		return obj;
	}
	template <typename Numeric> requires (
		is_any_integer<Numeric>::value ||
		is_any_integer_Numeric<Numeric>::value
	) inline constexpr
	auto& 		operator %=(const Numeric& x) {
		if (m_type <= 1) {
			throw TypeError("vlib::variant_t", to_str(
				"Function \"",
				__FUNCTION__,
				"\" is not applicable for type \"",
				dtype(),
				"\"." ));
		} else if (m_type == 2) {
			*m_int %= x;
		} else if (m_type == 3) {
			*m_double %= x;
		} else if (m_type == 4) {
			*m_len %= x;
		} else if (m_type == 5) {
			*m_str %= x;
		} else if (m_type == 6) {
			*m_arr %= x;
		} else if (m_type == 7) {
			*m_dict %= x;
		}
		return *this;
	}

	// Subscript operator
	inline constexpr
	auto& 		operator [](const Len& index) const {
		if (m_type <= 4) {
			throw TypeError("vlib::variant_t", to_str(
				"Function \"",
				__FUNCTION__,
				"\" is not applicable for type \"",
				dtype(),
				"\"." ));
		} else if (m_type == 5) {
			return m_str->operator[](index);
		} else if (m_type == 6) {
			return m_arr->operator[](index);
		} else if (m_type == 7) {
			return m_dict->operator[](index);
		}
		return *this;
	}

	// Dump to pipe.
	constexpr
	friend Pipe&		operator <<(Pipe& pipe, const This& obj) {
		if (obj.m_type == 0) {
			return pipe << "null";
		} else if (obj.m_type == 1) {
			return pipe << *obj.m_bool;
		} else if (obj.m_type == 2) {
			return pipe << *obj.m_int;
		} else if (obj.m_type == 3) {
			return pipe << *obj.m_double;
		} else if (obj.m_type == 4) {
			return pipe << *obj.m_len;
		} else if (obj.m_type == 5) {
			return pipe << *obj.m_str;
		} else if (obj.m_type == 6) {
			return pipe << *obj.m_arr;
		} else if (obj.m_type == 7) {
			return pipe << *obj.m_dict;
		} else {
			return pipe << "ERROR";
		}
	}

	//
};

// ---------------------------------------------------------
// Type definitions.

#define vArray Array<variant_t<Shared>>
#define vDict Dict<variant_t<Shared>, variant_t<Shared>>

// ---------------------------------------------------------
// Instances.

// Is variant type.
template<typename Type> struct is_variant_t 								{ SICEBOOL value = false; };
template<> 				struct is_variant_t<variant_t<Unique>> 			{ SICEBOOL value = true;  };
template<> 				struct is_variant_t<variant_t<Unique>&> 			{ SICEBOOL value = true;  };
template<> 				struct is_variant_t<variant_t<Unique>&&> 			{ SICEBOOL value = true;  };
template<> 				struct is_variant_t<const variant_t<Unique>> 		{ SICEBOOL value = true;  };
template<> 				struct is_variant_t<const variant_t<Unique>&> 	{ SICEBOOL value = true;  };
template<> 				struct is_variant_t<variant_t<Shared>> 			{ SICEBOOL value = true;  };
template<> 				struct is_variant_t<variant_t<Shared>&> 			{ SICEBOOL value = true;  };
template<> 				struct is_variant_t<variant_t<Shared>&&> 			{ SICEBOOL value = true;  };
template<> 				struct is_variant_t<const variant_t<Shared>> 		{ SICEBOOL value = true;  };
template<> 				struct is_variant_t<const variant_t<Shared>&> 	{ SICEBOOL value = true;  };

// Is unique type.
template<> 				struct is_Unique<variant_t<Unique>> 			{ SICEBOOL value = true;  };
template<> 				struct is_Unique<variant_t<Unique>&> 			{ SICEBOOL value = true;  };
template<> 				struct is_Unique<variant_t<Unique>&&> 			{ SICEBOOL value = true;  };
template<> 				struct is_Unique<const variant_t<Unique>> 		{ SICEBOOL value = true;  };
template<> 				struct is_Unique<const variant_t<Unique>&> 		{ SICEBOOL value = true;  };

// Is shared type.
template<> 				struct is_Shared<variant_t<Shared>> 			{ SICEBOOL value = true;  };
template<> 				struct is_Shared<variant_t<Shared>&> 			{ SICEBOOL value = true;  };
template<> 				struct is_Shared<variant_t<Shared>&&> 			{ SICEBOOL value = true;  };
template<> 				struct is_Shared<const variant_t<Shared>> 		{ SICEBOOL value = true;  };
template<> 				struct is_Shared<const variant_t<Shared>&> 		{ SICEBOOL value = true;  };

// ---------------------------------------------------------
// Shortcuts.
namespace types { namespace shortcuts {

template <typename Status = Shared>
using variant_t =		vlib::variant_t<Status>;

}; 		// End namespace sockets.
}; 		// End namespace shortcuts.

// ---------------------------------------------------------
// End.

}; 		// End namespace vlib.
#endif 	// End header.
