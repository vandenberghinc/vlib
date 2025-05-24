// Author: Daan van den Bergh
// Copyright: © 2022 Daan van den Bergh.

// Header.
#ifndef VLIB_SOCKET_TYPE_H
#define VLIB_SOCKET_TYPE_H

// Namespace vlib.
namespace vlib {

// Namespace sockets.
namespace sockets {

// Namespace type.
namespace type {

// Socket type.
// - type: int.
enum types {
	stream = 			SOCK_STREAM,		// virtual circuit
	dgram = 			SOCK_DGRAM,			// datagram.
	raw = 				SOCK_RAW,			// raw socket.
	rdm = 				SOCK_RDM,			// reliably-delivered message. datagram.
	// cdgram = 			SOCK_CONN_DGRAM,	// connection datagram.
};

}; 		// End namespace type.
}; 		// End namespace sockets.
}; 		// End namespace vlib.
#endif 	// End header.
