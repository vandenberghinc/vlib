// Author: Daan van den Bergh
// Copyright: © 2022 Daan van den Bergh.
//
// Notes:
// - Keep the hierarchy like "xxx::error::errors" since "base/strerr.h" has hierarchy "xxx::error::desc".
//

// @TODO make docs for embedded in belonging classes.

// Header.
#ifndef VLIB_ERRORS_H
#define VLIB_ERRORS_H

// Namespace vlib.
namespace vlib {

// ---------------------------------------------------------
// Json.

namespace json {
namespace error {

// Errors.
enum errors {
	success = 			0,
	parse = 			-100,
	invalid_start = 	-101,
	invalid_end =	 	-102,
	too_small =		 	-103,
	not_found =		 	-104,
	incorrect_type =	-106,
	invalid_type =		-107,
	unknown =		 	-108,
	
};

}};

// ---------------------------------------------------------
// File.

namespace file {
namespace error {

// Errors.
enum errors {
	open = 				-201,
	read = 				-202,
	write = 			-203,
	close =				-204,
	create =			-205,
	remove =			-206,
	not_open =			-207,
	undefined_path =	-208,
	invalid_path =		-209,
	invalid_mode =		-210,
	flush =				-211,
	sync =				-212,
};

}};

// ---------------------------------------------------------
// User.

namespace user {
namespace error {

// Errors.
enum errors {
	invalid_uid = 		-1000,
	generate_uid = 		-1001,
	shadow_access = 	-1002,
	crypt = 			-1003,
	incorrect_pass =	-1004,
	prompt_pass =		-1005,
	set_pass =			-1006,
	create =			-1007,
	generate_salt =		-1008,
	del =				-1009,
};

}};

// ---------------------------------------------------------
// Group.

namespace group {
namespace error {

// Errors.
enum errors {
	invalid_gid = 		-1100,
	generate_gid = 		-1101,
	create = 			-1102,
	del =	 			-1103,
	add_user =	 		-1104,
	del_user =	 		-1105,
};

}};

// ---------------------------------------------------------
// Path.

namespace path {
namespace error {

// Errors.
enum errors {
	touch = 		-700,
	mkdir = 		-701,
	chown = 		-702,
	chmod = 		-703,
	remove = 		-704,
	abs = 			-705,
};

}};

// ---------------------------------------------------------
// Process.

namespace proc {
namespace error {

// Errors.
enum errors {
	build_wpipe = 		-301,
	build_rpipe = 		-302,
	build_epipe = 		-303,
	write_input = 		-304,
	fork = 				-305,
	timeout = 			-306,
	kill = 				-307,
	interrupted = 		-308,
	poll = 				-309,
	closed = 			-310,
	parse_exit_status =	-311,
};

}};

// ---------------------------------------------------------
// Thread.

namespace threads {
namespace error {

// Errors.
enum errors {
	create = 			-600,
	join =				-601,
	detach = 			-602,
	lock = 				-603,
	unlock = 			-604,
};

}};

// ---------------------------------------------------------
// Daemon.

namespace daemon {
namespace error {

// Errors.
enum errors {
	load_config =		-1200,
	reload_config =		-1201,
	already_exists =	-1202,
	does_not_exist =	-1203,
};

}};

// ---------------------------------------------------------
// Compression.

namespace compression {
namespace error {

// Errors.
enum errors {
	success = 			0,
	too_large_err = 	-401,
	deflate_err = 		-402,
	inflate_err = 		-403,
	decompress_err = 	-404,
};

}};

// ---------------------------------------------------------
// Crypto.

namespace crypto {
namespace error {

// Errors.
enum errors {
	encrypt = 			-801,
	decrypt = 			-802,
	key =	 			-803,
	encode =	 		-804,
	decode =	 		-805,
	sign =	 			-806,
	generate = 			-807,
};

}};

// ---------------------------------------------------------
// Sockets.

namespace sockets {
namespace error {

// Errors.
enum errors {
	success = 					 0, 	// never change the value "success", since the internal code does not use error::success but rather 0.
	init =	 					-501,
	set_opt =	 				-502,
	convert_ip =	 			-503,
	set_blocking =	 			-504,
	poll =	 					-505,
	accept =	 				-506,
	bind =	 					-507,
	connect =	 				-508,
	listen =	 				-509,
	timeout =	 				-510,
	not_open =	 				-511,
	closed =	 				-512,
	getpeer =	 				-513,
	send =	 					-514,
	close =	 					-515,
	shutdown =	 				-516,
	want_read =	 				-517,
	want_write =	 			-518,
	want_x509_lookup =	 		-519,
	syscall =	 				-520,
	zero_return =	 			-521,
	want_connect =	 			-522,
	want_accept =	 			-523,
	load_cert =	 				-524,
	load_key =	 				-525,
	verify_key =	 			-526,
	set_min_tls_version =	 	-527,
	min_tls_version =	 		-528,
	unknown_tls_version =	 	-529,
	getaddr =			 		-530,
	tls_init = 					-531,
	fatal = 					-532,
	sni = 						-533,
	no_data =					-534,
	unknown =	 				-535,
};

}};

// ---------------------------------------------------------
// RestAPI.

namespace restapi {
namespace error {

// Errors.
enum errors {
	undefined_database = 		-901,
	invalid_uid =		 		-902,
	invalid_api_key =	 		-903,
	invalid_signature =	 		-904,
	rate_limit_exceeded =		-905,
	invalid_access_token =		-906,
	invalid_auth =				-907,
	duplicate_username =		-908,
	invalid_username =			-909,
	unknown_username = 			-910,
};

}};

// ---------------------------------------------------------
// End.

}; 		// End namespace vlib.
#endif 	// End header.
