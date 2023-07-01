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
/*  @docs {
    @chapter: crypto
    @title: Modes
    @description:
        Encryption and encoding modes
    @usage:
        #include <vlib/crypto.h>
        int base64 = vlib::crypto::mode::base64;
        int hex = vlib::crypto::mode::Hex;
        int cbc = vlib::crypto::mode::cbc;
        int cfb = vlib::crypto::mode::cfb;
        int ctr = vlib::crypto::mode::ctr;
        int ecb = vlib::crypto::mode::ecb;
        int ofb = vlib::crypto::mode::ofb;
        int sha256 = vlib::crypto::mode::sha256;
        int sha512 = vlib::crypto::mode::sha512;
} */
enum modes {
	base64 = 	1,
	hex = 		2,
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
