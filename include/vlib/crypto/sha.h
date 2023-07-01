// Author: Daan van den Bergh
// Copyright: © 2022 Daan van den Bergh.

//
// NOTES:
//
//  - derived of: https://github.com/mapbox/gzip-hpp
//

// Header.
#ifndef VLIB_CRYPTO_SHA256_H
#define VLIB_CRYPTO_SHA256_H

// Namespace vlib.
namespace vlib {

// ---------------------------------------------------------
// Static SHA256 struct.
#define VLIB_SHA_STRUCT_REQUIRES requires ( \
    Mode == crypto::mode::sha1 || \
    Mode == crypto::mode::sha256 || \
    Mode == crypto::mode::sha512 \
)

/* @docs {
    @chapter: crypto
    @title: SHA
    @description:
        Static SHA256 and SHA512 types.
    @usage:
        #include <vlib/crypto.h>
        vlib::sha<crypto::mode::sha256>::sign(...);
        vlib::SHA256::sign(...); // alias.
        vlib::SHA512::sign(...); // alias.
} */
template <int Mode = crypto::mode::sha256> VLIB_SHA_STRUCT_REQUIRES
struct SHA {

// Public.
public:

    // ---------------------------------------------------------
    // Exceptinos.
    
    static excid_t gen_key_err;
    static excid_t sign_err;
    static excid_t alloc_err;
    static excid_t hash_err;

// Public.
public:

    // ---------------------------------------------------------
    // Functions.
    
    // EVP helper.
    SICE
    auto evp() requires (Mode == crypto::mode::sha1) {
        return EVP_sha1();
    }
    SICE
    auto evp() requires (Mode == crypto::mode::sha256) {
        return EVP_sha256();
    }
    SICE
    auto evp() requires (Mode == crypto::mode::sha512) {
        return EVP_sha512();
    }
    
	// Generate key.
    /*  @docs {
        @title: Generate key
        @description:
            Generate a hex encoded key.
        @parameter: {
            @name: len
            @description: The length of the key to generate.
        }
        @usage:
            vlib::String output = vlib::SHA256::generate_key(output, 32);
    } */
	static inline
	String 	generate_key(ullong len) {
		uchar* key = new uchar [len];
		if(!RAND_bytes(key, (uint) len)) {
			delete[] key;
            throw GenerateKeyError(gen_key_err);
		}
        String output = Hex::encode((const char*) key, len);
		delete[] key;
		return output;
	}

	// SHA HMAC.
    /*  @docs {
        @title: HMAC
        @description:
            Sign data with a key.
        @parameter: {
            @name: key
            @description: The hex encoded key.
        }
        @parameter: {
            @name: data
            @description: The data to sign.
        }
        @usage:
            vlib::String output = vlib::SHA256::hmac("Some Key", "Hello World!");
        @funcs: 2
    } */
    SICE
    String  hmac(const String& key, const String& data) {
        return hmac(key.data(), key.len(), data.data(), data.len());
    }
	static inline
	String  hmac(
		const char* 	key,
		ullong			klen,
		const char* 	data,
		ullong			dlen
	) {
		uchar*	result = new uchar [EVP_MAX_MD_SIZE];
		uint 	len = 0;
		if (HMAC(evp(), key, (uint) klen, (const uchar*) data, dlen, result, &len) == NULL) {
			delete[] result;
            throw SignError(sign_err);
		}
        String output = Hex::encode((const char*) result, len);
		delete[] result;
		return output;
	}
    
    // Sign data.
    /*  @docs {
     *  @title: HMAC
     *  @description:
     *      Sign data with a key.
     *  @parameter: {
     *      @name: key
     *      @description: The hex encoded key.
     *  }
     *  @parameter: {
     *      @name: data
     *      @description: The data to sign.
     *  }
     *  @usage:
     *      vlib::String output = vlib::SHA256::hmac("Some Key", "Hello World!");
     *  @funcs: 2
     } */
    static
    String  hash(const String& data) requires (Mode == crypto::mode::sha1) {
        // g++ calls it ambigous if you call "hash(data.data(), data.len())" here.
        String hash;
        hash.resize(SHA_DIGEST_LENGTH);
        hash.len() = SHA_DIGEST_LENGTH;
        SHA1((uchar*) data.data(), data.len(), (uchar*) hash.data());
        return hash;
    }
    static
    String  hash(const char* data, ullong dlen) requires (Mode == crypto::mode::sha1) {
        String hash;
        hash.resize(SHA_DIGEST_LENGTH);
        hash.len() = SHA_DIGEST_LENGTH;
        SHA1((uchar*) data, dlen, (uchar*) hash.data());
        return hash;
    }
    static
    String  hash(const String& data) requires (Mode == crypto::mode::sha256) {
        // g++ calls it ambigous if you call "hash(data.data(), data.len())" here.
        String hash;
        hash.resize(SHA256_DIGEST_LENGTH);
        hash.len() = SHA256_DIGEST_LENGTH;
        SHA256((uchar*) data.data(), data.len(), (uchar*) hash.data());
        return hash;
    }
    static
    String  hash(const char* data, ullong dlen) requires (Mode == crypto::mode::sha256) {
        String hash;
        hash.resize(SHA256_DIGEST_LENGTH);
        hash.len() = SHA256_DIGEST_LENGTH;
        SHA256((uchar*) data, dlen, (uchar*) hash.data());
        return hash;
    }
    static
    String  hash(const String& data) requires (Mode == crypto::mode::sha512) {
        // g++ calls it ambigous if you call "hash(data.data(), data.len())" here.
        String hash;
        hash.resize(SHA512_DIGEST_LENGTH);
        hash.len() = SHA512_DIGEST_LENGTH;
        SHA512((uchar*) data.data(), data.len(), (uchar*) hash.data());
        return hash;
    }
    static
    String  hash(const char* data, ullong dlen) requires (Mode == crypto::mode::sha512) {
        String hash;
        hash.resize(SHA512_DIGEST_LENGTH);
        hash.len() = SHA512_DIGEST_LENGTH;
        SHA512((uchar*) data, dlen, (uchar*) hash.data());
        return hash;
    }
    
    // SHA Digest.
    /*  @docs {
        @title: SHA Digest
        @description:
            SHA Digest.
        @parameter: {
            @name: output
            @description: A reference to the output string.
        }
        @parameter: {
            @name: data
            @description: The data to sign.
        }
        @return:
            Returns the digest.
        @usage:
            vlib::String output = vlib::SHA256::digest("Hello World!");
        @funcs: 2
    } */
    SICE
    String     digest(const String& data) {
        return digest(data.data(), data.len());
    }
    static inline
    String     digest(const char* data, ullong dlen) {
        
        BIO * p_bio_md  = nullptr;
        BIO * p_bio_mem = nullptr;
        // try
        // {
        p_bio_md = BIO_new(BIO_f_md());
        if (!p_bio_md) {
            throw AllocError(alloc_err);
        }
        BIO_set_md(p_bio_md, evp());
        p_bio_mem = BIO_new_mem_buf((void*)data, (int) dlen);
        if (!p_bio_mem) {
            throw AllocError(alloc_err);
        }
        BIO_push(p_bio_md, p_bio_mem);
        std::vector<char> buf(dlen);
        for (;;)
        {
            auto nread = BIO_read(p_bio_md, buf.data(), (int) buf.size());
            if (nread  < 0) {
                throw HashError(hash_err);
            }
            if (nread == 0) { break; } // eof
        }
        char md_buf[EVP_MAX_MD_SIZE];
        auto md_len = BIO_gets(p_bio_md, md_buf, sizeof(md_buf));
        if (md_len <= 0) {
            throw HashError(hash_err);
        }
        String result(md_buf, md_len);
        BIO_free_all(p_bio_md);
        return result;
        // }
        // catch (...)
        // {
        //     if (p_bio_md) { BIO_free_all(p_bio_md); }
        //     throw;
        // }
    }

};

// Exceptions.
template <int Mode> VLIB_SHA_STRUCT_REQUIRES excid_t SHA<Mode>::gen_key_err = exceptions::add_err("Encountered an error while generating a key.");
template <int Mode> VLIB_SHA_STRUCT_REQUIRES excid_t SHA<Mode>::sign_err = exceptions::add_err("Encountered while signing.");
template <int Mode> VLIB_SHA_STRUCT_REQUIRES excid_t SHA<Mode>::alloc_err = exceptions::add_err("Encountered while allocating.");
template <int Mode> VLIB_SHA_STRUCT_REQUIRES excid_t SHA<Mode>::hash_err = exceptions::add_err("Encountered while hashing.");

// ---------------------------------------------------------
// Aliases.

using SHA1 = SHA<crypto::mode::sha1>;
using SHA256 = SHA<crypto::mode::sha256>;
using SHA512 = SHA<crypto::mode::sha512>;

// ---------------------------------------------------------
// End.

}; 		// End namespace vlib.
#endif 	// End header.
