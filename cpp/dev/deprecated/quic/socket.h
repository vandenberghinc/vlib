/*
 Author: Daan van den Bergh
 Copyright: © 2022 Daan van den Bergh.
*/

// Header.
#ifndef VLIB_QUIC_SOCKET_H
#define VLIB_QUIC_SOCKET_H

// Includes.
#include <quiche.h>

// Namespace vlib.
namespace vlib {

// Namespace quic.
namespace quic {

// ---------------------------------------------------------
// QUIC socket type.

struct Socket {
private:

    // ---------------------------------------------------------
    // Attributes.
    
    int m_fd;
    quiche_config* m_config;
    quiche_conn* m_conn;
    
    // ---------------------------------------------------------
    // Private funcs.

    // Set non blocking.
    void set_non_blocking() {
        int flags = fcntl(m_fd, F_GETFL, 0);
        if (flags == -1) {
            perror("fcntl");
            return;
        }

        flags |= O_NONBLOCK;

        if (fcntl(m_fd, F_SETFL, flags) == -1) {
            perror("fcntl");
        }
    }

    void initialize_quic_config() {
        m_config = quiche_config_new(QUICHE_PROTOCOL_VERSION);
        if (m_config == nullptr) {
            perror("quiche_new_config");
            return;
        }

        // Configure quiche as needed
        // ...
    }
    
public:
    
    // ---------------------------------------------------------
    // Constructors.
    
    // Default constructor.
    Socket() : m_fd(-1), m_config(nullptr), m_conn(nullptr) {}

    // Destructor.
    ~Socket() {
        close();
    }

    // ---------------------------------------------------------
    // Functions.
    
    // Initialize.
    bool initialize() {
        m_fd = socket(AF_INET, SOCK_DGRAM, 0);
        if (m_fd == -1) {
            perror("socket");
            return false;
        }

        set_non_blocking();
        initialize_quic_config();
        return true;
    }

    // Connect.
    bool connect(const std::string& server_ip, int server_port) {
        sockaddr_in server_address{};
        server_address.sin_family = AF_INET;
        server_address.sin_port = htons(server_port);
        server_address.sin_addr.s_addr = inet_addr(server_ip.c_str());

        m_conn = quiche_connect(server_address, m_config);
        if (m_conn == NULL) {
            perror("quiche_connect");
            return false;
        }

        return true;
    }

    // Accept.
    bool accept(const sockaddr* addr, socklen_t addrlen) {
        quiche_conn* conn = quiche_accept(addr, addrlen, m_config);
        if (conn == NULL) {
            perror("quiche_accept");
            return false;
        }

        return true;
    }

    // Read.
    ssize_t read(char* buffer, size_t buffer_size, int timeout_ms) {
        while (true) {
            pollfd fds[1];
            fds[0].fd = m_fd;
            fds[0].events = POLLIN;

            int poll_result = poll(fds, 1, timeout_ms);
            if (poll_result < 0) {
                perror("poll");
                return -1;
            } else if (poll_result == 0) {
                // Timeout occurred
                return 0;
            } else {
                ssize_t bytes_read = quiche_conn_recv(m_conn, buffer, buffer_size);
                if (bytes_read < 0) {
                    if (errno == EWOULDBLOCK || errno == EAGAIN) {
                        // No data available for reading at the moment, retry
                        continue;
                    } else {
                        // Error occurred
                        perror("quiche_recv");
                        return -1;
                    }
                }

                return bytes_read;
            }
        }
    }

    // Write.
    ssize_t write(const char* buffer, size_t buffer_size, int timeout_ms) {
        size_t total_bytes_written = 0;
        while (total_bytes_written < buffer_size) {
            pollfd fds[1];
            fds[0].fd = m_fd;
            fds[0].events = POLLOUT;

            int poll_result = poll(fds, 1, timeout_ms);
            if (poll_result < 0) {
                perror("poll");
                return -1;
            } else if (poll_result == 0) {
                // Timeout occurred
                return total_bytes_written;
            } else {
                ssize_t bytes_written = quiche_conn_send(
                    m_conn,
                    buffer + total_bytes_written,
                    buffer_size - total_bytes_written
                );
                if (bytes_written < 0) {
                    if (errno == EWOULDBLOCK || errno == EAGAIN) {
                        // Socket buffer is full, cannot write at the moment, retry
                        continue;
                    } else {
                        // Error occurred
                        perror("quiche_send");
                        return -1;
                    }
                }

                total_bytes_written += bytes_written;
            }
        }

        return total_bytes_written;
    }

    // Close.
    void close() {
        if (m_conn != nullptr) {
            quiche_conn_free(m_conn);
            m_conn = nullptr;
        }

        if (m_config != nullptr) {
            quiche_config_free(m_config);
            m_config = nullptr;
        }

        if (m_fd != -1) {
            ::close(m_fd);
            m_fd = -1;
        }
    }

};

// ---------------------------------------------------------
// End.

}; 		// End namespace https.
}; 		// End namespace vlib.
#endif 	// End header.
