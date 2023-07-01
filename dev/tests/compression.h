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
#include "../include/vlib/compression.h"

// Header.
#ifndef TEST_COMPRESSION_H
#define TEST_COMPRESSION_H

// Tester.
// - Requires compiler flags: -I /usr/local/opt/zlib/include -lz
namespace test {
struct compression {
int operator()() const {

	// Namespaces.
	using namespace vlib;

	String input("Hello World!"), compressed, decompressed;
    compressed = vlib::compression::compress(input.data(), input.len());
	vtest::test("vlib::compression.is_compressed", "true", vlib::compression::is_compressed(compressed));
    decompressed = vlib::compression::decompress(compressed.data(), compressed.len());
	vtest::test("vlib::compression. compress & decompress", "Hello World!", decompressed.c_str());

	// End.
	return vtest::exit_status();

};
}; 		// End struct.
}; 		// End namespace.
#endif  // End header.














