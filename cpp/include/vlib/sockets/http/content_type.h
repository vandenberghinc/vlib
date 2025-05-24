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
/* 	@docs:
 * 	@chapter: HTTP
 * 	@title: Content types
 * 	@description: HTTP content types, does not include all available content types.
 * 	@usage:
 * 		#include <vlib/sockets/http.h>
 * 		vlib::http::content_type_t content_type = vlib::http::content_type::json;
 * 	@show_code: true
 */
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
	static inline const String 	undefined		= "undefined";
	static inline const String 	unknown			= "unknown";
	static inline const String 	json			= "application/json";
	static inline const String 	xml				= "application/xml";
	static inline const String 	html			= "text/html";
	static inline const String 	plain			= "text/plain";
	static inline const String 	css				= "text/css";
	static inline const String 	js				= "application/javascript";
};

// Convert the error number to a string description.
inline constexpr
auto& to_str(int status) {
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
constexpr
short	from_str(const char* data, ullong len = NPos::npos) {
	if (len == NPos::npos) {
		len = vlib::len(data);
	}
	if (desc::html.eq(data, len)) {
		return vlib::http::content_type::html;
	} else if (desc::json.eq(data, len)) {
		return vlib::http::content_type::json;
	} else if (desc::xml.eq(data, len)) {
		return vlib::http::content_type::xml;
	} else if (desc::plain.eq(data, len)) {
		return vlib::http::content_type::plain;
	} else if (desc::css.eq(data, len)) {
		return vlib::http::content_type::css;
	} else if (desc::js.eq(data, len)) {
		return vlib::http::content_type::js;
		
	} else if (desc::unknown.eq(data, len)) {
		return vlib::http::content_type::unknown;
	} else {
		return vlib::http::content_type::undefined;
	}
}
constexpr
short	from_str(const String& content_type) {
	return from_str(content_type.data(), content_type.len());
}

// End namespace content_type.
};

// Content type.
struct ContentType {
	
	// Attributes.
	short 	value;
	
	// Constructor.
	constexpr ContentType() : value(vlib::http::content_type::undefined) {}
	
	// Constructor by short.
	constexpr ContentType(short content_type) : value(content_type) {}
	
	// Constructor by string.
	constexpr ContentType(const char* content_type, ullong len = NPos::npos) : value(vlib::http::content_type::from_str(content_type, len)) {}
	constexpr ContentType(const String& content_type) : value(vlib::http::content_type::from_str(content_type)) {}
	
	// Is defined.
	constexpr
	bool	is_defined() const {
		return value != vlib::http::content_type::undefined;
	}
	
	// Is undefined.
	constexpr
	bool	is_undefined() const {
		return value == vlib::http::content_type::undefined;
	}
	
	// To string.
	constexpr
	String 	str() const {
		return vlib::http::content_type::to_str(value);
	}
	
	// Equals.
	constexpr friend bool operator == (const ContentType& x, short y) {
		return x.value == y;
	}
	constexpr friend bool operator == (const ContentType& x, const ContentType& y) {
		return x.value == y.value;
	}
	
	// Not equals.
	constexpr friend bool operator != (const ContentType& x, short y) {
		return x.value != y;
	}
	constexpr friend bool operator != (const ContentType& x, const ContentType& y) {
		return x.value != y.value;
	}
};

}; 		// End namespace http.

// Shortcuts.
namespace http { namespace shortcuts {
using content_type_t =		vlib::http::content_type_t;
};};

}; 		// End namespace vlib.
#endif 	// End header.
