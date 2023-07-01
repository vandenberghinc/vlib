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
struct ClientTemplate_args {
	String				host;
	String				ip;
	uint				port = 0;
    String              sni;
	String 				api_key;
	String 				api_secret;
	http::Headers		headers;
	Compression			compression;
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
	ClientTemplate (ClientTemplate_args x) :
	m_sock(move(x.host), move(x.ip), x.port),
	m_api_key(move(x.api_key)),
	m_api_secret(move(x.api_secret)),
    m_sni(move(x.sni)),
	m_headers(move(x.headers)),
    m_compression(move(x.compression))
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

	// Create and send a request.
	constexpr
	Response	request(
		short			method,
		const String&	endpoint,
		int				timeout = -1
	) {
		Request request(method, endpoint, m_headers, http_version);
		return send_request(request, timeout);
	}
	constexpr
	Response	request(
		short 			method,
		const String& 	endpoint,
		const String&	body,
		int				timeout = -1
	) {
        if (m_api_secret.is_defined()) {
            m_headers.value("API-Signature", 13) = SHA256::hmac(m_api_secret, body);
        }
		http::Request request(method, endpoint, m_headers, body, http_version);
		return send_request(request, timeout);
	}
	constexpr
	Response	request(
		short 			method,
		const String& 	endpoint,
		const Json&		params,
		int				timeout = -1
	) {
		return request(method, endpoint, params.json(), timeout);
	}
	constexpr
	Response	query_request(
		short 			method,
		const String& 	endpoint,
		const Json&		params,
		int				timeout = -1
	) {
		if (params.len() == 0) {
			return request(method, endpoint, timeout);
		}
		String new_endpoint (endpoint);
		new_endpoint << '?' << url_encode(params);
		return request(method, new_endpoint, timeout);
	}

	// Create and send a compressed request.
	// - Only the body will be compressed.
	// - Warning: should not be used when the body contains sensitive information.
	constexpr
	Response	compressed_request(
		short 			method,
		const String& 	endpoint,
		const String&	body,
		int				timeout = -1
	) {
		return request(method, endpoint, m_compression.compress(body), timeout);
	}
	constexpr
	Response	compressed_request(
		short 			method,
		const String& 	endpoint,
		const Json&		params,
		int				timeout = -1
	) {
		return compressed_request(method, endpoint, params.json(), timeout);
	}
	
	// Send a request.
	constexpr
	Response	send_request(
		const http::Request&	request,
		int						timeout = -1
	) {
		if (!m_was_connected || m_sock.is_broken() || !m_sock.is_connected()) {
            if (m_was_connected) {
                restart();
            }
            m_sock.connect(timeout < 500 ? 500 : timeout);
		}
        m_was_connected = true;
        m_sock.send(request.data(), timeout);
		http::Response response = Response::receive(m_sock, timeout);
		if (response.has_body() && m_compression.is_compressed(response.body())) {
			response.body() = m_compression.decompress(response.body());
		}
		return response;
	}
    
    // Restart the socket.
    void 	restart() {
        m_sock.restart();
        if (m_sni.is_defined()) {
            m_sock.set_sni(m_sni);
        }
        m_was_connected = false;
    }
    
    // Close the socket.
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
