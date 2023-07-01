// Author: Daan van den Bergh
// Copyright: © 2022 Daan van den Bergh.
//
// TO DO:
//  3: math/Numeric
//  4: math/SN
//  5: additional/DataFrame
//  6: additional/variant_t
//

// Includes.
#include "../include/vlib/crypto.h"
// Header.
#ifndef TEST_CRYPTO_H
#define TEST_CRYPTO_H

// Tester.
namespace test {
struct crypto {
int operator()() const {

	// Namespaces.
	using namespace vlib;

	// ---------------------------------------------------------
	// AES.

	vlib::AES aes;
	aes.generate_key();

	String data = "Hello World!";
	String encrypted = aes.encrypt(data);
	String decrypted = aes.decrypt(encrypted);
	vtest::test("vlib::AES::encrypt & decrypt", "12", decrypted.len());
	vtest::test("vlib::AES::encrypt & decrypt", "Hello World!", decrypted.c_str());
	
	// ---------------------------------------------------------
	// SHA.

	String key = "Some secret Key";
	String sign = SHA256::sign(key, data);
	vtest::test("vlib::SHA256::sign", "A0CA2C0D579A5A6D61FE50B882B67D58C64399C3A80BA5F0473D28C96A34D50E", sign.c_str());
	sign = SHA512::sign(key, data);
	vtest::test("vlib::SHA512::sign", "DBE6AA7C09AA8812FD43EE9213BAF9695D170BD95216A03232210222D91595067070275E48A4B6BC0B416AF2233C9CA9CFA0C3F326CA1E7BA925AF077F5E1134", sign.c_str());

	// ---------------------------------------------------------
	// End.
	return vtest::exit_status();

};
}; 		// End struct.
}; 		// End namespace.
#endif  // End header.














