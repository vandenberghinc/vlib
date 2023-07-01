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
#include "../include/vlib/cli.h"

// Header.
#ifndef TEST_CLI_H
#define TEST_CLI_H

// Tester.
// - Requires compiler flags: -I /usr/local/opt/zlib/include -lz
namespace test {
struct cli {
int operator()() const {

	// Namespaces.
	using namespace vlib;
	
	// Casts.
	auto arr0 = CLI::cast<Array<String>>("Hello World!,How are you?");
	vtest::test("CLI::cast<Array<String>>", "[\"Hello World!\", \"How are you?\"]", arr0.str().c_str());
	auto arr1 = CLI::cast<Array<int>>("0,1");
	vtest::test("CLI::cast<Array<int>>", "[0, 1]", arr1.str().c_str());
	auto arr2 = CLI::cast<Array<String>>("Hello World!");
	vtest::test("CLI::cast<Array<String>>", "[\"Hello World!\"]", arr2.str().c_str());
	auto dict0 = CLI::cast<Dict<String, int>>("a:0,b:1");
	vtest::test("CLI::cast<Array<String>>", "{\"a\": 0, \"b\": 1}", dict0.str().c_str());
	
	CLI cli({"--os", "0, 1"});
	auto os_arr = cli.get<Array<int>>("--os", {});
	vtest::test("CLI::get<Array<String>>", "[0, 1]", os_arr.str().c_str());

	// End.
	return vtest::exit_status();

};
}; 		// End struct.
}; 		// End namespace.
#endif  // End header.














