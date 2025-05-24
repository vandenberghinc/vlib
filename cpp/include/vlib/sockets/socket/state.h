// Author: Daan van den Bergh
// Copyright: © 2022 Daan van den Bergh.

// Header.
#ifndef VLIB_SOCKET_STATE_H
#define VLIB_SOCKET_STATE_H

// Namespace vlib.
namespace vlib {

// Namespace sockets.
namespace sockets {

// Namespace state.
namespace state {

// Socket state.
enum states {
	connected = 			 0,
	connecting = 			-1,
	not_connected = 		-2,
	closed = 				-3,
	unknown = 				-4,
};

}; 		// End namespace state.
}; 		// End namespace sockets.
}; 		// End namespace vlib.
#endif 	// End header.
