// Author: Daan van den Bergh
// Copyright: © 2022 Daan van den Bergh.

// Header.
#ifndef VLIB_TLSTCP_CLIENT_T_H
#define VLIB_TLSTCP_CLIENT_T_H

// Namespace vlib.
namespace vlib {

// Namespace tls.
namespace tls {

// ---------------------------------------------------------
// Secure TCP Client Type.
//
// Notes:
// - The socket is always non-blocking.
//

template <
    int     family =         sockets::family::ipv4,
    int     type =           sockets::type::stream,
    int     protocol =       sockets::protocol::undefined,
    uint    buff_len =       1024,
    bool    blocking =       false,
    uint    tls_version =    tls::version::any    // the minimum tls version.
> requires (
	family == sockets::family::ipv4 ||
	family == sockets::family::ipv6
)
struct Client {

// Public.
public:

	// ---------------------------------------------------------
	// Aliases.

	using		Socket = 	sockets::Socket<family, type, protocol, buff_len, blocking>;
	using		This = 		Client;

	// ---------------------------------------------------------
	// Attributes.

	struct attr {
		Socket		sock;
		SSL_CTX* 	ctx = nullptr;
		SSL* 		ssl = nullptr;
	};
	SPtr<attr> 	m_attr;

// Private.
private:

	// ---------------------------------------------------------
	// Wrapper functions.

	// Construct the server ctx.
	void 	construct_ctx_ssl() {
		m_attr->ctx = SSL_CTX_new(TLS_client_method());
		if (m_attr->ctx == NULL) {
			m_attr->ctx = nullptr;
            throw SocketError("Unable to initialize the client context.");
		}
        // wrapper::set_min_tls_version(m_attr->ctx, tls_version);
		m_attr->ssl = SSL_new(m_attr->ctx);
		if (m_attr->ssl == NULL) {
			m_attr->ssl = nullptr;
            throw SocketError("Unable to initialize the client tls.");
		}
		SSL_set_fd(m_attr->ssl, m_attr->sock.fd().value());
	}
    
    // Initialize the tcp socket.
    constexpr
    void    init_tcp(const String& ip, const Int& port) {
        m_attr->sock.construct(ip, port);
    }
    constexpr
    void    init_tcp_by_host(const String& host, const Int& port = 0) {
        m_attr->sock.construct_host(host, port);
    }

// Public.
public:

	// ---------------------------------------------------------
	// Construct functions.

	// Reconstructor from ip and port.
	constexpr
	void 	reconstruct(const String& ip, const Int& port) {
        close();
        init_tcp(ip, port);
        construct_ctx_ssl();
	}
	
	// Reconstructor from host.
	constexpr
	void 	reconstruct(const String& host) {
        close();
        init_tcp_by_host(host);
        construct_ctx_ssl();
	}
    
    // Reconstructor from host, ip and port.
    constexpr
    void     reconstruct(
        const String&  host,
        const String&  ip,
        const Int&    port
    ) {
        close();
        if (host.is_defined()) {
            init_tcp_by_host(host, port);
            
        } else {
            init_tcp_by_host(ip, port);
        }
        construct_ctx_ssl();
    }
	
	// Copy.
	constexpr
	auto&	copy(const This& obj) {
        close();
		m_attr.copy(obj.m_attr);
		return *this;
	}

	// Swap.
	constexpr
	auto&	swap(This& obj) {
        close();
		m_attr.swap(obj.m_attr);
		return *this;
	}

    
	// ---------------------------------------------------------
	// Constructors.

	// Default constructor.
	constexpr
	Client () :
	m_attr(attr{})
	{
		wrapper::init_openssl();
	}

	// Constructor from ip & port.
	constexpr
	Client (const String& ip, const Int& port) :
	m_attr(attr{})
	{
		wrapper::init_openssl();
        init_tcp(ip, port);
        construct_ctx_ssl();
	}

	// Constructor from host.
	constexpr
	Client (const String& host) :
	m_attr(attr{})
	{
        wrapper::init_openssl();
        init_tcp_by_host(host);
        construct_ctx_ssl();
	}
	
	// Special constructor for http::ClientTemplate.
	constexpr
	Client (const String& host, const String& ip, const Int& port) :
	m_attr(attr{})
	{
		wrapper::init_openssl();
		if (host.is_defined()) {
            init_tcp_by_host(host, port);
            
		} else {
            init_tcp_by_host(ip, port);
		}
        construct_ctx_ssl();
	}

	// Copy constructor.
	constexpr
	Client(const This& obj) :
	m_attr(obj.m_attr) {}

	// Move constructor.
	constexpr
	Client(This&& obj) :
	m_attr(move(obj.m_attr)) {}

	// Destructor.
	constexpr
	~Client() {
		if (m_attr.links() == 0) {
			close();
		}
	}

	// ---------------------------------------------------------
	// Assignment operators.

	// Assignment operator from host.
	constexpr
	auto&	operator =(const String& host) { return reconstruct(host); }
	constexpr
	auto&	operator =(String&& host) { return reconstruct(host); }

	// Copy assignment operator.
	constexpr
	auto&	operator =(const This& obj) { return copy(obj); }

	// Move assignment operator.
	constexpr
	auto&	operator =(This&& obj) { return swap(obj); }

	// ---------------------------------------------------------
	// Attribute functions.

    // Fd.
    constexpr
    auto&     fd() {
        return m_attr->sock.fd();
    }
    
	// Ip.
	constexpr
	auto& 	ip() {
		return m_attr->sock.ip();
	}

	// Port.
	constexpr
	auto& 	port() {
		return m_attr->sock.port();
	}

	// Host.
	constexpr
	auto& 	host() {
		return m_attr->sock.host();
	}

	// Socket.
	constexpr
	auto& 	sock() {
		return m_attr->sock;
	}


	// CTX object.
	auto& 	ctx() {
		return m_attr->ctx;
	}

	// SSL object.
	auto& 	ssl() {
		return m_attr->ssl;
	}

	// The tls version.
	constexpr
	auto& 	version() {
		return tls_version;
	}

	// ---------------------------------------------------------
	// Functions.
	
	// Set server name (SNI).
	// https://stackoverflow.com/questions/5113333/how-to-implement-server-name-indication-sni
	constexpr
	void    set_sni(const String& servername) {
		set_sni(servername.c_str());
	}
	constexpr
	void    set_sni(const char* servername) {
		if (SSL_set_tlsext_host_name(m_attr->ssl, servername) != 1) {
            throw SocketError("Unable to set the server name (sni).");
		}
	}
	
	// Receive.
	String  recv(const Int& timeout = VLIB_SOCK_TIMEOUT) {
        String received;
		wrapper::receive(received, m_attr->ssl, timeout.value(), buff_len);
        return received;
	}
    void     recv(String& received, const Int& timeout = VLIB_SOCK_TIMEOUT) {
        wrapper::receive(received, m_attr->ssl, timeout.value(), buff_len);
    }
	
	// Receive a full HTTP request over tls.
	/* @docs {
	 *	@title: Receive a HTTP request.
	 *	@parameter: {
	 *		@name: timeout
	 *		@description: The timeout in milliseconds.
	 *	}
	 *	@description:
	 *		Receive a HTTP request.
	 *
	 *		Supports chunked requests.
	 *	@usage:
	 *		vlib::Socket sock;
	 *		...
	 *		vlib::http::Request request = sock.recv<vlib::http::Request>(10000);
	 } */
	template <typename DataType> requires (
		http::is_Response<DataType>::value ||
		http::is_Request<DataType>::value
	) constexpr
	DataType recv(const Int& timeout) {
		DataType request;
		http::Parser parser(request);
		String received;
		while (true) {
			recv(received, timeout);
			if (parser.parse(received)) {
				break;
			}
		}
		return request;
	}

	// Send.
	void 	send(
		const String&	data,
		const Int& 		timeout = VLIB_SOCK_TIMEOUT
	) {
		wrapper::send(m_attr->ssl, data.data(), data.len(), timeout.value());
	}
	void 	send(
		const http::Request&	request,
		const Int& 				timeout = VLIB_SOCK_TIMEOUT
	) {
		send(request.data(), timeout);
	}
	void 	send(
		const char*		data,
		uint 			len,
		Int      		timeout
	) {
		wrapper::send(m_attr->ssl, data, len, timeout.value());
	}
	
	// Send chunked http response.
	// The header "Transfer-Encoding: chunked" will automatically be added.
	// May cause undefined behaviour if the header already exists.
	template <typename Type> requires (http::is_Request<Type>::value || http::is_Response<Type>::value)
	ullong  send_chunked(
		const Type&	response,
		const Int&  timeout = VLIB_SOCK_TIMEOUT
	) {
		return wrapper::send_chunked(m_attr->ssl, response, timeout);
	}
    
    // Poll receive.
    void    poll_recv(const Int& timeout = VLIB_SOCK_TIMEOUT) {
        m_attr->sock.poll_recv(m_attr->sock.fd(), timeout);
    }
    
    // Poll send.
    void    poll_send(const Int& timeout = VLIB_SOCK_TIMEOUT) {
        m_attr->sock.poll_send(m_attr->sock.fd(), timeout);
    }

	// Connect.
	void 	connect(const Int& timeout = 10 * 1000) {
		
		// Variables.
		int status;
        ullong end_time = Date::get_mseconds() + timeout.value();
        
        // Connect underlying socket.
        m_attr->sock.connect();
        // for (int attempts = 3; attempts >= 0; --attempts) {
        //     if (attempts > 0) {
        //         try {
        //             m_attr->sock.connect();
        //             break;
        //         } catch (SocketClosedError& e) {
        //             m_attr->sock.restart();
        //         }
        //     } else {
        //         m_attr->sock.connect();
        //     }
        // }
        
        
        // Verify socket connection
        int socket_error = 0;
        socklen_t socket_error_length = sizeof(socket_error);
        int getsockopt_result = getsockopt(m_attr->sock.fd().value(), SOL_SOCKET, SO_ERROR, &socket_error, &socket_error_length);
        if (getsockopt_result == -1 || socket_error != 0) {
            throw ConnectError("Unable to establish a connection.");
        }
        
        // Loop.
        struct pollfd pfd;
        while (true) {

            // Connect with ssl.
            errno = 0;
            if ((status = SSL_connect(m_attr->ssl)) > 0) {
                break;
            }
            
            // Handle sys call errors.
            // else if (errno != 0) {
            //     throw ConnectError(to_str("Unable to establish a connection [", wrapper::get_err(m_attr->ssl, status), "]."));
            // }

            // Handle want read / write.
            wrapper::handle_want_read_write(m_attr->ssl, status, pfd, m_attr->sock.fd().value(), m_attr->sock.fd().value(), timeout.value());
            // if (wrapper::handle_want_read_write(m_attr->ssl, status, pfd, m_attr->sock.m_fd.value(), m_attr->sock.m_fd.value(), timeout)) {
            //     break;
            // }
            
            // Timeout.
            if (timeout != -1 && Date::get_mseconds() >= end_time) {
                throw TimeoutError("Operation timed out.");
            }

        }
		
	}

    // Free the ssl objects.
    void    free() {
        if (m_attr->ssl) {
            SSL_free(m_attr->ssl);
            m_attr->ssl = nullptr;
        }
        if (m_attr->ctx) {
            SSL_CTX_free(m_attr->ctx);
            m_attr->ctx = nullptr;
        }
    }
    
	// Close the client.
    void    close() {
        free();
        m_attr->sock.close();
	}
	
	// Get the connection state.
	// int 	state() {
	// 	if (m_attr->ssl == nullptr) {
	// 		return vlib::sockets::state::closed;
	// 	} else {
	// 		return m_attr->sock.state(SSL_get_fd(m_attr->ssl));
	// 	}
	// }
	
    // Check the pipe is broken.
    Bool    is_broken() {
        return m_attr->sock.is_broken();
    }
    
	// Check if a connected client is connected.
	Bool 	is_connected() {
        // return m_attr->sock.is_connected();
        return m_attr->sock.is_connected() && wrapper::is_connected(m_attr->ssl);
		// return m_attr->sock.is_connected(SSL_get_fd(m_attr->ssl));
	}

	// Show the certificate subject & issuer.
	//  - Does not support negative indexes.
	//  - Does not check indexes.
	String 	cert_info() {
		return wrapper::cert_info(m_attr->ssl);
	}
    
    // Restart.
    void    restart() {
        close();
        m_attr->sock.restart();
        construct_ctx_ssl();
    }

	// Debug.
	static inline
	auto& 	debug(String& data) {
		wrapper::debug(data);
	}
	static inline
	void 	debug() {
		wrapper::debug();
	}
	static inline
	void 	debug(ulong e) {
		wrapper::debug(e);
	}

    // Get as string representation.
    constexpr
    String str() const {
        return m_attr->sock.str();
    }
    
	// ---------------------------------------------------------
	// Operators.

	// Dump to pipe.
	constexpr friend
	auto& 	operator <<(Pipe& pipe, const Client& obj) {
		return pipe << obj.m_attr->sock;
	}

};

// ---------------------------------------------------------
// End.

}; 		// End namespace tls.
}; 		// End namespace vlib.
#endif 	// End header.
