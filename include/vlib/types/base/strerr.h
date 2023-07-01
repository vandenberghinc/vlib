// Author: Daan van den Bergh
// Copyright: © 2022 Daan van den Bergh.
//
// Notes:
// - Keep the hierarchy like "xxx::error::desc" since "global/errors.h" has hierarchy "xxx::error::errors".
//

// Header.
#ifndef VLIB_ERRSTR_H
#define VLIB_ERRSTR_H

// Namespace vlib.
namespace vlib {

// ---------------------------------------------------------
// Json.

namespace json {
namespace error {

// Descriptions.
struct desc {
	SICE const CString 	success = 			"Success";
	SICE const CString 	parse = 			"JSON parse error";
	SICE const CString 	invalid_start = 	"Invalid JSON start character";
	SICE const CString 	invalid_end = 		"Invalid JSON end character";
	SICE const CString 	too_small = 		"JSON too small";
	SICE const CString 	not_found = 		"JSON key not found";
	SICE const CString 	incorrect_type = 	"Incorrect JSON type";
	SICE const CString 	invalid_type = 		"Invalid JSON type";
	SICE const CString 	unknown = 			"Unknown JSON error";
};

}};

// ---------------------------------------------------------
// User.

namespace user {
namespace error {

// Descriptions.
struct desc {
	SICE const CString 	invalid_uid =		"Invalid uid";
	SICE const CString 	generate_uid =		"Generate uid error";
	SICE const CString 	shadow_access =		"No access to the shadow file";
	SICE const CString 	crypt =				"Password encryption error";
	SICE const CString 	incorrect_pass = 	"Incorrect password error";
	SICE const CString 	prompt_pass = 		"Prompt password error";
	SICE const CString 	set_pass = 			"Failed to set the password error";
	SICE const CString 	create = 			"Create user error";
	SICE const CString 	generate_salt = 	"Generate salt error";
	SICE const CString 	del =		 		"Delete user error";
};

}};

// ---------------------------------------------------------
// Group.

namespace group {
namespace error {

// Descriptions.
struct desc {
	SICE const CString 	invalid_gid =		"Invalid gid";
	SICE const CString 	generate_gid =		"Generate gid error";
	SICE const CString 	create =			"Create group error";
	SICE const CString 	del =				"Delete group error";
	SICE const CString 	add_user = 			"Add user(s) to group error";
	SICE const CString 	del_user = 			"Delete user(s) from group error";
};

}};

// ---------------------------------------------------------
// Path.

namespace path {
namespace error {

// Descriptions.
struct desc {
	SICE const CString 	touch = 			"Create file error";
	SICE const CString 	mkdir = 			"Create directory error";
	SICE const CString 	chown = 			"Chown path error";
	SICE const CString 	chmod = 			"Chmod path error";
	SICE const CString 	remove = 			"Remove path error";
	SICE const CString 	abs = 				"Absolute path error";
};

}};

// ---------------------------------------------------------
// File.

namespace file {
namespace error {

// Descriptions.
struct desc {
	SICE const CString 	open = 				"Open file error";
	SICE const CString 	read = 				"Read file error";
	SICE const CString 	write = 			"Write file error";
	SICE const CString 	close = 			"Close file error";
	SICE const CString 	create = 			"Create file error";
	SICE const CString 	remove = 			"Remove file error";
	SICE const CString 	not_open =	 		"File is not open";
	SICE const CString	undefined_path = 	"Undefined path";
	SICE const CString	invalid_path = 		"Invalid path";
	SICE const CString	invalid_mode = 		"Invalid mode";
	SICE const CString	flush = 			"Flush file error";
	SICE const CString	sync = 				"Sync file error";
};

}};

// ---------------------------------------------------------
// Process.

namespace proc {
namespace error {

// Descriptions.
struct desc {
	SICE const CString 	build_wpipe = 		"Build write pipe";
	SICE const CString 	build_rpipe = 		"Build read pipe";
	SICE const CString 	build_epipe = 		"Build error pipe";
	SICE const CString 	write_input = 		"Write input";
	SICE const CString 	fork = 				"Fork";
	SICE const CString 	timeout = 			"Process pipe timeout";
	SICE const CString 	kill = 				"Kill process error";
	SICE const CString 	interrupted = 		"Process pipe interrupted";
	SICE const CString 	poll = 				"Poll process error";
	SICE const CString 	closed = 			"Process pipe closed";
	SICE const CString 	parse_exit_status = "Parse process exit status error";
};

}};

// ---------------------------------------------------------
// Thread.

namespace threads {
namespace error {

// Descriptions.
struct desc {
	SICE const CString 	create = 		"Create thread error";
	SICE const CString 	join = 			"Join thread error";
	SICE const CString 	detach = 		"Detach thread error";
	SICE const CString 	lock = 			"Lock mutex error";
	SICE const CString 	unlock = 		"Unlock mutex error";
};

}};

// ---------------------------------------------------------
// Daemon.

namespace daemon {
namespace error {

// Descriptions.
struct desc {
	SICE const CString 	load_config = 				"Load daemon config error";
	SICE const CString 	reload_config = 			"Reload daemon config error";
	SICE const CString 	already_exists = 			"Daemon already exists";
	SICE const CString 	does_not_exist = 			"Daemon does not exist";
};

}};

// ---------------------------------------------------------
// Compression.

namespace compression {
namespace error {

// Descriptions.
struct desc {
	SICE const CString 	success = 			"Success";
	SICE const CString 	too_large_err = 	"Too large";
	SICE const CString 	deflate_err = 		"Deflate error";
	SICE const CString 	inflate_err = 		"Inflate error";
	SICE const CString 	decompress_err = 	"Decompress error";
};

}};

// ---------------------------------------------------------
// Crypto.

namespace crypto {
namespace error {

// Descriptions.
struct desc {
	SICE const CString 	encrypt = 			"Encrypt error";
	SICE const CString 	decrypt = 			"Decrypt error";
	SICE const CString 	key = 				"Key error";
	SICE const CString 	encode = 			"Encode error";
	SICE const CString 	decode = 			"Decode error";
	SICE const CString 	sign = 				"Sign error";
	SICE const CString 	generate = 			"Generate random bytes error";
};

}};

// ---------------------------------------------------------
// Sockets.

namespace sockets {
namespace error {

// Descriptions.
// @TODO update desc, especially the "want_xxx" ones.
struct desc {
	SICE const CString 	success =  				"Success";
	SICE const CString 	init =  				"Failed to initialize the socket";
	SICE const CString 	set_opt =  				"Failed to configure the socket options";
	SICE const CString 	convert_ip =  			"Failed to convert the ip to binary";
	SICE const CString 	set_blocking =  		"Failed to set the blocking of the socket";
	SICE const CString 	poll =  				"Failed to poll the socket";
	SICE const CString 	accept =  				"Failed to accept a client socket";
	SICE const CString 	bind =  				"Failed to bind to the socket";
	SICE const CString 	connect =  				"Failed to connect with the server";
	SICE const CString 	listen =  				"Failed to start listening on the socket";
	SICE const CString 	timeout =  				"Timeout error";
	SICE const CString 	not_open =  			"Socket is not open";
	SICE const CString 	closed =  				"Socket is closed";
	SICE const CString 	getpeer =  				"Failed to get the peer info";
	SICE const CString 	send =  				"Failed to write to the socket";
	SICE const CString 	close =  				"Failed to close the socket";
	SICE const CString 	shutdown =  			"Failed to shut the socket down";
	SICE const CString 	want_read =  			"Socket wants a read";
	SICE const CString 	want_write =  			"Socket wants a write";
	SICE const CString 	want_x509_lookup =  	"Sockets wants a X509 lookup";
	SICE const CString 	syscall =  				"System call error";
	SICE const CString 	zero_return =  			"Socket peer has closed the connection for writing";
	SICE const CString 	want_connect =  		"Socket wants to connect";
	SICE const CString 	want_accept =  			"Sockets wants to accept";
	SICE const CString 	load_cert =  			"Unable to load the certificate";
	SICE const CString 	load_key =  			"Unable to load the key";
	SICE const CString 	verify_key =  			"Failed to verify the key";
	SICE const CString 	set_min_tls_version = 	"Failed to set the minimum TLS version";
	SICE const CString 	min_tls_version = 		"Failed to meet the required TLS version";
	SICE const CString 	unknown_tls_version = 	"Unknown TLS version";
	SICE const CString 	getaddr =  				"Unable to get the host's address info";
	SICE const CString 	tls_init =  			"Failed to initialize the tls socket";
	SICE const CString 	fatal =  				"A fatal error occurred";
	SICE const CString 	sni =  					"Servername indication error";
	SICE const CString 	no_data =				"No data error";
	SICE const CString 	unknown =  				"Encoutered an unknown error";
};

}};

// ---------------------------------------------------------
// RestAPI.

namespace restapi {
namespace error {

// Descriptions.
struct desc {
	SICE const CString 	undefined_database = 		"Undefined database path error";
	SICE const CString 	invalid_uid =		 		"Invalid user id";
	SICE const CString 	invalid_api_key =	 		"Invalid API key";
	SICE const CString 	invalid_signature =	 		"Invalid signature";
	SICE const CString 	rate_limit_exceeded =	 	"Rate limit exceeded";
	SICE const CString 	invalid_access_token =	 	"Invalid access token";
	SICE const CString 	invalid_auth =			 	"Invalid authentication";
	SICE const CString 	duplicate_username =		"Username exists";
	SICE const CString 	invalid_username =			"Invalid username";
	SICE const CString 	unknown_username =			"Unknown username";
};

}};


// ---------------------------------------------------------
// String representation.

// Convert an error number to a string description.
/*  @docs {
	@chapter: Errors
	@title: String error
	@description:
		Convert an error number to a string description.
	@usage:
        #include <vlib/types.h>
		int status = ...;
		vlib::print("Error: ", vlib::strerr(status));
} */

inline constexpr
auto& strerr(int err) {
	switch (err) {

		// Json.
		case json::error::success:
			return json::error::desc::success;
		case json::error::parse:
			return json::error::desc::parse;
		case json::error::invalid_start:
			return json::error::desc::invalid_start;
		case json::error::invalid_end:
			return json::error::desc::invalid_end;
		case json::error::too_small:
			return json::error::desc::too_small;
		case json::error::not_found:
			return json::error::desc::not_found;
		case json::error::incorrect_type:
			return json::error::desc::incorrect_type;
		case json::error::invalid_type:
			return json::error::desc::invalid_type;
		case json::error::unknown:
			return json::error::desc::unknown;
			
		// User.
		case user::error::invalid_uid:
			return user::error::desc::invalid_uid;
		case user::error::generate_uid:
			return user::error::desc::generate_uid;
		case user::error::shadow_access:
			return user::error::desc::shadow_access;
		case user::error::crypt:
			return user::error::desc::crypt;
		case user::error::incorrect_pass:
			return user::error::desc::incorrect_pass;
		case user::error::prompt_pass:
			return user::error::desc::prompt_pass;
		case user::error::set_pass:
			return user::error::desc::set_pass;
		case user::error::create:
			return user::error::desc::create;
		case user::error::generate_salt:
			return user::error::desc::generate_salt;
		case user::error::del:
			return user::error::desc::del;
		
		// Group.
		case group::error::invalid_gid:
			return group::error::desc::invalid_gid;
		case group::error::generate_gid:
			return group::error::desc::generate_gid;
		case group::error::create:
			return group::error::desc::create;
		case group::error::del:
			return group::error::desc::del;
		case group::error::add_user:
			return group::error::desc::add_user;
		case group::error::del_user:
			return group::error::desc::del_user;
			
		// Path.
		case path::error::touch:
			return path::error::desc::touch;
		case path::error::mkdir:
			return path::error::desc::mkdir;
		case path::error::chown:
			return path::error::desc::chown;
		case path::error::chmod:
			return path::error::desc::chmod;
		case path::error::remove:
			return path::error::desc::remove;
		case path::error::abs:
			return path::error::desc::abs;

		// File.
		case file::error::open:
			return file::error::desc::open;
		case file::error::read:
			return file::error::desc::read;
		case file::error::write:
			return file::error::desc::write;
		case file::error::close:
			return file::error::desc::close;
		case file::error::create:
			return file::error::desc::create;
		case file::error::remove:
			return file::error::desc::remove;
		case file::error::not_open:
			return file::error::desc::not_open;
		case file::error::undefined_path:
			return file::error::desc::invalid_path;
		case file::error::invalid_path:
			return file::error::desc::invalid_path;
		case file::error::invalid_mode:
			return file::error::desc::invalid_mode;
		case file::error::flush:
			return file::error::desc::flush;
		case file::error::sync:
			return file::error::desc::sync;

		// Process.
		case proc::error::build_wpipe:
			return proc::error::desc::build_wpipe;
		case proc::error::build_rpipe:
			return proc::error::desc::build_rpipe;
		case proc::error::build_epipe:
			return proc::error::desc::build_epipe;
		case proc::error::write_input:
			return proc::error::desc::write_input;
		case proc::error::fork:
			return proc::error::desc::fork;
		case proc::error::timeout:
			return proc::error::desc::timeout;
		case proc::error::kill:
			return proc::error::desc::kill;
		case proc::error::interrupted:
			return proc::error::desc::interrupted;
		case proc::error::poll:
			return proc::error::desc::poll;
		case proc::error::closed:
			return proc::error::desc::closed;
		case proc::error::parse_exit_status:
			return proc::error::desc::parse_exit_status;

		// Thread.
		case threads::error::create:
			return threads::error::desc::create;
		case threads::error::join:
			return threads::error::desc::join;
		case threads::error::detach:
			return threads::error::desc::detach;
		case threads::error::lock:
			return threads::error::desc::lock;
		case threads::error::unlock:
			return threads::error::desc::unlock;
			
		// Daemon.
		case daemon::error::load_config:
			return daemon::error::desc::load_config;
		case daemon::error::reload_config:
			return daemon::error::desc::reload_config;
		
		// Compression.
		// case compression::error::success:
		// 	return compression::error::desc::success;
		case compression::error::too_large_err:
			return compression::error::desc::too_large_err;
		case compression::error::deflate_err:
			return compression::error::desc::deflate_err;
		case compression::error::inflate_err:
			return compression::error::desc::inflate_err;
		case compression::error::decompress_err:
			return compression::error::desc::decompress_err;

		// Crypto.
		case crypto::error::encrypt:
			return crypto::error::desc::encrypt;
		case crypto::error::decrypt:
			return crypto::error::desc::decrypt;
		case crypto::error::key:
			return crypto::error::desc::key;
		case crypto::error::encode:
			return crypto::error::desc::encode;
		case crypto::error::decode:
			return crypto::error::desc::decode;
		case crypto::error::sign:
			return crypto::error::desc::sign;
		case crypto::error::generate:
			return crypto::error::desc::generate;

		// Socket.
		// case sockets::error::success:
		// 	return sockets::error::desc::success;
		case sockets::error::init:
			return sockets::error::desc::init;
		case sockets::error::set_opt:
			return sockets::error::desc::set_opt;
		case sockets::error::convert_ip:
			return sockets::error::desc::convert_ip;
		case sockets::error::set_blocking:
			return sockets::error::desc::set_blocking;
		case sockets::error::poll:
			return sockets::error::desc::poll;
		case sockets::error::accept:
			return sockets::error::desc::accept;
		case sockets::error::bind:
			return sockets::error::desc::bind;
		case sockets::error::connect:
			return sockets::error::desc::connect;
		case sockets::error::listen:
			return sockets::error::desc::listen;
		case sockets::error::timeout:
			return sockets::error::desc::timeout;
		case sockets::error::not_open:
			return sockets::error::desc::not_open;
		case sockets::error::closed:
			return sockets::error::desc::closed;
		case sockets::error::getpeer:
			return sockets::error::desc::getpeer;
		case sockets::error::send:
			return sockets::error::desc::send;
		case sockets::error::close:
			return sockets::error::desc::close;
		case sockets::error::shutdown:
			return sockets::error::desc::shutdown;
		case sockets::error::want_read:
			return sockets::error::desc::want_read;
		case sockets::error::want_write:
			return sockets::error::desc::want_write;
		case sockets::error::want_x509_lookup:
			return sockets::error::desc::want_x509_lookup;
		case sockets::error::syscall:
			return sockets::error::desc::syscall;
		case sockets::error::zero_return:
			return sockets::error::desc::zero_return;
		case sockets::error::want_connect:
			return sockets::error::desc::want_connect;
		case sockets::error::want_accept:
			return sockets::error::desc::want_accept;
		case sockets::error::load_cert:
			return sockets::error::desc::load_cert;
		case sockets::error::load_key:
			return sockets::error::desc::load_key;
		case sockets::error::verify_key:
			return sockets::error::desc::verify_key;
		case sockets::error::set_min_tls_version:
			return sockets::error::desc::set_min_tls_version;
		case sockets::error::min_tls_version:
			return sockets::error::desc::min_tls_version;
		case sockets::error::unknown_tls_version:
			return sockets::error::desc::unknown_tls_version;
		case sockets::error::getaddr:
			return sockets::error::desc::getaddr;
		case sockets::error::tls_init:
			return sockets::error::desc::tls_init;
		case sockets::error::fatal:
			return sockets::error::desc::fatal;
		case sockets::error::sni:
			return sockets::error::desc::sni;
		case sockets::error::no_data:
			return sockets::error::desc::no_data;
		case sockets::error::unknown:
			return sockets::error::desc::unknown;

		// RestAPI.
		case restapi::error::undefined_database:
			return restapi::error::desc::undefined_database;
		case restapi::error::invalid_uid:
			return restapi::error::desc::invalid_uid;
		case restapi::error::invalid_api_key:
			return restapi::error::desc::invalid_api_key;
		case restapi::error::invalid_signature:
			return restapi::error::desc::invalid_signature;
		case restapi::error::rate_limit_exceeded:
			return restapi::error::desc::rate_limit_exceeded;
		case restapi::error::invalid_access_token:
			return restapi::error::desc::invalid_access_token;
		case restapi::error::invalid_auth:
			return restapi::error::desc::invalid_auth;
		case restapi::error::duplicate_username:
			return restapi::error::desc::duplicate_username;
		case restapi::error::invalid_username:
			return restapi::error::desc::invalid_username;
		case restapi::error::unknown_username:
			return restapi::error::desc::unknown_username;

		// Unknown.
		default:
			return sockets::error::desc::unknown;
			
	}
}

}; 		// End namespace vlib.
#endif 	// End header.
