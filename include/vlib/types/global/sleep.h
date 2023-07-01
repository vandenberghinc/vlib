// Author: Daan van den Bergh
// Copyright: © 2022 Daan van den Bergh.

// Header.
#ifndef VLIB_SLEEP_H
#define VLIB_SLEEP_H

// Includes.
#include <unistd.h> 	// for "sleep.h"

// Namespace vlib.
namespace vlib {

// Sleep.
/* @docs {
	@chapter: global
	@title: Sleep
	@description:
		Static sleep structure.
	@usage:
		#include <vlib/types.h>
		vlib::sleep:seconds(1);
} */
struct sleep {

	// Sleep seconds.
	/* @docs {
		@title: Sleep seconds
		@description:
			Sleep a number of seconds.
		@usage:
			vlib::sleep::sec(1);
	} */
	static inline
	void sec(const uint& seconds) {
		::usleep(seconds * 1000000);
	}

	// Sleep Sleep milliseconds.
	/* @docs {
		@title: Milliseconds
		@description:
			Sleep a number of milliseconds.
		@usage:
			vlib::sleep::msec(1);
	} */
	static inline
	void msec(const uint& ms) {
		::usleep(ms * 1000);
	}

	// Sleep useconds (copy).
	/* @docs {
		@title: Sleep microseconds
		@description:
			Sleep a number of microseconds.
		@usage:
			vlib::sleep::usec(1);
	} */
	static inline
	void usec(const uint& us) {
		::usleep(us);
	}

}; 		// End struct sleep_t.

}; 		// End namespace vlib.
#endif 	// End header.
