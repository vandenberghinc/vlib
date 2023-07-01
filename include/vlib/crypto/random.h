// Author: Daan van den Bergh
// Copyright: © 2022 Daan van den Bergh.

//
// Sources:
// - https://github.com/DaniloVlad/OpenSSL-AES/blob/master/aes.c
// - https://stackoverflow.com/questions/3381614/c-convert-string-to-hexadecimal-and-vice-versa
//

// Header.
#ifndef VLIB_CRYPTO_RANDOM_H
#define VLIB_CRYPTO_RANDOM_H

// Namespace vlib.
namespace vlib {

// Namespace crypto.
namespace crypto {

static int random_stream_fd = 0;

// Generate random bytes.
auto random(uint len) {
    
    // /dev/random is not secure because of blocking: https://github.com/jedisct1/libsodium/issues/49
    static const char* device = "/dev/urandom";
    
    // Open file descriptor.
    if (random_stream_fd == 0) {
        if ((random_stream_fd = ::open(device, O_RDONLY)) < 0) {
            throw OpenError(tostr("Unable to open \"", device, "\" [", ::strerror(errno), "]."));
        }
    }
    
    // Read.
    ullong bytes = 0;
    String output;
    while (output.len() < len) {
        output.resize(output.len() + len);
        if (
            (bytes = ::read(random_stream_fd, output.data(), len - output.len())) < 0 &&
            errno != EINTR &&
            errno != EAGAIN
        ) {
            throw ReadError(tostr("Read error [", ::strerror(errno), "]."));
        }
        output.len() += bytes;
    }
    return output;
    
}


};      // End namespace crypto.
}; 		// End namespace vlib.
#endif 	// End header.
