// Author: Daan van den Bergh
// Copyright: © 2022 Daan van den Bergh.

// Header.
#ifndef VLIB_TLS_WRAPPER_H
#define VLIB_TLS_WRAPPER_H

// Namespace vlib.
namespace vlib {

// Namespace tls.
namespace tls {

// ---------------------------------------------------------
// Secure TCP IP Template.
//
// Notes:
// - The socket is always non-blocking.
//
// Sources:
// - https://indienote.tistory.com/361
//

struct wrapper {

	// Alias.
	using Length = ullong;

	// Initialize openssl.
	static inline
	void 	init_openssl() {
		SSL_library_init();
		OpenSSL_add_all_algorithms();  				// load & register all cryptos, etc.
		SSL_load_error_strings();   				// load all error messages.
	}

	// Convert ssl error.
	static inline
	int 	convert_ssl_err(SSL*& ssl, int status) {
		switch (SSL_get_error(ssl, status)) {
			case SSL_ERROR_NONE:
				return vlib::sockets::error::success;
			case SSL_ERROR_SSL:
				return vlib::sockets::error::fatal;
			case SSL_ERROR_WANT_READ:
				return vlib::sockets::error::want_read;
			case SSL_ERROR_WANT_WRITE:
				return vlib::sockets::error::want_write;
			case SSL_ERROR_WANT_X509_LOOKUP:
				return vlib::sockets::error::want_x509_lookup;
			case SSL_ERROR_SYSCALL:
				return vlib::sockets::error::syscall;
			case SSL_ERROR_ZERO_RETURN:
				return vlib::sockets::error::zero_return;
			case SSL_ERROR_WANT_CONNECT:
				return vlib::sockets::error::want_connect;
			case SSL_ERROR_WANT_ACCEPT:
				return vlib::sockets::error::want_accept;
			default:
				return vlib::sockets::error::unknown;
		}
	}

	// Set the minimum tls version.
	SICE
	void 	set_min_tls_version(SSL_CTX*& m_ctx, int version) {
		switch (version) {
			case tls::version::any:
                break;
			case tls::version::v1_0:
				if (SSL_CTX_set_min_proto_version(m_ctx, TLS1_VERSION) <= 0) {
                    throw SocketError("Unable to set the minimum tls version.");
				}
                break;
			case tls::version::v1_1:
				if (SSL_CTX_set_min_proto_version(m_ctx, TLS1_1_VERSION) <= 0) {
                    throw SocketError("Unable to set the minimum tls version.");
				}
                break;
			case tls::version::v1_2:
				if (SSL_CTX_set_min_proto_version(m_ctx, TLS1_2_VERSION) <= 0) {
                    throw SocketError("Unable to set the minimum tls version.");
				}
                break;
			case tls::version::v1_3:
				if (SSL_CTX_set_min_proto_version(m_ctx, TLS1_3_VERSION) <= 0) {
                    throw SocketError("Unable to set the minimum tls version.");
				}
                break;
			default:
                throw SocketError("Unknown tls version.");
		}
	}

	// Handle the want read / write errors.
	// - Returns the converted ssl error when the ssl error is not want read / write.
	static inline
	bool 	handle_want_read_write(
		SSL*& 				ssl,
		int 			status,
		struct pollfd& 		pfd,
		int 			rfd,
		int 			wfd,
		int 			timeout
	) {
		int pollstatus;
		switch (SSL_get_error(ssl, status)) {
			case SSL_ERROR_NONE:
                return true;
			case SSL_ERROR_WANT_READ:
				pfd = {rfd, POLLIN, 0};
				if ((pollstatus = ::poll(&pfd, 1, timeout)) > 0) {
                    return false;
				} else if (pollstatus == 0) {
                    throw TimeoutError("Operation timed out.");
				} else {
                    throw PollError(tostr("Poll error [", ::strerror(errno), "]."));
				}
                return true;
			case SSL_ERROR_WANT_WRITE:
				pfd = {wfd, POLLOUT, 0};
				if ((pollstatus = ::poll(&pfd, 1, timeout)) > 0) {
                    return false;
				} else if (pollstatus == 0) {
                    throw TimeoutError("Operation timed out.");
				} else {
                    throw PollError(tostr("Poll error [", ::strerror(errno), "]."));
				}
                return true;
            // case SSL_ERROR_ZERO_RETURN:
            //     throw TLSError("SSL connection closed gracefully by peer");
            // case SSL_ERROR_WANT_CONNECT:
            //     throw TLSError("SSL operation blocked, waiting for a connect handshake to complete");
            // case SSL_ERROR_WANT_ACCEPT:
            //     throw TLSError("SSL operation blocked, waiting for an accept handshake to complete");
            // case SSL_ERROR_WANT_X509_LOOKUP:
            //     throw TLSError("SSL operation blocked, waiting for an X509 lookup to complete");
            // case SSL_ERROR_SYSCALL:
            //     if (errno != 0) {
            //         throw TLSError(String(std::strerror(errno)));
            //     } else {
            //         throw TLSError("System call error occurred");
            //     }
            // case SSL_ERROR_SSL: {
            //     String err;
            //     err.resize(256);
            //     ERR_error_string_n(ERR_get_error(), err.data(), 256);
            //     throw TLSError(err);
            // }
            // default:
            //     throw TLSError("Unknown SSL error occurred");
            default: return false;
		}
	}

	// Receive.
	static inline
	Bool 	is_connected(SSL*& ssl) {
		int status;
		char buff;
		if ((status = SSL_peek(ssl, &buff, 1)) <= 0) {
			switch (SSL_get_error(ssl, status)) {
			case SSL_ERROR_SSL:
			case SSL_ERROR_SYSCALL:
			case SSL_ERROR_ZERO_RETURN:
			case SSL_ERROR_WANT_CONNECT:
				return false;
			case SSL_ERROR_WANT_ACCEPT:
			case SSL_ERROR_NONE:
			case SSL_ERROR_WANT_READ:
			case SSL_ERROR_WANT_WRITE:
			case SSL_ERROR_WANT_X509_LOOKUP:
				return true;
			default:
				return false;
			}
		}
		return true;
	}
	
	// Receive.
	static inline
	void 	receive(
		String& 		received,
		SSL*& 		    ssl,
		int 			timeout = -1,
		int 			buff_len = 1024
	) {

		// Variables.
		char buff[buff_len];
		int bytes = 0;
		auto rfd = SSL_get_rfd(ssl);
		auto wfd = SSL_get_wfd(ssl);
		struct pollfd pfd;

		// Loop.
        llong end_time = Date::get_mseconds() + timeout;
		while (true) {
            
            // Check broken pipe.
            // if (sockets::Socket<>::is_broken(rfd)) {
            //     throw BrokenPipeError("Pipe is broken.");
            // }
            
            // Receive.
			if ((bytes = SSL_read(ssl, buff, buff_len)) > 0) {
				received.concat_r(buff, (uint) bytes);
                return ;
			}
            
            // Handle want read write.
            handle_want_read_write(ssl, bytes, pfd, rfd, wfd, timeout);
            // if (handle_want_read_write(ssl, bytes, pfd, rfd, wfd, timeout)) {
            //     break;
            // }
            
            // Timeout.
            if (timeout != -1 && Date::get_mseconds() >= end_time) {
                throw TimeoutError("Operation timed out.");
            }
		}
	}

	// Send.
	static inline
	ullong  send(
		SSL*&	        ssl,
		const char* 	data,
		ullong 			len,
		int 			timeout
	) {
        
        /* V2 send in chunks.
        // Seems to have an error when used by vfin.
        // The error is not clear but do not use this version.
        int fd = SSL_get_fd(ssl), chunk, chunk_size = 1024 * 32;
        ullong sent = 0;
        llong status;
        while (sent < len) {
            Socket<>::poll(fd, POLLOUT, POLLOUT, timeout);
            chunk = len - sent < (uint) chunk_size ? (int) (len - sent) : chunk_size;
            errno = 0;
            if ((status = SSL_write(ssl, data + sent, chunk)) < 0) {
                if (errno != EAGAIN) {
                    int err = SSL_get_error(ssl, (int) status);
                    if (err != SSL_ERROR_WANT_READ && err != SSL_ERROR_WANT_WRITE) {
                        throw WriteError(tostr("Write error [", get_err(ssl, (int) status), "] [", ::strerror(errno), "]."));
                    }
                }
            } else if (status == 0) {
                throw WriteError(tostr("Write error [", get_err(ssl, (int) status), "] [", ::strerror(errno), "]."));
            } else {
                sent += (ullong) status;
            }
        }
        return sent;
         */
        
        /* V1 */
        llong status;
        if ((status = SSL_write(ssl, data, len)) < 0) {
            throw WriteError(tostr("Write error [", get_err(ssl, (int) status), "] [", ::strerror(errno), "]."));
        }
        struct pollfd pfd;
        int fd = SSL_get_fd(ssl);
        handle_want_read_write(ssl, (int) status, pfd, fd, fd, timeout);
        return (ullong) status;
         
        
        /* V2 contains some errors in returning len.
        llong status;
        int fd = SSL_get_fd(ssl);
        Socket<>::poll(fd, POLLOUT, POLLOUT, timeout);
        struct pollfd pfd;
        errno = 0;
		if ((status = SSL_write(ssl, data, len)) == 0) {
            return 0;
        } else if (status < 0 && !handle_want_read_write(ssl, (int) status, pfd, fd, fd, timeout)) {
            throw WriteError(tostr("Write error [", get_err(ssl, (int) status), "] [", ::strerror(errno), "]."));
        }
        // handle_want_read_write(ssl, (int) status, pfd, fd, fd, timeout);
        return (ullong) status;
         */
        
	}
	static inline
    ullong  send(
		SSL*& 			ssl,
		const String& 	data,
		int 		timeout = -1
	) {
		return send(ssl, data.data(), (uint) data.len(), timeout);
	}

	// Close a ssl connection.
	static inline
	void 	close(SSL*& ssl, const Int& timeout = 60 * 1000) {
        
        // Get fd.
        int fd = SSL_get_fd(ssl);
        
        // Set to blocking.
        // To make things easier.
        Socket<>::set_blocking(fd, false);
        
        // Shut down.
        // try {
        //     SSL_shutdown(ssl);
        // } catch (BrokenPipeError&) {}
        int status, attempts = 0;
        bool active = true;
        llong end_time = Date::get_mseconds() + timeout.value();
        while (active) {
            if (timeout != -1 && Date::get_mseconds() >= end_time) {
                throw TimeoutError("Operation timed out.");
            }
            switch (status = SSL_shutdown(ssl)) {
                case 0:
                    vlib::sleep::msec(10);
                    continue;
                case 1:
                    active = false;
                    break;
                default:
                    if (errno == EAGAIN) {
                        continue;
                    }
                    if (attempts < 3) {
                        ++attempts;
                        continue;
                    }
                    print(tostr("Shut down error [", status, "] [", get_err(ssl, status), "] [", ::strerror(errno), "]."));
                    throw CloseError(tostr("Shut down error [", get_err(ssl, status), "] [", ::strerror(errno), "]."));
                    break;
            }
        }
        if (active) {
            throw CloseError("Failed to close the socket.");
        }
        
        // Free.
        SSL_free(ssl);
        ssl = nullptr;
        
        // Close underlying socket.
        Socket<>::close(fd);
        
        /* V1.
        int fd = SSL_get_fd(ssl);
        llong end_time = Date::get_mseconds() + timeout.value();
        int status;
        while (true) {
            if (timeout != -1 && Date::get_mseconds() >= end_time) {
                throw TimeoutError("Operation timed out.");
            }
            errno = 0;
            switch (status = SSL_shutdown(ssl)) {
                case 0:
                    vlib::sleep::msec(10);
                    continue;
                case 1:
                    break;
                default:
                    if (errno == EAGAIN) {
                        continue;
                    }
                    print(tostr("Encountered an error while closing the ssl socket [", get_err(ssl, status), "] [", ::strerror(errno), "]."));
                    throw CloseError(tostr("Encountered an error while closing the ssl socket [", get_err(ssl, status), "] [", ::strerror(errno), "]."));
                    
            }
        }
        SSL_free(ssl);
        Socket<>::close(fd);
        ssl = nullptr;
        */
	}

	// Show the certificate subject & issuer.
	static inline
	String 	cert_info(SSL* ssl) {
		String info;
		char* line;
		X509* cert = SSL_get_peer_certificate(ssl);
		if (cert != NULL) {

			// Subject.
			info.concat_r("Subject: ", 9);
			line = X509_NAME_oneline(X509_get_subject_name(cert), 0, 0);
			info.concat_r(line, vlib::len(line));
			free(line);

			// Issuer.
			info.concat_r("\nIssuer: ", 9);
			line = X509_NAME_oneline(X509_get_issuer_name(cert), 0, 0);
			info.concat_r(line, vlib::len(line));
            free(line);

			// Free.
			X509_free(cert);

		}
		return info;
	}
    
    // Get error.
    static inline
    String  get_err(SSL*& ssl, int ret) {
        int err_code = SSL_get_error(ssl, ret);
        String err;
        err.resize(256);
        ERR_error_string_n(err_code, err.data(), 256);
        err.len() = vlib::len(err.data());
        
        // const char* err_lib = ERR_lib_error_string(ERR_GET_LIB(err_code));
        // // const char* err_func = ERR_func_error_string(ERR_GET_FUNC(err_code));
        // const char* err_reason = ERR_reason_error_string(ERR_GET_REASON(err_code));
        // // const char* err_fatal = ERR_fatal_error_string(ERR_FATAL_ERROR(err_code));
        //
        // printf("OpenSSL Error:\n");
        // printf("Library: %s\n", err_lib ? err_lib : "Unknown");
        // // printf("Function: %s\n", err_func ? err_func : "Unknown");
        // printf("Reason: %s\n", err_reason ? err_reason : "Unknown");
        // // printf("Fatal: %s\n", err_fatal ? err_fatal : "Unknown");
        // printf("Error Message: %s\n", err.c_str());
        
        return err;
    }

	// Debug.
	static inline
	auto& 	debug(String& data) {
		ulong e;
		char* buff = new char [256];
		while ((e = ERR_get_error()) != 0) {
			ERR_error_string_n(e, buff, 256);
			data << buff;
			data.concat_r(" [fatal: ", 9);
			data << (ERR_FATAL_ERROR(e) == 1);
			data.concat_r("].\n", 3);
		}
		delete[] buff;
		return data;
	}
	static inline
	void 	debug() {
		ulong e;
		char* buff = new char [256];
		while ((e = ERR_get_error()) != 0) {
			ERR_error_string_n(e, buff, 256);
			vlib::out << buff;
			vlib::out.dump(" [fatal: ", 9);
			vlib::out << (ERR_FATAL_ERROR(e) == 1);
			vlib::out.dump("].\n", 3);
		}
		delete[] buff;
	}
	static inline
	void 	debug(ulong e) {
		char* buff = new char [256];
		ERR_error_string_n(e, buff, 256);
		vlib::out << buff;
		vlib::out.dump(" [fatal: ", 9);
		vlib::out << (ERR_FATAL_ERROR(e) == 1);
		vlib::out.dump("].\n", 3);
		delete[] buff;
	}

};

// ---------------------------------------------------------
// End.

}; 		// End namespace tls.
}; 		// End namespace vlib.
#endif 	// End header.
