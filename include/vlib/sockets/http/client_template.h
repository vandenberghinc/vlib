// Author: Daan van den Bergh
// Copyright: © 2022 Daan van den Bergh.

// Header.
#ifndef VLIB_HTTP_CLIENT_TEMPLATE_H
#define VLIB_HTTP_CLIENT_TEMPLATE_H

// Namespace vlib.
namespace vlib {

// Namespace http.
namespace http {

// ---------------------------------------------------------
// HTTP client template type.

// Constructor args.
struct ClientTemplateArgs {
	String				host;
	String				ip;
	uint				port = 0;
    String              sni;
	String 				api_key;
	String 				api_secret;
	http::Headers		headers;
	Compression			compression;
	Bool				query = true; // automatically use query requests on GET.
	Bool				debug = false;
};

template <
	typename Socket,									// the tcp / tls socket.
	uint	 http_version = 	http::version::v1_1 	// the http version.
>
struct ClientTemplate {

// Public.
public:
	
	// ---------------------------------------------------------
	// Aliases.

	using 	This = 		ClientTemplate;

	// ---------------------------------------------------------
	// Attributes.

	Socket			m_sock;
	String			m_api_key;
	String			m_api_secret;
    String          m_sni;
	http::Headers	m_headers;
	Compression	    m_compression;
    Bool            m_was_connected = false;
	Bool			m_query = true; // automatically use query requests on GET.
	Bool			m_debug = false;
	
// Private.
private:
	
	// ---------------------------------------------------------
	// Private functions.
	
	// Set headers.
	void 	set_headers() {
		if (m_api_key.is_defined()) {
			m_headers.value("API-Key", 7) = m_api_key;
		}
	}

// Public.
public:
	
	// ---------------------------------------------------------
	// Constructors.

	// Default constructor.
	constexpr
	ClientTemplate () {}

	// Constructor.
	constexpr
	ClientTemplate (String ip, uint port) :
	m_sock(move(ip), port) {}
	constexpr
	ClientTemplate (String ip, uint port, http::Headers headers) :
	m_sock(move(ip), port),
	m_headers(move(headers)) {}

	// Constructor from hostname.
	constexpr
	ClientTemplate (String host) :
	m_sock(move(host)) {}
	constexpr
	ClientTemplate (String host, http::Headers headers) :
	m_sock(move(host)),
	m_headers(move(headers)) {}
	
	// Constructor from args.
	constexpr
	ClientTemplate (ClientTemplateArgs x) :
	m_sock(move(x.host), move(x.ip), x.port),
	m_api_key(move(x.api_key)),
	m_api_secret(move(x.api_secret)),
    m_sni(move(x.sni)),
	m_headers(move(x.headers)),
    m_compression(move(x.compression)),
	m_query(x.query),
	m_debug(x.debug)
	{
		set_headers();
        if (m_sni.is_defined()) {
            m_sock.set_sni(m_sni);
        }
	}

	// ---------------------------------------------------------
	// Attributes.

	// The tls socket.
	constexpr
	auto& 	sock() {
		return m_sock;
	}

	// The headers.
	constexpr
	auto& 	headers() {
		return m_headers;
	}

	// The compression.
	constexpr
	auto& 	compression() {
		return m_compression;
	}

	// ---------------------------------------------------------
	// Functions.

	// Sign.
	void	sign(const String& body) {
		m_headers.value("API-Signature", 13) = SHA256::hmac(m_api_secret, body);
	}
	
	// Create and send a request.
	/*  @docs  {
	 *	@parent: vlib::http::Client
	 *	@title: Request
	 *	@description:
	 *		Make a HTTP request.
	 *	@return:
	 *		The functions return a <type>vlib::http::Response</type> object.
	 *	@parameter: {
	 *		@name: method
	 *		@description: The HTTP method, see <link #vlib::http::method::methods>vlib::http::method</link> for more info.
	 *	}
	 *	@parameter: {
	 *		@name: endpoint
	 *		@description: The endpoint url, for example `/`.
	 *	}
	 *	@parameter: {
	 *		@name: timeout
	 *		@description: The timout in milliseconds, use `-1` for no timeout.
	 *	}
	 *	@usage:
	 *		// Request with no parameters.
	 *		vlib::http::Client client (...);
	 *		vlib::http::Response response = client.request(
	 *			vlib::http::method::get,
	 *			"/",
	 *			-1
	 *		)
	 *
	 *		// Request with a string body.
	 *		vlib::http::Response response = client.request(
	 *			vlib::http::method::get,
	 *			"/",
	 *			-1,
	 *			"Hello World!"
	 *		)
	 *
	 *		// Request with json body parameters.
	 *		// Use query request to make a request with query parameters.
	 *		vlib::http::Response response = client.request(
	 *			vlib::http::method::get,
	 *			"/",
	 *			-1,
	 *			{{"Hello", "World!"}}
	 *		)
	 *	@funcs: 4
	 } */
	/*  @docs  {
	 *	@parent: vlib::https::Client
	 *	@title: Request
	 *	@description:
	 *		Make a HTTPS request.
	 *	@return:
	 *		The functions return a <type>vlib::http::Response</type> object.
	 *	@parameter: {
	 *		@name: method
	 *		@description: The HTTP method, see <link #vlib::http::method::methods>vlib::http::method</link> for more info.
	 *	}
	 *	@parameter: {
	 *		@name: endpoint
	 *		@description: The endpoint url, for example `/`.
	 *	}
	 *	@parameter: {
	 *		@name: timeout
	 *		@description: The timout in milliseconds, use `-1` for no timeout.
	 *	}
	 *	@usage:
	 *		// Request with no parameters.
	 *		vlib::https::Client client (...);
	 *		vlib::http::Response response = client.request(
	 *			vlib::http::method::get,
	 *			"/",
	 *			-1
	 *		)
	 *
	 *		// Request with a string body.
	 *		vlib::http::Response response = client.request(
	 *			vlib::http::method::get,
	 *			"/",
	 *			-1,
	 *			"Hello World!"
	 *		)
	 *
	 *		// Request with json body parameters.
	 *		// Use query request to make a request with query parameters.
	 *		vlib::http::Response response = client.request(
	 *			vlib::http::method::get,
	 *			"/",
	 *			-1,
	 *			{{"Hello", "World!"}}
	 *		)
	 *	@funcs: 4
	 } */
	constexpr
	Response	request(
		short			method,
		const String&	endpoint,
		int				timeout = VLIB_SOCK_TIMEOUT
	) {
		return send_request(Request(method, endpoint, m_headers, http_version), timeout);
	}
	constexpr
	Response	request(
		short 			method,
		const String& 	endpoint,
		const String&	body,
		int				timeout = VLIB_SOCK_TIMEOUT
	) {
		if (m_query && method == vlib::http::method::get) {
			return query_request(method, endpoint, body, timeout);
		}
		if (m_api_secret.is_defined()) {
			sign(body);
		}
		return send_request(http::Request(method, endpoint, m_headers, body, http_version), timeout);
	}
	constexpr
	Response	request(
		short 			method,
		const String& 	endpoint,
		const Json&		params,
		int				timeout = VLIB_SOCK_TIMEOUT
	) {
		if (m_query && method == vlib::http::method::get) {
			return query_request(method, endpoint, params.json(), timeout);
		}
		if (params.len() > 0) {
			return request(method, endpoint, params.json(), timeout);
		} else {
			return request(method, endpoint, timeout);
		}
	}
	constexpr
	Response	query_request(
		short 			method,
		const String& 	endpoint,
		const Json&		params,
		int				timeout = VLIB_SOCK_TIMEOUT
	) {
		if (params.len() == 0) {
			return request(method, endpoint, timeout);
		}
		String new_endpoint (endpoint);
		new_endpoint << '?' << url_encode(params);
		return request(method, new_endpoint, timeout);
	}
	constexpr
	Response	query_request(
		short 			method,
		const String& 	endpoint,
		const String&	params,
		int				timeout = VLIB_SOCK_TIMEOUT
	) {
		String new_endpoint (endpoint);
		new_endpoint << '?' << params;
		return request(method, new_endpoint, timeout);
	}

	// Create and send a compressed request.
	/*  @docs  {
	 *	@parent: vlib::http::Client
	 *	@title: Compressed request
	 *	@description:
	 *		Make a compressed HTTP request.
	 *
	 *		Only the body will compressed.
	 *	@return:
	 *		The functions return a <type>vlib::http::Response</type> object.
	 *	@parameter: {
	 *		@name: method
	 *		@description: The HTTP method, see <link #vlib::http::method::methods>vlib::http::method</link> for more info.
	 *	}
	 *	@parameter: {
	 *		@name: endpoint
	 *		@description: The endpoint url, for example `/`.
	 *	}
	 *	@parameter: {
	 *		@name: timeout
	 *		@description: The timout in milliseconds, use `-1` for no timeout.
	 *	}
	 *	@parameter: {
	 *		@name: body
	 *		@description: The request body.
	 *	}
	 *	@usage:
	 *		// Compressed request with a string body.
	 *		vlib::http::Client client (...);
	 *		vlib::http::Response response = client.compressed_request(
	 *			vlib::http::method::get,
	 *			"/",
	 *			-1,
	 *			"Hello World!"
	 *		)
	 *
	 *		// Compressed request with json body parameters.
	 *		// Use query request to make a request with query parameters.
	 *		vlib::http::Response response = client.compressed_request(
	 *			vlib::http::method::get,
	 *			"/",
	 *			-1,
	 *			{{"Hello", "World!"}}
	 *		)
	 *	@funcs: 2
	 } */
	/*  @docs  {
	 *	@parent: vlib::https::Client
	 *	@title: Compressed request
	 *	@description:
	 *		Make a compressed HTTPS request.
	 *
	 *		Only the body will compressed.
	 *	@warning:
	 *		This function should not be used when the body contains sensitive information.
	 *	@return:
	 *		The functions return a <type>vlib::http::Response</type> object.
	 *	@parameter: {
	 *		@name: method
	 *		@description: The HTTP method, see <link #vlib::http::method::methods>vlib::http::method</link> for more info.
	 *	}
	 *	@parameter: {
	 *		@name: endpoint
	 *		@description: The endpoint url, for example `/`.
	 *	}
	 *	@parameter: {
	 *		@name: timeout
	 *		@description: The timout in milliseconds, use `-1` for no timeout.
	 *	}
	 *	@parameter: {
	 *		@name: body
	 *		@description: The request body.
	 *	}
	 *	@usage:
	 *		// Compressed request with a string body.
	 *		vlib::https::Client client (...);
	 *		vlib::http::Response response = client.compressed_request(
	 *			vlib::http::method::post,
	 *			"/",
	 *			-1,
	 *			"Hello World!"
	 *		)
	 *
	 *		// Compressed request with json body parameters.
	 *		// Use query request to make a request with query parameters.
	 *		vlib::http::Response response = client.compressed_request(
	 *			vlib::http::method::post,
	 *			"/",
	 *			-1,
	 *			{{"Hello", "World!"}}
	 *		)
	 *	@funcs: 2
	 } */
	constexpr
	Response	compressed_request(
		short 			method,
		const String& 	endpoint,
		const String&	body,
		int				timeout = VLIB_SOCK_TIMEOUT
	) {
		if (m_query && method == vlib::http::method::get) {
			return query_request(method, endpoint, m_compression.compress(body), timeout);
		}
		return request(method, endpoint, m_compression.compress(body), timeout);
	}
	constexpr
	Response	compressed_request(
		short 			method,
		const String& 	endpoint,
		const Json&		params,
		int				timeout = VLIB_SOCK_TIMEOUT
	) {
		return compressed_request(method, endpoint, params.json(), timeout);
	}
	
	// Create and send a chunked request.
	/*  @docs  {
	 *	@parent: vlib::http::Client
	 *	@title: Chunked request
	 *	@description:
	 *		Make a chunked HTTP request.
	 *
	 *		Only the body will sent in chunks.
	 *
	 *		Does not yet support query requests with `query = true`.
	 *	@return:
	 *		The functions return a <type>vlib::http::Response</type> object.
	 *	@parameter: {
	 *		@name: method
	 *		@description: The HTTP method, see <link #vlib::http::method::methods>vlib::http::method</link> for more info.
	 *	}
	 *	@parameter: {
	 *		@name: endpoint
	 *		@description: The endpoint url, for example `/`.
	 *	}
	 *	@parameter: {
	 *		@name: timeout
	 *		@description: The timout in milliseconds, use `-1` for no timeout.
	 *	}
	 *	@parameter: {
	 *		@name: body
	 *		@description: The request body.
	 *	}
	 *	@usage:
	 *		// Chunked request with a string body.
	 *		vlib::http::Client client (...);
	 *		vlib::http::Response response = client.chunked_request(
	 *			vlib::http::method::post,
	 *			"/",
	 *			-1,
	 *			"Hello World!"
	 *		)
	 *
	 *		// Chunked request with json body parameters.
	 *		vlib::http::Response response = client.chunked_request(
	 *			vlib::http::method::post,
	 *			"/",
	 *			-1,
	 *			{{"Hello", "World!"}}
	 *		)
	 *	@funcs: 2
	 } */
	/*  @docs  {
	 *	@parent: vlib::https::Client
	 *	@title: Chunked request
	 *	@description:
	 *		Make a chunked HTTPS request.
	 *
	 *		Only the body will sent in chunks.
	 *
	 *		Does not yet support query requests with `query = true`.
	 *	@return:
	 *		The functions return a <type>vlib::http::Response</type> object.
	 *	@parameter: {
	 *		@name: method
	 *		@description: The HTTP method, see <link #vlib::http::method::methods>vlib::http::method</link> for more info.
	 *	}
	 *	@parameter: {
	 *		@name: endpoint
	 *		@description: The endpoint url, for example `/`.
	 *	}
	 *	@parameter: {
	 *		@name: timeout
	 *		@description: The timout in milliseconds, use `-1` for no timeout.
	 *	}
	 *	@parameter: {
	 *		@name: body
	 *		@description: The request body.
	 *	}
	 *	@usage:
	 *		// Chunked request with a string body.
	 *		vlib::https::Client client (...);
	 *		vlib::http::Response response = client.chunked_request(
	 *			vlib::http::method::post,
	 *			"/",
	 *			-1,
	 *			"Hello World!"
	 *		)
	 *
	 *		// Chunked request with json body parameters.
	 *		vlib::http::Response response = client.chunked_request(
	 *			vlib::http::method::post,
	 *			"/",
	 *			-1,
	 *			{{"Hello", "World!"}}
	 *		)
	 *	@funcs: 2
	 } */
	constexpr
	Response	chunked_request(
		short 			method,
		const String& 	endpoint,
		const String&	body,
		int				timeout = VLIB_SOCK_TIMEOUT
	) {
		if (m_api_secret.is_defined()) {
			sign(body);
		}
		return send_request(http::Request(method, endpoint, m_headers, body, http_version), timeout, true);
	}
	constexpr
	Response	chunked_request(
		short 			method,
		const String& 	endpoint,
		const Json&		params,
		int				timeout = VLIB_SOCK_TIMEOUT
	) {
		const String body = params.json();
		if (m_api_secret.is_defined()) {
			sign(body);
		}
		return send_request(http::Request(method, endpoint, m_headers, body, http_version), timeout, true);
	}
	
	// Send a request.
	constexpr
	Response	send_request(
		const http::Request&	request,
		int						timeout = VLIB_SOCK_TIMEOUT,
		bool					chunked = false
	) {
		if (!m_was_connected || m_sock.is_broken() || !m_sock.is_connected()) {
            if (m_was_connected) {
                restart();
            }
            m_sock.connect(timeout < 500 ? 500 : timeout);
		}
        m_was_connected = true;
		if (m_debug) {
			print("===================================================");
			print(request);
		}
		if (chunked) {
			m_sock.send_chunked(request, timeout);
		} else {
			m_sock.send(request, timeout);
		}
		http::Response response = m_sock.template recv<http::Response>(timeout);
		if (response.has_body() && m_compression.is_compressed(response.body())) {
			response.body() = m_compression.decompress(response.body());
		}
		if (m_debug) {
			print("===================================================");
			print(response);
		}
		return response;
	}
    
    // Restart the socket.
	/*  @docs  {
	 *	@parent: vlib::http::Client
	 *	@title: Restart
	 *	@description:
	 *		Restart the socket.
	 *
	 *		Restarting the socket will happen automatically when the socket connection has been closed.
	 *	@usage:
	 *		// Compressed request with a string body.
	 *		vlib::http::Client client (...);
	 *		client.restart();
	 } */
	/*  @docs  {
	 *	@parent: vlib::https::Client
	 *	@title: Restart
	 *	@description:
	 *		Restart the socket.
	 *
	 *		Restarting the socket will happen automatically when the socket connection has been closed.
	 *	@usage:
	 *		// Compressed request with a string body.
	 *		vlib::https::Client client (...);
	 *		client.restart();
	 } */
    void 	restart() {
        m_sock.restart();
        if (m_sni.is_defined()) {
            m_sock.set_sni(m_sni);
        }
        m_was_connected = false;
    }
    
    // Close the socket.
	/*  @docs  {
	 *	@parent: vlib::http::Client
	 *	@title: Close
	 *	@description:
	 *		Close the socket.
	 *	@usage:
	 *		// Compressed request with a string body.
	 *		vlib::http::Client client (...);
	 *		...
	 *		client.close();
	 } */
	/*  @docs  {
	 *	@parent: vlib::https::Client
	 *	@title: Close
	 *	@description:
	 *		Close the socket.
	 *	@usage:
	 *		// Compressed request with a string body.
	 *		vlib::https::Client client (...);
	 *		...
	 *		client.close();
	 } */
    void     close() {
        m_sock.close();
        m_was_connected = false;
    }

	// ---------------------------------------------------------
	// Operators.

	// Dump to pipe.
	constexpr friend
	auto& 	operator <<(Pipe pipe, This& obj) {
		return pipe << obj.m_sock;
	}

};

// ---------------------------------------------------------
// End.

}; 		// End namespace http.
}; 		// End namespace vlib.
#endif 	// End header.
