// Author: Daan van den Bergh
// Copyright: © 2022 Daan van den Bergh.

//
// Sources:
// - https://github.com/DaniloVlad/OpenSSL-AES/blob/master/aes.c
// - https://stackoverflow.com/questions/3381614/c-convert-string-to-hexadecimal-and-vice-versa
//

// Header.
#ifndef VLIB_ENCODING_HEX_H
#define VLIB_ENCODING_HEX_H

// Namespace vlib.
namespace vlib {

// ---------------------------------------------------------
// Hex static struct.
/* @docs {
    @chapter: Encoding
    @title: Hex
    @description:
        Static hex encoder struct, used to encode and decode data.
    @usage:
        #include <vlib/crypto.h>
        vlib::Hex:: ... ;
} */
struct Hex {

	// ---------------------------------------------------------
	// Aliases.

	using 	Length = 		ullong;

	// ---------------------------------------------------------
	// Functions.

	// Encode to hex.
    /*  @docs {
        @title: Encode
        @description:
            Encode a string.
        @parameter: {
            @name: output
            @description: A reference to the output string.
        }
        @parameter: {
            @name: input
            @description: The input data to encode.
        }
        @return:
            Returns `0` upon success, and the error code upon failure (`< 0`).
        @usage:
            vlib::String encoded = vlib::Hex::encode("Hello World!", 12);
        @funcs: 2
    } */
    SICE
    String  encode(const String& input) {
        return encode(input.data(), input.len());
    }
	SICE
	String 	encode(const char* input, const Length len) {
        String output;
		output.resize(len * 2);
		output.len() = output.capacity();
		char* arr = output.data();
		const Length a = 'A' - 1;
		//const Length a = capital ? 'A' - 1 : 'a' - 1;
		for (Length i = 0, c = input[0] & 0xFF; i < output.len(); c = input[i / 2] & 0xFF) {
			arr[i++] = c > 0x9F ? (c / 16 - 9) | a : c / 16 | '0';
			arr[i++] = (c & 0xF) > 9 ? (c % 16 - 9) | a : c % 16 | '0';
		}
		return output;
	}

	// Decode from hex.
    /*  @docs {
        @title: Decode
        @description:
            Decode a string.
        @parameter: {
            @name: output
            @description: A reference to the output string.
        }
        @parameter: {
            @name: input
            @description: The input data to decode.
        }
        @return:
            Returns `0` upon success, and the error code upon failure (`< 0`).
        @usage:
            vlib::String decoded = vlib::Hex::decode("XXX");
        @funcs: 2
    } */
    SICE
    String  decode(const String& input) {
        return decode(input.data(), input.len());
    }
	SICE
	String  decode(const char* input, const Length len) {
		String output;
		output.resize((len + 1) / 2);
		output.len() = output.capacity();
		char* arr = output.data();
		for (Length i = 0, j = 0; i < output.len(); i++, j++) {
			arr[i] = (input[j] & '@' ? input[j] + 9 : input[j]) << 4; j++; // 4, j++;
			arr[i] |= (input[j] & '@' ? input[j] + 9 : input[j]) & 0xF;
		}
		return output;
	}

};

// ---------------------------------------------------------
// End.

}; 		// End namespace vlib.
#endif 	// End header.
