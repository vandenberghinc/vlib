// Author: Daan van den Bergh
// Copyright: © 2022 Daan van den Bergh.

// Header.
#ifndef VLIB_HTTP_CONTENT_TYPE_H
#define VLIB_HTTP_CONTENT_TYPE_H

// Namespace vlib.
namespace vlib {

// Namespace http.
namespace http {

// Type definition.
typedef short content_type_t;

// Namespace content_type.
namespace content_type {

// HTTP content type.
/* 	@docs: {
 * 	@chapter: HTTP
 * 	@title: Content types
 * 	@description: HTTP content types, does not include all available content types.
 * 	@usage:
 * 		#include <vlib/sockets/http.h>
 * 		vlib::http::content_type_t content_type = vlib::http::content_type::json;
 * 	@show_code: true
 } */
enum content_types {
	undefined = 	0, // must always remain zero for vweb.
	unknown = 		1,
	json = 			2,
	xml = 			3,
	html = 			4,
	plain = 		5,
	css = 			6,
	js = 			7,
};

// Descriptions.
struct desc {
	SICE const CString 	undefined		= "undefined";
	SICE const CString 	unknown			= "unknown";
	SICE const CString 	json			= "application/json";
	SICE const CString 	xml				= "application/xml";
	SICE const CString 	html			= "text/html";
	SICE const CString 	plain			= "text/plain";
	SICE const CString 	css				= "text/css";
	SICE const CString 	js				= "application/javascript";
};

// Convert the error number to a string description.
inline constexpr
auto& tostr(int status) {
	switch (status) {
		case content_types::undefined:
			return desc::undefined;
		case content_types::unknown:
			return desc::unknown;
		case content_types::html:
			return desc::html;
		case content_types::json:
			return desc::json;
		case content_types::xml:
			return desc::xml;
		case content_types::plain:
			return desc::plain;
		case content_types::css:
			return desc::css;
		case content_types::js:
			return desc::js;
		default:
			return desc::undefined;
	}
}

// Convert string to content type.
SICE
Int     fromstr(const String& content_type) {
    if (content_type == desc::html) {
        return vlib::http::content_type::html;
    } else if (content_type == desc::json) {
        return vlib::http::content_type::json;
    } else if (content_type == desc::xml) {
        return vlib::http::content_type::xml;
    } else if (content_type == desc::plain) {
		return vlib::http::content_type::plain;
	} else if (content_type == desc::css) {
		return vlib::http::content_type::css;
	} else if (content_type == desc::js) {
		return vlib::http::content_type::js;
		
	} else if (content_type == desc::unknown) {
		return vlib::http::content_type::unknown;
    } else {
        return vlib::http::content_type::undefined;
    }
}

}; 		// End namespace content_type.
}; 		// End namespace http.

// Shortcuts.
namespace http { namespace shortcuts {
using content_type_t =		vlib::http::content_type_t;
};};

}; 		// End namespace vlib.
#endif 	// End header.
