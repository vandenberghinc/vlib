// Author: Daan van den Bergh
// Copyright: © 2022 Daan van den Bergh.

// Header.
#ifndef VLIB_SOCKET_SOCKET_H
#define VLIB_SOCKET_SOCKET_H

// Namespace vlib.
namespace vlib {

// Namespace sockets.
namespace sockets {

// ---------------------------------------------------------
// Socket.
//
// Notes:
// - Does not automatically close on destruction.
// - Host address construction only supports the following protocols: [http, https].
//

template <
	int				family = 		family::ipv4,
	int 			type = 			type::stream,
	int 			protocol = 		protocol::undefined,
	uint 	        buff_len = 		1024,
	bool 			blocking = 		false
> requires (
	family == family::ipv4 ||
	family == family::ipv6
)
struct Socket {

// Public.
public:

	// ---------------------------------------------------------
	// Aliases.

	using 	Length = 	ullong;		// data length.
	using 	Addr = 		struct sockaddr;		// generic socket address.
	using 	Addrin4 = 	struct sockaddr_in;		// ipv4 socket address in.
	using 	Addrin6 = 	struct sockaddr_in6;	// ipv6 socket address in.
    using   Client =    Int;

// Private.
private:
    
	// ---------------------------------------------------------
	// Attributes.

	Int					m_fd = -1;					// the main file descriptor.
	Addr*				m_addr;					// the generic socket address.
	uint 				m_addrlen;				// the length of the generic socket address.
	Addrin4				m_addrin4;
	Addrin6				m_addrin6;
	struct addrinfo*	m_addrinfo = NULL;
	bool				m_by_ip;
	String				m_ip;
    Int 				m_port = 0;
	String				m_host;

	// ---------------------------------------------------------
	// Static attributes.

	static inline uint	addrlen4 = sizeof(Addrin4);
	static inline uint	addrlen6 = sizeof(Addrin6);
    
    // ---------------------------------------------------------
    // Private functions.
    
    // Broken pipe handler.
    SICE
    void    sigpipe_handler(int) {
        // vlib::StackTrace trace;
        // trace.init();
        // print(trace.trace());
        throw BrokenPipeError("Pipe is broken.");
    }

// Public.
public:
    
    // ---------------------------------------------------------
    // Structs.
    
    // Connection info.
    struct Connection {
        Int     fd;
        String  ip;
        Int     port;
        
        // Convert the string ip to a numeric ip.
        constexpr
        LLong   numeric_ip() {
            return numeric_ip(ip);
        }
        static constexpr
        LLong   numeric_ip(const String& ip) {
            LLong x = 0;
            for (auto& c: ip) {
                switch (c) {
                    case '.':
                        continue;
                    default:
                        x *= 10;
                        x += todigit(c);
                        continue;
                }
            }
            return x;
        }
        
    };
    
    // ---------------------------------------------------------
    // Utility functions.
    
    static
    void    set_sigpipe_action() {
        struct sigaction sa;
        sa.sa_handler = sigpipe_handler;
        sigemptyset(&sa.sa_mask);
        sa.sa_flags = 0;
        sigaction(SIGPIPE, &sa, nullptr);
    }

	// ---------------------------------------------------------
	// Constructors.
	
    // Default constructor.
    constexpr
    Socket()
    {
    }
    
	// Constructor from ip and port.
	constexpr
	Socket(const String& ip, const Int& port) {
		assign(ip, port);
		construct_by_ip();
	}
	
	// Constructor from port.
	constexpr
	Socket(const Int& port) {
		assign(port);
		construct_by_ip();
	}
	
	// Constructor host.
	constexpr
	Socket(const String& host) {
		assign_host(host);
		construct_by_host();
	}
    
    // Constructor with host or ip.
    constexpr
    Socket(const String& host, const String& ip, const Int& port) {
        if (host.is_defined()) {
            assign_host(host, port);
            construct_by_host();
        } else {
            assign(ip, port);
            construct_by_ip();
        }
    }

	// Destructor.
	constexpr
	~Socket () {
		if (m_addrinfo != NULL) {
			freeaddrinfo(m_addrinfo);
		}
        close();
	}
    
    // ---------------------------------------------------------
    // Construct functions.

    // Constructor from ip and port.
    constexpr
    auto&   construct(const String& ip, const Int& port) {
        assign(ip, port);
        construct_by_ip();
        return *this;
    }
    
    // Constructor from port.
    constexpr
    auto&   construct(const Int& port) {
        assign(port);
        construct_by_ip();
        return *this;
    }
    
    // Constructor host.
    constexpr
    auto&   construct(const String& host) {
        assign_host(host);
        construct_by_host();
        return *this;
    }
    constexpr
    auto&   construct_host(const String& host, const Int& port = 0) {
        assign_host(host, port);
        construct_by_host();
        return *this;
    }
    
	// ---------------------------------------------------------
	// Attribute functions.

	// Get the file descriptor.
	constexpr
	auto& 	fd() { return m_fd; }

	// Get generic socket address.
	constexpr
	auto& 	addr() { return m_addr; }

	// Get the socket address length.
	constexpr
	auto& 	addrlen() { return m_addrlen; }

	// Get the ip.
	constexpr
	auto& 	ip() { return m_ip; }

	// Get the port.
	constexpr
	auto& 	port() { return m_port; }

	// Get the host.
	constexpr
	auto& 	host() { return m_host; }

	// Create a new socket address.
	//
	// IPv4.
    SICE
	auto 	new_addr() requires (family == family::ipv4) {
		Addrin4 naddr;
		return naddr;
	}
	//
	// IPv6.
	SICE
	auto 	new_addr() requires (family == family::ipv6) {
		Addrin6 naddr;
		return naddr;
	}

	// ---------------------------------------------------------
	// Static functions.
    
	// Get ip from address.
	//
	// IPv4.
    /*
	template <typename Type> SICE
	Type	get_ip(const Addrin4& addr) requires (is_String<Type>::value) {
		return inet_ntoa(addr.sin_addr);
	}
	template <typename Type> SICE
	Type	get_ip(const Addrin4& addr) requires (is_any_integer<Type>::value || is_any_integer_Numeric<Type>::value) {
		return (Type) addr.sin_addr.s_addr;
	}
    template <typename Type> SICE
    Type    get_ip(const Int& fd) requires (family == family::ipv4 && is_String<Type>::value) {
        Addrin4 addr;
        if (::getpeername(fd.value(), (Addr*) &addr, &addrlen4) < 0) {
            throw SocketError("vlib::tls::Server", "Unable to get the peer address.");
        }
        return inet_ntoa(addr.sin_addr);
    }
    template <typename Type> SICE
    Type    get_ip(const Int& fd) requires (family == family::ipv4 && (is_any_integer<Type>::value || is_any_integer_Numeric<Type>::value)) {
        Addrin4 addr;
        if (::getpeername(fd.value(), (Addr*) &addr, &addrlen4) < 0) {
            throw SocketError("vlib::tls::Server", "Unable to get the peer address.");
        }
        return (Type) addr.sin_addr.s_addr;
    }	
	//
	// IPv6.
	template <typename Type> SICE
	Type	get_ip(const Addrin6& addr) requires (is_String<Type>::value) {
		return (const char*) addr.sin6_addr.s6_addr;
	}
	template <typename Type> SICE
    Type	get_ip(const Addrin6& addr) requires (is_any_integer<Type>::value || is_any_integer_Numeric<Type>::value) {
		return (Type) addr.sin6_addr.s6_addr;
	}
    template <typename Type> SICE
    Type    get_ip(const Int& fd) requires (family == family::ipv6 && is_String<Type>::value) {
        Addrin6 addr;
        if (::getpeername(fd.value(), (Addr*) &addr, &addrlen6) < 0) {
            throw SocketError("vlib::tls::Server", "Unable to get the peer address.");
        }
        return (const char*) addr.sin6_addr.s6_addr;
    }
    template <typename Type> SICE
    Type    get_ip(const Int& fd) requires (family == family::ipv6 && (is_any_integer<Type>::value || is_any_integer_Numeric<Type>::value)) {
        Addrin6 addr;
        if (::getpeername(fd.value(), (Addr*) &addr, &addrlen6) < 0) {
            throw SocketError("vlib::tls::Server", "Unable to get the peer address.");
        }
        return (Type) addr.sin6_addr.s6_addr;
    }
    */
	
	// Get port from address.
	//
	// IPv4.
	SICE
    Int    get_port(const Addrin4& addr) {
		return ntohs(addr.sin_port);
	}
	//
	// IPv6.
	SICE
    Int    get_port(const Addrin6& addr) {
		return ntohs(addr.sin6_port);
	}
    
    // Check if a string is an ip.
    SICE
    Bool    is_ip(const String& x) {
        
        // ipv6
        if (x.find('.') != NPos::npos) {
            return true;
        }
        
        // Host.
        if (x.find_first_not_of(".0123456789") != NPos::npos) {
            return false;
        }
        
        // ipv4.
        return true;
    }
    
    // Check if a string is a hostname.
    SICE
    Bool    is_host(const String& x) {
        
        // ipv6
        if (x.find('.') == NPos::npos) {
            return false;
        }
        
        // Host.
        if (x.find_first_not_of(".0123456789") != NPos::npos) {
            return true;
        }
        
        // ipv4.
        return false;
    }
    
    // Check if an ip string is an ipv4 address.
    // Causes undefined behaviour when the string is not an ip but a hostname.
    SICE
    Bool    is_ipv4(const String& x) {
        return x.find('.') != NPos::npos;
    }
    
    // Check if an ip string is an ipv6 address.
    // Causes undefined behaviour when the string is not an ip but a hostname.
    SICE
    Bool    is_ipv6(const String& x) {
        return x.find('.') == NPos::npos;
    }
	
	// ---------------------------------------------------------
	// Functions.
    
    // Assign an ip & port.
    constexpr
    void	assign(const String& ip, const Int& port) {
        if (ip.eq("*", 1)) {
            m_ip.destruct();
        } else {
            m_ip = ip;
        }
        m_port = port;
        m_host.destruct();
        if (m_addrinfo != NULL) {
            freeaddrinfo(m_addrinfo);
            m_addrinfo = NULL;
        }
    }
    constexpr
	void	assign(String&& ip, const Int& port) {
        if (ip.eq("*", 1)) {
            m_ip.destruct();
        } else {
            m_ip = ip;
        }
        m_port = port;
        m_host.destruct();
        if (m_addrinfo != NULL) {
            freeaddrinfo(m_addrinfo);
            m_addrinfo = NULL;
        }
    }

    // Assign a universal ip and defined port.
    constexpr
	void	assign(const Int& port) {
        m_ip.destruct();
        m_port = port;
        m_host.destruct();
        if (m_addrinfo != NULL) {
            freeaddrinfo(m_addrinfo);
            m_addrinfo = NULL;
        }
    }

    // Assign a host address (url).
    constexpr
	void	assign_host(const String& host, const Int& port = 0) {
        m_ip.destruct();
        m_port = port;
        m_host = host;
        if (m_addrinfo != NULL) {
            freeaddrinfo(m_addrinfo);
            m_addrinfo = NULL;
        }
    }
    constexpr
	void	assign_host(String&& host, const Int& port = 0) {
        m_ip.destruct();
        m_port = port;
        m_host = host;
        if (m_addrinfo != NULL) {
            freeaddrinfo(m_addrinfo);
            m_addrinfo = NULL;
        }
    }
    
    // Set socket options.
    constexpr
	void	set_opt() {
        
        // Set options.
        int opt = 1;
        if (setsockopt(m_fd.value(), SOL_SOCKET, SO_REUSEADDR, &opt, sizeof(opt)) < 0) {
            ::close(m_fd.value());
			throw SetOptionError(tostr("Failed to set option SO_REUSEADDR [", ::strerror(errno), "]."));
        }
        if (setsockopt(m_fd.value(), SOL_SOCKET, SO_REUSEPORT, &opt, sizeof(opt)) < 0) {
            ::close(m_fd.value());
			throw SetOptionError(tostr("Failed to set option SO_REUSEPORT [", ::strerror(errno), "]."));
        }
        // int internal_buff = 200000;
        // if (setsockopt(m_fd, SOL_SOCKET, SO_SNDBUF, &internal_buff, sizeof(int))) {
        //     ::close(m_fd);
        //     return vlib::sockets::error::set_opt;
        // }
        // if (setsockopt(m_fd, SOL_SOCKET, SO_RCVBUF, &internal_buff, sizeof(int))) {
        //     ::close(m_fd);
        //     return vlib::sockets::error::set_opt;
        // }
        // if (setsockopt(m_fd, IPPROTO_TCP, TCP_NODELAY, &opt, sizeof(opt)) < 0) { //TCP_NODELAY
        //     ::close(m_fd);
        //     return vlib::sockets::error::set_opt;
        // }
        
    }
    constexpr
    void    set_send_buff(const Int& buff) {
        set_send_buff(m_fd, buff);
    }
    SICE
    void    set_send_buff(const Int& fd, const Int& buff) {
        if (setsockopt(fd.value(), SOL_SOCKET, SO_SNDBUF, &(buff.value()), sizeof(int)) < 0) {
            ::close(fd.value());
            throw SetOptionError(tostr("Failed to set the send buffer [", ::strerror(errno), "]."));
        }
    }
    constexpr
    void    set_recv_buff(const Int& buff) {
        set_recv_buff(m_fd, buff);
    }
    SICE
    void    set_recv_buff(const Int& fd, const Int& buff) {
        if (setsockopt(fd.value(), SOL_SOCKET, SO_RCVBUF, &(buff.value()), sizeof(int)) < 0) {
            ::close(fd.value());
            throw SetOptionError(tostr("Failed to set the receive buffer [", ::strerror(errno), "]."));
        }
    }
    constexpr
    void    set_nagle(const Bool& enabled) {
        set_nagle(m_fd, enabled);
    }
    SICE
    void    set_nagle(const Int& fd, const Bool& enabled) {
        int val = enabled ? 0 : 1;
        if ((setsockopt(fd.value(), IPPROTO_TCP, TCP_NODELAY, &val, sizeof(val)) < 0)) {
            ::close(fd.value());
            throw SetOptionError(tostr("Failed to set the nagle algorithm option [", ::strerror(errno), "]."));
        }
    }

    // Construct by ip helper.
    constexpr
    void	construct_by_ip() requires (family == family::ipv4) {

        // Initialize socket.
        m_fd = ::socket(family, type, protocol);
        if (m_fd < 0) {
			throw CreateError(tostr("Failed to create the socket [", ::strerror(errno), "]."));
        }

        // Set options.
		set_opt();

        // Initialize address.
        m_addrin4 = {};
        m_addrin4.sin_family = family;
        m_addrin4.sin_port = htons(m_port.value());
        if (m_ip.is_undefined()) {
            m_addrin4.sin_addr.s_addr = INADDR_ANY;
        }
        else if (inet_pton(family, m_ip.c_str(), &m_addrin4.sin_addr) <= 0) {
            ::close(m_fd.value());
			throw SocketError(tostr("Failed to convert ip \"", m_ip, "\" [", ::strerror(errno), "]."));
        }

        // Assign.
        m_addr = (Addr*) &m_addrin4;
        m_addrlen = addrlen4;
        m_by_ip = true;

        // Non blocking.
        set_blocking();
        
    }
    constexpr
    void	construct_by_ip() requires (family == family::ipv6) {

        // Initialize socket.
        m_fd = ::socket(family, type, protocol);
        if (m_fd < 0) {
			throw CreateError(tostr("Failed to create the socket [", ::strerror(errno), "]."));
        }

        // Set options.
		set_opt();

        // Initialize address.
        m_addrin6 = {};
        m_addrin6.sin6_family = family;
        m_addrin6.sin6_port = htons(m_port.value());
        if (m_ip.is_undefined()) {
            m_addrin6.sin6_addr = in6addr_any;
        }
        else if (inet_pton(family, m_ip.c_str(), &m_addrin6.sin6_addr) <= 0) {
            ::close(m_fd.value());
			throw SocketError(tostr("Failed to convert ip \"", m_ip, "\" [", ::strerror(errno), "]."));
        }

        // Assign.
        m_addr = (Addr*) &m_addrin6;
        m_addrlen = addrlen6;
        m_by_ip = true;

        // Non blocking.
        set_blocking();
		
    }

    // Construct by host helper.
    constexpr
    void	construct_by_host() {

        // Initialize socket.
        m_fd = ::socket(family, type, protocol);
        if (m_fd < 0) {
			throw CreateError(tostr("Failed to create the socket [", ::strerror(errno), "]."));
        }

        // Set options.
		set_opt();

        // Get port.
        String port;
        if (m_port == 0) {
            port = "80";
            if (
                m_host.len() >= 6 &&
                m_host.get(0) == 'h' &&
                m_host.get(1) == 't' &&
                m_host.get(2) == 't' &&
                m_host.get(3) == 'p' &&
                m_host.get(4) == 's' &&
                m_host.get(5) == ':'
            ) {
                port = "443";
            }
        } else {
            port = m_port.str();
        }

        // Get hostname.
        Length start_index = 0;
        Length end_index = m_host.len();
        bool post = false;
        for (auto& i: m_host.indexes()) {
            switch (m_host.get(i)) {
                case '/': {
                    if (post) { end_index = i; break; }
                    else if (i > 0 && m_host.get(i-1) == '/') {
                        start_index = i + 1;
                        post = true;
                        continue;
                    }
                    else { continue; }
                    break;
                }
                case '.': { post = true; continue; }
                default: continue;
            }
            break;
        }
        char* hostname = m_host.data() + start_index;
        hostname[end_index - start_index] = '\0';

        // Get address info.
        struct addrinfo hints = {};
        hints.ai_family = family;
        hints.ai_socktype = type;
        hints.ai_flags = AI_PASSIVE;
        hints.ai_protocol = protocol;
        hints.ai_canonname = NULL;
        hints.ai_addr = NULL;
        hints.ai_next = NULL;
        if (::getaddrinfo(hostname, port.c_str(), &hints, &m_addrinfo) != 0) {
            ::close(m_fd.value());
			throw LookupError(tostr("Failed to get address \"", m_host, "\" [", ::strerror(errno), "]."));
        }
        m_by_ip = false;

        // Non blocking.
        set_blocking();

    }
    
    // Restart the socket.
    void	restart() {
        
        // Close.
        close();
        
        // Initialize socket.
        m_fd = ::socket(family, type, protocol);
        if (m_fd < 0) {
			throw CreateError(tostr("Failed to create the socket [", ::strerror(errno), "]."));
        }

        // Set options.
		set_opt();

        // Non blocking.
        set_blocking();
		
    }
    
    // Set to non blocking.
    void    set_blocking() {
        set_blocking(m_fd, blocking);
    }
    static
    void    set_blocking(const Int& fd, const Bool& to = blocking) {
        int flags = ::fcntl(fd.value(), F_GETFL);
        if (flags == -1) {
            throw SetOptionError(tostr("Failed to get the socket flags [", ::strerror(errno), "]."));
        }
        flags = to ? (flags & ~O_NONBLOCK) : (flags | O_NONBLOCK);
        if (::fcntl(fd.value(), F_SETFL, flags) == -1) {
            ::close(fd.value());
            throw SetOptionError(tostr("Failed to set the socket to non-blocking [", ::strerror(errno), "]."));
        }
    }

	// Poll a file descriptor.
	SICE
	void	poll(
		const Int&		fd,
		const Short&	events,
		const Short&	revents,
		const Int&		timeout = -1
	) {
        
        // Poll.
        // set_sigpipe_action();
        struct pollfd pfd {fd.value(), events.value(), 0};
        while (true) {
            switch (::poll(&pfd, 1, timeout.value())) {
                case 0:
                     throw TimeoutError("Operation timed out.");
                case -1:
                    if (errno == EINTR) {
                        continue;
                    }
                    throw PollError(tostr("Poll error [", ::strerror(errno), "]."));
                default:
                    if (pfd.revents & revents.value()) {
                        return ;
                    }
                    else if (pfd.revents & POLLNVAL) {
                        throw SocketClosedError(tostr("Socket is closed."));
                    }
                    else if (pfd.revents & POLLERR) {
                        throw SocketClosedError(tostr("Socket is closed."));
                    }
                    else if (pfd.revents & POLLHUP) {
                        throw SocketClosedError(tostr("Socket is closed."));
                    }
                    else if (pfd.revents & POLLPRI) {
                        throw SocketClosedError(tostr("Socket is closed."));
                    }
                    else {
                        throw PollError(tostr("Uncatched poll event."));
                    }
            }
        }
	}
    
    // Poll receive.
    // - Use -1 to receive with no timeout.
    // - Use 0 to receive and stop instantly if there is nothing to read.
    SICE
    void	poll_recv(
        const Int&         fd,
        const Int&         timeout = -1
    ) {
        poll(fd, POLLIN, POLLIN, timeout);
    }
    
    // Poll send.
    // - Use -1 to receive with no timeout.
    // - Use 0 to receive and stop instantly if there is nothing to read.
    SICE
    void	poll_send(
        const Int&         fd,
        const Int&         timeout = -1
    ) {
        poll(fd, POLLOUT, POLLOUT, timeout);
    }

	// Connect to the socket.
	constexpr
	void 	connect(const Int& timeout = 10 * 1000) {
        
        // Set sigaction.
        set_sigpipe_action();
        
        /* V2 blocking.
        set_blocking(m_fd, true);
        if (m_by_ip) {
            errno = 0;
            if (::connect(m_fd.value(), m_addr, m_addrlen) >= 0) {
                set_blocking(m_fd, blocking);
                return ;
            } else {
                print(tostr("Unable to connect with \"", str(), "\" [", ::strerror(errno), "]."));
                throw ConnectError(tostr("Unable to connect with \"", str(), "\" [", ::strerror(errno), "]."));
            }
        } else {
            struct addrinfo *rp, *result = m_addrinfo;
            for (rp = result; rp != NULL; rp = rp->ai_next) {
                char address[INET_ADDRSTRLEN];
                inet_ntop(AF_INET, rp->ai_addr, address, sizeof(address));
                if (::connect(m_fd.value(), rp->ai_addr, rp->ai_addrlen) == 0) {
                    m_addr = rp->ai_addr;
                    m_addrlen = rp->ai_addrlen;
                    set_blocking(m_fd, blocking);
                    return ;
                }
            }
            throw ConnectError(tostr("Unable to connect with \"", str(), "\" [", ::strerror(errno), "]."));
        }
         */
        
        /* V1 non blocking. */
        if (m_by_ip) {
            errno = 0;
            if (::connect(m_fd.value(), m_addr, m_addrlen) >= 0) {
				return ;
            }
            else if (errno == EINPROGRESS) {
				poll(m_fd, POLLOUT, POLLOUT, timeout);
            } else {
				throw ConnectError(tostr("Unable to connect with \"", str(), "\" [", ::strerror(errno), "]."));
            }
		} else {
			struct addrinfo *rp, *result = m_addrinfo;
			for (rp = result; rp != NULL; rp = rp->ai_next) {
				char address[INET_ADDRSTRLEN];
				inet_ntop(AF_INET, rp->ai_addr, address, sizeof(address));
				if (::connect(m_fd.value(), rp->ai_addr, rp->ai_addrlen) == 0) {
					m_addr = rp->ai_addr;
					m_addrlen = rp->ai_addrlen;
					return ;
				} else if (errno == EINPROGRESS) {
					try {
                        errno = 0;
						poll(m_fd, POLLOUT, POLLOUT, timeout);
						m_addr = rp->ai_addr;
						m_addrlen = rp->ai_addrlen;
						return ;
					} catch (...) {}
				}
			}
			throw ConnectError(tostr("Unable to connect with \"", str(), "\" [", ::strerror(errno), "]."));
		}
	}

	// Check if connected.
	constexpr
    Bool    is_connected() {
		return is_connected(m_fd);
	}
	SICE
    Bool    is_connected(const Int& fd) {
        // Set sigaction.
        set_sigpipe_action();
        
        // Check.
		if (blocking) {
			throw InvalidUsageError(tostr("Function \"", __FUNCTION__, "\" is only supported for non-blocking sockets."));
		}
        char buf;
        return ::recv(fd.value(), &buf, 1, MSG_PEEK) != 0 || ::send(fd.value(), &buf, 1, MSG_PEEK) != 0;
        // errno = 0;
        // char buf;
        // if (
        //     ::recv(fd, &buf, 1, MSG_PEEK) == 0 ||
  //           ::send(fd, &buf, 1, MSG_PEEK) == 0 ||
        //     (errno != 0 && errno != EISCONN)
        // ) {
        //     return false;
        // }
        // return true;
        
	}
    
    // Check if the pipe is broken.
    constexpr
    Bool    is_broken() {
        return is_broken(m_fd);
    }
    SICE
    Bool    is_broken(const Int& fd, const Int& timeout = 10) {
		try {
			poll(fd, POLLERR | POLLHUP, POLLERR | POLLHUP, timeout);
			return true;
		} catch (...) {
			return false;
		}
    }
	
	
	// Bind to the address.
	constexpr
	void	bind() {
        set_sigpipe_action();
		if (::bind(m_fd.value(), m_addr, m_addrlen) < 0) {
			throw BindError(tostr("Unable to bind to \"", str(), "\" [", ::strerror(errno), "]."));
		}
	}

	// Listen to incoming connections.
	constexpr
	void	listen() {
        set_sigpipe_action();
		if (::listen(m_fd.value(), 3) < 0) {
			throw ListenError(tostr("Unable to listen to \"", str(), "\" [", ::strerror(errno), "]."));
		}
	}

	// Accept a client.
	//
	// IPv4.
	constexpr
    Int     accept(const Int& timeout = -1) requires (family == family::ipv4) {
		Addrin4 addr;
        return accept(addr, timeout);
	}
	constexpr
    Int	    accept(
		Addrin4& 		addr,
		const Int& 		timeout = -1	// the timeout.
	) requires (family == family::ipv4) {
        set_sigpipe_action();
		int status;
		poll(m_fd, POLLIN, POLLIN, timeout);
		addr = {};
		if ((status = ::accept(m_fd.value(), (Addr*) &addr, &addrlen4)) < 0) {
			throw AcceptError(tostr("Unable to accept the peer [", ::strerror(errno), "]."));
		}
        set_blocking(status, blocking);
        return status;
	}
	//
	// IPv6.
	constexpr
    Int	    accept(const Int& timeout = -1) requires (family == family::ipv6) {
		Addrin6 addr;
		return accept(addr, timeout);
	}
	constexpr
    Int accept(
		Addrin6& 		addr,
		const Int& 		timeout = -1	// the timeout.
	) requires (family == family::ipv6) {
        set_sigpipe_action();
		int status;
		poll(m_fd, POLLIN, POLLIN, timeout);
		addr = {};
		if ((status = ::accept(m_fd.value(), (Addr*) &addr, &addrlen6)) > 0) {
			throw AcceptError(tostr("Unable to accept the peer [", ::strerror(errno), "]."));
		}
        set_blocking(status, blocking);
        return status;
	}

	// Get info of an accepted client.
	//
	// IPv4.
	SICE
	void	info(String& ip, Int& port, Addrin4& addr) requires (family == family::ipv4) {
		ip = inet_ntoa(addr.sin_addr);
		port = ntohs(addr.sin_port);
	}
	SICE
	void	info(String& ip, Int& port, const Int& fd) requires (family == family::ipv4) {
		Addrin4 addr;
		if (::getpeername(fd.value(), (Addr*) &addr, &addrlen4) < 0) {
			throw LookupError(tostr("Unable to get the peer info [", ::strerror(errno), "]."));
		}
		ip = inet_ntoa(addr.sin_addr);
		port = ntohs(addr.sin_port);
	}
	//
	// IPv6.
	SICE
	void	info(String& ip, Int& port, Addrin6& addr) requires (family == family::ipv6) {
		ip = (const char*) addr.sin6_addr.s6_addr;
		port = ntohs(addr.sin6_port);
	}
	SICE
	void	info(String& ip, Int& port, const Int& fd) requires (family == family::ipv6) {
		Addrin6 addr;
		if (::getpeername(fd.value(), (Addr*) &addr, &addrlen6) < 0) {
			throw LookupError(tostr("Unable to get the peer info [", ::strerror(errno), "]."));
		}
		ip = (const char*) addr.sin6_addr.s6_addr;
		port = ntohs(addr.sin6_port);
	}
    
    // Info with return type.
    static inline
    Connection     info(const Int& fd) {
        Connection i { .fd = fd };
        info(i.ip, i.port, fd);
        return i;
    }

	// Close a file descriptor.
	constexpr
	void	close() {
        ::close(m_fd.value()); // no error check to support restart when unitialized.
	}
    SICE
	void	close(const Int& fd) {
        ::close(fd.value()); // no error check to support restart when unitialized.
	}

	// Call shutdown on a file descriptor.
	constexpr
	void	shutdown() {
		if (::shutdown(m_fd.value(), SHUT_RDWR) < 0) {
			throw CloseError(tostr("Unable to shut the socket down [", ::strerror(errno), "]."));
		}
	}
	SICE
	void	shutdown(const Int& fd) {
		if (::shutdown(fd.value(), SHUT_RDWR) < 0) {
			throw CloseError(tostr("Unable to shut the socket down [", ::strerror(errno), "]."));
		}
	}

	// Receive data from the socket.
	// - Use -1 to receive with no timeout.
	// - Use 0 to receive and stop instantly if there is nothing to read.
    template <int l_buff_len = buff_len, typename... Air> SICE
	ullong  recv(
		String& 		received,
		const Int& 		fd,
		const Int& 		timeout = -1,
		const Int& 		flags = 0
	) {
        
        // Set sigaction.
        set_sigpipe_action();
        
        // Poll.
		poll(fd, POLLIN, POLLIN, timeout);
        long bytes = 0;
        ullong total_bytes = 0;
        
        // Read.
        do {
            total_bytes += bytes;
            received.len() += bytes;
            received.resize(received.len() + l_buff_len);
        } while ((bytes = ::recv(fd.value(), received.data() + received.len(), l_buff_len, flags.value())) > 0);
        
        // Null terminate.
        if (received.len() > 0) { received.null_terminate(); }
        
        // No data has been read, but poll returned an POLLIN event.
        // This may be because an EOF also triggers the POLLIN event.
        else {
            throw SocketClosedError(tostr("Socket is closed."));
        }
        return total_bytes;
	}
    template <int l_buff_len = buff_len, typename... Air> SICE
    String  recv(
        const Int&         fd,
        const Int&         timeout = -1,
        const Int&         flags = 0
    ) {
        String received;
        recv<l_buff_len>(received, fd, timeout, flags);
        return received;
    }
    
    // Receive http request.
    // template <int l_buff_len = buff_len, typename... Air> SICE
    // void    recv(
    //     http::Request&     received,
    //     const Int&         fd,
    //     const Int&         timeout = -1,
    //     const Int&         flags = 0
    // ) {
    //     String data;
    //     recv<l_buff_len>(data, fd, timeout, flags);
    //     received.reconstruct(move(data));
    // }
    
    // Receive a full HTTP request over tcp.
    SICE
    void recv(
        http::Request& request,
        String& buffer,
        const Int& fd,
        const Int& timeout
    ) {
        
        // Set sigaction.
        set_sigpipe_action();
        
        // Vars.
        String received, header;
        ullong index = 0, bytes = 0, headers_len = 0, content_len = 0;
        ullong prev_crlf = 0; // index after the previous crlf.
        short mode = 0;
        
        // Loop.
        while (true) {
            
            // End of headers with no body.
            if (received.len() > 0 && headers_len != 0 && content_len == 0) {
                if (received.len() == headers_len + content_len) {
                    break;
                } else if (received.len() >= headers_len + content_len) {
                    buffer.concat_r(received.data() + headers_len + content_len, received.len() - (headers_len + content_len));
                    received.len() = headers_len + content_len;
                }
            }
            
            // Buffer.
            if (buffer.len() > 0) {
                received.concats_r(buffer);
                buffer.reset();
                bytes = received.len();
            }
            
            // Receive.
            else {
                bytes = recv(received, fd, timeout);
            }
            
            // Body mode.
            if (mode == 1) {
                if (content_len == 0 || received.len() == headers_len + content_len) {
                    break;
                } else if (content_len != 0 && received.len() >= headers_len + content_len) {
                    buffer.concat_r(received.data() + headers_len + content_len, received.len() - (headers_len + content_len));
                    received.len() = headers_len + content_len;
                }
                continue;
            }
            
            // Iterate headers.
            else {
                index = received.len() - bytes;
                for (auto& c: received.iterate(index, bytes)) {
                    
                    // Remove spaces at start of headers.
                    if (index == prev_crlf && mode == 0 && c == ' ') {
                        ++prev_crlf;
                    }
                    
                    // Headers.
                    switch (c) {
                            
                        // End of header.
                        case '\n':
                            
                            // Parse header.
                            if (index > 0 && received[index - 1] == '\r') {
                                header.data() = received.data() + prev_crlf;
                                header.len() = index - 1 - prev_crlf;
                                
                                // End of all headers.
                                if (header.len() == 0) {
                                    headers_len = index + 1;
                                    mode = 1;
                                }
                                
                                // Parse content length header.
                                else if (header.eq_first("Content-Length:", 15)) {
                                    header.data() = received.data() + prev_crlf + 15;
                                    header.len() = index - 1 - prev_crlf + 15;
                                    while (header.len() > 0) {
                                        if (header.first() == ' ') {
                                            ++header.data();
                                            --header.len();
                                        } else if (header.last() == ' ') {
                                            --header.len();
                                        }
                                    }
                                    content_len = tonumeric<ullong>(header.data(), header.len());
                                }
                                header.data() = nullptr;
                            }
                            
                            // Set previous crlf.
                            prev_crlf = index + 1;
                            
                            break;
                        default: break;
                    }
                    
                    // Increment index.
                    ++index;
                    
                }
            }
            
        }
        
        // Parse.
        request.reconstruct(received);
        
    }


	// Send data through the socket.
    SICE
	ullong	send(
		const Int& 		fd,
		const String& 	data,
		const Int& 		timeout = -1,
		const Int& 		flags = 0
	) {
        return send(fd, data.data(), data.len(), timeout, flags);
	}
    SICE
    ullong  send(
        const Int&         fd,
        const char*        data,
        const Length&      len,
        const Int&         timeout,
        const Int&         flags = 0
    ) {
        set_sigpipe_action();
        ullong full_sent = 0;
        llong status = 0, attempts = 0;
        while (full_sent < len) {
			poll(fd, POLLOUT, POLLOUT, timeout);
            switch (status = ::send(fd.value(), data + full_sent, len - full_sent, flags.value())) {
                case -1:
                    switch (errno) {
                        case EAGAIN:
                            continue;
                        default:
                            break;
                    }
					throw CloseError(tostr("Unable to send to the socket [", ::strerror(errno), "]."));
                case 0:
                    if (attempts == 10) {
						throw CloseError(tostr("Unable to send to the socket [", ::strerror(errno), "]."));
                    }
                    ++attempts;
                    break;
                default:
                    full_sent += status;
                    break;
                    
            }
        }
        return full_sent;
    }
    
    // Send http response.
    SICE
    ullong  send(
        const Int&              fd,
        const http::Response&   data,
        const Int&              timeout = -1,
        const Int&              flags = 0
    ) {
        String& x = data.data();
        return send(fd, x.data(), x.len(), timeout, flags);
    }
    constexpr
    ullong  send(
        const http::Response&   data,
        const Int&              timeout = -1,
        const Int&              flags = 0
    ) {
        String& x = data.data();
        return send(m_fd, x.data(), x.len(), timeout, flags);
    }
    
    // Send chunked http response.
    // The header "Transfer-Encoding: chunked" will automatically be added.
    // May cause undefined behaviour if the header already exists.
    SICE
    ullong  send_chunked(
        const Int&              fd,
        const http::Response&   response,
        const Int&              timeout = -1,
        const Int&              flags = 0
    ) {
        
        // Set sigaction.
        set_sigpipe_action();
        
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
        send(fd, headers, timeout, flags);
        full_sent += headers.len();
        sent = end_header_pos;
        
        // Send headers.
        while (sent < len) {
            
            chunk = len - sent < chunk_size ? len - sent : chunk_size;
            snprintf(chunk_header, 16, "%zx\r\n", chunk);
            chunk_header_len = vlib::len(chunk_header);
            send(fd, chunk_header, chunk_header_len, timeout, flags);
            full_sent += chunk_header_len;
            
            send(fd, data.data() + sent, chunk, timeout, flags);
            full_sent += chunk;
            
            send(fd, "\r\n", 2, timeout, flags);
            full_sent += 2;
            
            sent += chunk;
        }
        send(fd, "0\r\n\r\n", 5, timeout, flags);
        full_sent += 5;
        return full_sent;
        
    }
    

    // Get as string representation.
    constexpr
    String str() const {
        if (m_ip.is_defined()) {
            return String() << m_ip << ':' << m_port;
        } else if (m_host.is_defined() && m_port != 0) {
            return String() << m_host << ':' << m_port;
        } else if (m_host.is_defined()) {
            return String() << m_host;
        } else if (m_port != 0) {
            return String() << '*' << ':' << m_port;
        } else {
            return String("?:?", 3);
        }
    }
    
	// Dump to pipe.
	constexpr friend
	auto& 	operator <<(Pipe& pipe, const Socket& obj) {
		if (obj.m_ip.is_defined()) {
			return pipe << obj.m_ip << ':' << obj.m_port;
		} else if (obj.m_port != 0) {
			return pipe << '*' << ':' << obj.m_port;
		} else if (obj.m_host.is_defined()) {
			return pipe << obj.m_host;
		} else {
			pipe.dump("?:?", 3);
			return pipe;
		}
	}
    
    // ---------------------------------------------------------
    // Compatibility functions.
    // Do not use these funcs.
    
    // Ignored.
    int set_sni(const String&) {
        return 0;
    }
    // Ignored.
    void debug() {}

};

// ---------------------------------------------------------
// End.

}; 		// End namespace sockets.

// Alias.
template <
int             family =           sockets::family::ipv4,
int             type =             sockets::type::stream,
int             protocol =         sockets::protocol::undefined,
uint            buff_len =         1024,
bool            blocking =         false
> requires (
    family == sockets::family::ipv4 ||
    family == sockets::family::ipv6
)
using Socket = sockets::Socket<family, type, protocol, buff_len, blocking>;

}; 		// End namespace vlib.
#endif 	// End header.
