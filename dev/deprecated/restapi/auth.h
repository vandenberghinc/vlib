/*
 Author: Daan van den Bergh
 Copyright: © 2022 Daan van den Bergh.
*/

// Header.
#ifndef VLIB_RESTAPI_AUTH_H
#define VLIB_RESTAPI_AUTH_H

// Namespace vlib.
namespace vlib {

// Namespace restapi.
namespace restapi {

// Authentication methods.
/* 	@docs: {
	@chapter: restapi
	@title: Authentication
	@description: RESTAPI authentication methods.
	@usage:
		#include <vlib/sockets/restapi.h>
		short auth = vlib::restapi::auth::api | vlib::restapi::auth::sign | vlib::restapi::auth::token;
} */
enum auth {
	key = (1u << 0),
	token = (1u << 1),
	sign = (1u << 2),
};

}; 		// End namespace restapi.
}; 		// End namespace vlib.
#endif 	// End header.
