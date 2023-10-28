// Author: Daan van den Bergh
// Copyright: © 2022 Daan van den Bergh.

//
// Sources:
// - https://stackoverflow.com/questions/342409/how-do-i-base64-encode-decode-in-c/41094722#41094722
//

// Header.
#ifndef VLIB_ENCODING_BASE64_H
#define VLIB_ENCODING_BASE64_H

// Namespace vlib.
namespace vlib {

// ---------------------------------------------------------
// Hex static struct.
/* @docs
    @chapter: Encoding
    @title: Base64
    @description:
        Static base64 encoder, used to encode and decode data.
    @usage:
        #include <vlib/crypto.h>
        vlib::Base64:: ... ;
*/
struct Base64 {

    // ---------------------------------------------------------
    // Aliases.

    using     Length =         ullong;
    
    // ---------------------------------------------------------
    // Attributes.
    
    constexpr static const unsigned char base64_table[65] =
        "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
    constexpr static const int B64index[256] = { 0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,
    0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,
    0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0, 62, 63, 62, 62, 63, 52, 53, 54, 55,
    56, 57, 58, 59, 60, 61,  0,  0,  0,  0,  0,  0,  0,  0,  1,  2,  3,  4,  5,  6,
    7,  8,  9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25,  0,
    0,  0,  0, 63,  0, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40,
    41, 42, 43, 44, 45, 46, 47, 48, 49, 50, 51 };


    // ---------------------------------------------------------
    // Functions.

    // Encode to base64.
    /*  @docs
        @title: Encode
        @description:
            Encode a string.
        @parameter:
            @name: output
            @description: A reference to the output string.
        }
        @parameter:
            @name: input
            @description: The input data to encode.
        }
        @usage:
            vlib::String = vlib::Base64::encode("Hello World!", 12);
        @funcs: 2
    */
    SICE
    String     encode(const String& input) {
        return encode(input.data(), input.len());
    }
    SICE
    String     encode(const char* input, const Length len) {
        unsigned char *out, *pos;
        const unsigned char *end, *in;
        size_t olen;
        olen = 4*((len + 2) / 3); /* 3-byte blocks to 4-byte */
        if (olen < len) {
            return String(); /* integer overflow */
        }

        String outStr;
        outStr.resize(olen);
        outStr.len() = olen;
        out = (unsigned char*)&outStr[0];

        end = (uchar*) input + len;
        in = (uchar*) input;
        pos = out;
        while (end - in >= 3) {
            *pos++ = base64_table[in[0] >> 2];
            *pos++ = base64_table[((in[0] & 0x03) << 4) | (in[1] >> 4)];
            *pos++ = base64_table[((in[1] & 0x0f) << 2) | (in[2] >> 6)];
            *pos++ = base64_table[in[2] & 0x3f];
            in += 3;
        }

        if (end - in) {
            *pos++ = base64_table[in[0] >> 2];
            if (end - in == 1) {
                *pos++ = base64_table[(in[0] & 0x03) << 4];
                *pos++ = '=';
            }
            else {
                *pos++ = base64_table[((in[0] & 0x03) << 4) |
                    (in[1] >> 4)];
                *pos++ = base64_table[(in[1] & 0x0f) << 2];
            }
            *pos++ = '=';
        }

        return outStr;
    }

    // Decode from base64.
    /*  @docs
        @title: Decode
        @description:
            Decode a string.
        @parameter:
            @name: output
            @description: A reference to the output string.
        }
        @parameter:
            @name: input
            @description: The input data to decode.
        }
        @usage:
            vlib::String decoded = vlib::Base64::decode("XXX");
        @funcs: 2
    */
    SICE
    String     decode(const String& input) {
        return decode(input.data(), input.len());
    }
    SICE
    String        decode(const char* input, const Length len) {
        unsigned char* p = (unsigned char*)input;
        int pad = len > 0 && (len % 4 || p[len - 1] == '=');
        const size_t L = ((len + 3) / 4 - pad) * 4;
        String str('\0');
        str.resize(L / 4 * 3 + pad);
        str.len() = L / 4 * 3 + pad;
        for (size_t i = 0, j = 0; i < L; i += 4)
        {
            int n = B64index[p[i]] << 18 | B64index[p[i + 1]] << 12 | B64index[p[i + 2]] << 6 | B64index[p[i + 3]];
            str[j++] = n >> 16;
            str[j++] = n >> 8 & 0xFF;
            str[j++] = n & 0xFF;
        }
        if (pad)
        {
            int n = B64index[p[L]] << 18 | B64index[p[L + 1]] << 12;
            str[str.len() - 1] = n >> 16;

            if (len > L + 2 && p[L + 2] != '=')
            {
                n |= B64index[p[L + 2]] << 6;
                str.append(n >> 8 & 0xFF);
            }
        }
        return str;
    }

};

// ---------------------------------------------------------
// End.

};         // End namespace vlib.
#endif     // End header.
