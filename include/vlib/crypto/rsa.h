// Author: Daan van den Bergh
// Copyright: © 2022 Daan van den Bergh.

//
// NOTES:
//
//  - derived of: https://github.com/mapbox/gzip-hpp
//

// Header.
#ifndef VLIB_CRYPTO_RSA_H
#define VLIB_CRYPTO_RSA_H

// Namespace vlib.
namespace vlib {

// ---------------------------------------------------------
// Static SHA256 struct.

/* @docs {
    @chapter: crypto
    @title: RSA
    @description:
        Very simple RSA object.
    @usage:
        #include <vlib/crypto.h>
        vlib::RSA rsa(...);
} */
struct RSA {

// Public.
public:

    // ---------------------------------------------------------
    // Exceptinos.
    
    static excid_t read_priv_key_err;
    static excid_t read_pub_key_err;
    static excid_t sign_err;
    
// Private.
private:
    
    // ---------------------------------------------------------
    // Attributes.
    
    SPtr<EVP_PKEY*> m_priv;

    // ---------------------------------------------------------
    // Private functions.
    
    // Load private key.
    static
    EVP_PKEY* load_priv_key(const Path& path) {
        FILE* fp = vlib::open(path.c_str(), vlib::file::read);
        if (!fp) {
            throw OpenError(to_str("Encountered an error while opening \"", path, "\" [", ::strerror(errno), "]."));
        }
        EVP_PKEY* key = PEM_read_PrivateKey(fp, nullptr, nullptr, nullptr);
        fclose(fp);
        if (!key) {
            throw RSAError(read_priv_key_err);
        }
        return key;
    }
    
    // Initialize private key from string.
    static
    EVP_PKEY* init_priv_key(const String& data) {
        BIO* bio = BIO_new( BIO_s_mem() );
        BIO_write(bio, data.data(), (uint) data.len());
        EVP_PKEY* key = PEM_read_bio_PrivateKey(bio, nullptr, nullptr, nullptr);
        BIO_free(bio);
        if (!key) {
            throw RSAError(read_priv_key_err);
        }
        return key;
    }
    
// Public.
public:

    // ---------------------------------------------------------
    // Constructors.
    
    // Default constructor.
    constexpr RSA() = default;
    
    // Constructor from private key data.
    constexpr
    RSA(const String& data)
    {
        if (data.is_defined()) {
            m_priv = init_priv_key(data);
        }
    }
    
    // Constructor from private key path.
    template <typename Type> requires (is_Path<Type>::value) constexpr
    RSA(const Type& path)
    {
        if (path.is_defined()) {
            m_priv = load_priv_key(path);
        }
    }
    
    // Destructor.
    constexpr
    ~RSA() {
        if (m_priv && m_priv.links() == 0) {
            EVP_PKEY_free(*m_priv);
        }
    }
    
    // ---------------------------------------------------------
    // Attributes.
    
    // Get the private key.
    /*  @docs {
     *  @title: Private Key
     *  @description: Get the private key attribute.
     *  @attribute: true
     } */
    constexpr auto& private_key() { return *m_priv; }
    constexpr auto& private_key() const { return *m_priv; }
    
    // Is defined.
    /*  @docs {
     *  @title: Is defined
     *  @description: Check if the object is defined.
     *  @attribute: true
     } */
    constexpr bool is_defined() const { return m_priv.is_defined(); }
    
    // Is undefined.
    /*  @docs {
     *  @title: Is undefined
     *  @description: Check if the object is undefined.
     *  @attribute: true
     } */
    constexpr bool is_undefined() const { return m_priv.is_undefined(); }
    
    // ---------------------------------------------------------
    // Functions.
    
	// Sign data.
    /*  @docs {
        @title: Sign
        @description:
            Sign data with the private key.
        @parameter: {
            @name: data
            @description: The data to sign.
        }
        @usage:
            vlib::RSA rsa ("/path/to/private_key")
            vlib::String output = rsa.sign("Hello World!");
        @funcs: 2
    } */
    template <int Algorithm = crypto::mode::sha256>
    String  sign(const String& data) const {
        return sign<Algorithm>(data.data(), data.len());
    }
    template <int Algorithm = crypto::mode::sha256>
	String  sign(const char* data, ullong dlen) const {
        
        // Initialize context.
        EVP_MD_CTX* ctx = EVP_MD_CTX_new();
        if (!ctx) {
            throw RSAError(sign_err);
        }

        // Initialize.
        if (EVP_SignInit(ctx, SHA<Algorithm>::evp()) != 1) {
            EVP_MD_CTX_free(ctx);
            throw RSAError(sign_err);
        }
        if (EVP_SignUpdate(ctx, data, dlen) != 1) {
            EVP_MD_CTX_free(ctx);
            throw RSAError(sign_err);
        }
        
        // Sign.
        String signature;
        signature.resize(EVP_PKEY_size(*m_priv));
        uint signature_len;
        if (EVP_SignFinal(ctx, (uchar*) signature.data(), &signature_len, *m_priv) != 1) {
            EVP_MD_CTX_free(ctx);
            throw RSAError(sign_err);
        }
        signature.len() = (ullong) signature_len;
        
        // Free.
        EVP_MD_CTX_free(ctx);
        
        // Handler.
        return signature;
        
	}

};

// Exceptions.
excid_t RSA::read_priv_key_err = exceptions::add_err("Encountered an error while reading the private key.");
excid_t RSA::read_pub_key_err = exceptions::add_err("Encountered an error while reading the public key.");
excid_t RSA::sign_err = exceptions::add_err("Encountered an error while signing the data.");


// ---------------------------------------------------------
// End.

}; 		// End namespace vlib.
#endif 	// End header.
