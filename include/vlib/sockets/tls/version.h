// Author: Daan van den Bergh
// Copyright: © 2022 Daan van den Bergh.

// Header.
#ifndef VLIB_TLSTCP_VERSION_H
#define VLIB_TLSTCP_VERSION_H

// Namespace vlib.
namespace vlib {

// Namespace http.
namespace tls {

// Namespace method.
namespace version {

// TLS version.
enum versions {
	any = 		0,
	v1_0 = 		10,
	v1_1 = 		11,
	v1_2 = 		12,
	v1_3 = 		13,
};

}; 		// End namespace version.
}; 		// End namespace tls.
}; 		// End namespace vlib.
#endif 	// End header.
