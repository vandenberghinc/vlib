// Author: Daan van den Bergh
// Copyright: © 2022 Daan van den Bergh.

// Header.
#ifndef VLIB_CRYPTO_MODE_H
#define VLIB_CRYPTO_MODE_H

// Namespace vlib.
namespace vlib {

// Namespace crypto.
namespace crypto {

// Namespace method.
namespace mode {

// Encryption & encoding modes.
/*  @docs
    @chapter: Crypto
    @title: Modes
    @description:
        Encryption and encoding modes
    @usage:
        #include <vlib/crypto.h>
        int cbc = vlib::crypto::mode::cbc;
        int sha256 = vlib::crypto::mode::sha256;
	@show_code: true
*/
enum modes {
	cbc = 		3,
	cfb = 		4,
	ctr = 		5,
    // ecb =         6, //unsafe
	ofb = 		7,
    gcm =       8,
    sha1 =      9,
    sha2 =      10,
	sha256 = 	11,
	sha512 = 	12,
};

}; 		// End namespace mode.
}; 		// End namespace crypto.
}; 		// End namespace vlib.
#endif 	// End header.
