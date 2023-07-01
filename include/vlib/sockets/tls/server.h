// Author: Daan van den Bergh
// Copyright: © 2022 Daan van den Bergh.

// Header.
#ifndef VLIB_TLSTCP_SERVER_T_H
#define VLIB_TLSTCP_SERVER_T_H

// Namespace vlib.
namespace vlib {

// Namespace tls.
namespace tls {

// ---------------------------------------------------------
// Secure TCP Server Type.
//
// Notes:
// - The socket is always non-blocking.
// - The "client" parameters refer to the index of the client, not the clients SSL pointer.
//
template <
	int				family = 		sockets::family::ipv4,
	int 			type = 			sockets::type::stream,
	int 			protocol = 		sockets::protocol::undefined,
	uint 	buff_len = 		1024,
	bool 			blocking = 		false,
	uint	tls_version = 	tls::version::v1_3	// the minimum tls version.
> requires (
	family == sockets::family::ipv4 ||
	family == sockets::family::ipv6
)
struct Server {

// Public.
public:

	// ---------------------------------------------------------
	// Aliases.

	using		Socket = 	sockets::Socket<family, type, protocol, buff_len, blocking>;
	using		This = 		Server;
    using       Client =    SSL*;

	// ---------------------------------------------------------
	// Attributes.

	struct attr {
		Socket						sock;
		String						cert;
		String						key;
		String						pass;
		SSL_CTX* 					ctx = nullptr;
        // Array<SSL*, uint>    clients;    // the ssl objects.
        // Array<int, uint>    fds;        // underlying socket file descriptors.
	};
	SPtr<attr>	m_attr;

// Private.
private:

	// ---------------------------------------------------------
	// Wrapper functions.

	// Construct the server ctx.
	void    construct_ctx() {
		m_attr->ctx = SSL_CTX_new(TLS_server_method());   // create new context from server-method instance.
		if (m_attr->ctx == NULL) {
			m_attr->ctx = nullptr;
            throw SocketError("Unable to initialize the server context.");
		}
        wrapper::set_min_tls_version(m_attr->ctx, tls_version);
	}
    
    // Initialize the tcp socket.
    constexpr
    void    init_tcp(uint port) {
        m_attr->sock.construct(port);
    }
    constexpr
    void    init_tcp(String ip, uint port) {
        m_attr->sock.construct(move(ip), port);
    }

	// SSL accept wrapper.
	// - Returns the client's index on a successfull accept.
	Client 	ssl_accept(int fd, Int timeout = 5 * 1000) {

        // Set timeout time.
        ullong end_time;
        if (timeout == -1 || timeout > 5 * 1000) {
            end_time = Date::get_mseconds() + 5 * 1000;
        } else {
            end_time = Date::get_mseconds() + timeout.value();
        }
        
		// Initialize ssl.
		int status;
		Client ssl = SSL_new(m_attr->ctx);
		if (ssl == NULL) {
			::close(fd);
            throw AcceptError("Unable to initialize a new client context.");
		}
        if (SSL_set_fd(ssl, fd) != 1) {
            SSL_shutdown(ssl);
            SSL_free(ssl);
            ::close(fd);
            throw AcceptError("Unable to set the file descriptor of the new client context.");
        }
        
        // V3.
        while ((status = SSL_accept(ssl)) != 1) {
            
            // Timeout.
            if (Date::get_mseconds() >= end_time) {
                SSL_shutdown(ssl);
                SSL_free(ssl);
                ::close(fd);
                throw TimeoutError("Operation timed out.");
            }
            
            // Handle error.
            int error = SSL_get_error(ssl, status);
            switch (error) {
                case SSL_ERROR_WANT_READ:
                case SSL_ERROR_WANT_WRITE:
                    // SSL handshake would block, continue the loop
                    continue;
                default: {
                    
                    // Try again.
                    if (errno == EAGAIN) {
                        continue;
                    }
                    
                    // Throw error.
                    String err = wrapper::get_err(ssl, status);
                    SSL_shutdown(ssl);
                    SSL_free(ssl);
                    ::close(fd);
                    throw AcceptError(tostr("Accept error [", err, "] [", ::strerror(errno), "]."));
                    
                }
            }
            
        }
        return ssl;
        
        /* V2 Non blocking.
        
        // Set to blocking.
        ::fcntl(fd, F_SETFL, fcntl(fd, F_GETFL) & ~O_NONBLOCK);
        
        // Accept.
        if ((status = SSL_accept(ssl)) <= 0) {
            String err = wrapper::get_err(ssl, status);
            SSL_shutdown(ssl);
            SSL_free(ssl);
            ::close(fd);
            throw AcceptError(tostr("Accept error [", err, "] [", ::strerror(errno), "]."));
        }
        
        // Set to non blocking.
        ::fcntl(fd, F_SETFL, fcntl(fd, F_GETFL) | O_NONBLOCK);
        
        // Handler.
        return ssl;
         
        */
        
        /* V1
		// Loop.
		struct pollfd pfd;
		auto& rfd = SSL_get_rfd(ssl);
		auto& wfd = SSL_get_wfd(ssl);
        while (true) {

			// Accept ssl.
			if ((status = SSL_accept(ssl)) == 1) {
				return ssl;
            }
            
            // Fatal error.
            else if (status < 0) {
                if (errno == EAGAIN) {
                    continue;
                }
                String err = wrapper::get_err(ssl, status);
                SSL_shutdown(ssl);
                SSL_free(ssl);
                ::close(fd);
                throw AcceptError(tostr("Accept error [", err, "] [", ::strerror(errno), "]."));
            }

			// Handle want read / write.
            try {
                wrapper::handle_want_read_write(ssl, status, pfd, rfd, wfd, timeout.value());
            } catch (TimeoutError& e) {
                SSL_shutdown(ssl);
                SSL_free(ssl);
                ::close(fd);
                throw e;
            } catch (PollError& e) {
                SSL_shutdown(ssl);
                SSL_free(ssl);
                ::close(fd);
                throw e;
            } catch (Exception& e) {
                SSL_shutdown(ssl);
                SSL_free(ssl);
                ::close(fd);
                throw e;
            }
            
            // Timeout.
            if (timeout != -1 && Date::get_mseconds() >= end_time) {
                SSL_shutdown(ssl);
                SSL_free(ssl);
                ::close(fd);
                throw TimeoutError("Operation timed out.");
            }

        }
        // throw AcceptError("Unknown error.");
        return NULL;
         */
	}

// Public.
public:

	// ---------------------------------------------------------
	// Construct functions.

	// Constructor.
	constexpr
	void 	construct(
		String 			ip,
		uint 	        port,
		String 			cert,
		String 			key,
		String 			pass = nullptr
	) {
		m_attr->cert = move(cert);
		m_attr->key = move(key);
		m_attr->pass = move(pass);
        close();
        init_tcp(move(ip), port);
        construct_ctx();
        load_certs();
	}
    constexpr
    void     construct(
        uint             port,
        String           cert,
        String           key,
        String           pass = nullptr
    ) {
        m_attr->cert = move(cert);
        m_attr->key = move(key);
        m_attr->pass = move(pass);
        close();
        init_tcp(port);
        construct_ctx();
        load_certs();
    }

	// Copy.
	constexpr
	auto&	copy(const This& obj) {
		m_attr.copy(obj.m_attr);
		return *this;
	}

	// Swap.
	constexpr
	auto&	swap(This& obj) {
		m_attr.swap(obj.m_attr);
		return *this;
	}

	// ---------------------------------------------------------
	// Constructors.

	// Default constructor.
	constexpr
	Server () :
	m_attr(attr{})
	{
		wrapper::init_openssl();
	}

	// Constructor from ip and port.
	constexpr
	Server (
		const String& 			ip,
		const Int& 	            port,
		const String& 			cert,
		const String& 			key,
		const String& 			pass = nullptr
	) :
	m_attr(attr { .cert = cert, .key = key, .pass = pass })
	{
		wrapper::init_openssl();
        init_tcp(ip, port.value());
        construct_ctx();
        load_certs();
	}

	// Constructor from universal ip and defined port.
	constexpr
	Server (
		const Int& 	            port,
		const String& 			cert,
		const String& 			key,
		const String& 			pass = nullptr
	) :
	m_attr(attr { .cert = cert, .key = key, .pass = pass })
	{
		wrapper::init_openssl();
        init_tcp(port.value());
        construct_ctx();
        load_certs();
	}

	// Copy constructor.
	constexpr
	Server(const This& obj) :
	m_attr(obj.m_attr) {}

	// Move constructor.
	constexpr
	Server(This&& obj) :
	m_attr(move(obj.m_attr)) {}

	// Destructor.
	constexpr
	~Server() {
        if (m_attr.links() == 0) {
            close();
        }
	}

	// ---------------------------------------------------------
	// Assignment operators.

	// Copy assignment operator.
	constexpr
	auto&	operator =(const This& obj) { return copy(obj); }

	// Move assignment operator.
	constexpr
	auto&	operator =(This&& obj) { return swap(obj); }

	// ---------------------------------------------------------
	// Attribute functions.

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

	// Certificate.
	constexpr
	auto& 	cert() {
		return m_attr->cert;
	}

	// Key.
	constexpr
	auto& 	key() {
		return m_attr->key;
	}

	// Pass.
	constexpr
	auto& 	pass() {
		return m_attr->pass;
	}
    
	// CTX object.
	constexpr
	auto& 	ctx() {
		return m_attr->ctx;
	}

	// The tls version.
	constexpr
	auto& 	version() {
		return tls_version;
	}

	// ---------------------------------------------------------
	// Functions.

	// Bind.
	void 	bind() {
        m_attr->sock.bind();
	}

	// Listen.
	void    listen() {
        m_attr->sock.listen();
	}

	// Accept.
	// - Returns the client's index on a successfull accept.
	Client 	accept(const Int& timeout = -1) {
        Int fd = m_attr->sock.accept(timeout.value());
        m_attr->sock.set_sigpipe_action();
        return ssl_accept(fd.value(), timeout);
	}
	template <typename Addrin>
	Client 	accept(Addrin& addr, int timeout = -1) {
        Int fd = m_attr->sock.accept(addr, timeout);
        m_attr->sock.set_sigpipe_action();
        return ssl_accept(fd.value(), timeout);
	}

	// Get info about a connected client.
    static inline
	void 	info(String& ip, uint& port, const Client& client) {
        Socket::info(ip, port, SSL_get_fd(client));
	}
    static inline
    typename Socket::Connection info(const Client& client) {
        return Socket::info(SSL_get_fd(client));
    }
    
    // Get the connected client's ip.
    template <typename Type> static inline
    Type    get_ip(const Client& client) {
        return Socket::template get_ip<Type>(SSL_get_fd(client));
    }

	// Receive.
    static inline
	void 	recv(
		String& 		received,
		Client&	        client,
		const Int& 		timeout = -1
	) {
        Socket::set_sigpipe_action();
		wrapper::receive(received, client, timeout.value(), buff_len);
	}
    static inline
    String  recv(
        Client&            client,
        const Int&         timeout = -1
    ) {
        Socket::set_sigpipe_action();
        String received;
        wrapper::receive(received, client, timeout.value(), buff_len);
        return received;
    }
    static inline
    void 	recv(
		http::Request&	request,
		Client&	        client,
		const Int& 	    timeout = -1
	) {
        Socket::set_sigpipe_action();
		String received;
        wrapper::receive(received, client, timeout.value(), buff_len);
		request.reconstruct(move(received));
	}

	// Send.
    static inline
	ullong 	send(
		Client&         client,
		const String& 	data,
		const Int& 		timeout = -1
	) {
        Socket::set_sigpipe_action();
		return wrapper::send(client, data.data(), data.len(), timeout.value());
	}
    static inline
    ullong  send(
		Client& 	            client,
		const http::Response&	response,
		const Int& 				timeout = -1
	) {
		return send(client, response.data(), timeout);
	}
    static inline
    ullong  send(
		Client& 	    client,
		const char*     data,
		uint 			len,
		const Int&      timeout
	) {
        Socket::set_sigpipe_action();
		return wrapper::send(client, data, len, timeout.value());
	}
    
    // Send chunked http response.
    // The header "Transfer-Encoding: chunked" will automatically be added.
    // May cause undefined behaviour if the header already exists.
    SICE
    ullong  send_chunked(
        Client&                 client,
        const http::Response&   response,
        const Int&              timeout = -1
    ) {
        
        // Set sigaction.
        Socket::set_sigpipe_action();
        
        // Vars.
        String& data = response.data();
        ullong len = data.len(), sent = 0, full_sent = 0, end_header_pos, chunk_header_len;
        size_t chunk;
        const ullong chunk_size = 1024 * 32;
        char chunk_header[16];
        
        // Send headers.
        end_header_pos = data.find("\r\n\r\n");
        if (end_header_pos == NPos::npos) {
            throw InvalidUsageError("Could not find the end of the headers.");
        }
        end_header_pos += 4;
        String headers (data.data(), end_header_pos);
        ullong spos = headers.find("Content-Length:");
        if (spos != NPos::npos) {
            ullong epos = headers.find("\r\n", spos);
            if (epos != NPos::npos) {
                headers.replace_h(spos, epos, "Transfer-Encoding:chunked", 25);
            }
        }
        send(client, headers, timeout);
        full_sent += headers.len();
        sent = end_header_pos;
        
        // Send headers.
        while (sent < len) {
            
            chunk = len - sent < chunk_size ? len - sent : chunk_size;
            snprintf(chunk_header, 16, "%zx\r\n", chunk);
            chunk_header_len = vlib::len(chunk_header);
            send(client, chunk_header, chunk_header_len, timeout);
            full_sent += chunk_header_len;
            
            send(client, data.data() + sent, chunk, timeout);
            full_sent += chunk;
            
            send(client, "\r\n", 2, timeout);
            full_sent += 2;
            
            sent += chunk;
        }
        send(client, "0\r\n\r\n", 5, timeout);
        full_sent += 5;
        return full_sent;
        
    }
    
    // Restart.
    void    restart() {
        close();
        m_attr->sock.restart();
        construct_ctx();
        load_certs();
    }

	// Close the server.
	void 	close() {
		if (m_attr->ctx) {
			SSL_CTX_free(m_attr->ctx);
			m_attr->ctx = nullptr;
		}
        m_attr->sock.close();
	}

	// Close a client.
	//  - Does not support negative indexes.
	//  - Does not check indexes.
    static inline
	void 	close(Client& client) {
        wrapper::close(client);
	}

	// Get a client connection state.
	// int 	state(uint client) {
	// 	SSL*& ssl = m_attr->clients.get(client);
	// 	if (ssl == nullptr) {
	// 		return vlib::sockets::state::closed;
	// 	} else {
	// 		return m_attr->sock.state(SSL_get_fd(ssl));
	// 	}
	// }
	
	// Check if a connected client is connected.
    static inline
	bool 	is_connected(Client& client) {
		if (client == nullptr) {
			return false;
		} else {
			return wrapper::is_connected(client);
		}
	}
    
    // Check if the pipe is broken.
    constexpr
    Bool    is_broken() {
        return m_attr->m_sock.is_broken();
    }
    SICE
    Bool    is_broken(const Client& client, const Int& timeout = 10) {
        return Socket::is_broken(SSL_get_fd(client), timeout);
    }

	// Load the certificates.
	void    load_certs() {
        
		// Set the key password.
		if (m_attr->pass.is_defined()) {
			SSL_CTX_set_default_passwd_cb_userdata(m_attr->ctx, m_attr->pass.null_terminate().data());
		}

		// Set the local certificate.
		if (SSL_CTX_use_certificate_file(m_attr->ctx, m_attr->cert.null_terminate().data(), SSL_FILETYPE_PEM) <= 0) {
            throw SocketError(tostr("Unable to load certificate \"", m_attr->cert, "\" from socket \"", ip(), ":", port(), "\"."));
		}

		// Set the private key (may be the same as cert).
		if (SSL_CTX_use_PrivateKey_file(m_attr->ctx, m_attr->key.null_terminate().data(), SSL_FILETYPE_PEM) <= 0) {
            throw SocketError(tostr("Unable to load key \"", m_attr->key, "\" from socket \"", ip(), ":", port(), "\"."));
		}

		// Verify the private key.
		if (!SSL_CTX_check_private_key(m_attr->ctx)) {
            throw SocketError(tostr("Unable to verify key \"", m_attr->key, "\" from socket \"", ip(), ":", port(), "\"."));
		}

	}

	// Show the certificate subject & issuer.
	//  - Does not support negative indexes.
	//  - Does not check indexes.
	String 	cert_info(Client& client) {
		return wrapper::cert_info(client);
	}

    // Get as string representation.
    constexpr
    String str() const {
        return m_attr->sock.str();
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
    
	// ---------------------------------------------------------
	// Operators.

	// Dump to pipe.
	constexpr friend
	auto& 	operator <<(Pipe& pipe, const This& obj) {
		return pipe << obj.m_attr->sock;
	}
	
};

// ---------------------------------------------------------
// End.

}; 		// End namespace tls.
}; 		// End namespace vlib.
#endif 	// End header.
