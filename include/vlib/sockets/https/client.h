// Author: Daan van den Bergh
// Copyright: © 2022 Daan van den Bergh.

// Header.
#ifndef VLIB_HTTPS_CLIENT_T_H
#define VLIB_HTTPS_CLIENT_T_H

// Namespace vlib.
namespace vlib {

// Namespace https.
namespace https {

// ---------------------------------------------------------
// HTTP client type.
//
// Notes:
//
// - GET request parameters are by default passed in the payload body.
//   You can use the "Request" functions seperately to create a request that conforms to your wishes.
//

/*  @docs
 *  @chapter: HTTPS
 *  @name: Client
 *  @title: Client
 *  @description:
 *      HTTPS client type.
 *  @usage:
 *      #include <vlib/sockets/https.h>
 *      vlib::https::Client client;
 */

template <
	uchar	family = 		sockets::family::ipv4,
	int 			type = 			sockets::type::stream,
	int 			protocol = 		sockets::protocol::undefined,
	uint 	buff_len = 		1024,
	bool 			blocking = 		false,
	uint	tls_version = 	tls::version::v1_3, // the minimum tls version.
	uint	http_version = 	http::version::v1_1 // the http version.
> requires (
	family == sockets::family::ipv4 ||
	family == sockets::family::ipv6
)
struct Client : public vlib::http::ClientTemplate<tls::Client<family, type, protocol, buff_len, blocking, tls_version>, http_version> {

	// ---------------------------------------------------------
	// Aliases.

	using 	Base = 		http::ClientTemplate<tls::Client<family, type, protocol, buff_len, blocking, tls_version>, http_version>;
	
	// ---------------------------------------------------------
	// Constructors.

	// Default constructor.
	constexpr
	Client () : Base() {}

	// Constructor.
    /*  @docs
     *  @title: Constructor
     *  @description:
     *  Construct a client object.
     *  @parameter:
     *      @name: ip
     *      @description: The server's ip address.
     *  @parameter:
     *      @name: port
     *      @description: The server's port.
     *  @usage:
     *      vlib::http::Client client("127.0.0.1", 9000);
     */
	constexpr
	Client (String ip, uint port) :
	Base(move(ip), port) {}
    /*  @docs
     *  @title: Constructor
     *  @description:
     *      Construct a client object.
     *  @parameter:
     *      @name: ip
     *      @description: The server's ip address.
     *  @parameter:
     *      @name: port
     *      @description: The server's port.
     *  @parameter:
     *      @name: headers
     *      @description: The default headers.
     *  @usage:
     *      vlib::http::Client client("127.0.0.1", 9000);
     */
	constexpr
	Client (String ip, uint port, http::Headers headers) :
	Base(move(ip), port, move(headers)) {}

	// Constructor from hostname.
    /*  @docs
     *  @title: Constructor
     *  @description:
     *      Construct a client object.
     *  @parameter:
     *      @name: host
     *      @description: The server's host address.
     *  @usage:
     *      vlib::http::Client client("127.0.0.1", 9000);
     **/
	constexpr
	Client (String host) :
	Base(move(host)) {}
    /*  @docs
     *  @title: Constructor
     *  @description:
     *      Construct a client object.
     *  @parameter:
     *      @name: host
     *      @description: The server's host address.
     *  @parameter:
     *      @name: headers
     *      @description: The default headers.
     *  @usage:
     *      vlib::http::Client client("127.0.0.1", 9000);
     **/
	constexpr
	Client (String host, http::Headers headers) :
	Base(move(host), move(headers)) {}
	
	// Constructor from args.
	/* @docs
	 *  @title: Constructor
	 *  @description:
	 *      Construct a client object from arguments.
	 *  @parameter:
	 *      @name: args
	 *      @description:
	 *			The template arguments.
	 *
	 *			The arguments can contain the following fields:
	 *			```struct ClientTemplateArgs {
	 *				String				host;
	 *				String				ip;
	 *				uint				port = 0;
	 *				String              sni;
	 *				String 				api_key;
	 *				String 				api_secret;
	 *				http::Headers		headers;
	 *				Compression			compression;
	 *			};```
	 *  }
	 *  @usage:
	 *      vlib::http::Client client({
	 *			.host = ...,
	 *			.ip = ...,
	 *			.port = ...,
	 *			.sni = ...,
	 *			.headers = ...,
	 *		});
	 **/
	constexpr
	Client (http::ClientTemplateArgs args) :
	Base(move(args)) {}

};

// ---------------------------------------------------------
// Simple request.


// Request.
vlib::http::Response    request(const vlib::http::RequestArgs& args) {
    return vlib::http::request_h<Client<>>(args);
}

// ---------------------------------------------------------
// End.

}; 		// End namespace https.
}; 		// End namespace vlib.
#endif 	// End header.
