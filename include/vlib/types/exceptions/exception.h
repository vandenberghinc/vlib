// Author: Daan van den Bergh
// Copyright: © 2022 Daan van den Bergh.

// Header.
#ifndef VLIB_EXCEPTION_T_H
#define VLIB_EXCEPTION_T_H

// Global xception id alias.
using excid_t = unsigned long long;

// Namespace vlib.
namespace vlib {

// Forward declaration of class string.
template <typename Type, typename Length = ullong>
struct Array;
typedef Array<char, ullong>        String;

// Namespace exceptions.
namespace exceptions {

// Static id arrays.
char** type_ids = nullptr;
ullong type_ids_len = 0;
ullong type_ids_cap = 0;
char** err_ids = nullptr;
ullong err_ids_len = 0;
ullong err_ids_cap = 0;

// Get ids.
auto& type(const excid_t& id) {
    return type_ids[id];
}
auto& err(const excid_t& id) {
    return err_ids[id];
}

// Add ids.
excid_t add_type(const char* id) {
    vlib::array<char*, ullong>::append(type_ids, type_ids_len, type_ids_cap, (char*) id, 4);
    return type_ids_len - 1;
}
excid_t add_err(const char* id) {
    vlib::array<char*, ullong>::append(err_ids, err_ids_len, err_ids_cap, (char*) id, 4);
    return err_ids_len - 1;
}

// End namespace exceptions.
};

// Exception ID for the error message.
struct ExceptionID {
    
    // Attributes.
    unsigned long long id;
    
    // Default constructor.
    constexpr ExceptionID() = default;
    
    // Constructor.
    ExceptionID(const char* err) : id(exceptions::add_err(err)) {}
    
};

// Exception type.
/* 	@docs {
	@chapter: exceptions
	@title: Exception
	@description:
		Exception type.
 
        Define preprocessor variable `#define vlib_enable_trace true` to enable a stacktrace.
        Define preprocessor variable `#define vlib_max_trace 32` to set a max stacktrace depth, the default value is 32.
        The stacktrace only works properly when the program is compiled without optimization, and compiled with flags `-g` and `-rdynamic` for linux.
	@usage:
        #include <vlib/types.h>
		vlib::Exception x (...);
} */
struct Exception {

// Private:
private:

	// ---------------------------------------------------------
	// Aliases.

	using 			This = 			Exception;
	using 			Length = 		ullong;

    // ---------------------------------------------------------
    // Static attributes.
    static constexpr uint   m_increaser = 4;
    
	// ---------------------------------------------------------
	// Attributes.
    
    Length                  m_type_id;
    internal::BaseString    m_type;
    Length                  m_err_id;
    internal::BaseString    m_err;
    StackTrace              m_trace;


	// ---------------------------------------------------------
	// Constructors.

// Public:
public:
    
    // Default constructor.
    constexpr
    Exception() :
    m_type_id(internal::npos),
    m_err_id(internal::npos)
    {
#if vlib_enable_trace == true
        m_trace.init();
#endif
    }

    // Copy constructor.
    constexpr
    Exception (const This& obj) :
    m_type_id(obj.m_type_id),
    m_type(obj.m_type),
    m_err_id(obj.m_err_id),
    m_err(obj.m_err),
    m_trace(obj.m_trace)
    {}

    // Move constructor.
    constexpr
    Exception (This&& obj) :
    m_type_id(obj.m_type_id),
    m_type(move(obj.m_type)),
    m_err_id(obj.m_err_id),
    m_err(move(obj.m_err)),
    m_trace(obj.m_trace)
    {}
    
// Protected:
protected:

    // Constructor from ids.
    constexpr
    Exception (const Length type_id, const Length err_id) :
    m_type_id(type_id),
    m_err_id(err_id)
    {
#if vlib_enable_trace == true
        m_trace.init();
#endif
    }
    
	// Constructor from const char* err.
    constexpr
	Exception (const char* type, const char* err) :
    m_type_id(internal::npos),
	m_type(type),
	m_err_id(internal::npos),
	m_err(err)
	{
#if vlib_enable_trace == true
        m_trace.init();
#endif
	}

	// Constructor from String err.
    constexpr
    Exception (const char* type, const String& err);

	// Constructor from String&& err.
    constexpr
    Exception (const char* type, String&& err);
    
    // Constructor with template args for err.
    // Will be created by "types/base/array.h"
    template <typename Arg1, typename Arg2, typename... Args>
    requires (!vlib::is_any_numeric<Arg1>::value || !vlib::is_any_numeric<Arg2>::value) // can not both be numerics.
    constexpr
    Exception (const char* type, const Arg1& arg1, const Arg2& arg2, Args&&... args);

// Public:
public:

	// ---------------------------------------------------------
	// Assignment operators.

	// Copy assignment operator.
	constexpr
	auto&	operator =(const This& obj) {
        m_type_id = obj.m_type_id;
        m_type = obj.m_type;
        m_err_id = obj.m_err_id;
        m_err = obj.m_err;
        m_trace = obj.m_trace;
		return *this;
	}

	// Move assignment operator.
	constexpr
	auto&	operator =(This&& obj) {
        m_type_id = obj.m_type_id;
        m_type = move(obj.m_type);
        m_err_id = obj.m_err_id;
        m_err = move(obj.m_err);
        m_trace = move(obj.m_trace);
		return *this;
	}

	// ---------------------------------------------------------
	// Functions.

	// Type.
    auto& type_id() const {
        return m_type_id;
    }
    const char* type() const {
        if (m_type.data() == nullptr && m_type_id < exceptions::type_ids_len) {
            return exceptions::type_ids[m_type_id];
        }
        return m_type.c_str();
    }
    
	// Message.
    auto& err_id() const {
        return m_err_id;
    }
    const char* err() const {
        if (m_err.data() == nullptr && m_err_id < exceptions::err_ids_len) {
            return exceptions::err_ids[m_err_id];
        }
        return m_err.c_str();
    }
    
    // Trace.
    auto trace() const {
        return m_trace.trace(1, 3);
    }

	// Dump an exception.
	void dump();

	//
};

// ---------------------------------------------------------
// End.

}; 		// End namespace vlib.
#endif 	// End header.
