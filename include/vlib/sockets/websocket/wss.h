// Author: Daan van den Bergh
// Copyright: © 2022 Daan van den Bergh.

// Header.
#ifndef VLIB_WEBSOCKET_WSS_H
#define VLIB_WEBSOCKET_WSS_H

// Namespace vlib.
namespace vlib {

// Namespace tcp.
namespace websocket {

// ---------------------------------------------------------
// Secure Websocket.
//
// This is a very basic websocket with not all features.
// Mainly for library "vfin".
//
// Sources:
// - https://www.rfc-editor.org/rfc/rfc6455
// - https://github.com/php-ion/websocket-parser

template <
    int     family =         sockets::family::ipv4,
    int     type =           sockets::type::stream,
    int     protocol =       sockets::protocol::undefined,
    uint    buff_len =       1024,
    bool    blocking =       false,
    uint    tls_version =    tls::version::v1_3    // the minimum tls version.
> requires (
    family == sockets::family::ipv4 ||
    family == sockets::family::ipv6
)
struct WSS {

// Private.
private:

	// ---------------------------------------------------------
	// Aliases.

	using 		Socket = tls::Client<family, type, protocol, buff_len, blocking, tls_version>;
    
    // ---------------------------------------------------------
    // Threads.
    
    // Keep alive.
    class KeepAlive : public vlib::Thread<KeepAlive> {
    public:
        
        // Attributes.
        WSS*    m_wss;
        Int     m_interval;
        Bool    m_run = false;
        
        // Constructor.
        constexpr
        KeepAlive() : Thread<KeepAlive>() {}
        
        // Start thread.
        void* run(void) {
            while (m_run) {
                m_wss->ping();
                uint slept = 0;
                while (slept < m_interval) {
                    vlib::sleep::sec(10);
                    slept += 10;
                }
            }
            return NULL;
        }
    };
    
    // ---------------------------------------------------------
    // Aliases.

    Socket      m_sock;
    String      m_host;
    String      m_key;
    Parser      m_parser;
    Mutex       m_mutex;
    KeepAlive   m_keep_alive;
    
// Public.
public:
    
    // ---------------------------------------------------------
    // Constructors.
    
    // Default constructor.
    constexpr
    WSS() {}
    
    // Constructor.
    constexpr
    WSS(const String& host, const Int& port = 443) :
    m_sock(host, "", port.value()),
    m_host(host) {}
    
    // ---------------------------------------------------------
    // Functions.
    
    // Connect.
    void    connect(const Int& timeout = 60000) {
        
        // Connect with server.
        if (m_sock.connect(timeout.value()) != 0) {
            throw WSSError(tostr(
                "Unable to connect to websocket \"",
                m_host, ":", m_sock.port(),
                "\"."
            ));
        }
        
        // Generate key.
        vlib::random::random_seed();
        m_key = vlib::Base64::encode(String::random(16));
        
        // Get host and endpoint.
        String naked_url = m_host, endpoint;
        ullong pos;
        if ((pos = naked_url.find("//")) != NPos::npos) {
            naked_url.slice_r(pos+2);
        }
        if ((pos = naked_url.find('/')) != NPos::npos) {
            endpoint = naked_url.slice(pos);
            naked_url.slice_r(0, pos);
        }
        
        // Upgrade to websocket.
        String request = tostr(
            "GET ", endpoint, " HTTP/1.1\r\n"
            "Host: ", naked_url, "\r\n"
            "Origin: https://", naked_url, "\r\n"
            "Upgrade: websocket\r\n"
            "Connection: upgrade\r\n"
            "Sec-WebSocket-Key: ", m_key, "\r\n"
            "Sec-WebSocket-Version: 13\r\n"
            "\r\n"
        );
        if (m_sock.send(request, timeout.value()) != 0) {
            throw WSSError("Unable to send to the websocket.");
        }
        http::Response response = http::Response::receive(m_sock, timeout.value());
        if (response.status() != 101) {
            throw WSSError(tostr(
                "Connection error [",
                response.status(),
                "]: ",
                vlib::http::status::tostr(response.status()),
                "."
            ));
        }
        
        // Validate key.
        String result = response.header("Sec-WebSocket-Accept", 20);
        String hash = vlib::Base64::encode(vlib::SHA1::digest(m_key.concat("258EAFA5-E914-47DA-95CA-C5AB0DC85B11", 36)));
        if (hash != result) {
            throw WSSError("Invalid handshake key.");
        }

    }
    
    // Request.
    constexpr
    void    send(const String& data) {
        
        String mask = "1234"; //String::random(4);
        String frame = Parser::create_frame(
            (Parser::websocket_flags) (Parser::OP_TEXT | Parser::FINAL_FRAME | Parser::HAS_MASK),
            mask.data(),
            data.data(),
            data.len()
        );
        m_sock.send(frame);
    }
    constexpr
    void    send(const Json& data) {
        return send(data.str());
    }
    
    // Receive.
    constexpr
    String  recv(const Int& timeout = VLIB_SOCK_TIMEOUT) {
        String received;
        // while (true) {
            String frame;
            m_sock.recv(frame, timeout.value());
            m_parser.parse_frame(received, frame);
            if (m_parser.flags & Parser::FINAL_FRAME) {
                return received;
            }
            return received;
        // }
        throw WSSError("Unexpected receive error.");
    }
    
    // Ping the server.
    // constexpr
    // void    ping() {
    //     String mask = String::random(4);
    //     String request = Parser::create_frame(
    //         (Parser::websocket_flags) (Parser::OP_PING | Parser::FINAL_FRAME | Parser::HAS_MASK),
    //         mask.data(),
    //         "",
    //         0
    //     );
    //     if (m_sock.send(request) != 0) {
    //         throw WSSError("Unable to sent to the websocket.");
    //     }
    //     String received;
    //     if (m_sock.receive(received) != 0) {
    //         throw WSSError("Unable to receive from the websocket.");
    //     }
    //     String response;
    //     m_parser.parse_frame(response, received);
    //     if (!(m_parser.flags & Parser::FINAL_FRAME)) {
    //         throw WSSError("Unable to receive the pong from the websocket.");
    //     }
    // }
    
    // Lock the mutex.
    constexpr
    void lock() {
        m_mutex.lock();
    }
    
    // Unlock the mutex.
    constexpr
    void unlock() {
        m_mutex.unlock();
    }
    
    // Keep alive with interval in seconds.
    constexpr
    void    keep_alive(const Int& interval = 60 * 10) {
        if (m_keep_alive.m_run) { return ; }
        m_keep_alive.m_wss = &(*this);
        m_keep_alive.m_interval = interval;
        m_keep_alive.m_run = true;
        m_keep_alive.start();
        m_keep_alive.detach();
    }
    
    // Stop the keep alive thread.
    constexpr
    void    stop_keep_alive() {
        m_keep_alive.m_run = false;
    }

};

// ---------------------------------------------------------
// End.

}; 		// End namespace tcp.
}; 		// End namespace vlib.
#endif 	// End header.
