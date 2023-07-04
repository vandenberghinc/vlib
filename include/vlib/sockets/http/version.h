// Author: Daan van den Bergh
// Copyright: © 2022 Daan van den Bergh.

// Header.
#ifndef VLIB_HTTP_VERSION_H
#define VLIB_HTTP_VERSION_H

// Namespace vlib.
namespace vlib {

// Namespace http.
namespace http {

// Type definition.
typedef short version_t;

// Namespace method.
namespace version {

// HTTP response status.
// -
/* 	@docs: {
 * 	@chapter: HTTP
 * 	@title: Version
 * 	@description:
 * 		HTTP versions.
 *
 * 		Only supports HTTP versions [0.9, 1.0, 1.1, 2.0].
 * 	@usage:
 * 		#include <vlib/sockets/http.h>
 * 		vlib::http::version_t version = vlib::http::version::v1_1;
 * 	@show_code: true
 } */
enum versions {
	undefined = 0,
	v0_9 = 		9,
	v1_0 = 		10,
	v1_1 = 		11,
	v2_0 = 		20,
};

// Descriptions.
struct desc {
	SICE const CString 	undefined			= "HTTP/?";
	SICE const CString 	v0_9				= "HTTP/0.9";
	SICE const CString 	v1_0				= "HTTP/1.0";
	SICE const CString 	v1_1				= "HTTP/1.1";
	SICE const CString 	v2_0				= "HTTP/2.0";
};

// Convert the enum to a string description.
inline constexpr
auto& tostr(short version) {
	switch (version) {
		case versions::undefined:
			return desc::undefined;
		case versions::v0_9:
			return desc::v0_9;
		case versions::v1_0:
			return desc::v1_0;
		case versions::v1_1:
			return desc::v1_1;
		case versions::v2_0:
			return desc::v2_0;
		default:
			return desc::undefined;
	}
}

}; 		// End namespace version.
}; 		// End namespace http.

// Shortcuts.
namespace http { namespace shortcuts {
using version_t =		vlib::http::version_t;
};};

}; 		// End namespace vlib.
#endif 	// End header.
