/*
 Author: Daan van den Bergh
 Copyright: © 2022 Daan van den Bergh.
*/

// Header.
#ifndef VLIB_RESTAPI_RATE_LIMIT_T_H
#define VLIB_RESTAPI_RATE_LIMIT_T_H

// Namespace vlib.
namespace vlib {

// Namespace restapi.
namespace restapi {

// Rate limit structure.
struct RateLimit {
	long 	timestamp = 0;
	int 	count = 0;
};

// Namespace method.
namespace rate_limit {

// HTTP request method.
/* 	@docs: {
	@chapter: restapi
	@title: Rate limit format
	@description: The RESTAPI rate limit formats.
	@usage:
		#include <vlib/sockets/restapi.h>
		short format = vlib::restapi::rate_limit::sec;
} */
enum formats {
	sec = 	1,
	min = 	2,
	hour = 	3,
	day = 	4,
	week = 	5,
};

// Check if the format is valid.
inline constexpr
bool valid(const short& format) {
	switch (format) {
		case formats::sec:
			return true;
		case formats::min:
			return true;
		case formats::hour:
			return true;
		case formats::day:
			return true;
		case formats::week:
			return true;
		default:
			return false;
	}
}

// Convert format to seconds.
inline constexpr
auto to_seconds(const short& format) {
	switch (format) {
		case formats::sec:
			return 1;
		case formats::min:
			return 60;
		case formats::hour:
			return 3600;
		case formats::day:
			return 86400;
		case formats::week:
			return 604800;
		default:
			return 1;
	}
}

}; 		// End namespace rate_limit.
}; 		// End namespace restapi.
}; 		// End namespace vlib.
#endif 	// End header.
