// Author: Daan van den Bergh
// Copyright: © 2022 Daan van den Bergh.

// Header.
#ifndef VLIB_HTTP_METHOD_H
#define VLIB_HTTP_METHOD_H

// Namespace vlib.
namespace vlib {

// Namespace http.
namespace http {

// Namespace method.
namespace method {

// HTTP request method.
/* 	@docs: {
 * 	@chapter: HTTP
 * 	@title: Methods
 * 	@description: HTTP methods.
 * 	@usage:
 * 		#include <vlib/sockets/http.h>
 * 		short get = vlib::http::method::get;
 * 	@show_code: true
 } */
enum methods {
	undefined = 	0,
	get = 			1,
	head = 			2,
	post = 			3,
	put = 			4,
	del = 			5,
	connect = 		6,
	options = 		7,
	trace = 		8,
	patch = 		9,
};

// Descriptions.
struct desc {
	SICE const CString undefined = 	"UNDEFINED";
	SICE const CString get = 		"GET";
	SICE const CString head = 		"HEAD";
	SICE const CString post = 		"POST";
	SICE const CString put = 		"PUT";
	SICE const CString del = 		"DELETE";
	SICE const CString connect = 	"CONNECT";
	SICE const CString options = 	"OPTIONS";
	SICE const CString trace = 		"TRACE";
	SICE const CString patch = 		"PATCH";
};

// Convert the enum to a string description.
inline constexpr
auto& to_str(short version) {
	switch (version) {
		case methods::undefined:
			return desc::undefined;
		case methods::get:
			return desc::get;
		case methods::head:
			return desc::head;
		case methods::post:
			return desc::post;
		case methods::put:
			return desc::put;
		case methods::del:
			return desc::del;
		case methods::connect:
			return desc::connect;
		case methods::options:
			return desc::options;
		case methods::trace:
			return desc::trace;
		case methods::patch:
			return desc::patch;
		default:
			return desc::undefined;
	}
}

// Get method id from string.
constexpr
short	from_str(const char* method, ullong len = NPos::npos) {
	if (len == NPos::npos) {
		len = vlib::len(method);
	}
    if (desc::get.eq(method, len)) {
        return vlib::http::method::get;
    }
    else if (desc::head.eq(method, len)) {
        return vlib::http::method::head;
    }
    else if (desc::post.eq(method, len)) {
        return vlib::http::method::post;
    }
    else if (desc::put.eq(method, len)) {
        return vlib::http::method::put;
    }
    else if (desc::del.eq(method, len)) {
        return vlib::http::method::del;
    }
    else if (desc::connect.eq(method, len)) {
        return vlib::http::method::connect;
    }
    else if (desc::options.eq(method, len)) {
        return vlib::http::method::options;
    }
    else if (desc::trace.eq(method, len)) {
        return vlib::http::method::trace;
    }
    else if (desc::patch.eq(method, len)) {
        return vlib::http::method::patch;
    } else {
        return vlib::http::method::undefined;
    }
}
constexpr
short	from_str(const String& method) {
	return from_str(method.data(), method.len());
}

// End namespace method.
};

// Method.
struct Method {
	
	// Attributes.
	short 	value;
	
	// Constructor.
	constexpr Method() : value(vlib::http::method::undefined) {}
	
	// Constructor by short.
	constexpr Method(short method) : value(method) {}
	
	// Constructor by string.
	constexpr Method(const char* method, ullong len = NPos::npos) : value(vlib::http::method::from_str(method, len)) {}
	constexpr Method(const String& method) : value(vlib::http::method::from_str(method)) {}
	
	// Is defined.
	constexpr
	bool	is_defined() const {
		return value != vlib::http::method::undefined;
	}
	
	// Is undefined.
	constexpr
	bool	is_undefined() const {
		return value == vlib::http::method::undefined;
	}
	
	// To string.
	constexpr
	String 	str() const {
		return vlib::http::method::to_str(value);
	}
	
	// Equals.
	constexpr friend bool operator == (const Method& x, short y) {
		return x.value == y;
	}
	constexpr friend bool operator == (const Method& x, const Method& y) {
		return x.value == y.value;
	}
	
	// Not equals.
	constexpr friend bool operator != (const Method& x, short y) {
		return x.value != y;
	}
	constexpr friend bool operator != (const Method& x, const Method& y) {
		return x.value != y.value;
	}
};

}; 		// End namespace http.
}; 		// End namespace vlib.
#endif 	// End header.
