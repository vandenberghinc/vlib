// Author: Daan van den Bergh
// Copyright: © 2022 Daan van den Bergh.

// header.
#ifndef VLIB_SOCKETS_GLOBAL_H
#define VLIB_SOCKETS_GLOBAL_H

// Namespace vlib.
namespace vlib {

// Get the ip and port of a host [e.g "https:://github.com/"].
int 	lookup(String& ip, uint& port, const String& host, int type = AF_INET) {

	// Get port.
	const char* cport = "80";
	port = 80;
	if (
		host.len() >= 6 &&
		host.get(0) == 'h' &&
		host.get(1) == 't' &&
		host.get(2) == 't' &&
		host.get(3) == 'p' &&
		host.get(4) == 's' &&
		host.get(5) == ':'
	) {
		cport = "443";
		port = 443;
	}

	// Get hostname.
	ullong start_index = 0;
	ullong end_index = host.len();
	bool post = false;
	for (auto& i: host.indexes()) {
		switch (host.get(i)) {
			case '/': {
				if (post) { end_index = i; break; }
				else if (i > 0 && host.get(i-1) == '/') {
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
	char* hostname = host.data() + start_index;
	hostname[end_index - start_index] = '\0';

	// Vars.
	struct addrinfo hints = {}, *result;
	int errcode;
	ip.resize(INET6_ADDRSTRLEN);
	void *ptr;

	// Hints.
	hints.ai_family = PF_UNSPEC;
	hints.ai_socktype = SOCK_STREAM;
	hints.ai_flags |= AI_CANONNAME;

	// Get address info.
	errcode = getaddrinfo (hostname, cport, &hints, &result);
	if (errcode != 0) {
		return sockets::error::getaddr;
	}

	// Get ips.
	while (result) {
		inet_ntop (result->ai_family, result->ai_addr->sa_data, ip.data(), INET6_ADDRSTRLEN);
		switch (type) {
			case AF_INET: {
				switch (result->ai_family) {
					case AF_INET: {
						ptr = &((struct sockaddr_in *) result->ai_addr)->sin_addr;
						inet_ntop (result->ai_family, ptr, ip.data(), INET6_ADDRSTRLEN);
						ip.len() = vlib::len(ip.data());
						freeaddrinfo(result);
						return 0;
					}
					default: break;
				}
				break;
			}
			case AF_INET6: {
				switch (result->ai_family) {
					case AF_INET6: {
						ptr = &((struct sockaddr_in6 *) result->ai_addr)->sin6_addr;
						inet_ntop (result->ai_family, ptr, ip.data(), INET6_ADDRSTRLEN);
						ip.len() = vlib::len(ip.data());
						freeaddrinfo(result);
						return 0;
					}
					default: break;
				}
				break;
			}
			default: continue;
		}
		result = result->ai_next;
	}
	freeaddrinfo(result);
	return sockets::error::getaddr;
}
int 	lookup_ipv4(String& ip, uint& port, const String& host) {
	return lookup(ip, port, host, AF_INET);
}
int 	lookup_ipv6(String& ip, uint& port, const String& host) {
	return lookup(ip, port, host, AF_INET6);
}

// Returns a url-encoded version of str.
String 	url_encode(const String& str) {
	String encoded;
	for (auto& i: str) {
		if (isalnum(i) || i == '-' || i == '_' || i == '.' || i == '~') {
			encoded << i;
		}
		else if (i == ' ') {
			encoded << '+';
		}
		else {
			encoded << '%' << to_hex(i >> 4) << to_hex(i & 15);
		}
	}
	return encoded;
}
String  url_encode(const Json& params) {
    String encoded;
    for (auto& i: params.indexes()) {
        if (i != 0) {
            encoded << '&';
        }
        encoded << url_encode(params.key(i)) << '=' << url_encode(params.value(i).str());
    }
    return encoded;
}

// Returns a url-decoded version of str.
String 	url_decode(const String& str) {
	String decoded;
	const char* data = str.c_str();
	while (*data) {
		if (*data == '%') {
			if (data[1] && data[2]) {
				decoded << (char) (from_hex(data[1]) << 4 | from_hex(data[2]));
				data += 2;
			}
		} else if (*data == '+') {
			decoded << ' ';
		} else {
			decoded << *data;
		}
		data++;
	}
	return decoded;
}

// Get private ip.
String  private_ip() {
    
    // Initialize socket.
    int sock = socket(PF_INET, SOCK_DGRAM, 0);
    struct sockaddr_in loopback;
    if (sock == -1) {
        throw SocketError(tostr("Unable to initialize the socket [", ::strerror(errno), "]."));
    }
    memset(&loopback, 0, sizeof(loopback));
    loopback.sin_family = AF_INET;
    loopback.sin_addr.s_addr = 1337;   // can be any IP address
    loopback.sin_port = htons(9);      // using debug port
    
    // Connect.
    if (connect(sock, reinterpret_cast<sockaddr*>(&loopback), sizeof(loopback)) == -1) {
        close(sock);
        throw ConnectError(tostr("Unable to connect to the socket [", ::strerror(errno), "]."));
    }
    
    // Get socket info.
    socklen_t addrlen = sizeof(loopback);
    if (getsockname(sock, reinterpret_cast<sockaddr*>(&loopback), &addrlen) == -1) {
        close(sock);
        throw SocketError(tostr("Unable to get the socket name [", ::strerror(errno), "]."));
    }
    
    // Close.
    ::close(sock);
    
    // Convert ip.
    String private_ip;
    private_ip.resize(INET_ADDRSTRLEN);
    if (inet_ntop(AF_INET, &loopback.sin_addr, private_ip.data(), INET_ADDRSTRLEN) == 0x0) {
        throw SocketError(tostr("Unable to convert the socket address to an ip [", ::strerror(errno), "]."));
    }
    private_ip.len() = vlib::len(private_ip.data());
    return private_ip;
    
}

}; 		// End namespace vlib.
#endif 	// End header.
