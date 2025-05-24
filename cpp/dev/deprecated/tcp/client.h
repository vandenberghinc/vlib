// Author: Daan van den Bergh
// Copyright: © 2022 Daan van den Bergh.
//
// DEPRECATED
//

// Header.
#ifndef VLIB_TCP_CLIENT_T_H
#define VLIB_TCP_CLIENT_T_H

// Namespace vlib.
namespace vlib {

// Namespace tcp.
namespace tcp {

// ---------------------------------------------------------
// TCP client type.

template <
	int				family = 		sockets::family::ipv4,
	int 			type = 			sockets::type::stream,
	int 			protocol = 		sockets::protocol::undefined,
	uint 	buff_len = 		1024,
	bool 			blocking = 		false
> requires (
	family == sockets::family::ipv4 ||
	family == sockets::family::ipv6
)
struct Client : private sockets::Socket<family, type, protocol, buff_len, blocking> {

// Public.
public:

	// ---------------------------------------------------------
	// Aliases.

	using 		Base = sockets::Socket<family, type, protocol, buff_len, blocking>;

// Private.
private:

	// ---------------------------------------------------------
	// Private shortcuts.

	using 		Base::server;
	using 		Base::client;
    using       Base::client_by_host;
	// using 		Base::receive;
	using 		Base::send;
	using 		Base::info;
	// using 		Base::is_connected;
 
// Public.
public:

	// ---------------------------------------------------------
	// Public shortcuts.

	using 		Base::fd;
	using 		Base::addr;
	using 		Base::addrlen;
	using 		Base::ip;
	using 		Base::port;
	using 		Base::host;
	using 		Base::new_addr;

	using 		Base::poll;
	using 		Base::connect;
	using 		Base::close;
	using 		Base::shutdown;
    using       Base::restart;

	// ---------------------------------------------------------
	// Attribute shortcuts.

	using 		Base::m_fd;

	// ---------------------------------------------------------
	// Construct functions.

	// Reconstruct by ip and port.
	constexpr
	int 	reconstruct(const String& ip, const uint& port) {
		int status;
		if ((status = close()) < 0) {
			return status;
		}
		if ((status = client(ip, port)) < 0) {
			return status;
		}
        return 0;
	}
	constexpr
	int 	reconstruct(String&& ip, const uint& port) {
		int status;
		if ((status = close()) < 0) {
			return status;
		}
		if ((status = client(ip, port)) < 0) {
			return status;
		}
        return 0;
	}

	// Reconstruct by host.
	constexpr
	int 	reconstruct(const String& host) {
		int status;
		if ((status = close()) < 0) {
			return status;
		}
		if ((status = client_by_host(host)) < 0) {
			return status;
		}
        return 0;
	}
	constexpr
	int 	reconstruct(String&& host) {
		int status;
		if ((status = close()) < 0) {
			return status;
		}
		if ((status = client_by_host(host)) < 0) {
			return status;
		}
        return 0;
	}

	// ---------------------------------------------------------
	// Constructors.

	// Default constructor.
	constexpr
	Client () : Base() {}

	// Constructor from ip and port.
	constexpr
	Client (const String& ip, const uint& port) :
	Base() {
		switch (client(ip, port)) {
			case vlib::sockets::error::init:
				throw SocketError("vlib::tcp_t", tostr("Unable to create socket \"", ip, ":", port, "\" [", errno, "]."));
				break;
			case vlib::sockets::error::set_opt:
				throw SocketError("vlib::tcp_t", tostr("Unable to set the options for socket \"", ip, ":", port, "\" [", errno, "]."));
				break;
			case vlib::sockets::error::convert_ip:
				throw SocketError("vlib::tcp_t", tostr("Unable to convert ip \"", ip, ":", port, "\" [", errno, "]."));
				break;
			case vlib::sockets::error::set_blocking:
				throw SocketError("vlib::tcp_t", tostr("Unable to make socket \"", ip, ":", port, "\" non-blocking [", errno, "]."));
				break;
			default:
			case vlib::sockets::error::success:
				break;
		}
	}
	constexpr
	Client (String&& ip, const uint& port) :
	Base() {
		switch (client(ip, port)) {
			case vlib::sockets::error::init:
				throw SocketError("vlib::tcp_t", tostr("Unable to create socket \"", ip, ":", port, "\" [", errno, "]."));
				break;
			case vlib::sockets::error::set_opt:
				throw SocketError("vlib::tcp_t", tostr("Unable to set the options for socket \"", ip, ":", port, "\" [", errno, "]."));
				break;
			case vlib::sockets::error::convert_ip:
				throw SocketError("vlib::tcp_t", tostr("Unable to convert ip \"", ip, ":", port, "\" [", errno, "]."));
				break;
			case vlib::sockets::error::set_blocking:
				throw SocketError("vlib::tcp_t", tostr("Unable to make socket \"", ip, ":", port, "\" non-blocking [", errno, "]."));
				break;
			default:
			case vlib::sockets::error::success:
				break;
		}
	}

	// Constructor.
	constexpr
	Client (const String& host) :
	Base() {
		switch (client_by_host(host)) {
			case vlib::sockets::error::init:
				throw SocketError("vlib::tcp_t", tostr("Unable to create socket \"", host, "\" [", errno, "]."));
				break;
			case vlib::sockets::error::set_opt:
				throw SocketError("vlib::tcp_t", tostr("Unable to set the options for socket \"", host, "\" [", errno, "]."));
				break;
			case vlib::sockets::error::getaddr:
				throw SocketError("vlib::tcp_t", tostr("Unable to convert host \"", host, "\" [", errno, "]."));
				break;
			case vlib::sockets::error::set_blocking:
				throw SocketError("vlib::tcp_t", tostr("Unable to make socket \"", host, "\" non-blocking [", errno, "]."));
				break;
			default:
			case vlib::sockets::error::success:
				break;
		}
	}
	constexpr
	Client (String&& host) :
	Base() {
		switch (client_by_host(host)) {
			case vlib::sockets::error::init:
				throw SocketError("vlib::tcp_t", tostr("Unable to create socket \"", host, "\" [", errno, "]."));
				break;
			case vlib::sockets::error::set_opt:
				throw SocketError("vlib::tcp_t", tostr("Unable to set the options for socket \"", host, "\" [", errno, "]."));
				break;
			case vlib::sockets::error::getaddr:
				throw SocketError("vlib::tcp_t", tostr("Unable to convert host \"", host, "\" [", errno, "]."));
				break;
			case vlib::sockets::error::set_blocking:
				throw SocketError("vlib::tcp_t", tostr("Unable to make socket \"", host, "\" non-blocking [", errno, "]."));
				break;
			default:
			case vlib::sockets::error::success:
				break;
		}
	}
	
	// Special constructor for http::ClientTemplate.
	constexpr
	Client (const String& host, const String& ip, const uint& port) :
	Base() {
		if (host.is_defined()) {
			switch (client_by_host(host, port)) {
				case vlib::sockets::error::init:
					throw SocketError("vlib::tcp_t", tostr("Unable to create socket \"", host, "\" [", errno, "]."));
					break;
				case vlib::sockets::error::set_opt:
					throw SocketError("vlib::tcp_t", tostr("Unable to set the options for socket \"", host, "\" [", errno, "]."));
					break;
				case vlib::sockets::error::getaddr:
					throw SocketError("vlib::tcp_t", tostr("Unable to convert host \"", host, "\" [", errno, "]."));
					break;
				case vlib::sockets::error::set_blocking:
					throw SocketError("vlib::tcp_t", tostr("Unable to make socket \"", host, "\" non-blocking [", errno, "]."));
					break;
				default:
				case vlib::sockets::error::success:
					break;
			}
		}
		else {
			switch (client(ip, port)) {
				case vlib::sockets::error::init:
					throw SocketError("vlib::tcp_t", tostr("Unable to create socket \"", ip, ":", port, "\" [", errno, "]."));
					break;
				case vlib::sockets::error::set_opt:
					throw SocketError("vlib::tcp_t", tostr("Unable to set the options for socket \"", ip, ":", port, "\" [", errno, "]."));
					break;
				case vlib::sockets::error::convert_ip:
					throw SocketError("vlib::tcp_t", tostr("Unable to convert ip \"", ip, ":", port, "\" [", errno, "]."));
					break;
				case vlib::sockets::error::set_blocking:
					throw SocketError("vlib::tcp_t", tostr("Unable to make socket \"", ip, ":", port, "\" non-blocking [", errno, "]."));
					break;
				default:
				case vlib::sockets::error::success:
					break;
			}
		}
	}
	constexpr
	Client (String&& host, String&& ip, const uint& port) :
	Base() {
		if (host.is_defined()) {
			switch (client_by_host(host, port)) {
				case vlib::sockets::error::init:
					throw SocketError("vlib::tcp_t", tostr("Unable to create socket \"", host, "\" [", errno, "]."));
					break;
				case vlib::sockets::error::set_opt:
					throw SocketError("vlib::tcp_t", tostr("Unable to set the options for socket \"", host, "\" [", errno, "]."));
					break;
				case vlib::sockets::error::getaddr:
					throw SocketError("vlib::tcp_t", tostr("Unable to convert host \"", host, "\" [", errno, "]."));
					break;
				case vlib::sockets::error::set_blocking:
					throw SocketError("vlib::tcp_t", tostr("Unable to make socket \"", host, "\" non-blocking [", errno, "]."));
					break;
				default:
				case vlib::sockets::error::success:
					break;
			}
		}
		else {
			switch (client(ip, port)) {
				case vlib::sockets::error::init:
					throw SocketError("vlib::tcp_t", tostr("Unable to create socket \"", ip, ":", port, "\" [", errno, "]."));
					break;
				case vlib::sockets::error::set_opt:
					throw SocketError("vlib::tcp_t", tostr("Unable to set the options for socket \"", ip, ":", port, "\" [", errno, "]."));
					break;
				case vlib::sockets::error::convert_ip:
					throw SocketError("vlib::tcp_t", tostr("Unable to convert ip \"", ip, ":", port, "\" [", errno, "]."));
					break;
				case vlib::sockets::error::set_blocking:
					throw SocketError("vlib::tcp_t", tostr("Unable to make socket \"", ip, ":", port, "\" non-blocking [", errno, "]."));
					break;
				default:
				case vlib::sockets::error::success:
					break;
			}
		}
	}

	// Destructor.
	constexpr
	~Client() {
		close();
	}

	// ---------------------------------------------------------
	// Functions.

	// Receive data from the socket.
	// - Use -1 to receive with no timeout.
	// - Use 0 to receive and stop instantly if there is nothing to read.
	int 	receive(
		String& 					received,
		const int&	 			timeout = -1,
		const int& 				flags = 0
	) {
		return Base::receive(received, m_fd, timeout, flags);
	}

	// Send data through the socket.
	int 	send(
		const char* 				data,
		const ullong&	len = 0,
		const int& 					timeout = -1,
		const int& 					flags = 0
	) {
		return send(m_fd, data, len, timeout, flags);
	}
	int 	send(
		const String&				data,
		const int& 					timeout = -1,
		const int& 					flags = 0
	) {
		return send(m_fd, data, timeout, flags);
	}

	// Info.
	constexpr
	int 	info(
		String& 			ip,
		int&			port
	) {
		return info(ip, port, m_fd);
	}

	// Check if a file descriptor's connection is connected.
	constexpr
	bool 	is_connected() {
		return Base::is_connected();
	}
    
	// Dump to pipe.
	constexpr friend
	auto& 	operator <<(Pipe& pipe, const Client& obj) {
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

}; 		// End namespace tcp.
}; 		// End namespace vlib.
#endif 	// End header.
