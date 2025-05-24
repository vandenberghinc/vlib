/*
 Author: Daan van den Bergh
 Copyright: © 2022 Daan van den Bergh.
*/

//
// Sources:
// - https://github.com/spcnvdr/xchacha20/blob/master/src/xchacha20.c
//

// Header.
#ifndef VLIB_CRYPTO_XCHACHA20_H
#define VLIB_CRYPTO_XCHACHA20_H

// Namespace vlib.
namespace vlib {

// Namespace crypto.
namespace crypto {

// ---------------------------------------------------------
// XChaCha20.

struct XChaCha20 {
    
// Private.
public:
    
    /** Key and IV sizes that are supported by XChaCha20.
     *  All sizes are in bits.
     */
    #define NAME "XChaCha20"
    #define KEYSIZE 256                 /* 256-bits, 32 bytes */
    #define BLOCKSIZE 512               /* 512-bits, 64 bytes */
    #define IVSIZE 192                  /* 192-bits, 24 bytes */

    /* XChaCha20 block size in bytes */
    #define XCHACHA_BLOCKLENGTH 64

    /* The following macros are used to obtain exact-width results. */
    #define U8V(v) ((uint8_t)(v) & (0xFF))
    #define U16V(v) ((uint16_t)(v) & (0xFFFF))
    #define U32V(v) ((uint32_t)(v) & (0xFFFFFFFF))
    #define U64V(v) ((uint64_t)(v) & (0xFFFFFFFFFFFFFFFF))


    /** The following macros return words with their bits rotated over n
     *  positions to the left/right.
     */
    #define ROTL32(v, n) \
      (U32V((v) << (n)) | ((v) >> (32 - (n))))


    /** The following macros load words from an array of bytes with
     *  different types of endianness, and vice versa.
     */
    #define U8TO32_LITTLE(p) \
      (((uint32_t)((p)[0])      ) | \
       ((uint32_t)((p)[1]) <<  8) | \
       ((uint32_t)((p)[2]) << 16) | \
       ((uint32_t)((p)[3]) << 24))

    #define U32TO8_LITTLE(p, v) \
      do { \
        (p)[0] = U8V((v)      ); \
        (p)[1] = U8V((v) >>  8); \
        (p)[2] = U8V((v) >> 16); \
        (p)[3] = U8V((v) >> 24); \
      } while (0)


    #define ROTATE(v,c) (ROTL32(v,c))
    #define XOR(v,w) ((v) ^ (w))
    #define PLUS(v,w) (U32V((v) + (w)))
    #define PLUSONE(v) (PLUS((v),1))


    /* The ChaCha quarter round */
    #define QUARTERROUND(a,b,c,d) \
      a = PLUS(a,b); d = ROTATE(XOR(d,a),16); \
      c = PLUS(c,d); b = ROTATE(XOR(b,c),12); \
      a = PLUS(a,b); d = ROTATE(XOR(d,a), 8); \
      c = PLUS(c,d); b = ROTATE(XOR(b,c), 7);
    
    struct Context {
        uint32_t input[16];
    };
    
    // ---------------------------------------------------------
    // Attributes.
    
    String m_key;
    
    // ---------------------------------------------------------
    // Private functions.
    
    /* hchacha an intermediary step towards XChaCha20 based on the
     * construction and security proof used to create XSalsa20.
     * @param out Holds output of hchacha
     * @param in The input to process with hchacha
     * @param k The key to use with hchacha
     *
     */
    static inline
    void xchacha_hchacha20(uint8_t *out, const uint8_t *in, const uint8_t *k){
        int i;
        uint32_t x0, x1, x2, x3, x4, x5, x6, x7;
        uint32_t x8, x9, x10, x11, x12, x13, x14, x15;

        /* XChaCha Constant */
        x0 = 0x61707865;
        x1 = 0x3320646e;
        x2 = 0x79622d32;
        x3 = 0x6b206574;

        x4  = U8TO32_LITTLE(k +  0);
        x5  = U8TO32_LITTLE(k +  4);
        x6  = U8TO32_LITTLE(k +  8);
        x7  = U8TO32_LITTLE(k + 12);
        x8  = U8TO32_LITTLE(k + 16);
        x9  = U8TO32_LITTLE(k + 20);
        x10 = U8TO32_LITTLE(k + 24);
        x11 = U8TO32_LITTLE(k + 28);
        x12 = U8TO32_LITTLE(in +  0);
        x13 = U8TO32_LITTLE(in +  4);
        x14 = U8TO32_LITTLE(in +  8);
        x15 = U8TO32_LITTLE(in + 12);

        for (i = 0; i < 10; i++){
            QUARTERROUND(x0, x4,  x8, x12);
            QUARTERROUND(x1, x5,  x9, x13);
            QUARTERROUND(x2, x6, x10, x14);
            QUARTERROUND(x3, x7, x11, x15);
            QUARTERROUND(x0, x5, x10, x15);
            QUARTERROUND(x1, x6, x11, x12);
            QUARTERROUND(x2, x7,  x8, x13);
            QUARTERROUND(x3, x4,  x9, x14);
        }

        U32TO8_LITTLE(out +  0, x0);
        U32TO8_LITTLE(out +  4, x1);
        U32TO8_LITTLE(out +  8, x2);
        U32TO8_LITTLE(out + 12, x3);
        U32TO8_LITTLE(out + 16, x12);
        U32TO8_LITTLE(out + 20, x13);
        U32TO8_LITTLE(out + 24, x14);
        U32TO8_LITTLE(out + 28, x15);
    }
    
    /** Setup the XChaCha20 encryption key
     * @param ctx The XChaCha20 Context to use
     * @param k A buffer holding the encryption key to use
     * @note Valid key sizes are 256 bits, and the only valid IV size
     * is 192 bits.
     *
     */
    static inline
    void xchacha_keysetup(Context& ctx, const uint8_t *k, uint8_t *iv){
        /* The sub-key to use */
        uint8_t k2[32];

        /* Generate the sub-key to use from the 256-bit key and 192-bit iv
         * We then use this sub-key and the last 8 bytes of the iv
         * as normal.
         */
        xchacha_hchacha20(k2, iv, k);


        ctx.input[0] = 0x61707865;
        ctx.input[1] = 0x3320646e;
        ctx.input[2] = 0x79622d32;
        ctx.input[3] = 0x6b206574;
        ctx.input[4] = U8TO32_LITTLE(k2 + 0);
        ctx.input[5] = U8TO32_LITTLE(k2 + 4);
        ctx.input[6] = U8TO32_LITTLE(k2 + 8);
        ctx.input[7] = U8TO32_LITTLE(k2 + 12);
        ctx.input[8] = U8TO32_LITTLE(k2 + 16);
        ctx.input[9] = U8TO32_LITTLE(k2 + 20);
        ctx.input[10] = U8TO32_LITTLE(k2 + 24);
        ctx.input[11] = U8TO32_LITTLE(k2 + 28);
        ctx.input[12] = 0;            /* Internal counter */
        ctx.input[13] = 0;         /* Internal counter */
        ctx.input[14] = U8TO32_LITTLE(iv + 16);
        ctx.input[15] = U8TO32_LITTLE(iv + 20);
    }
    
    /** Set the internal counter to a specific number. Depending
     * on the specification, sometimes the counter is started at 1.
     * @param ctx The XChaCha context to modify
     * @param counter The number to set the counter to
     *
     */
    static inline
    void xchacha_set_counter(Context& ctx, uint8_t *counter){
        ctx.input[12] = U8TO32_LITTLE(counter + 0);
        ctx.input[13] = U8TO32_LITTLE(counter + 4);
    }
    
    /** Encrypt data with the XChaCha20 stream cipher
     * @param ctx The XChaCha20 context with the cipher's state to use
     * @param m The plaintext to encrypt
     * @param c A buffer to hold the ciphertext created from the plaintext
     * @param bytes The length of the plaintext to encrypt
     * @note length of c must be >= the length of m otherwise a buffer
     * overflow will occur.
     *
     */
    static inline
    void xchacha_encrypt_bytes(Context& ctx, const uint8_t *m, uint8_t *c, uint32_t bytes){
        uint32_t x0, x1, x2, x3, x4, x5, x6, x7, x8, x9, x10, x11, x12, x13, x14, x15;
        uint32_t j0, j1, j2, j3, j4, j5, j6, j7, j8, j9, j10, j11, j12, j13, j14, j15;
        uint8_t *ctarget = NULL;
        uint8_t tmp[64];
        uint32_t i;

        if (!bytes) return;

        j0 = ctx.input[0];
        j1 = ctx.input[1];
        j2 = ctx.input[2];
        j3 = ctx.input[3];
        j4 = ctx.input[4];
        j5 = ctx.input[5];
        j6 = ctx.input[6];
        j7 = ctx.input[7];
        j8 = ctx.input[8];
        j9 = ctx.input[9];
        j10 = ctx.input[10];
        j11 = ctx.input[11];
        j12 = ctx.input[12];
        j13 = ctx.input[13];
        j14 = ctx.input[14];
        j15 = ctx.input[15];

        for (;;) {
            if (bytes < 64) {
                for (i = 0;i < bytes;++i)
                    tmp[i] = m[i];
                m = tmp;
                ctarget = c;
                c = tmp;
            }
            x0 = j0;
            x1 = j1;
            x2 = j2;
            x3 = j3;
            x4 = j4;
            x5 = j5;
            x6 = j6;
            x7 = j7;
            x8 = j8;
            x9 = j9;
            x10 = j10;
            x11 = j11;
            x12 = j12;
            x13 = j13;
            x14 = j14;
            x15 = j15;

            /* Do 20 rounds instead of 8 */
            for (i = 20;i > 0;i -= 2) {
                QUARTERROUND( x0, x4, x8,x12)
                QUARTERROUND( x1, x5, x9,x13)
                QUARTERROUND( x2, x6,x10,x14)
                QUARTERROUND( x3, x7,x11,x15)
                QUARTERROUND( x0, x5,x10,x15)
                QUARTERROUND( x1, x6,x11,x12)
                QUARTERROUND( x2, x7, x8,x13)
                QUARTERROUND( x3, x4, x9,x14)
            }
            x0 = PLUS(x0,j0);
            x1 = PLUS(x1,j1);
            x2 = PLUS(x2,j2);
            x3 = PLUS(x3,j3);
            x4 = PLUS(x4,j4);
            x5 = PLUS(x5,j5);
            x6 = PLUS(x6,j6);
            x7 = PLUS(x7,j7);
            x8 = PLUS(x8,j8);
            x9 = PLUS(x9,j9);
            x10 = PLUS(x10,j10);
            x11 = PLUS(x11,j11);
            x12 = PLUS(x12,j12);
            x13 = PLUS(x13,j13);
            x14 = PLUS(x14,j14);
            x15 = PLUS(x15,j15);

            x0 = XOR(x0,U8TO32_LITTLE(m + 0));
            x1 = XOR(x1,U8TO32_LITTLE(m + 4));
            x2 = XOR(x2,U8TO32_LITTLE(m + 8));
            x3 = XOR(x3,U8TO32_LITTLE(m + 12));
            x4 = XOR(x4,U8TO32_LITTLE(m + 16));
            x5 = XOR(x5,U8TO32_LITTLE(m + 20));
            x6 = XOR(x6,U8TO32_LITTLE(m + 24));
            x7 = XOR(x7,U8TO32_LITTLE(m + 28));
            x8 = XOR(x8,U8TO32_LITTLE(m + 32));
            x9 = XOR(x9,U8TO32_LITTLE(m + 36));
            x10 = XOR(x10,U8TO32_LITTLE(m + 40));
            x11 = XOR(x11,U8TO32_LITTLE(m + 44));
            x12 = XOR(x12,U8TO32_LITTLE(m + 48));
            x13 = XOR(x13,U8TO32_LITTLE(m + 52));
            x14 = XOR(x14,U8TO32_LITTLE(m + 56));
            x15 = XOR(x15,U8TO32_LITTLE(m + 60));

            j12 = PLUSONE(j12);
            if (!j12) {
                j13 = PLUSONE(j13);
            }

            U32TO8_LITTLE(c + 0,x0);
            U32TO8_LITTLE(c + 4,x1);
            U32TO8_LITTLE(c + 8,x2);
            U32TO8_LITTLE(c + 12,x3);
            U32TO8_LITTLE(c + 16,x4);
            U32TO8_LITTLE(c + 20,x5);
            U32TO8_LITTLE(c + 24,x6);
            U32TO8_LITTLE(c + 28,x7);
            U32TO8_LITTLE(c + 32,x8);
            U32TO8_LITTLE(c + 36,x9);
            U32TO8_LITTLE(c + 40,x10);
            U32TO8_LITTLE(c + 44,x11);
            U32TO8_LITTLE(c + 48,x12);
            U32TO8_LITTLE(c + 52,x13);
            U32TO8_LITTLE(c + 56,x14);
            U32TO8_LITTLE(c + 60,x15);

            if (bytes <= 64) {
                if (bytes < 64) {
                    for (i = 0;i < bytes;++i)
                        ctarget[i] = c[i];
                }
                ctx.input[12] = j12;
                ctx.input[13] = j13;
                return;
            }
            bytes -= 64;
            c += 64;
            m += 64;
        }
    }

// Public.
public:
    
    // ---------------------------------------------------------
    // Constructor.
    
    // Default constructor.
    constexpr
    XChaCha20() = default;
    
    // Constructor.
    constexpr
    XChaCha20(const String& key) :
    m_key(key)
    {}
    constexpr
    XChaCha20(String&& key) :
    m_key(key)
    {}
    
    
    
};


};      // End namespace crypto.
};         // End namespace vlib.
#endif     // End header.
