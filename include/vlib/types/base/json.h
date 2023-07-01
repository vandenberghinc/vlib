// Author: Daan van den Bergh
// Copyright: © 2022 Daan van den Bergh.

// Header.
#ifndef VLIB_JSON_T_H
#define VLIB_JSON_T_H

// Namespace vlib.
namespace vlib {

// Namespace json.
namespace json {

// ---------------------------------------------------------
// Json value types & errors.

enum types {
	null = 0,
	boolean = 1,
	floating = 2,
	integer = 3,
	len = 4,
	string = 5,
	array = 6,
	json = 7,
};
String strtype(const ushort& x) {
    switch (x) {
        case null:
            return String("Null", 4);
        case boolean:
            return String("Bool", 4);
        case floating:
            return String("Floating", 8);
        case integer:
            return String("Integer", 7);
        case len:
            return String("Length", 6);
        case string:
            return String("String", 6);
        case array:
            return String("JArray", 6);
        case json:
            return String("Json", 4);
        default:
            return String("Unkown", 6);
    }
}
namespace internal {
int null_status;
}

// ---------------------------------------------------------
// Json value type.
//
// Warning:
// - When multiple json's ({...}{...}) are parsed in one string. All values from the previous json's will be overwritten.
//
// Notes:
// - A json JsonValue is "null" by default.
// - A signed integral type (non floating) is called int, though the max value is that of a long long.
//
// @TODO make switch in copy and construct etc. do not copy all but only a single.
// @TODO docs.
template <typename Json>
struct JsonValue {

// Public.
public:
    
	// ---------------------------------------------------------
	// Aliases.

	using 		This = 			JsonValue;
    using       JArray =        Array<typename Json::value_type>; // otherwise it causes issues with derived classes.
    
    // Is JsonValue template for g++ compiler.
    template <typename LType> requires (!std::is_same<const LType, const JsonValue>::value) SICE
    bool is_JsonValue_h() { return false; }
    template <typename LType> requires (std::is_same<const LType, const JsonValue>::value) SICE
    bool is_JsonValue_h() { return true; }
    
    // Is JArray template for g++ compiler.
    template <typename LType> requires (!std::is_same<const LType, const JArray>::value) SICE
    bool is_JArray_h() { return false; }
    template <typename LType> requires (std::is_same<const LType, const JArray>::value) SICE
    bool is_JArray_h() { return true; }
    
    // Is Json template for g++ compiler.
    template <typename LType> requires (!std::is_same<const LType, const Json>::value) SICE
    bool is_Json_h() { return false; }
    template <typename LType> requires (std::is_same<const LType, const Json>::value) SICE
    bool is_Json_h() { return true; }

// Protected.
protected:
    
	// ---------------------------------------------------------
	// Attributes.

	ushort			m_type;
	UPtr<Bool>		m_bool;
	UPtr<LDouble>	m_double;
	UPtr<LLong>		m_int;
	UPtr<Len>		m_len;
	UPtr<String>	m_str;
	UPtr<JArray>    m_arr;
	UPtr<Json>		m_json;
    
    // ---------------------------------------------------------
    // Private functions.
    
    // To jarray.
    template <typename Type> constexpr
    JArray to_jarray(const Array<Type>& x) {
        JArray arr;
        for (auto& val: x) {
            arr.append(val);
        }
        return arr;
    }
    template <typename Type> constexpr
    JArray to_jarray(Array<Type>&& x) {
        JArray arr;
        for (auto& val: x) {
            arr.append(move(val));
        }
        return arr;
    }

public:
    
	// ---------------------------------------------------------
	// Construct functions.

	// Copy.
	constexpr
	auto&   copy(const This& obj) {
		m_type =	obj.m_type;
		m_bool.copy(obj.m_bool);
		m_double.copy(obj.m_double);
		m_int.copy(obj.m_int);
		m_len.copy(obj.m_len);
		m_str.copy(obj.m_str);
		m_arr.copy(obj.m_arr);
		m_json.copy(obj.m_json);
		return *this;
	}
	constexpr
	auto&   construct(const This& obj) {
		m_type =	obj.m_type;
		m_bool.copy(obj.m_bool);
		m_double.copy(obj.m_double);
		m_int.copy(obj.m_int);
		m_len.copy(obj.m_len);
		m_str.copy(obj.m_str);
		m_arr.copy(obj.m_arr);
		m_json.copy(obj.m_json);
		return *this;
	}

	// Swap.
	constexpr
	auto&   swap(This& obj) {
		m_type =	obj.m_type;
		m_bool.swap(obj.m_bool);
		m_double.swap(obj.m_double);
		m_int.swap(obj.m_int);
		m_len.swap(obj.m_len);
		m_str.swap(obj.m_str);
		m_arr.swap(obj.m_arr);
		m_json.swap(obj.m_json);
		return *this;
	}
	constexpr
	auto&   construct(This& obj) {
		m_type =	obj.m_type;
		m_bool.swap(obj.m_bool);
		m_double.swap(obj.m_double);
		m_int.swap(obj.m_int);
		m_len.swap(obj.m_len);
		m_str.swap(obj.m_str);
		m_arr.swap(obj.m_arr);
		m_json.swap(obj.m_json);
		return *this;
	}

	// Construct from Null.
	constexpr
	auto&   construct(const Null&) {
		m_type = types::null;
		return *this;
	}
	constexpr
	auto&   construct(Null&&) {
		m_type = types::null;
		return *this;
	}

	// Construct from Bool.
	template <typename Type> requires (is_Bool<Type>::value || is_bool<Type>::value) constexpr
	auto&   construct(const Type& x) {
		m_bool = x;
		m_type = types::boolean;
		return *this;
	}
	template <typename Type> requires (is_Bool<Type>::value || is_bool<Type>::value) constexpr
	auto&   construct(Type&& x) {
		m_bool = x;
		m_type = types::boolean;
		return *this;
	}
    
	// Construct from Double.
	template <typename Type> requires (is_floating_Numeric<Type>::value || is_floating<Type>::value) constexpr
	auto&   construct(const Type& x) {
		m_double = x;
		m_type = types::floating;
		return *this;
	}
	template <typename Type> requires (is_floating_Numeric<Type>::value || is_floating<Type>::value) constexpr
	auto&   construct(Type&& x) {
		m_double = x;
		m_type = types::floating;
		return *this;
	}

	// Construct from Long.
	template <typename Type> requires (is_signed_Numeric<Type>::value || is_signed_numeric<Type>::value) constexpr
	auto&   construct(const Type& x) {
		m_int = x;
		m_type = types::integer;
		return *this;
	}
	template <typename Type> requires (is_signed_Numeric<Type>::value || is_signed_numeric<Type>::value) constexpr
	auto&   construct(Type&& x) {
		m_int = x;
		m_type = types::integer;
		return *this;
	}

	// Construct from Len.
	template <typename Type> requires (is_unsigned_Numeric<Type>::value || is_unsigned_numeric<Type>::value) constexpr
	auto&   construct(const Type& x) {
		m_len = x;
		m_type = types::len;
		return *this;
	}
	template <typename Type> requires (is_unsigned_Numeric<Type>::value || is_unsigned_numeric<Type>::value) constexpr
	auto&   construct(Type&& x) {
		m_len = x;
		m_type = types::len;
		return *this;
	}

	// Construct from String.
	template <typename Type> requires (is_String<Type>::value) constexpr
	auto&   construct(const Type& x) {
		m_str = x;
		m_type = types::string;
		return *this;
	}
	template <typename Type> requires (is_String<Type>::value) constexpr
	auto&   construct(Type&& x) {
		m_str = x;
		m_type = types::string;
		return *this;
	}
	constexpr
	auto&   construct(const char* x) {
		m_str = x;
		m_type = types::string;
		return *this;
	}
	constexpr
	auto&   construct(const char* x, const ullong& len) {
		m_str.reconstruct_by_type_args(x, len);
		m_type = types::string;
		return *this;
	}

	// Construct from Array.
	template <typename Type> requires (is_JArray_h<Type>() && !is_String<Type>::value) constexpr
	auto&   construct(const Type& x) {
		m_arr = x;
		m_type = types::array;
		return *this;
	}
	template <typename Type> requires (is_JArray_h<Type>() && !is_String<Type>::value) constexpr
	auto&   construct(Type&& x) {
		m_arr = x;
		m_type = types::array;
		return *this;
	}

	// Construct from Json.
	constexpr
	auto&   construct(const Json& x) {
		m_json = x;
		m_type = types::json;
		return *this;
	}
	constexpr
	auto&   construct(Json&& x) {
		m_json = x;
		m_type = types::json;
		return *this;
	}
    
    // Construct from Dict.
    template <typename Type> requires (
        is_Null<Type>::value || is_Bool<Type>::value || is_bool<Type>::value ||
        is_floating_Numeric<Type>::value || is_floating<Type>::value ||
        is_signed_Numeric<Type>::value || is_signed_numeric<Type>::value ||
        is_unsigned_Numeric<Type>::value || is_unsigned_numeric<Type>::value ||
        is_cstr<Type>::value || is_String<Type>::value || is_JArray_h<Type>() || is_Json_h<Type>()
    ) constexpr
    auto&   construct(const Dict<String, Type>& x) {
        m_json = x;
        m_type = types::json;
        return *this;
    }
    template <typename Type> requires (
        is_Null<Type>::value || is_Bool<Type>::value || is_bool<Type>::value ||
        is_floating_Numeric<Type>::value || is_floating<Type>::value ||
        is_signed_Numeric<Type>::value || is_signed_numeric<Type>::value ||
        is_unsigned_Numeric<Type>::value || is_unsigned_numeric<Type>::value ||
        is_cstr<Type>::value || is_String<Type>::value || is_JArray_h<Type>() || is_Json_h<Type>()
    ) constexpr
    auto&   construct(Dict<String, Type>&& x) {
        m_json = x;
        m_type = types::json;
        return *this;
    }
    
    // Construct from Array.
    template <typename Type> requires (
        is_Null<Type>::value || is_Bool<Type>::value || is_bool<Type>::value ||
        is_floating_Numeric<Type>::value || is_floating<Type>::value ||
        is_signed_Numeric<Type>::value || is_signed_numeric<Type>::value ||
        is_unsigned_Numeric<Type>::value || is_unsigned_numeric<Type>::value ||
        is_cstr<Type>::value || is_String<Type>::value || is_JArray_h<Type>() || is_Json_h<Type>()
    ) constexpr
    auto&   construct(const Array<Type>& x) {
        m_arr = to_jarray(x);
        m_type = types::array;
        return *this;
    }
    template <typename Type> requires (
        is_Null<Type>::value || is_Bool<Type>::value || is_bool<Type>::value ||
        is_floating_Numeric<Type>::value || is_floating<Type>::value ||
        is_signed_Numeric<Type>::value || is_signed_numeric<Type>::value ||
        is_unsigned_Numeric<Type>::value || is_unsigned_numeric<Type>::value ||
        is_cstr<Type>::value || is_String<Type>::value || is_JArray_h<Type>() || is_Json_h<Type>()
    ) constexpr
    auto&   construct(Array<Type>&& x) {
        m_arr = to_jarray(x);
        m_type = types::array;
        return *this;
    }

	// Reconstruct.
	template <typename Type> requires (
        is_Null<Type>::value || is_Bool<Type>::value || is_bool<Type>::value ||
        is_floating_Numeric<Type>::value || is_floating<Type>::value ||
        is_signed_Numeric<Type>::value || is_signed_numeric<Type>::value ||
        is_unsigned_Numeric<Type>::value || is_unsigned_numeric<Type>::value ||
        is_cstr<Type>::value || is_String<Type>::value || is_JArray_h<Type>() || is_Array<Type>::value || is_Json_h<Type>()
    ) constexpr
	auto&   reconstruct(const Type& type) {
		reset();
		construct(type);
		return *this;
	}
	template <typename Type> requires (
        is_Null<Type>::value || is_Bool<Type>::value || is_bool<Type>::value ||
        is_floating_Numeric<Type>::value || is_floating<Type>::value ||
        is_signed_Numeric<Type>::value || is_signed_numeric<Type>::value ||
        is_unsigned_Numeric<Type>::value || is_unsigned_numeric<Type>::value ||
        is_cstr<Type>::value || is_String<Type>::value || is_JArray_h<Type>() || is_Array<Type>::value || is_Json_h<Type>()
    ) constexpr
	auto&   reconstruct(Type&& type) {
		reset();
		construct(type);
		return *this;
	}
    constexpr
    auto&   reconstruct(const char* data) {
        reset();
        construct(data);
        return *this;
    }
    constexpr
    auto&   reconstruct(const char* data, const ullong& len) {
        reset();
        construct(data, len);
        return *this;
    }

	// Reset.
	constexpr
	This& 		reset() {
		m_type = types::null;
		m_bool.reset();
		m_double.reset();
		m_len.reset();
		m_int.reset();
		m_str.reset();
		m_arr.reset();
		m_json.reset();
		return *this;
	}

	// ---------------------------------------------------------
	// Constructors.

	// Default constructor.
	constexpr
	JsonValue()
	: m_type(types::null) {}

	// Template constructor.
	template <typename Type> requires (
        is_Null<Type>::value || is_Bool<Type>::value || is_bool<Type>::value ||
        is_floating_Numeric<Type>::value || is_floating<Type>::value ||
        is_signed_Numeric<Type>::value || is_signed_numeric<Type>::value ||
        is_unsigned_Numeric<Type>::value || is_unsigned_numeric<Type>::value ||
        is_cstr<Type>::value || is_String<Type>::value || is_JArray_h<Type>() || is_Json_h<Type>()
    ) constexpr
	JsonValue (const Type& x) {
		construct(x);
	}
	template <typename Type> requires (
        is_Null<Type>::value || is_Bool<Type>::value || is_bool<Type>::value ||
        is_floating_Numeric<Type>::value || is_floating<Type>::value ||
        is_signed_Numeric<Type>::value || is_signed_numeric<Type>::value ||
        is_unsigned_Numeric<Type>::value || is_unsigned_numeric<Type>::value ||
        is_cstr<Type>::value || is_String<Type>::value || is_JArray_h<Type>() || is_Json_h<Type>()
    ) constexpr
	JsonValue (Type&& x) {
		construct(x);
	}
    constexpr
    JsonValue (const char* data) {
        construct(data);
    }
    constexpr
    JsonValue (const char* data, const ullong& len) {
        construct(data, len);
    }
    
    // Constructor from dict.
    template <typename Type> requires (
        is_Null<Type>::value || is_Bool<Type>::value || is_bool<Type>::value ||
        is_floating_Numeric<Type>::value || is_floating<Type>::value ||
        is_signed_Numeric<Type>::value || is_signed_numeric<Type>::value ||
        is_unsigned_Numeric<Type>::value || is_unsigned_numeric<Type>::value ||
        is_cstr<Type>::value || is_String<Type>::value || is_JArray_h<Type>() || is_Json_h<Type>()
    ) constexpr
    JsonValue (const Dict<String, Type>& x) {
        construct(x);
    }
    template <typename Type> requires (
        is_Null<Type>::value || is_Bool<Type>::value || is_bool<Type>::value ||
        is_floating_Numeric<Type>::value || is_floating<Type>::value ||
        is_signed_Numeric<Type>::value || is_signed_numeric<Type>::value ||
        is_unsigned_Numeric<Type>::value || is_unsigned_numeric<Type>::value ||
        is_cstr<Type>::value || is_String<Type>::value || is_JArray_h<Type>() || is_Json_h<Type>()
    ) constexpr
    JsonValue (Dict<String, Type>&& x) {
        construct(x);
    }
    
    // Constructor from array.
    template <typename Type> requires (
        is_Null<Type>::value || is_Bool<Type>::value || is_bool<Type>::value ||
        is_floating_Numeric<Type>::value || is_floating<Type>::value ||
        is_signed_Numeric<Type>::value || is_signed_numeric<Type>::value ||
        is_unsigned_Numeric<Type>::value || is_unsigned_numeric<Type>::value ||
        is_cstr<Type>::value || is_String<Type>::value || is_JArray_h<Type>() || is_Json_h<Type>()
    ) constexpr
    JsonValue (const Array<Type>& x) {
        construct(x);
    }
    template <typename Type> requires (
        is_Null<Type>::value || is_Bool<Type>::value || is_bool<Type>::value ||
        is_floating_Numeric<Type>::value || is_floating<Type>::value ||
        is_signed_Numeric<Type>::value || is_signed_numeric<Type>::value ||
        is_unsigned_Numeric<Type>::value || is_unsigned_numeric<Type>::value ||
        is_cstr<Type>::value || is_String<Type>::value || is_JArray_h<Type>() || is_Json_h<Type>()
    ) constexpr
    JsonValue (Array<Type>&& x) {
        construct(x);
    }

	// Copy constructor.
    constexpr
	JsonValue (const This& obj) {
		copy(obj);
	}

	// Move constructor.
    constexpr
	JsonValue (This&& obj) {
		swap(obj);
	}
    
    // Constructor for derived classes.
    constexpr
    JsonValue (
        const ushort& l_type,
        const UPtr<Bool>& l_bool,
        const UPtr<LDouble>& l_double,
        const UPtr<LLong>& l_int,
        const UPtr<Len>& l_len,
        const UPtr<String>& l_str,
        const UPtr<JArray>& l_arr,
        const UPtr<Json>& l_json
    ) :
    m_type(l_type),
    m_bool(l_bool),
    m_double(l_double),
    m_int(l_int),
    m_len(l_len),
    m_str(l_str),
    m_arr(l_arr),
    m_json(l_json)
    {}
    constexpr
    JsonValue (
        ushort&& l_type,
        UPtr<Bool>&& l_bool,
        UPtr<LDouble>&& l_double,
        UPtr<LLong>&& l_int,
        UPtr<Len>&& l_len,
        UPtr<String>&& l_str,
        UPtr<JArray>&& l_arr,
        UPtr<Json>&& l_json
    ) :
    m_type(l_type),
    m_bool(l_bool),
    m_double(l_double),
    m_int(l_int),
    m_len(l_len),
    m_str(l_str),
    m_arr(l_arr),
    m_json(l_json)
    {}
    

	// ---------------------------------------------------------
	// Assignment operators.

	// Template constructor.
    template <typename Type> requires (
        is_Null<Type>::value || is_Bool<Type>::value || is_bool<Type>::value ||
        is_floating_Numeric<Type>::value || is_floating<Type>::value ||
        is_signed_Numeric<Type>::value || is_signed_numeric<Type>::value ||
        is_unsigned_Numeric<Type>::value || is_unsigned_numeric<Type>::value ||
        is_cstr<Type>::value || is_String<Type>::value || is_JArray_h<Type>() || is_Json_h<Type>()
    ) constexpr
    This& 	operator =(const Type& x) {
		return reconstruct(x);
	}
    template <typename Type> requires (
        is_Null<Type>::value || is_Bool<Type>::value || is_bool<Type>::value ||
        is_floating_Numeric<Type>::value || is_floating<Type>::value ||
        is_signed_Numeric<Type>::value || is_signed_numeric<Type>::value ||
        is_unsigned_Numeric<Type>::value || is_unsigned_numeric<Type>::value ||
        is_str<Type>::value || is_String<Type>::value || is_JArray_h<Type>() || is_Json_h<Type>()
    ) constexpr
    This& 	operator =(Type&& x) {
		return reconstruct(x);
	}
    constexpr
    This&   operator =(const char* data) {
        return reconstruct(data);
    }

	// Copy constructor.
	constexpr
	This& 	operator =(const This& obj) {
		return copy(obj);
	}

	// Move constructor.
	constexpr
    This& 	operator =(This&& obj) {
		return swap(obj);
	}

	// ---------------------------------------------------------
	// Attribute functions.

	// Type.
	constexpr
	auto&	type() const { return m_type; }
    
    // Is defined / undefined.
    constexpr
    auto    is_undefined() const { return m_type == types::null; }
    constexpr
    auto    is_defined() const { return m_type != types::null; }

	// Null.
	constexpr
	auto	isn() const { return m_type == types::null; }
    constexpr
    auto&   asn() const {
        switch (m_type) {
            case types::null:
                return vlib::null;
            default:
                throw TypeError(tostr("Value type is not \"Null\" but \"", strtype(m_type), "\"."));
                return vlib::null;
        }
    }

	// Bool.
	constexpr
	auto	isb() const { return m_type == types::boolean; }
    constexpr
    auto&   asb() const {
        switch (m_type) {
            case types::boolean:
                return *m_bool;
            default:
                throw TypeError(tostr("Value type is not \"Bool\" but \"", strtype(m_type), "\"."));
                return *m_bool;
        }
    }

	// Floating.
	constexpr
	auto	isf() const { return m_type == types::floating; }
    constexpr
    auto&   asf() const {
        switch (m_type) {
            case types::floating:
                return *m_double;
            default:
                throw TypeError(tostr("Value type is not \"Floating\" but \"", strtype(m_type), "\"."));
                return *m_double;
        }
    }

	// Integer.
	constexpr
	auto	isi() const { return m_type == types::integer; }
    constexpr
    auto&   asi() const {
        switch (m_type) {
            case types::integer:
                return *m_int;
            default:
                throw TypeError(tostr("Value type is not \"Integer\" but \"", strtype(m_type), "\"."));
                return *m_int;
        }
    }

	// Len.
	constexpr
	auto	isl() const { return m_type == types::len; }
    constexpr
    auto&   asl() const {
        switch (m_type) {
            case types::len:
                return *m_len;
            default:
                throw TypeError(tostr("Value type is not \"Length\" but \"", strtype(m_type), "\"."));
                return *m_len;
        }
    }

	// String.
	constexpr
	auto	iss() const { return m_type == types::string; }
	constexpr
    auto&	ass() const {
        switch (m_type) {
            case types::string:
                return *m_str;
            default:
                throw TypeError(tostr("Value type is not \"String\" but \"", strtype(m_type), "\"."));
                return *m_str;
        }
    }

	// Array.
	constexpr
	auto	isa() const { return m_type == types::array; }
    constexpr
    auto&   asa() const {
        switch (m_type) {
            case types::array:
                return *m_arr;
            default:
                throw TypeError(tostr("Value type is not \"Array\" but \"", strtype(m_type), "\"."));
                return *m_arr;
        }
    }

	// Json.
	constexpr
	auto	isj() const { return m_type == types::json; }
    constexpr
    auto&   asj() const {
        switch (m_type) {
            case types::json:
                return *m_json;
            default:
                throw TypeError(tostr("Value type is not \"Json\" but \"", strtype(m_type), "\"."));
                return *m_json;
        }
    }

    
    // Subscript operator.
    constexpr
    This&   value(const ullong& index) {
        switch (m_type) {
            case types::json:
                return m_json->value(index);
            default:
                throw TypeError(tostr("Function \"", __FUNCTION__, "\" is not supported for type \"", m_type, "\"."));
        }
    }
    constexpr
    This&   value(const ullong& index) const {
        switch (m_type) {
            case types::json:
                return m_json->value(index);
            default:
                throw TypeError(tostr("Function \"", __FUNCTION__, "\" is not supported for type \"", m_type, "\"."));
        }
    }
    constexpr
    This&   value(const String& key) {
        switch (m_type) {
            case types::json:
                return m_json->value(key);
            default:
                throw TypeError(tostr("Function \"", __FUNCTION__, "\" is not supported for type \"", m_type, "\"."));
        }
    }
    constexpr
    This&   value(const String& key) const {
        switch (m_type) {
            case types::json:
                return m_json->value(key);
            default:
                throw TypeError(tostr("Function \"", __FUNCTION__, "\" is not supported for type \"", m_type, "\"."));
        }
    }
    constexpr
    This&   value(const char* key, const ullong& len) {
        switch (m_type) {
            case types::json:
                return m_json->value(key, len);
            default:
                throw TypeError(tostr("Function \"", __FUNCTION__, "\" is not supported for type \"", m_type, "\"."));
        }
    }
    constexpr
    This&   value(const char* key, const ullong& len) const {
        switch (m_type) {
            case types::json:
                return m_json->value(key, len);
            default:
                throw TypeError(tostr("Function \"", __FUNCTION__, "\" is not supported for type \"", m_type, "\"."));
        }
    }
    
    // Parse to numerical value.
    template <typename Type> requires (is_any_integer_Numeric<Type>::value || is_floating_Numeric<Type>::value) constexpr
    Type    as() const {
        switch (m_type) {
            case types::integer:
                return *m_int;
            case types::floating:
                return *m_double;
            case types::len:
                return *m_len;
            default:
                throw ParseError(tostr("Unable to parse a numeric from type \"", m_type, "\"."));
        }
    }
    
    // Parse to string.
    template <typename Type> requires (is_String<Type>::value || is_char<Type>::value) constexpr
    String  as() const {
        return str();
    }
    
    // Parse to array.
    template <typename Type> requires (is_Array<Type>::value && !is_String<Type>::value) constexpr
    Type    as() const {
        switch (m_type) {
            case types::array: {
                Type arr;
                for (auto& val: *m_arr) {
                    arr.append(val.template as<typename Type::ValueType>());
                }
                return arr;
            }
            default:
                throw ParseError(tostr("Unable to parse a numeric from type \"", m_type, "\"."));
        }
    }
    
    // Get reference to underlying object by template type.
    //
    // Bool.
    template <typename Type> requires (is_Bool<Type>::value) constexpr
    auto& get() { return asb(); }
    template <typename Type> requires (is_Bool<Type>::value) constexpr
    auto& get() const { return asb(); }
    //
    // Double.
    template <typename Type> requires (is_LDouble<Type>::value) constexpr
    auto& get() { return asf(); }
    template <typename Type> requires (is_LDouble<Type>::value) constexpr
    auto& get() const { return asf(); }
    //
    // Int.
    template <typename Type> requires (is_LLong<Type>::value) constexpr
    auto& get() { return asi(); }
    template <typename Type> requires (is_LLong<Type>::value) constexpr
    auto& get() const { return asi(); }
    //
    // Len.
    template <typename Type> requires (is_Len<Type>::value) constexpr
    auto& get() { return asl(); }
    template <typename Type> requires (is_Len<Type>::value) constexpr
    auto& get() const { return asl(); }
    //
    // String.
    template <typename Type> requires (is_String<Type>::value) constexpr
    auto& get() { return ass(); }
    template <typename Type> requires (is_String<Type>::value) constexpr
    auto& get() const { return ass(); }
    //
    // Array.
    template <typename Type> requires (is_JArray_h<Type>()) constexpr
    auto& get() { return asa(); }
    template <typename Type> requires (is_JArray_h<Type>()) constexpr
    auto& get() const { return asa(); }
    //
    // Json.
    template <typename Type> requires (is_Json_h<Type>()) constexpr
    auto& get() { return asj(); }
    template <typename Type> requires (is_Json_h<Type>()) constexpr
    auto& get() const { return asj(); }

	// ---------------------------------------------------------
	// Casts.

	// As String.
	constexpr
	String	str() const {
		switch (m_type) {
		case types::null:
			return vlib::null.str();
		case types::boolean:
			return m_bool->str();
		case types::floating:
			return m_double->str();
		case types::integer:
			return m_int->str();
		case types::len:
			return m_len->str();
		case types::string:
			return *m_str;
		case types::array:
			return m_arr->str();
		case types::json:
			return m_json->str();
		default:
			throw TypeError(tostr("Unknown type: ", m_type, "."));
		}
	}

	// As json formatted string.
	constexpr
	String	json() const {
		switch (m_type) {
		case types::null:
			return vlib::null.json();
		case types::boolean:
			return m_bool->json();
		case types::floating:
			return m_double->json();
		case types::integer:
			return m_int->json();
		case types::len:
			return m_len->json();
		case types::string:
			return m_str->json();
		case types::array:
			return m_arr->json();
		case types::json:
			return m_json->json();
		default:
			throw TypeError(tostr("Unknown type: ", m_type, "."));
		}
	}

	// ---------------------------------------------------------
	// Operators.
	
	// Operator ==.
	constexpr friend
	bool	operator ==(const This& x, const This& y) {
		if (x.m_type != y.m_type) { return false; }
		switch (x.m_type) {
			case types::null:
				return true;
			case types::boolean:
				return *x.m_bool == *y.m_bool;
			case types::floating:
				return *x.m_double == *y.m_double;
			case types::integer:
				return *x.m_int == *y.m_int;
			case types::len:
				return *x.m_len == *y.m_len;
			case types::string:
				return *x.m_str == *y.m_str;
			case types::array:
				return *x.m_arr == *y.m_arr;
			case types::json:
				return *x.m_json == *y.m_json;
			default:
				return false;
		}
	}
	constexpr friend
	bool	operator !=(const This& x, const This& y) {
		return !(x == y);
	}
    
    // Subscript operator.
    constexpr
    This&   operator [](const ullong& index) {
        switch (m_type) {
            // case types::str:
            //     return m_str->operator[](index);
            case types::array:
                return m_arr->operator[](index);
            case types::json:
                return m_json->operator[](index);
            default:
                throw TypeError(tostr("Function \"", __FUNCTION__, "\" is not supported for type \"", m_type, "\"."));
        }
    }
    constexpr
    This&   operator [](const ullong& index) const {
        switch (m_type) {
            // case types::str:
            //     return m_str->operator[](index);
            case types::array:
                return m_arr->operator[](index);
            case types::json:
                return m_json->operator[](index);
            default:
                throw TypeError(tostr("Function \"", __FUNCTION__, "\" is not supported for type \"", m_type, "\"."));
        }
    }
    constexpr
    This&   operator [](const String& key) {
        switch (m_type) {
            case types::json:
                return m_json->operator[](key);
            default:
                throw TypeError(tostr("Function \"", __FUNCTION__, "\" is not supported for type \"", m_type, "\"."));
        }
    }
    constexpr
    This&   operator [](const String& key) const {
        switch (m_type) {
            case types::json:
                return m_json->operator[](key);
            default:
                throw TypeError(tostr("Function \"", __FUNCTION__, "\" is not supported for type \"", m_type, "\"."));
        }
    }

	// Dump to pipe.
	constexpr friend
	auto&	operator <<(Pipe& pipe, const This& obj) {
		switch (obj.m_type) {
			case types::null:
				return pipe << vlib::null;
			case types::boolean:
				return pipe << *obj.m_bool;
			case types::floating:
				return pipe << *obj.m_double;
			case types::integer:
				return pipe << *obj.m_int;
			case types::len:
				return pipe << *obj.m_len;
			case types::string:
				return pipe << *obj.m_str;
			case types::array:
				return pipe << *obj.m_arr;
			case types::json:
				return pipe << *obj.m_json;
			default:
				return pipe << "ERROR";
		}
	}

};

// ---------------------------------------------------------
// Json type.
//
// Notes:
// - Perhaps optimizations could be made by having a char* buffer attribute from parsing.
//   So a CString could be used instead of a str for at least the keys, but the this creates ...
//   A problem when a copy constructor is invoked, the keys and values that use the buffer ...
//   Will still point to the old buffer, which may go out of scope.
//
/*  @docs {
	@chapter: types
	@title: JSON
	@description:
		Dynamic json dictionary.
    @warning:
        When multiple json's ({...}{...}) are parsed in one string. All values from the previous json's will be overwritten by the last json.
	@usage:
        #include <vlib/types.h>
		vlib::Json x ({
			{"a": true},
			{"b": 0},
			{"c": null},
			{"d": "Hello World!"},
		});
} */

struct Json : public Dict<String, JsonValue<Json>> {

// Public.
public:
    
    // ---------------------------------------------------------
    // Aliases.

    using         This =        Json;
    using         Key =         String;
    using         Value =       JsonValue<Json>;
    using         JArray =      Array<Value>;
    using         Pair =        vlib::Pair<Key, Value>;
    using         Base =        Dict<Key, Value>;
    
// Private.
private:

    // ---------------------------------------------------------
    // Private functions.

    // To json.
    template <typename Type> requires (
        is_Null<Type>::value || is_Bool<Type>::value || is_bool<Type>::value ||
        is_floating_Numeric<Type>::value || is_floating<Type>::value ||
        is_signed_Numeric<Type>::value || is_signed_numeric<Type>::value ||
        is_unsigned_Numeric<Type>::value || is_unsigned_numeric<Type>::value ||
        is_String<Type>::value || Value::is_JArray_h<Type>() || Value::is_Json_h<Type>()
    )
    SICE
    Json to_json(const Dict<String, Type>& x) {
        Json json;
        for (auto& index: x.indexes()) {
            json.append(x.key(index), x.value(index));
        }
        return json;
    }
    template <typename Type> requires (
        is_Null<Type>::value || is_Bool<Type>::value || is_bool<Type>::value ||
        is_floating_Numeric<Type>::value || is_floating<Type>::value ||
        is_signed_Numeric<Type>::value || is_signed_numeric<Type>::value ||
        is_unsigned_Numeric<Type>::value || is_unsigned_numeric<Type>::value ||
        is_String<Type>::value || Value::is_JArray_h<Type>() || Value::is_Json_h<Type>()
    )
    SICE
    Json to_json(Dict<String, Type>&& x) {
        Json json;
        for (auto& index: x.indexes()) {
            json.append(move(x.key(index)), move(x.value(index)));
        }
        return json;
    }
    
// Public.
public:

	// ---------------------------------------------------------
	// Shortcuts.

	using Base::m_keys;
	using Base::m_values;

	using Base::reconstruct;
	using Base::find;
	using Base::operator[];

	// ---------------------------------------------------------
	// Attributes.

	char*		m_buff;
	ullong		m_buff_len;

	// ---------------------------------------------------------
	// Constructors.

	// Default constructor.
	constexpr
	Json () :
	Base() {}
	// constexpr
	// Json (const nullPtr&) :
	// Base() {}

	// Constructor from initializer list.
	constexpr
	Json (const std::initializer_list<Pair>& x) :
	Base(x) {}

	// Constructor from parse.
	constexpr
	Json (const String& str) :
	Base(parse(str.data(), str.len())) {}
	constexpr
	Json (const char* arr, const ullong& len) :
	Base(parse(arr, len)) {}
    
    // Constructor from dict.
    template <typename Type> requires (
        is_Null<Type>::value || is_Bool<Type>::value || is_bool<Type>::value ||
        is_floating_Numeric<Type>::value || is_floating<Type>::value ||
        is_signed_Numeric<Type>::value || is_signed_numeric<Type>::value ||
        is_unsigned_Numeric<Type>::value || is_unsigned_numeric<Type>::value ||
        is_String<Type>::value || Value::is_JArray_h<Type>() || Value::is_Json_h<Type>()
    ) constexpr
    Json (const Dict<String, Type>& x) :
    Base(to_json(x)) {}

	// Copy constructor from base.
	constexpr
	Json (const Base& obj) :
	Base(obj) {}

	// Move constructor from base.
	constexpr
	Json (Base&& obj) :
	Base(obj) {}

	// Copy constructor.
	constexpr
	Json (const This& obj) :
	Base(obj) {}

	// Move constructor.
	constexpr
	Json (This&& obj) :
	Base(obj) {}

	// ---------------------------------------------------------
	// Assignment operators.

	// Assignment operator from initializer list.
	constexpr
	This&	operator =(const std::initializer_list<Pair>& x) {
		reconstruct(x);
		return *this;
	}
    
    // Constructor from dict.
    template <typename Type> requires (
        is_Null<Type>::value || is_Bool<Type>::value || is_bool<Type>::value ||
        is_floating_Numeric<Type>::value || is_floating<Type>::value ||
        is_signed_Numeric<Type>::value || is_signed_numeric<Type>::value ||
        is_unsigned_Numeric<Type>::value || is_unsigned_numeric<Type>::value ||
        is_String<Type>::value || Value::is_JArray_h<Type>() || Value::is_Json_h<Type>()
    ) constexpr
    This&   operator =(const Dict<String, Type>& x) {
        reconstruct(to_json(x));
        return *this;
    }

	// Copy assignment operator.
	constexpr
	This&	operator =(const This& x) {
		copy(x);
		return *this;
	}

	// Move assignment operator.
	constexpr
	This&	operator =(This&& x) {
		swap(x);
		return *this;
	}

	// ---------------------------------------------------------
	// Functions.
	
	// Load a file.
	static inline
	This	load(const char* path) {
		char* data = nullptr;
		ullong len;
		switch (vlib::load(path, data, len)) {
		case file::error::open:
			throw OpenError(String() << "Unable to open file \"" << path << "\".");
		case file::error::read:
			throw ReadError(String() << "Unable to open file \"" << path << "\".");
		case file::error::write:
			throw WriteError(String() << "Unable to open file \"" << path << "\".");
		}
		if (len > 0 && data[len - 1] == '\n') {
			--len;
		}
		This obj(parse(data, len));
		delete[] data;
        return obj;
	}
	static inline
	This 	load(const String& path) {
		return load(path.c_str());
	}
	
	// Check if a param is present.
	constexpr
	llong 	find_type(const char* key, const ullong& len, const int& type) const {
		ullong index = find(key, len);
		if (index == NPos::npos) {
			return json::error::not_found;
		}
		if (m_values->get(index).type() != type) {
			return json::error::incorrect_type;
		}
		return (llong) index;
	}
	constexpr
    llong 	find_type(const String& key, const int& type) const {
		return find_type(key.data(), key.len(), type);
	}
    
    // Dump with indent.
    SICE
    String  dump(const JArray& json, const Int& indent = 4, const Int& start_indent = 0) {
        
        // Empty.
        if (json.len() == 0) { return "[]"; }
        
        // Vars.
        String indented;
        indented.append('[');
        if (indent != 0) {
            indented.append('\n');
        }
        indented.fill_r(start_indent + indent, ' ');
        ullong last_index = json.len() - 1;
        
        // Iterate.
        for (auto& index: json.indexes()) {
            
            // Add value.
            auto& value = json.get(index);
            switch (value.type()) {
                case types::array:
                    indented << dump(value.asa(), indent, start_indent + indent);
                    break;
                case types::json:
                    indented << dump(value.asj(), indent, start_indent + indent);
                    break;
                case types::string: {
                    String j = value.json();
                    indented << '"';
                    for (auto& c: j.iterate(1, j.len() - 1)) {
                        if (is_escape_sequence(c)) {
                            indented << '\\' << c;
                        } else {
                            indented << c;
                        }
                    }
                    indented << '"';
                    break;
                }
                default:
                    indented << value.json();
                    break;
            }
            
            // Add post value.
            if (index != last_index) {
                indented << ',';
                if (indent != 0) {
                    indented << '\n';
                }
                indented.fill_r(start_indent + indent, ' ');
            }
            
        }
        
        // Add last indent.
        if (indent != 0) {
            indented << '\n';
        }
        indented.fill_r(start_indent, ' ');
        indented << ']';
        return indented;
    }
    SICE
    String  dump(const Json& json, const Int& indent = 4, const Int& start_indent = 0) {
        
        // Empty.
        if (json.len() == 0) { return "{}"; }
        
        // Vars.
        String indented;
        indented.append('{');
        if (indent != 0) {
            indented.append('\n');
        }
        indented.fill_r(start_indent + indent, ' ');
        ullong last_index = json.len() - 1;
        
        // Iterate.
        for (auto& index: json.indexes()) {
            
            // Add key.
            indented << json.key(index).json() << ": ";
            
            // Add value.
            auto& value = json.value(index);
            switch (value.type()) {
                case types::array:
                    indented << dump(value.asa(), indent, start_indent + indent);
                    break;
                case types::json:
                    indented << dump(value.asj(), indent, start_indent + indent);
                    break;
                case types::string: {
                    String j = value.json();
                    indented << '"';
                    for (auto& c: j.iterate(1, j.len() - 1)) {
                        if (is_escape_sequence(c)) {
                            indented << '\\' << c;
                        } else {
                            indented << c;
                        }
                    }
                    indented << '"';
                    break;
                }
                default:
                    indented << value.json();
                    break;
            }
            
            // Add post value.
            if (index != last_index) {
                indented << ',';
                if (indent != 0) {
                    indented << '\n';
                }
                indented.fill_r(start_indent + indent, ' ');
            }
            
        }
        
        // Add last indent.
        if (indent != 0) {
            indented << '\n';
        }
        indented.fill_r(start_indent, ' ');
        indented << '}';
        return indented;
        
    }
    constexpr
    String  dump(const Int& indent = 4) const {
        return dump(*this, indent);
    }
    
    // Convert to json string.
    constexpr
    String  json() const {
        return dump(0);
    }
    
    // Convert to string.
    constexpr
    String  str() const {
        return dump(0);
    }
    
    // Concat with another Json.
    template <typename... Args> constexpr
    This&    concat_r(const This& obj, Args&&... args) {
        for (auto& index: obj.indexes()) {
            auto& this_value = value(obj.key(index));
            auto& obj_value = obj.value(index);
            if (this_value.type() == types::json && obj_value.type() == types::json) {
                this_value.asj().concat_r(obj_value.asj());
            } else if (this_value.type() == types::array && obj_value.type() == types::array) {
                this_value.asa().concat_r(obj_value.asa());
            } else {
                this_value = obj_value;
            }
        }
        return concat_r(args...);
    }
    template <typename... Args> constexpr
    This    concat(const This& obj, Args&&... args) const {
        return copy().concat_r(obj, args...);
    }
    constexpr
    This&    concat_r() { return *this; }
	
	// ---------------------------------------------------------
	// Parsing.

	// Parse json from char*.
	// - Only viable for a dictionary (curly brackets).
	SICE
	This	parse(const String& data) {
		return parse_curly_brackets(data.data(), data.len());
	}
	SICE
	This	parse(const char* data, const ullong& len) {
		return parse_curly_brackets(data, len);
	}
	SICE
	This	parse(const char* data) {
		return parse_curly_brackets(data, vlib::len(data));
	}

	// Parse json from char* and ullong.
	SICE
	JArray	parse_brackets(const char* arr, ullong len) {

		// Checks.
        while (len > 0) {
            switch (arr[len-1]) {
                case '\n':
                case ' ':
                case '\t':
                    --len;
                    continue;
                default:
                    break;
            }
            break;
        }
		switch (len) {
            case 0:
            case 1:
                throw ParseError("JSON string representation is too small.");
            default: break;
        }
        switch (arr[0]) {
            case '[': break;
            default:
                throw ParseError("JSON string representation of an array has an invalid start.");
        }
        switch (arr[len - 1]) {
            case ']': break;
            default:
                throw ParseError("JSON string representation of an array has an invalid end.");
		}

		// Variables.
		ullong 	value_start = 1; 			// start index of the new value.
		ullong 	value_end = 0; 				// end index of the new value.
		bool 	is_str = false; 			// is inside string.
        bool    is_comment = false;         // is inside comment.
		int 	depth = 0; 					// bracket depth.
		ullong 	index = 1;					// skip first bracket.
		ullong 	l_len = len - 1;			// skip last bracket.
		JArray	json;
		
		// Funcs.
		auto has_dot = [&]() {
			for (auto& i: Range(value_start, value_end)) {
				switch (arr[i]) {
				case '.':
					return true;
				default:
					continue;
				}
			}
			return false;
		};
		auto append_value = [&]() {
			switch (arr[value_start]) {
				case '"': {
					++value_start;
					--value_end;
					json.append(String(arr + value_start, value_end - value_start));
					break;
				}
				case '{': {
					json.append(parse_curly_brackets(arr + value_start, value_end - value_start));
					break;
				}
				case '[': {
					json.append(parse_brackets(arr + value_start, value_end - value_start));
					break;
				}
				case 'N':
				case 'n':
					json.append(Null());
					break;
				case 'T':
				case 't':
					json.append(true);
					break;
				case 'F':
				case 'f':
					json.append(false);
					break;
				case '-': {
					if (has_dot()) {
						json.append(tonumeric<ldouble>(arr + value_start, value_end - value_start));
					} else {
						json.append(tonumeric<llong>(arr + value_start, value_end - value_start));
					}
					break;
				}
				default: {
					if (has_dot()) {
						json.append(tonumeric<ldouble>(arr + value_start, value_end - value_start));
					} else {
						auto num = tonumeric<ullong>(arr + value_start, value_end - value_start);
						if (num >= limits<llong>::max) {
							json.append(num);
						} else {
							json.append((llong) num);
						}
					}
					break;
				}

			}
		};

		// Iterate, skip first curly bracket.
		json.resize();
		for (; index < l_len; ++index) {
			if (is_str) {
				switch (arr[index]) {
					case '"': { is_str = false; break; }
					default: break;
				}
            } else if (is_comment && depth == 0) {
                switch (arr[index]) {
                    case '\n': {
                        is_comment = false;
                        value_start = index + 1;
                        break;
                    }
                    default: break;
                }
			} else {
				switch (arr[index]) {

					// Skip spaces at the start of a key / value.
					case '\n':
					case '\t':
					case ' ': {
						if (index == value_start) { ++value_start; break; }
						break;
					}

					// Found string start / end.
					case '"': { is_str = !is_str; break; }
                        
                    // Found comment start.
                    case '/': {
                        if (depth == 0 && !is_str && index > 0 && arr[index - 1] == '/') {
                            is_comment = true;
                        }
                        break;
                    }

					// Found opening (curly) bracket.
					case '{':
					case '[': { ++depth; break; }

					// Found closing (curly) bracket.
					case '}':
					case ']': { --depth; break; }

					// Found end of value by delimiter.
					case ',': {
						switch (depth) {
							case 0: {
								value_end = index;
								append_value();
								value_start = index + 1;
								break;
							}
							default: break;
						}
						break;
					}
				}
			}
            // if (depth < 0) {
            //     throw ParseError("Detected multiple json's.");
            // }
		}

		// Add last key & value.
		if (len > 2 && value_start < l_len) {
			value_end = l_len;
            
            // Remove comment behind last value.
            // for (auto& index: Range<Backwards>(value_start, value_end)) {
            //     switch (arr[index]) {
            //         case '"':
            //             break;
            //         case '/':
            //             if (arr[index - 1] == '/') {
            //                 value_end = index - 1;
            //                 break;
            //             }
            //             continue;
            //         default:
            //             continue;
            //     }
            //     break;
            // }
            
            // Remove spaces at the end of the last value.
			while (true) {
				switch (arr[value_end - 1]) {
					case ' ':
					case '\t':
					case '\n': { --value_end; continue; }
					default: break;
				}
				break;
			}
            
			append_value();
		}
		return json;
	}

	// Parse json from char* and ullong.
	SICE
	This	parse_curly_brackets(const char* arr, ullong len, const int& limit = -1) {
		
		// Checks.
        while (len > 0) {
            switch (arr[len-1]) {
                case '\n':
                case ' ':
                case '\t':
                    --len;
                    continue;
                default:
                    break;
            }
            break;
        }
		switch (len) {
            case 0:
            case 1:
                throw ParseError("JSON string representation is too small.");
            default: break;
        }
        switch (arr[0]) {
            case '{': break;
            default:
                print("JSON string representation of a dictionary has an invalid start.");
                throw ParseError("JSON string representation of a dictionary has an invalid start.");
        }
        switch (arr[len - 1]) {
            case '}': break;
            default:
                print("JSON string representation of a dictionary has an invalid end [", arr[len-1], "].");
                throw ParseError("JSON string representation of a dictionary has an invalid end.");
		}
		
		// Variables.
		ullong 	key_start = 1; 				// start index of the new key.
		ullong 	key_end = 0; 				// end index of the new key.
		ullong 	value_start = 0; 			// start index of the new value.
		ullong 	value_end = 0; 				// end index of the new value.
		bool 	is_str = false; 			// is inside string.
        bool    is_comment = false;         // is inside comment.
		int 	depth = 0; 					// (curly) bracket depth.
		ullong 	index = 1;					// skip first curly bracket.
		ullong 	l_len = len - 1;			// skip last bracket.
		This 	json;
		
		auto has_dot = [&]() {
			for (auto& i: Range(value_start, value_end)) {
				switch (arr[i]) {
				case '.':
					return true;
				default:
					continue;
				}
			}
			return false;
		};
		auto append_key_and_value = [&]() {
			json.m_keys->append(Key(arr + key_start, key_end - key_start));
			switch (arr[value_start]) {
				case '"': {
					++value_start;
					--value_end;
                    // Manually add string so a value can also be created like this.
                    // {"somekey": "Hello"
                    // " World!"}
                    // Which will have the value "Hello World!".
                    String val;
                    val.resize(value_end - value_start);
                    bool val_is_str = true;
                    for (auto& i: Range(value_start, value_end)) {
                        auto& c = arr[i];
                        switch (c) {
                            case '"': {
                                if (arr[i - 1] == '\\') {
                                    val.append_no_resize(c);
                                } else {
                                    val_is_str = !val_is_str;
                                }
                                break;
                            }
                            default:
                                if (val_is_str) {
                                    val.append_no_resize(c);
                                }
                                break;
                        }
                    }
					json.m_values->append(move(val));
					break;
				}
				case '{': {
					json.m_values->append(parse_curly_brackets(arr + value_start, value_end - value_start));
					break;
				}
				case '[': {
					json.m_values->append(parse_brackets(arr + value_start, value_end - value_start));
					break;
				}
				case 'N':
				case 'n':
					json.m_values->append(Null());
					break;
				case 'T':
				case 't':
					json.m_values->append(true);
					break;
				case 'F':
				case 'f':
					json.m_values->append(false);
					break;
				case '-': {
					if (has_dot()) {
						json.m_values->append(tonumeric<ldouble>(arr + value_start, value_end - value_start));
					} else {
						json.m_values->append(tonumeric<llong>(arr + value_start, value_end - value_start));
					}
					break;
				}
				default: {
					if (has_dot()) {
						json.m_values->append(tonumeric<ldouble>(arr + value_start, value_end - value_start));
					} else {
						auto num = tonumeric<ullong>(arr + value_start, value_end - value_start);
						if (num >= limits<llong>::max) {
							json.m_values->append(num);
						} else {
							json.m_values->append((llong) num);
						}
					}
					break;
				}

			}
		};

		// Iterate, skip first curly bracket.
		json.resize();
		for (; index < l_len; ++index) {
            if (is_str) {
                switch (arr[index]) {
                    case '"': { is_str = false; break; }
                    default: break;
                }
            } else if (is_comment && depth == 0) {
                switch (arr[index]) {
                    case '\n': {
                        is_comment = false;
                        key_start = index + 1;
                        break;
                    }
                    default: break;
                }
			} else {
                switch (arr[index]) {
                        
                    // Skip spaces at the start of a key / value.
                    case '\n':
                    case '\t':
                    case ' ': {
                        if (index == key_start) { ++key_start; break; }
                        if (index == value_start) { ++value_start; break; }
                        break;
                    }
                        
                    // Found string start / end.
                    case '"': { is_str = !is_str; break; }
                        
                    // Found comment start.
                    case '/': {
                        if (depth == 0 && !is_str && index > 0 && arr[index - 1] == '/') {
                            is_comment = true;
                        }
                        break;
                    }
                        
                    // Found opening (curly) bracket.
                    case '{':
                    case '[': { ++depth; break; }
                        
                    // Found closing (curly) bracket.
                    case '}':
                    case ']': { --depth; break; }
                        
                    // Found end of key.
                    case ':':
                        switch (depth) {
                            case 0: {
                                key_end = index;
                                value_start = index + 1;
                                break;
                            }
                            default: break;
                        }
                        break;
                        
                    // Found end of value by delimiter.
                    case ',':
                        switch (depth) {
                            case 0: {
                                ++key_start;
                                --key_end;
                                value_end = index;
                                append_key_and_value();
                                if (limit != -1 && json.len() >= (ullong) limit) {
                                    return json;
                                }
                                key_start = index + 1;
                                break;
                            }
                            default: break;
                        }
                        break;
                }
			}
            // if (depth < 0) {
            //     throw ParseError("Detected multiple json's.");
            // }
		}

		// Add last key & value.
		if (key_end > key_start) {
			++key_start;
			--key_end;
			value_end = l_len;
            while (true) {
                switch (arr[value_end - 1]) {
                    case ' ':
                    case '\t':
                    case '\n':
                    case ',': --value_end; continue;
                    default: break;
                }
                break;
            }
			append_key_and_value();
		}
		return json;
	}

};
}; 		// End namespace json.

// ---------------------------------------------------------
// Aliases.

using 	Json = 		json::Json;
using   JsonValue = json::JsonValue<Json>;
using 	JArray = 	Array<JsonValue>;

// Is instance.
template<>     struct is_instance<JsonValue, JsonValue>     { SICEBOOL value = true;  };
template<> 	struct is_instance<Json, Json>					{ SICEBOOL value = true;  };
template<> 	struct is_instance<JArray, JArray>				{ SICEBOOL value = true;  };

// Is JsonValue.
template<typename Type>     struct is_JsonValue             { SICEBOOL value = false; };
template<>                  struct is_JsonValue<JsonValue>  { SICEBOOL value = true;  };

// is JArray.
template<typename Type>     struct is_JArray                { SICEBOOL value = false; };
template<>                  struct is_JArray<JArray>        { SICEBOOL value = true;  };

// Is type.
template<typename Type> 	struct is_Json 					{ SICEBOOL value = false; };
template<> 					struct is_Json<Json> 			{ SICEBOOL value = true;  };


// ---------------------------------------------------------
// Shortcuts.

namespace shortcuts {
namespace types {

using Json = vlib::Json;
using JsonValue = vlib::JsonValue;
using JArray = vlib::Array<vlib::JsonValue>;

}; 		// End namespace types.
}; 		// End namespace shortcuts.

}; 		// End namespace vlib.
#endif 	// End header.
