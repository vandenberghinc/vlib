// Author: Daan van den Bergh
// Copyright: © 2022 Daan van den Bergh.

// Header.
#ifndef VLIB_SOCKET_PROTOCOL_H
#define VLIB_SOCKET_PROTOCOL_H

// Namespace vlib.
namespace vlib {

// Namespace sockets.
namespace sockets {

// Namespace protocol.
namespace protocol {

// Socket type.
// - type: int.
enum protocols {
	unix = 				PF_UNIX,	// local communication.
	inet = 				PF_INET,	// internet (TCP/IP).
	// ns = 				PF_NS,		// xerox network system (XNS) architecture.
	// nnd = 				PF_NDD,		// aix ndd.
	undefined = 		0,
};

}; 		// End namespace protocol.
}; 		// End namespace sockets.
}; 		// End namespace vlib.
#endif 	// End header.
