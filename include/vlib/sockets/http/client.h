// Author: Daan van den Bergh
// Copyright: © 2022 Daan van den Bergh.

// Header.
#ifndef VLIB_HTTP_CLIENT_T_H
#define VLIB_HTTP_CLIENT_T_H

// Namespace vlib.
namespace vlib {

// Namespace http.
namespace http {

// ---------------------------------------------------------
// HTTP client type.
//
// Notes:
//
// - GET request parameters are by default passed in the payload body.
//   You can use the "Request" functions seperately to create a request that conforms to your wishes.
//
/*  @docs {
 *	@chapter: http
 *	@title: Client
 *	@description:
 *		HTTP client type.
 *	@usage:
 *		#include <vlib/sockets/http.h>
 *		vlib::http::Client client;
 } */

template <
	uchar	family = 		sockets::family::ipv4,
	int		type = 			sockets::type::stream,
	int 	protocol = 		sockets::protocol::undefined,
	uint 	buff_len = 		1024,
	bool 	blocking = 		false,
	uint	http_version = 	http::version::v1_1 // the http version.
> requires (
	family == sockets::family::ipv4 ||
	family == sockets::family::ipv6
)
struct Client : public vlib::http::ClientTemplate<sockets::Socket<family, type, protocol, buff_len, blocking>, http_version> {

	// ---------------------------------------------------------
	// Aliases.

	using 	Base = 		http::ClientTemplate<sockets::Socket<family, type, protocol, buff_len, blocking>, http_version>;

	// ---------------------------------------------------------
	// Constructors.

	// Default constructor.
	constexpr
	Client () : Base() {}

	// Constructor.
	/*  @docs {
		@title: Constructor
		@description:
			Construct a client object.
		@parameter: {
			@name: ip
			@description: The server's ip address.
		}
		@parameter: {
			@name: port
			@description: The server's port.
		}
		@usage:
			vlib::http::Client client("127.0.0.1", 9000);
	} */
	constexpr
	Client (String ip, uint port) :
	Base(move(ip), port) {}
	/*  @docs {
		@title: Constructor
		@description:
			Construct a client object.
		@parameter: {
			@name: ip
			@description: The server's ip address.
		}
		@parameter: {
			@name: port
			@description: The server's port.
		}
		@parameter: {
			@name: headers
			@description: The default headers.
		}
		@usage:
			vlib::http::Client client("127.0.0.1", 9000);
	} */
	constexpr
	Client (String ip, uint port, Headers headers) :
	Base(move(ip), port, move(headers)) {}

	// Constructor from hostname.
    /*  @docs {
     *  @title: Constructor
     *  @description:
     *      Construct a client object.
     *  @parameter: {
     *      @name: host
     *      @description: The server's host address.
     *  }
     *  @usage:
     *      vlib::http::Client client("127.0.0.1", 9000);
     *} */
	constexpr
	Client (String host) :
	Base(move(host)) {}
    /*  @docs {
     *  @title: Constructor
     *  @description:
     *      Construct a client object.
     *  @parameter: {
     *      @name: host
     *      @description: The server's host address.
     *  }
     *  @parameter: {
     *      @name: headers
     *      @description: The default headers.
     *  }
     *  @usage:
     *      vlib::http::Client client("127.0.0.1", 9000);
     *} */
	constexpr
	Client (String host, Headers headers) :
	Base(move(host), move(headers)) {}
	
	// Constructor from args.
	constexpr
	Client (http::ClientTemplateArgs x) :
	Base(move(x)) {}

};

// ---------------------------------------------------------
// Simple request.

// Request helper.
struct RequestArgs {
    Short method;
    String url;
    Json params = {};
    Headers headers = {};
    Int timeout = -1;
};
template <typename Client = http::Client<>>
Response    request_h(const RequestArgs& args) {
    
    // Get base url and endpoint.
    String host, clean_host, endpoint;
    ullong pos1, pos2;
    if ((pos1 = args.url.find("://")) != NPos::npos) {
        if ((pos2 = args.url.find('/', pos1 + 4)) != NPos::npos) {
            host = args.url.slice(0, pos2);
            clean_host = args.url.slice(pos1 + 3, pos2);
            endpoint = args.url.slice(pos2);
        }
    } else {
        if ((pos1 = args.url.find('/')) != NPos::npos) {
            host = args.url.slice(0, pos1);
            clean_host = host;
            endpoint = args.url.slice(pos1);
        }
    }
    
    // Set default headers.
    Headers headers = args.headers;
    headers["host"] = clean_host;
    
    // Make request.
    Client client (host, headers);
    vlib::http::Response response;
    switch (args.method.value()) {
        case method::get:
            response = client.query_request(args.method.value(), endpoint, args.params, args.timeout.value());
            break;
        case method::head:
        case method::post:
        case method::put:
        case method::del:
        case method::connect:
        case method::options:
        case method::trace:
        case method::patch:
            response = client.request(args.method.value(), endpoint, args.params, args.timeout.value());
            break;
        default:
            throw InvalidUsageError(tostr("Invalid method \"", args.method, "\"."));
    }
    client.close();
    return response;
}

// Request.
Response    request(const RequestArgs& args) {
    return request_h<Client<>>(args);
}

// ---------------------------------------------------------
// End.

}; 		// End namespace http.
}; 		// End namespace vlib.
#endif 	// End header.
