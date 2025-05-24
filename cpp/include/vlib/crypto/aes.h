// Author: Daan van den Bergh
// Copyright: © 2022 Daan van den Bergh.

//
// Sources:
// - https://github.com/DaniloVlad/OpenSSL-AES/blob/master/aes.c
// - https://stackoverflow.com/questions/3381614/c-convert-string-to-hexadecimal-and-vice-versa
//

// Header.
#ifndef VLIB_CRYPTO_AES_T_H
#define VLIB_CRYPTO_AES_T_H

// Namespace vlib.
namespace vlib {

// ---------------------------------------------------------
// AES type.
//
// Notes:
// - The attributes are shared, use "copy()" to make an unique copy.
//
// @TODO add mode AEAD

#define VLIB_AES_STRUCT_REQUIRES requires ( \
( \
    Mode == crypto::mode::cbc || \
    Mode == crypto::mode::ctr \
) && \
( \
    Key == crypto::key::aes128 || \
    Key == crypto::key::aes256 \
) \
)

/* @docs
    @chapter: Crypto
    @title: AES
    @description:
        AES type used to encrypt and decrypt data.
    @usage:
        #include <vlib/crypto.h>
        vlib::AES<vlib::crypto::mode::cbc, vlib::crypto::key::aes256> aes;
        vlib::AES256_CBC aes_alias; // alias.
    @note:
        Type `AES` acts as a shared pointer, use `AES::copy()` to create a copy without a link.
*/
template <
	int Mode = 	crypto::mode::cbc,
	int Key = 	crypto::key::aes256
> VLIB_AES_STRUCT_REQUIRES
struct AES {

// Public.
public:
    
    // ---------------------------------------------------------
    // Exceptions.
    
    static excid_t gen_key_err;
    static excid_t gen_iv_err;
    static excid_t encrypt_err;
    static excid_t decrypt_err;

	// ---------------------------------------------------------
	// Aliases.

	using 	This = 			AES;
	using 	Length = 		ullong;

	// ---------------------------------------------------------
	// Attributes.

	struct attr {
		String				key;				// hex encoded key.
		String				rkey;				// raw key.
        Bool                encode = true;
		EVP_CIPHER_CTX*		ctx = nullptr;
	};
	SPtr<attr>			m_attr;

	// ---------------------------------------------------------
	// Static attributes.

	SICE uint 	block_size =	16;

// Private.
private:

	// ---------------------------------------------------------
	// Wrappers.

	// Private constructor.
	explicit constexpr
	AES(const SPtr<attr>& ptr) :
	m_attr(ptr) {}
	explicit constexpr
	AES(SPtr<attr>&& ptr) :
	m_attr(ptr) {}

	// Ciphers.
	constexpr
	auto	cipher() const requires (Key == crypto::key::aes128 && Mode == crypto::mode::cbc) {
		return EVP_aes_128_cbc();
	}
	constexpr
	auto	cipher() const requires (Key == crypto::key::aes256 && Mode == crypto::mode::cbc) {
		return EVP_aes_256_cbc();
	}
	constexpr
	auto	cipher() const requires (Key == crypto::key::aes128 && Mode == crypto::mode::cfb) {
		return EVP_aes_128_cfb();
	}
	constexpr
	auto	cipher() const requires (Key == crypto::key::aes256 && Mode == crypto::mode::cfb) {
		return EVP_aes_256_cfb();
	}
	constexpr
	auto	cipher() const requires (Key == crypto::key::aes128 && Mode == crypto::mode::ctr) {
		return EVP_aes_128_ctr();
	}
	constexpr
	auto	cipher() const requires (Key == crypto::key::aes256 && Mode == crypto::mode::ctr) {
		return EVP_aes_256_ctr();
	}
	constexpr
	auto	cipher() const requires (Key == crypto::key::aes128 && Mode == crypto::mode::ofb) {
		return EVP_aes_128_ofb();
	}
	constexpr
	auto	cipher() const requires (Key == crypto::key::aes256 && Mode == crypto::mode::ofb) {
		return EVP_aes_256_ofb();
	}
    constexpr
    auto    cipher() const requires (Key == crypto::key::aes128 && Mode == crypto::mode::gcm) {
        return EVP_aes_128_gcm();
    }
    constexpr
    auto    cipher() const requires (Key == crypto::key::aes256 && Mode == crypto::mode::gcm) {
        return EVP_aes_256_gcm();
    }

// Public.
public:

	// ---------------------------------------------------------
	// Constructors.

	// Default constructor.
    /*  @docs
        @title: Constructor
        @description:
            Construct an AES type.
        @usage:
            vlib::AES<...> aes;
    */

	explicit constexpr
	AES() :
	m_attr(attr{.ctx = EVP_CIPHER_CTX_new()}) {}

	// Constructor from a key.
    /*  @docs
        @title: Constructor from a key.
        @description:
            Construct an AES object from a key.
        @parameter:
            @name: key
            @description: The hex encoded AES key.
        }
        @usage:
            vlib::AES<...> aes("...");
    */

	explicit constexpr
	AES(const String& key) :
	m_attr(attr{.key = key, .ctx = EVP_CIPHER_CTX_new()})
	{
        m_attr->rkey = Hex::decode(key);
	}

	// Copy constructor.
	constexpr
	AES(const This& obj) :
	m_attr(obj.m_attr) {}

	// Move constructor.
	constexpr
	AES(This&& obj) :
	m_attr(move(obj.m_attr)) {}

	// Destructor.
	constexpr
	~AES() {
		if (m_attr.links() == 0 && m_attr->ctx != nullptr) {
			EVP_CIPHER_CTX_cleanup(m_attr->ctx);
		}
	}

    // ---------------------------------------------------------
    // Assignment operator.
    
    // Copy assignment operator.
    constexpr
    auto& operator =(const This& obj) {
        m_attr.copy(obj.m_attr);
        return *this;
    }

    // Move assignment operator.
    constexpr
    auto& operator =(This&& obj) {
        m_attr.swap(obj.m_attr);
        return *this;
    }
    
	// ---------------------------------------------------------
	// Properties.

	// The encoded key.
    /*  @docs
        @title: Key
        @description:
            Get the key attribute.
    */
	constexpr
	auto&	key() { return m_attr->key; }
    constexpr
    auto&   key() const { return m_attr->key; }
    
    // The encode bool.
    /*  @docs
        @title: Key
        @description:
            Get the encode boolean attribute.
     
            When encode is enabled, everything is hex encoded.
    */
    constexpr
    auto&    encode() { return m_attr->encode; }
    constexpr
    auto&    encode() const { return m_attr->encode; }

	// ---------------------------------------------------------
	// Functions.

	// Reset.
    /*  @docs
        @title: Reset
        @description:
            Reset all attributes of the initialized object.
    */
	constexpr
	auto&	reset() {
		m_attr->key.reset();
		m_attr->rkey.reset();
        m_attr->encode = true;
		if (m_attr->ctx != nullptr) {
			EVP_CIPHER_CTX_cleanup(m_attr->ctx);
			m_attr->ctx = nullptr;
		}
		return 0;
	}

	// Make a unique copy.
    /*  @docs
        @title: Copy
        @description:
            Create a real copy of the object without any links.
    */
	constexpr
	This	copy() {
		return m_attr.copy();
	}
	constexpr
	This	copy() const {
		return m_attr.copy();
	}

	// Set the key (encoded).
    /*  @docs
        @title: Set key
        @description:
            Set the key of the AES type.
        @parameter:
            @name: key
            @description: The hex encoded AES key.
        }
        @funcs: 2
    */
	constexpr
	void    set_key(const String& encoded_key) {
		m_attr->key.copy(encoded_key);
        m_attr->rkey = Hex::decode(encoded_key);
	}
	constexpr
	void    set_key(String&& encoded_key) {
		m_attr->key.swap(encoded_key);
        m_attr->rkey = Hex::decode(encoded_key);
	}

	// Generate a key.
    /*  @docs
        @title: Generate key
        @description:
            Generate and assign a key.
    */
	constexpr
	void    generate_key() {
		m_attr->rkey.resize(Key);
		m_attr->rkey.len() = Key;
		if(!RAND_bytes((uchar*) m_attr->rkey.data(), Key)) {
            throw GenerateKeyError(gen_key_err);
		}
        m_attr->key = Hex::encode(m_attr->rkey);
	}
    SICE
    void    generate_key(String& key) {
        String rkey;
        rkey.resize(Key);
        rkey.len() = Key;
        if(!RAND_bytes((uchar*) rkey.data(), Key)) {
            throw GenerateKeyError(gen_key_err);
        }
        key = Hex::encode(rkey);
    }

	// Encrypt.
    /*  @docs
        @title: Encrypt
        @description:
            Encrypt a string.
        @parameter:
            @name: data
            @description: The data to encrypt.
        }
        @usage:
            vlib::AES<...> aes;
            aes.generate_key();
            vlib::String output = aes.encrypt(output, "Hello World!");
        @funcs: 2
    */
    constexpr
    String  encrypt(const String& data) {
        return encrypt(data.c_str(), data.len());
    }
	constexpr
    String  encrypt(const char* data, const Length len) {

		// Generate IV.
		uchar* iv = new uchar [block_size];
		if(!RAND_bytes(iv, block_size)) {
            throw GenerateIVError(gen_iv_err);
		}

		// Init encryption.
		EVP_EncryptInit(
			m_attr->ctx,
			cipher(),
			(uchar*) m_attr->rkey.data(),
			iv
		);

		// Combined IV.
		String combined ((char*) iv, block_size);

		Length enc_len = len + (len % block_size);
		String cipher;
		cipher.resize(enc_len);

		// Encrypt all the bytes up to but not including the last block
		if(!EVP_EncryptUpdate(
			m_attr->ctx,
			(uchar*) cipher.data(),
			(int*) &enc_len,
			(uchar*) data,
			(int) len
		)) {
            throw EncryptError(encrypt_err);
		}

		// Update length with the amount of bytes written
		cipher.len() = enc_len;

		// EncryptFinal will cipher the last block + Padding
		if(!EVP_EncryptFinal_ex(
			m_attr->ctx,
			(uchar*) cipher.data() + enc_len,
			(int*) &enc_len
		)) {
            throw EncryptError(encrypt_err);
		}

		// Add padding to length
		cipher.len() += enc_len;

		// Append iv.
		combined.concat_r(cipher);
		cipher.swap(combined);

		// Encode.
        if (m_attr->encode) {
            return Hex::encode(cipher.data(), cipher.len());
        }
        return cipher;
	}

	// Decrypt.
    /*  @docs
        @title: Decrypt
        @description:
            Decrypt a string.
        @parameter:
            @name: data
            @description: The data to decrypt.
        }
        @usage:
            vlib::AES<...> aes("Some Key");
            vlib::String output = aes.decrypt("XXX") != 0);
        @funcs: 2
    */
    constexpr
    String  decrypt(const String& data) {
        return decrypt(data.c_str(), data.len());
    }
	constexpr
    String  decrypt(const char* data, const Length len) {
        
		// Decode.
        String decoded;
        if (m_attr->encode) {
            decoded = Hex::decode(data, len);
        } else {
            decoded.reconstruct(data, len);
        }

		// Init encryption.
		EVP_DecryptInit(
			m_attr->ctx,
			cipher(),
			(uchar*) m_attr->rkey.data(),
			(uchar*) decoded.data()
		);

		Length dec_len = 0;
        String output;
		output.resize(decoded.len() + block_size);

		// Encrypt all the bytes up to but not including the last block
		if(!EVP_DecryptUpdate(
			m_attr->ctx,
			(uchar*) output.data(),
			(int*) &dec_len,
			(uchar*) (decoded.data() + block_size),
			(int) (decoded.len() - block_size) // does not work with - block_size, not sure why.
		)) {
            throw DecryptError(decrypt_err);
		}

		// Update length with the amount of bytes written
		output.len() = dec_len;
		
		// EncryptFinal will cipher the last block + Padding
		if(!EVP_DecryptFinal_ex(
			m_attr->ctx,
			(uchar*) output.data() + dec_len,
			(int*) &dec_len
		)) {
            throw DecryptError(decrypt_err);
		}

		// Add padding to length
		output.len() += dec_len;
		return output;

	}

};

// Exceptions;
template <int Mode, int Key> VLIB_AES_STRUCT_REQUIRES
excid_t AES<Mode, Key>::gen_key_err = exceptions::add_err("Encountered an error while generating a key.");
template <int Mode, int Key> VLIB_AES_STRUCT_REQUIRES
excid_t AES<Mode, Key>::gen_iv_err = exceptions::add_err("Encountered an error while generating the iv.");
template <int Mode, int Key> VLIB_AES_STRUCT_REQUIRES
excid_t AES<Mode, Key>::encrypt_err = exceptions::add_err("Encountered an error while encrypting.");
template <int Mode, int Key> VLIB_AES_STRUCT_REQUIRES
excid_t AES<Mode, Key>::decrypt_err = exceptions::add_err("Encountered an error while decrypting.");

// ---------------------------------------------------------
// Aliases.

using AES128_CBC = AES<crypto::mode::cbc, crypto::key::aes128>;
using AES256_CBC = AES<crypto::mode::cbc, crypto::key::aes256>;
using AES128_CTR = AES<crypto::mode::ctr, crypto::key::aes128>;
using AES256_CTR = AES<crypto::mode::ctr, crypto::key::aes256>;

// ---------------------------------------------------------
// End.

}; 		// End namespace vlib.
#endif 	// End header.
