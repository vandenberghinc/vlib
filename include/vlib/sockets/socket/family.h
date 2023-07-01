// Author: Daan van den Bergh
// Copyright: © 2022 Daan van den Bergh.

// Header.
#ifndef VLIB_SOCKET_IP_H
#define VLIB_SOCKET_IP_H

// Namespace vlib.
namespace vlib {

// Namespace sockets.
namespace sockets {

// Namespace family.
namespace family {

// Socket family.
// - type: uchar.
enum families {
	ipv4 = 				AF_INET,
	ipv6 = 				AF_INET6,
	undefined = 		AF_UNSPEC,
};

}; 		// End namespace family.
}; 		// End namespace sockets.
}; 		// End namespace vlib.
#endif 	// End header.
