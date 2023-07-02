// Author: Daan van den Bergh
// Copyright: © 2022 Daan van den Bergh.

// Header.
#ifndef VLIB_CRYPTO_KEY_H
#define VLIB_CRYPTO_KEY_H

// Namespace vlib.
namespace vlib {

// Namespace crypto.
namespace crypto {

// Namespace key.
namespace key {

// Key lengths.
/*  @docs {
    @chapter: crypto
    @title: Keys
    @description:
        Key lengths enum.
    @usage:
        #include <vlib/crypto.h>
        int len0 = vlib::crypto::key::length::aes128;
        int len1 = vlib::crypto::key::length::aes256;
	@show_code: true
} */
enum length {
	aes128 = 16,
	aes256 = 32,
};

}; 		// End namespace key.
}; 		// End namespace crypto.
}; 		// End namespace vlib.
#endif 	// End header.
