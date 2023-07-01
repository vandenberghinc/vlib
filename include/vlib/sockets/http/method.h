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
 * 	@chapter: http
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
auto& tostr(short version) {
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
SICE
Int     fromstr(const String& method) {
    if (method == desc::get) {
        return vlib::http::method::get;
    }
    else if (method == desc::head) {
        return vlib::http::method::head;
    }
    else if (method == desc::post) {
        return vlib::http::method::post;
    }
    else if (method == desc::put) {
        return vlib::http::method::put;
    }
    else if (method == desc::del) {
        return vlib::http::method::del;
    }
    else if (method == desc::connect) {
        return vlib::http::method::connect;
    }
    else if (method == desc::options) {
        return vlib::http::method::options;
    }
    else if (method == desc::trace) {
        return vlib::http::method::trace;
    }
    else if (method == desc::patch) {
        return vlib::http::method::patch;
    } else {
        return vlib::http::method::undefined;
    }
}

}; 		// End namespace method.
}; 		// End namespace http.

}; 		// End namespace vlib.
#endif 	// End header.
