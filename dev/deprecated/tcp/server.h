// Author: Daan van den Bergh
// Copyright: © 2022 Daan van den Bergh.
//
// DEPRECATED
//

// Header.
#ifndef VLIB_TCP_SERVER_T_H
#define VLIB_TCP_SERVER_T_H

// Namespace vlib.
namespace vlib {

// Namespace tcp.
namespace tcp {

// ---------------------------------------------------------
// TCP Server type.

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
struct Server : private sockets::Socket<family, type, protocol, buff_len, blocking> {

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
	using 		Base::bind;
	using 		Base::listen;

	// ---------------------------------------------------------
	// Attribute shortcuts.

	using 		Base::m_fd;

	// ---------------------------------------------------------
	// Attributes.
	
	Array<int, uint>	m_clients;

	// ---------------------------------------------------------
	// Construct functions.

	// Reconstruct by ip and port.
	constexpr
	int 	reconstruct(const String& ip, const uint& port) {
		int status;
		if ((status = close()) < 0) {
			return status;
		}
		if ((status = server(ip, port)) < 0) {
			return status;
		}
	}
	constexpr
	int 	reconstruct(String&& ip, const uint& port) {
		int status;
		if ((status = close()) < 0) {
			return status;
		}
		if ((status = server(ip, port)) < 0) {
			return status;
		}
	}

	// Reconstruct by port.
	constexpr
	int 	reconstruct(const uint& port) {
		int status;
		if ((status = close()) < 0) {
			return status;
		}
		if ((status = server(port)) < 0) {
			return status;
		}
	}

	// ---------------------------------------------------------
	// Constructors.

	// Default constructor.
	constexpr
	Server () : Base() {}

	// Constructor.
	constexpr
	Server (const String& ip, const uint& port) :
	Base() {
		switch (server(ip, port)) {
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
	Server (String&& ip, const uint& port) :
	Base() {
		switch (server(ip, port)) {
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

	// Constructor from universal ip and defined port.
	constexpr
	Server (const uint& port) :
	Base() {
		switch (server(port)) {
			case vlib::sockets::error::init:
				throw SocketError("vlib::tcp_t", tostr("Unable to create socket \"*:", port, "\" [", errno, "]."));
				break;
			case vlib::sockets::error::set_opt:
				throw SocketError("vlib::tcp_t", tostr("Unable to set the options for socket \"*:", port, "\" [", errno, "]."));
				break;
			case vlib::sockets::error::convert_ip:
				throw SocketError("vlib::tcp_t", tostr("Unable to convert ip \"*:", port, "\" [", errno, "]."));
				break;
			case vlib::sockets::error::set_blocking:
				throw SocketError("vlib::tcp_t", tostr("Unable to make socket \"*:", port, "\" non-blocking [", errno, "]."));
				break;
			default:
			case vlib::sockets::error::success:
				break;
		}
	}

	// Destructor.
	constexpr
	~Server() {
		close();
	}

	// ---------------------------------------------------------
	// Attribute functions.

	// Clients.
	constexpr
	auto& 	clients() {
		return m_clients;
	}

	// Get a client's file descriptor by index.
	// - Does not check indexes.
	constexpr
	auto& 	client(const uint& index) {
		return m_clients.get(index);
	}

	// ---------------------------------------------------------
	// Functions.

	// Poll a file descriptor.
	constexpr
	int 	poll(
		const uint&		client,
		const short&			events,
		const short&			revents,
		const int&				timeout = -1
	) {
		int status;
		struct pollfd pfd {m_clients.get(client), events, 0};
		if ((status = ::poll(&pfd, 1, timeout)) < 0) { return vlib::sockets::error::poll; }
		else if (status == 0) { return vlib::sockets::error::timeout; }
		else if (pfd.revents & revents) { return vlib::sockets::error::success; }
		else if (pfd.revents & POLLNVAL) { return vlib::sockets::error::not_open; }
		else if (pfd.revents & POLLERR) { return vlib::sockets::error::closed; }
		else { return vlib::sockets::error::unknown; }
	}

	// Accept.
	// - Returns the client's index on a successfull accept.
	template <typename Addrin> constexpr
	int 	accept(Addrin& addr, const int& timeout = -1) {
		int client;
		if ((client = Base::accept(addr, timeout)) >= 0) {
			uint index = 0;
			for (auto& fd: m_clients) {
				if (fd == -1) {
					fd = client;
					return index;
				}
				++index;
			}
			m_clients.append(client);
			return index;
		}
		return client;
	}
	constexpr
	int 	accept(const int& timeout = -1) {
		int client;
		if ((client = Base::accept(timeout)) >= 0) {
			int index = 0;
			for (auto& fd: m_clients) {
				if (fd == -1) {
					fd = client;
					return index;
				}
				++index;
			}
			m_clients.append(client);
			return index;
		}
		return client;
	}

	// Get info about a connected client.
	int 	info(String& ip, int& port, const uint& client) {
		return Base::info(ip, port, m_clients.get(client));
	}

	// Close the socket and all accepted clients.
	int 	close() {
		int status;
		if ((status = close(m_fd)) < 0) {
			return vlib::sockets::error::close;
		}
		return close_clients();
	}

	// Close an accepted client.
	int 	close(const uint& client) {
		int& fd = m_clients.get(client);
		int status;
		if ((status = ::close(fd)) == 0) {
			fd = -1;
			return vlib::sockets::error::success;
		}
		return vlib::sockets::error::close;
	}

	// Close all accepted clients.
	int 	close_clients() {
		int status;
		for (auto& fd: m_clients) {
			switch (fd) {
				case -1: continue;
				default: {
					if ((status = ::close(fd)) < 0) {
						return vlib::sockets::error::close;
					}
					fd = -1;
					continue;
				}
			}
		}
		return vlib::sockets::error::success;
	}

	// Call shutdown on the socket and all the accepted clients.
	int 	shutdown() {
		int status;
		if ((status = ::shutdown(m_fd, SHUT_RDWR)) < 0) {
			return status;
		}
		return shutdown_clients();
	}

	// Call shutdown on an accepted client.
	int 	shutdown(const uint& client) {
		int& fd = m_clients.get(client);
		int status;
		if ((status = ::shutdown(fd, SHUT_RDWR)) == 0) {
			fd = -1;
		}
		return status;
	}

	// Shut down all accepted clients.
	int 	shutdown_clients() {
		int status;
		for (auto& fd: m_clients) {
			switch (fd) {
				case -1: continue;
				default: {
					if ((status = ::shutdown(fd, SHUT_RDWR)) < 0) {
						return vlib::sockets::error::close;
					}
					fd = -1;
					continue;
				}
			}
		}
		return vlib::sockets::error::success;
	}
	
	// Receive data from the socket.
	// - Use -1 to receive with no timeout.
	// - Use 0 to receive and stop instantly if there is nothing to read.
	int 	receive(
		String& 					received,
		const uint&		client,
		const int&	 			timeout = -1,
		const int& 				flags = 0
	) {
		return Base::receive(received, m_clients.get(client), timeout, flags);
	}

	// Send data through the socket.
	int 	send(
		const uint&			client,
		const String& 				data,
		const int& 					timeout = -1,
		const int& 					flags = 0
	) {
		return Base::send(m_clients.get(client), data, timeout, flags);
	}
	int 	send(
		const uint&			client,
		const char* 				data,
		const ullong&	len,
		const int& 					timeout,
		const int& 					flags = 0
	) {
		return Base::send(m_clients.get(client), data, len, timeout, flags);
	}

	// Check if a connected client is connected.
	bool 	is_connected(const uint& client) {
		switch (const int& fd = m_clients.get(client)) {
			case -1:
				return false;
			default:
				return Base::is_connected(fd);
		}
	}

	// Dump to pipe.
	constexpr friend
	auto& 	operator <<(Pipe& pipe, const Server& obj) {
		if (obj.m_ip.is_defined()) {
			return pipe << obj.m_ip << ':' << obj.m_port;
		} else if (obj.m_port != 0) {
			return pipe << '*' << ':' << obj.m_port;
		// } else if (obj.m_host.is_defined()) {
		// 	return pipe << obj.m_host;
		} else {
			pipe.dump("?:?", 3);
			return pipe;
		}
	}

};

// ---------------------------------------------------------
// End.

}; 		// End namespace tcp.
}; 		// End namespace vlib.
#endif 	// End header.
