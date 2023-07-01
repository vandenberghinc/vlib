// Author: Daan van den Bergh
// Copyright: © 2022 Daan van den Bergh.
//

// Includes.
#include <vtest/vtest.h>
#include "../../include/vlib/crypto.h"

// Main.
int main() {

	using namespace vlib;

	vlib::AES aes;
	aes.generate_key();

	String data = "Hello World!";
	String encrypted = aes.encrypt(data.data(), data.len());
	String decrypted = aes.decrypt(encrypted.data(), encrypted.len());
	print("Encrypted: ", encrypted);
	print("Decrypted: ", decrypted);

	String key = "Some secret Key";
	String sign = SHA256::hmac(key, data);
	print("Signed: ", sign);

	String new_key = SHA256::generate_key(32);
	print("SHA key: ", new_key);


//	crypto::AES256_CBC aes;
//	String data = "Hello World!", encoded, decoded;
//	aes.encode<crypto::mode::base64>(encoded, data);
//	aes.decode<crypto::mode::base64>(decoded, encoded);
//	vtest::test("AES::encode & decode", "Hello World!", decoded.c_str());

//	aes.generate_key();

//	String encrypted, decrypted;
//	aes.encrypt(encrypted, data);
//	aes.decrypt(decrypted, encrypted);
//	vtest::test("AES::encrypt & decrypt", "12", decrypted.len());
//	vtest::test("AES::encrypt & decrypt", "Hello World!", decrypted.c_str());

//	String digest;
//	crypto::sha3_256::sign(digest, data);
//	print("Signed: ", digest);

	return 0;
}
