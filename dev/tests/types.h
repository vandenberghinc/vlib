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
#include "../include/vlib/types/_include.h"
// #include <array>

// Header.
#ifndef TEST_TYPES_H
#define TEST_TYPES_H

// #include <cmath>

// Some funcs.
auto test_ptr_str(vlib::Ptr<const char*, vlib::Unique> &x) {
	x = "Hello World!";
	return x;
}
void testptrarr(vlib::Ptr<vlib::Array<const char*>, vlib::Unique> &x) {
	x = vlib::Array<const char*>({"A", "B", "C"});
}

auto test_shared_ptr_str() {
	vlib::Ptr<const char*, vlib::Shared> x = "Hello World!";
	return x;
}

// auto test_response() {
// 	return vlib::success("Howdy!");
// }

// Test a Proc.
template <typename... Args>
void test_proc(vlib::Proc& proc, Args&&... args) {
	auto response = proc.execute(args...);
	if (response) {
		std::cout << "success [" << proc.err_number() << "]. \n";
	}
	else {
		switch (response.error()) {
			case vlib::proc::error::build_wpipe:
				std::cout << "build_write_pipe_err [" << proc.err_number() << "]. \n";
				break;
			case vlib::proc::error::build_rpipe:
				std::cout << "build_read_pipe_err [" << proc.err_number() << "]. \n";
				break;
			case vlib::proc::error::build_epipe:
				std::cout << "build_err_pipe_err [" << proc.err_number() << "]. \n";
				break;
			case vlib::proc::error::write_input:
				std::cout << "write_input_err [" << proc.err_number() << "]. \n";
				break;
			case vlib::proc::error::fork:
				std::cout << "fork_err [" << proc.err_number() << "]. \n";
				break;
			case vlib::proc::error::timeout:
				std::cout << "timeout_err [" << proc.err_number() << "]. \n";
				break;
			default:
				std::cout << "unknown_err [" << proc.err_number() << "]. \n";
		}
	}
	std::cout << "Process id: " << proc.pid() << "\n";
	std::cout << "Exit status: " << proc.exit_status() << "\n";
	if (proc.has_in()) { std::cout << "Read output: " << proc.in().c_str() << "\n"; }
	if (proc.has_out()) { std::cout << "Write output: " << proc.out().c_str() << "\n"; }
	if (proc.has_err()) { std::cout << "Error output: " << proc.err().c_str() << "\n"; }
}

// Tester.
namespace test {
struct types {
int operator()() const {

	// Namespaces.
	using namespace vlib;
	// vtest::show_correct();

	// ---------------------------------------------------------
	// Math.

	// Is even.
	vtest::test("is_even", "false", is_even(1));
	vtest::test("is_even", "true", is_even(2));
	vtest::test("is_even", "false", is_even(-1));
	vtest::test("is_even", "true", is_even(-2));
	vtest::test("is_even", "false", is_even((int) 1.0));
	vtest::test("is_even", "true", is_even((int) 2.0));
	vtest::test("is_even", "false", is_even((int) -1.0));
	vtest::test("is_even", "true", is_even((int) -2.0));

	// Floor.
	vtest::test("floor", "1", vlib::floor(1.99999));
	vtest::test("floor", "2", vlib::floor(2.00001));

	vtest::test("floor", "-2", vlib::floor(-1.99999));
	vtest::test("floor", "-3", vlib::floor(-2.00001));

	// Ceil.
	vtest::test("ceil", "2", vlib::ceil(1.99999));
	vtest::test("ceil", "3", vlib::ceil(2.00001));

	vtest::test("ceil", "-1", vlib::ceil(-1.99999));
	vtest::test("ceil", "-2", vlib::ceil(-2.00001));

	// As int.
	vtest::test("round", "10", vlib::round(9.99999));
	vtest::test("round", "10", vlib::round(10.00001));

	vtest::test("round", "-2", vlib::round(-1.99999));
	vtest::test("round", "-2", vlib::round(-2.00001));

	vtest::test("round", "-10", vlib::round(-9.99999));
	vtest::test("round", "-10", vlib::round(-10.00001));

	vtest::test("round", "2", vlib::round(1.99999));
	vtest::test("round", "2", vlib::round(2.00001));

	vtest::test("round", "10", vlib::round(9.99999));
	vtest::test("round", "10", vlib::round(10.00001));

	vtest::test("round", "-2", vlib::round(-1.99999));
	vtest::test("round", "-2", vlib::round(-2.00001));

	vtest::test("round", "-10", vlib::round(-9.99999));
	vtest::test("round", "-10", vlib::round(-10.00001));

	vtest::test("round", "9.100000", 0.0000000091 * vlib::pow(10, 9));
	vtest::test("round", "9", vlib::round(0.0000000091 * vlib::pow(10, 9)));
	vtest::test("round", "9", vlib::round(0.0000000089 * vlib::pow(10, 9)));

	vtest::test("has_decimals", "0", vlib::todecimals(100));
	vtest::test("has_decimals", "0.124500", vlib::todecimals(100.1245));
	vtest::test("has_decimals", "0.124500", vlib::todecimals(0.1245));
	vtest::test("has_decimals", "-0.124500", vlib::todecimals(-0.1245));

	vtest::test("has_decimals", "false", vlib::has_decimals(100));
	vtest::test("has_decimals", "true", vlib::has_decimals(0.1245));

	// ---------------------------------------------------------
	// Range.

	// For loop.
	std::string str = "";
	for (auto& i: Range<Forwards, int>(0, 3)) { str += std::to_string(i); }
	vtest::test("Range<Forwards>", "012", str);
	str = "";
	for (auto& i: Range<Forwards, int>(3)) { str += std::to_string(i); }
	vtest::test("Range<Forwards>", "012", str);
	str = "";
	for (auto& i: Range<Forwards, int>(-3, 0)) { str += std::to_string(i); }
	vtest::test("Range<Forwards>", "-3-2-1", str);
	str = "";
	for (auto& i: Range<Forwards, int>(-3)) { str += std::to_string(i); }
	vtest::test("Range<Forwards>", "-3-2-1", str);
	str = "";
	for (auto& i: Range<Backwards, int>(0, 3)) { str += std::to_string(i); }
	vtest::test("Range<Backwards>", "210", str);
	str = "";
	for (auto& i: Range<Backwards, int>(3)) { str += std::to_string(i); }
	vtest::test("Range<Backwards>", "210", str);
	str = "";
	for (auto& i: Range<Backwards, int>(-3, 0)) { str += std::to_string(i); }
	vtest::test("Range<Backwards>", "-1-2-3", str);
	str = "";
	for (auto& i: Range<Backwards, int>(-3)) { str += std::to_string(i); }
	vtest::test("Range<Backwards>", "-1-2-3", str);
	// str = "";
	// for (auto& i: Range<Backwards, int>(0, 3).reverse()) { str += std::to_string(i); }
	// vtest::test("Range<Backwards>::reverse", "012", str);
	// str = "";
	// for (auto& i: Range<Forwards, int>(0, 3).reverse()) { str += std::to_string(i); }
	// vtest::test("Range<Forwards>::reverse", "210", str);

	// While loop.
	int Intest = 0;
	auto range0 = Range<Forwards, int>(0, 10);
	while (++range0) {
		++Intest;
	}
	vtest::test("Range<Forwards>", std::to_string(Intest), 9);
	Intest = 0;
	auto range1 = Range<Backwards, int>(0, 10);
	while (++range1) {
		++Intest;
	}
	vtest::test("Range<Backwards>", std::to_string(Intest), 9);

	// ---------------------------------------------------------
	// Random type.

	vlib::random::seed(1);
	vtest::test("random::generate<short>", "", vlib::random::generate<short>());
	vtest::test("random::generate<float>", "", vlib::random::generate<float>());
	vtest::test("random::generate<int>", "", vlib::random::generate<int>());
	vlib::random::random_seed();

	// ---------------------------------------------------------
	// Cast.
	
	vtest::test("tobool", "true", tobool("true"));
	vtest::test("tobool", "false", tobool("false"));
	
	vtest::test("tonumeric<int>", "0", tonumeric<int>("0"));
	vtest::test("tonumeric<int>", "1", tonumeric<int>("1"));
	vtest::test("tonumeric<int>", "-1", tonumeric<int>("-1"));

	vtest::test("tonumeric<int>", "1", tonumeric<int>("1"));
	vtest::test("tonumeric<double>", "1.000000", tonumeric<double>("1"));

	vtest::test("tostr", "0", tostr(0).data());
	vtest::test("tostr", "0", tostr(-0).data());
	vtest::test("tostr", "0.000000", tostr(0.0).data());
	vtest::test("tostr", "0.000000", tostr(-0.0).data());

	vtest::test("tostr", "1", tostr(1).data());
	vtest::test("tostr", "100", tostr(100).data());
	vtest::test("tostr", "999999", tostr(999999).data());
	vtest::test("tostr", "34785639485", tostr(34785639485).data());
	vtest::test("tostr", "0.100000", tostr(0.1).data());
	vtest::test("tostr", "0.900000", tostr(0.9).data());
	vtest::test("tostr", "0.999000", tostr(0.999).data());
	vtest::test("tostr", "0.000010", tostr(0.00001).data());
	vtest::test("tostr", "1.010000", tostr(1.01).data());
	vtest::test("tostr", "1.000010", tostr(1.00001).data());
	vtest::test("tostr", "1.100000", tostr(1.10000).data());
	vtest::test("tostr", "10", tostr(10).data());
	vtest::test("tostr", "9", tostr(9).data());
	vtest::test("tostr", "99", tostr(99).data());
	vtest::test("tostr", "0.900000", tostr(0.9).data());
	vtest::test("tostr", "0.990000", tostr(0.99).data());
	vtest::test("tostr", "0.888800", tostr(0.8888).data());
	// vtest::test("tostr", "0.888880", tostr(0.88888).data());
	vtest::test("tostr", "88888", tostr(88888).data());
	vtest::test("tostr", "0.999999", tostr(0.999999).data());
	vtest::test("tostr", "999999", tostr(999999).data());
	vtest::test("tostr", "1003456.023510", tostr(1003456.02351).data());
	vtest::test("tostr", "1003456.023513", tostr(1003456.023513).data());
	vtest::test("tostr", "1003456.023513", tostr(1003456.0235134).data());
	vtest::test("tostr", "1003456.023513", tostr(1003456.02351345).data());
	vtest::test("tostr", "1003456.023513", tostr(1003456.023513456).data());
	vtest::test("tostr", "1003456.123456", tostr(1003456.1234564).data());
	vtest::test("tostr", "1003456.123457", tostr(1003456.1234565).data()); // automatically rounded because more decimals then length.
	vlib::casts::tostr::precision = 10;
	vtest::test("tostr", "1003456.0235134567", tostr(1003456.0235134567).data()); // ERROR-TAG-0001
	vtest::test("tostr", "1003456.0235134568", tostr(1003456.02351345678).data()); // automatically rounded because more decimals then length.
	vlib::casts::tostr::precision = 12;
	vtest::test("tostr", "1003456.023513456690", tostr(1003456.0235134567).data()); // rounding error.
	vlib::casts::tostr::precision = 5;
	vtest::test("tostr", "100.02351", tostr(100.02351).data());
	vlib::casts::tostr::precision = 6;

	vlib::casts::tostr::zero_padding = false;
	vtest::test("tostr", "-1", tostr(-1).data());
	vtest::test("tostr", "-0.1", tostr(-0.1).data());
	vtest::test("tostr", "-1.01", tostr(-1.01).data());
	vtest::test("tostr", "-1.00001", tostr(-1.00001).data());
	vtest::test("tostr", "-1.1", tostr(-1.10000).data());
	vtest::test("tostr", "-10", tostr(-10).data());
	vtest::test("tostr", "-9", tostr(-9).data());
	vtest::test("tostr", "-99", tostr(-99).data());
	vtest::test("tostr", "-0.9", tostr(-0.9).data());
	vtest::test("tostr", "0.99", tostr(0.99).data()); // TMP
	vtest::test("tostr", "-0.99", tostr(-0.99).data());
	vtest::test("tostr", "-0.88888", tostr(-0.88888).data());
	vtest::test("tostr", "-88888", tostr(-88888).data());
	vtest::test("tostr", "-0.999999", tostr(-0.999999).data());
	vlib::casts::tostr::zero_padding = true;
	vtest::test("tostr", "-999999", tostr(-999999).data());
	vtest::test("tostr", "-1003456.023510", tostr(-1003456.02351).data());
	vtest::test("tostr", "-1003456.023513", tostr(-1003456.023513).data());
	vlib::casts::tostr::precision = 7;
	vtest::test("tostr", "-1003456.0235134", tostr(-1003456.0235134).data());
	vlib::casts::tostr::precision = 8;
	vtest::test("tostr", "-1003456.02351345", tostr(-1003456.02351345).data());
	vlib::casts::tostr::precision = 6;
	
	vtest::test("tostr", "Hello World!", tostr("Hello", " ", "Wo", "rl", "d", "!").data());
	vtest::test("tostr", "Length is 10 not 15. Understood? true", tostr("Length is ", 10, " not ", 15, ". Understood? ", true).data());
	
	vtest::test("tostr", "2022", tostr(2022).data());
	
	vtest::test("tostr::ensure_start_padding", "001", tostr(1).ensure_start_padding_r('0', 3).data());
	vtest::test("tostr::ensure_start_padding", "-01", tostr(-1).ensure_start_padding_r('0', 3).data());
	
	vtest::test("tostr::ensure_end_padding", "1XX", tostr(1).ensure_end_padding_r('X', 3).data());
	vtest::test("tostr::ensure_end_padding", "-1X", tostr(-1).ensure_end_padding_r('X', 3).data());

	// ---------------------------------------------------------
	// Null type.

	Null null0;
	vtest::test("Null::isna", "true", null0.is_undefined());

	// ---------------------------------------------------------
	// Bool type.

	Bool bool0;
	vtest::test("Bool::isna", "true", bool0.is_undefined());
	bool0 = true;
	vtest::test("Bool::isna", "false", bool0.is_undefined());

	// ---------------------------------------------------------
	// Scientific notation type.

	// vtest::test("SN::cstr", "1e-05", SN(0.00001).c_str().data());
	// vtest::test("SN::cstr", "1.00e-05", SN(0.00001).cstr(2).data());
	// vtest::test("SN::cstr", "1e-05", SN(0.00001).cstr(0, 10).data());
	// vtest::test("SN::cstr", "1.0e-05", SN(0.00001).cstr(1, 10).data());
	// vtest::test("SN::cstr", "1.00e-05", SN(0.00001).cstr(2, 10).data());
	// vtest::test("SN::cstr", "1.0000e-05", SN(0.00001).cstr(4, 10).data());
	// vtest::test("SN::cstr", "1.00e-05", SN(0.00001).cstr(4, 8).data());

	// ---------------------------------------------------------
	// Numeric type.

	Int int0;
	vtest::test("Numeric::isna", "true", int0.is_undefined());
	int0 = 100;
	vtest::test("Numeric::isna", "false", int0.is_undefined());
	vtest::test("Numeric::value", "100", int0.value());

	// Subscript.
	vtest::test("Numeric::subscript", "9", Len(9).subscript(10));
	vtest::test("Numeric::subscript", std::to_string(NPos::npos), Len(11).subscript(10));
	vtest::test("Numeric::subscript", "10", Len(npos).subscript(10));

	vtest::test("Numeric::subscript", "9", Len(9).subscript(10, 100));
	vtest::test("Numeric::subscript", "100", Len(11).subscript(10, 100));
	vtest::test("Numeric::subscript", "100", Len(npos).subscript(10, 100));

	// Eq.
	vtest::test("Numeric::==", "true", Len(0) == Len(0));
	vtest::test("Numeric::==", "false", Len(0) == Len(-10));
	vtest::test("Numeric::==", "false", Len(0) == Len(10));
	vtest::test("Numeric::==", "false", Len(0) == 10);
	vtest::test("Numeric::==", "false", Len(0) == -10);
	vtest::test("Numeric::==", "false", Len(0) == npos);

	vtest::test("Numeric::==", "false", Len(10) == Len(-10));
	vtest::test("Numeric::==", "true", Len(10) == Len(10));
	vtest::test("Numeric::==", "true", Len(10) == 10);
	vtest::test("Numeric::==", "false", Len(10) == -10);
	vtest::test("Numeric::==", "false", Len(10) == npos);

	vtest::test("Numeric::==", "true", Len(-10) == Len(-10));
	vtest::test("Numeric::==", "false", Len(-10) == Len(10));
	vtest::test("Numeric::==", "false", Len(-10) == 10);
	vtest::test("Numeric::==", "true", Len(-10) == -10);
	vtest::test("Numeric::==", "false", Len(-10) == npos);

	vtest::test("Numeric::==", "true", Len(npos) == npos);
	vtest::test("Numeric::==", "true", Len(npos) == NPos::npos);

	// Less.
	vtest::test("Numeric::<", "true", Int(10) < Int(11));
	vtest::test("Numeric::<", "false", Int(10) < Int(9));
	vtest::test("Numeric::<", "false", Int(10) < Int(-11));
	vtest::test("Numeric::<", "false", Int(10) < Int(-9));
	vtest::test("Numeric::<", "false", Int(10) < Int(10));
	vtest::test("Numeric::<", "true", Int(-10) < Int(11));
	vtest::test("Numeric::<", "true", Int(-10) < Int(9));
	vtest::test("Numeric::<", "false", Int(-10) < Int(-11));
	vtest::test("Numeric::<", "true", Int(-10) < Int(-9));
	vtest::test("Numeric::<", "false", Int(-10) < Int(-10));

	vtest::test("Numeric::<", "true", Len(10) < 11);
	vtest::test("Numeric::<", "false", Len(10) < 9);
	vtest::test("Numeric::<", "false", Len(10) < 10);

	vtest::test("Numeric::<", "true", Len(10) < Int(11));
	vtest::test("Numeric::<", "false", Len(10) < Int(9));
	vtest::test("Numeric::<", "false", Len(10) < Int(10));

	vtest::test("Numeric::<", "true", Len(10) < Len(11));
	vtest::test("Numeric::<", "false", Len(10) < Len(9));
	vtest::test("Numeric::<", "false", Len(10) < Len(10));

	// Less eq.
	vtest::test("Numeric::<", "true", Int(10) <= Int(11));
	vtest::test("Numeric::<", "false", Int(10) <= Int(9));
	vtest::test("Numeric::<", "false", Int(10) <= Int(-9));
	vtest::test("Numeric::<", "true", Int(10) <= Int(10));

	vtest::test("Numeric::<", "true", Len(10) <= 11);
	vtest::test("Numeric::<", "false", Len(10) <= 9);
	vtest::test("Numeric::<", "true", Len(10) <= 10);

	vtest::test("Numeric::<", "true", Len(10) <= Int(11));
	vtest::test("Numeric::<", "false", Len(10) <= Int(9));
	vtest::test("Numeric::<", "true", Len(10) <= Int(10));

	vtest::test("Numeric::<", "true", Len(10) <= Len(11));
	vtest::test("Numeric::<", "false", Len(10) <= Len(9));
	vtest::test("Numeric::<", "true", Len(10) <= Len(10));

	// Greater.
	vtest::test("Numeric::>", "false", Int(10) > Int(11));
	vtest::test("Numeric::>", "true", Int(10) > Int(9));
	vtest::test("Numeric::>", "true", Int(10) > Int(-11));
	vtest::test("Numeric::>", "true", Int(10) > Int(-9));
	vtest::test("Numeric::>", "false", Int(10) > Int(10));
	vtest::test("Numeric::>", "false", Int(-10) > Int(11));
	vtest::test("Numeric::>", "false", Int(-10) > Int(9));
	vtest::test("Numeric::>", "true", Int(-10) > Int(-11));
	vtest::test("Numeric::>", "false", Int(-10) > Int(-9));
	vtest::test("Numeric::>", "false", Int(-10) > Int(-10));

	vtest::test("Numeric::>", "false", Len(10) > 11);
	vtest::test("Numeric::>", "true", Len(10) > 9);
	vtest::test("Numeric::>", "false", Len(10) > 10);

	vtest::test("Numeric::>", "false", Len(10) > Int(11));
	vtest::test("Numeric::>", "true", Len(10) > Int(9));
	vtest::test("Numeric::>", "false", Len(10) > Int(10));

	vtest::test("Numeric::>", "false", Len(10) > Len(11));
	vtest::test("Numeric::>", "true", Len(10) > Len(9));
	vtest::test("Numeric::>", "false", Len(10) > Len(10));
	
	// Greater equals.
	vtest::test("Numeric::>=", "false", Int(10) >= Int(11));
	vtest::test("Numeric::>=", "true", Int(10) >= Int(9));
	vtest::test("Numeric::>=", "true", Int(10) >= Int(-11));
	vtest::test("Numeric::>=", "true", Int(10) >= Int(-9));
	vtest::test("Numeric::>=", "true", Int(10) >= Int(10));
	vtest::test("Numeric::>=", "false", Int(-10) >= Int(11));
	vtest::test("Numeric::>=", "false", Int(-10) >= Int(9));
	vtest::test("Numeric::>=", "true", Int(-10) >= Int(-11));
	vtest::test("Numeric::>=", "false", Int(-10) >= Int(-9));
	vtest::test("Numeric::>=", "true", Int(-10) >= Int(-10));

	vtest::test("Numeric::>=", "false", Len(10) >= 11);
	vtest::test("Numeric::>=", "true", Len(10) >= 9);
	vtest::test("Numeric::>=", "true", Len(10) >= 10);

	vtest::test("Numeric::>=", "false", Len(10) >= Int(11));
	vtest::test("Numeric::>=", "true", Len(10) >= Int(9));
	vtest::test("Numeric::>=", "true", Len(10) >= Int(10));

	vtest::test("Numeric::>=", "false", Len(10) >= Len(11));
	vtest::test("Numeric::>=", "true", Len(10) >= Len(9));
	vtest::test("Numeric::>=", "true", Len(10) >= Len(10));

	// Power.
	vtest::test("Numeric::pow", "1", Len(10).pow(0).value());
	vtest::test("Numeric::pow", "10", Len(10).pow(1).value());
	vtest::test("Numeric::pow", "100", Len(10).pow(2).value());
	vtest::test("Numeric::pow", "10000000000", Len(10).pow(10).value());

	vtest::test("Numeric::pow", "10.000000", vlib::Double(10).pow(-0).value());
	vtest::test("Numeric::pow", "0.100000", vlib::Double(10).pow(-1).value());
	vtest::test("Numeric::pow", "0.010000", vlib::Double(10).pow(-2).value());
	vtest::test("Numeric::pow", "0.001000", vlib::Double(10).pow(-3).value());
	vtest::test("Numeric::pow", "0.000000", vlib::Double(10).pow(-10).value());

	vtest::test("Numeric::pow", "-10.000000", vlib::Double(-10).pow(-0).value());
	vtest::test("Numeric::pow", "-0.100000", vlib::Double(-10).pow(-1).value());
	vtest::test("Numeric::pow", "-0.010000", vlib::Double(-10).pow(-2).value());
	vtest::test("Numeric::pow", "-0.001000", vlib::Double(-10).pow(-3).value());
	vtest::test("Numeric::pow", "-0.000000", vlib::Double(-10).pow(-10).value());

	vtest::test("Numeric::pow", "2.000000", vlib::Double(2).pow(-0).value());
	vtest::test("Numeric::pow", "0.500000", vlib::Double(2).pow(-1).value());
	vtest::test("Numeric::pow", "0.250000", vlib::Double(2).pow(-2).value());
	vtest::test("Numeric::pow", "0.125000", vlib::Double(2).pow(-3).value());
	vtest::test("Numeric::pow", "0.031250", vlib::Double(2).pow(-5).value());

	vtest::test("Numeric::pow", "-2.000000", vlib::Double(-2).pow(-0).value());
	vtest::test("Numeric::pow", "-0.500000", vlib::Double(-2).pow(-1).value());
	vtest::test("Numeric::pow", "-0.250000", vlib::Double(-2).pow(-2).value());
	vtest::test("Numeric::pow", "-0.125000", vlib::Double(-2).pow(-3).value());
	vtest::test("Numeric::pow", "-0.031250", vlib::Double(-2).pow(-5).value());
	
	vtest::test("Numeric::pow", "0.000000", vlib::Float(Int(0)).value());

	// ---------------------------------------------------------
	// Pipe type.

	vtest::test("Pipe::<<", "Hello World!", (Pipe() << "Hello World!").null_terminate().data());

	// ---------------------------------------------------------
	// Pointer type.

	// Unique pointer.
	Ptr<int, Unique> uptr0 = 100;
	vtest::test("vlib::ptr::unique::is_defined", "true", uptr0.is_defined());
	vtest::test("vlib::ptr::unique::operator *", "100", *uptr0);
	Ptr<const char*, Unique> uptr1;
	vtest::test("vlib::ptr::unique::is_defined", "false", uptr1.is_defined());
	test_ptr_str(uptr1);
	vtest::test("vlib::ptr::unique::is_defined", "true", uptr1.is_defined());
	vtest::test("Ptr::unique::<const char*>", "Hello World!", *uptr1);
	Ptr<int, Unique> uptr2 = 1;
	Ptr<int, Unique> uptr3;
	uptr3 = uptr2;
	uptr3 = 2;
	vtest::test("Ptr::unique::copy", "1", *uptr2);
	vtest::test("Ptr::unique::copy", "2", *uptr3);

	// Shared pointer.
	Ptr<int, Shared> sptr0 = 1;
	Ptr<int, Shared> sptr1;
	sptr1 = sptr0;
	sptr1 = 2;
	vtest::test("Ptr::shared::copy", "2", *sptr0);
	vtest::test("Ptr::shared::copy", "2", *sptr1);

	auto sptr2 = test_shared_ptr_str();
	vtest::test("Ptr::shared::copy", "Hello World!", *sptr2);
	
	// ---------------------------------------------------------
	// CString.
	
	CString cstr0 = "Hello World!";
	vtest::test("CString::len", "12", cstr0.len());
	vtest::test("CString::isna", "false", cstr0.is_undefined());
	vtest::test("CString::isna", "true", CString().is_undefined());
	vtest::test("CString::cstr", "Hello World!", cstr0.c_str());
	vtest::test("CString::reset", "", cstr0.reset().c_str());
	cstr0 = "Hello World!";
	vtest::test("CString::first", "H", cstr0.first());
	vtest::test("CString::last", "!", cstr0.last());
	vtest::test("CString::get", "!", cstr0.get(11));
	vtest::test("CString::eq", "true", cstr0.eq("Hello World!"));
	vtest::test("CString::eq", "false", cstr0.eq("Hello!"));
	vtest::test("CString::eq", "true", cstr0.eq("Hello", 5));
	vtest::test("CString::eq", "\"Hello World!\"", cstr0.json().c_str());
	// vtest::test("CString::parse", "Hello World!", CString::parse("Hello World!").c_str());
	vtest::test("CString::[]", "!", cstr0.rget(1));
	std::string iter_test = "";
	for (auto i: cstr0) { iter_test += i; }
	vtest::test("CString::iterate", "Hello World!", iter_test);

	// ---------------------------------------------------------
	// Array.

	// Array type.
	String array0;
	array0.reconstruct("Hello World!");
	vtest::test("Array::len", "12", array0.len());
	vtest::test("Array", "Hello World!", array0.null_terminate().data());

	vtest::test("Array::eq", "true", array0.eq("Hello World!"));
	vtest::test("Array", "Hello World!", array0.null_terminate().data());
	vtest::test("Array::eq", "false", array0.eq("Hello"));
	array0.concat_r(" Hi!");
	vtest::test("Array::concat", "Hello World! Hi!", array0.null_terminate().data());
	array0.pop(array0.len() - 1);
	vtest::test("Array::pop", "Hello World! Hi", array0.null_terminate().data());
	array0.pop(1);
	vtest::test("Array::pop", "Hllo World! Hi", array0.null_terminate().data());
	array0.insert(1, 'e');
	vtest::test("Array::insert", "Hello World! Hi", array0.null_terminate().data());

	Array<int> array1 = {1, 2, 3};
	Array<int> array2 = {1, 2};
	Array<int> array3 = array1;
	vtest::test("Array::construct", "[1, 2, 3]", array1.str().c_str());
	vtest::test("Array::construct", "[1, 2, 3]", array3.str().c_str());
	array1.append(4);
	vtest::test("Array::append", "[1, 2, 3, 4]", array1.str().c_str());

	array1.append(1, 2, 3, 4);
	vtest::test("Array::append", "[1, 2, 3, 4, 1, 2, 3, 4]", array1.str().c_str());
	vtest::test("Array::append", "4", array1[array1.len()-1]);

	array1 = {0, 1, 2};
	array2 = {3, 4, 5};
	vtest::test("Array::concat", "[0, 1, 2, 3, 4, 5]", array1.concat_r(array2).str().c_str());

	array1.set(0, -1);
	vtest::test("Array::set", "-1", array1[0]);

	array1 = {1, 2, 3};
	array2 = {1, 2};
	array3 = array1;
	vtest::test("Array::eq", "true", array1.eq(array1));
	vtest::test("Array::eq", "false", array1.eq(array2));
	vtest::test("Array::eq", "true", array1.eq(array2, 2));
	vtest::test("Array::eq", "true", array1.eq(array3));

	array1 = {1, 2, 3};
	vtest::test("Array::first", "1", array1.first());
	vtest::test("Array::last", "3", array1.last());
	array2 = {4, 5};
	array1 = {1, 2, 3};
	vtest::test("Array::vconcat", "[1, 2, 3, 4, 5]", array1.concat_r(array2).str().c_str());

	array1 = {0, 1, 2, 3};
	vtest::test("Array::slice", "[0, 1, 2]", array1.slice_r(0, array1.len() - 1).str().c_str());
	vtest::test("Array::slice", "[1]", array1.slice_r(1, array1.len() - 1).str().c_str());

	array1 = {0, 1, 2, 3};
	vtest::test("Array::reverse", "[3, 2, 1, 0]", array1.reverse_r().str().c_str());

	array1 = {0, 1, 2, 3};
	vtest::test("Array::find", "1", array1.find(1));
	array1.append(1);
	vtest::test("Array::find", "4", array1.find(1, 2));
	vtest::test("Array::find", std::to_string(NPos::npos), array1.find(1, 5));
	vtest::test("Array::contains", "true", array1.contains(1));
	vtest::test("Array::contains", "false", array1.contains(99999));
	array1 = {0, 1, 2, 1, 3, 4};
	vtest::test("Array::len", "6", array1.len());
	vtest::test("Array::first", "0", array1.first());
	vtest::test("Array::last", "4", array1.last());
	vtest::test("Array::c_str", "[0, 1, 2, 1, 3, 4]", array1.str().c_str());
	vtest::test("Array::replace_r", "[0, 100, 2, 100, 3, 4]", array1.replace_r(1, 100).str().c_str());

	 array1 = {0, 1, 2};
	 vtest::test("Array::rget", "2", array1.rget(1));

	 array1 = {0, 1, 2};
	 vtest::test("Array::pop", "1", array1.pop(array1.len() - 2));
	 vtest::test("Array::pop post", "[0, 2]", array1.str().c_str());

	vtest::test("Array::fill", "[0, 0, 0]", Array<int>().fill_r(3, 0).str().c_str());
	array1 = {0, 1, 2};
	iter_test = "";
	for (auto i: array1) { iter_test += std::to_string(i); }
	vtest::test("Array::iterate", "012", iter_test);

	// Vshift
	// Positive.
	// Array<int> arr;
	// arr = {0, 1, 2, 3} ; arr.shift(1); vtest::test("Array::vshift", "[0, 0, 1, 2, 3]", arr.str().c_str());
	// arr = {0, 1, 2, 3} ; arr.shift(2); vtest::test("Array::vshift", "[0, 1, 0, 1, 2, 3]", arr.str().c_str());
	// arr = {0, 1, 2, 3} ; arr.shift(4); vtest::test("Array::vshift", "[0, 1, 2, 3, 0, 1, 2, 3]", arr.str().c_str());
	// arr = {0, 1, 2, 3} ; arr.shift(1, 1); vtest::test("Array::vshift", "[0, 1, 1, 2, 3]", arr.str().c_str());
	// arr = {0, 1, 2, 3} ; arr.shift(1, 2); vtest::test("Array::vshift", "[0, 1, 2, 2, 3]", arr.str().c_str());
	// arr = {0, 1, 2, 3} ; arr.shift(1, 3); vtest::test("Array::vshift", "[0, 1, 2, 3, 3]", arr.str().c_str());
	// arr = {0, 1, 2, 3} ; arr.shift(2, 1); vtest::test("Array::vshift", "[0, 1, 2, 1, 2, 3]", arr.str().c_str());
	// arr = {0, 1, 2, 3} ; arr.shift(2, 2); vtest::test("Array::vshift", "[0, 1, 2, 3, 2, 3]", arr.str().c_str());
	// arr = {0, 1, 2, 3} ; arr.shift(2, arr.len() - 2); vtest::test("Array::vshift", "[0, 1, 2, 3, 2, 3]", arr.str().c_str());
	// arr = {0, 1, 2, 3} ; arr.vshift(2, arr.len() - 1); vtest::test("Array::vshift", "{0, 1, 2, 3, ?, 3}", arr.str().c_str()); // ==> ERROR: Trying to shift an index that is not present.
	// arr = {0, 1, 2, 3} ; arr.vshift(4, arr.len()); vtest::test("Array::vshift", "...", arr.str().c_str()); // ==> ERROR : Trying to shift an index that is not present.

	// Negative.
	// @TODO causes memory leak (valgrind).
	// arr = {0, 1, 2, 3} ; arr.shift(-1); vtest::test("Array::vshift", "[1, 2, 3]", arr.str().c_str());
	// arr = {0, 1, 2, 3} ; arr.shift(-2); vtest::test("Array::vshift", "[2, 3]", arr.str().c_str());
	// arr = {0, 1, 2, 3} ; arr.shift(-(signed) (arr.len())); vtest::test("Array::vshift", "[]", arr.str().c_str());
	// arr = {0, 1, 2, 3} ; arr.shift(-1, 1); vtest::test("Array::vshift", "[0, 2, 3]", arr.str().c_str());
	// arr = {0, 1, 2, 3} ; arr.shift(-1, 2); vtest::test("Array::vshift", "[0, 1, 3]", arr.str().c_str());
	// arr = {0, 1, 2, 3} ; arr.shift(-1, 3); vtest::test("Array::vshift", "[0, 1, 2]", arr.str().c_str());
	// arr = {0, 1, 2, 3} ; arr.shift(-2, 1); vtest::test("Array::vshift", "[0, 3]", arr.str().c_str());
	// arr = {0, 1, 2, 3} ; arr.shift(-2, 2); vtest::test("Array::vshift", "[0, 1]", arr.str().c_str());
	// arr = {0, 1, 2, 3, 4, 5} ; arr.shift(-2, 2); vtest::test("Array::vshift", "[0, 1, 4, 5]", arr.str().c_str());
	// arr = {0, 1, 2, 3} ; arr.vshift(- (arr.len() + 1)); vtest::test("Array::vshift", "...", arr.str().c_str()); //  ==> ERROR : Trying to delete more than present after start.

	Array<int> arr = {1, 2, 3};
	vtest::test("Array::parse", "[1, 2, 3]", arr.str().c_str());
	arr.destruct();
	arr = Array<int>::parse("[1, 2, 3]");
	vtest::test("Array::parse", "[1, 2, 3]", arr.str().c_str());

	Array<Int> array4 = Array<Int>::parse("[1, 2, 3]");
	vtest::test("Array::parse", "[1, 2, 3]", array4.str().c_str());
	Array<String> array5; array5 = Array<String>::parse("[\"Hello\", \"World\", \"!\"]");
	vtest::test("Array::parse", "[\"Hello\", \"World\", \"!\"]", array5.str().c_str());

	array5.save("/tmp/my_array");
	Array<String>::load("/tmp/my_array");
	Array<String> loaded_array = Array<String>::load("/tmp/my_array");
	vtest::test("Array::save & load", "[\"Hello\", \"World\", \"!\"]", loaded_array.str().c_str());

	Array<int> array6 = {0, 1, 2, 3, 4, 5};
	vtest::test("Array::remove", "[0, 2, 4]", array6.remove_r(1, 3, 5).str().c_str());

	Array<String> array7 ({"a", "b", "c"});

	// String.
	String str0 = "Hello World!";
	String str1;
	String str2;
	String str3;
	vtest::test("String::cstr", "Hello World!", str0.c_str());

	vtest::test("String::len", "12", str0.len());
	vtest::test("String::isna", "false", str0.is_undefined());
	str1 = "Hello World!";
	str0.concat_r(str1);
	std::string stdstr0 (str0.data(), str0.capacity());
	vtest::test("String::concat", "Hello World!Hello World!", str0.c_str());

	str0 = "Hello World!";
	str1 = str0;
	vtest::test("String::copy", "Hello World!", str1.c_str());
	vtest::test("String::copy", "Hello World!", str1.c_str());
	str0.append('?');
	vtest::test("String::append", "Hello World!?", str0.c_str());
	vtest::test("String::copy", "Hello World!", str1.c_str());
	vtest::test("String::concat", "Hello World!?Hello World!", str0.concat_r(str1).c_str());
	str0 = "Hello World!";
	vtest::test("String::slice", "Hello World", str0.slice_r(0, str0.len() - 1).c_str());
	str0 = "Hello World!";
	vtest::test("String::reverse", "!dlroW olleH", str0.reverse_r().c_str());
	str0 = "Hello World!";
	str1 = str0.copy();
	str3 = "Hi";
	vtest::test("String::equals", "true", str0.eq(str1));
	vtest::test("String::equals", "false", str0.eq(str3));
	str0 = "Hello World!";
	vtest::test("String::find", "4", str0.find('o'));
	vtest::test("String::find", "7", str0.find('o', 5));
	vtest::test("String::find", std::to_string(NPos::npos), str0.find('o', 8));
	vtest::test("String::contains", "true", str0.contains('o'));
	vtest::test("String::contains", "false", str0.contains('Z'));
	vtest::test("String::replace_r", "Hello Forld!", str0.replace_r('W', 'F').c_str());
	vtest::test("String::operator []", "!", std::string(1, str0.rget(1)));
	str0 = "Hello World!?";
	vtest::test("String::pop", "!", std::string(1, str0.pop(str0.len() - 2)));
	vtest::test("String::pop post", "Hello World?", str0.c_str());
	vtest::test("String::fill", "???", String().fill_r(3, '?').c_str());

	str0 = "Hello!";
	str1 = "Hello World!";
	str2 = "Hello World!";
	vtest::test("String::str", "true", str1 == str2);
	vtest::test("String::str", "false", str0 == str1);
	vtest::test("String::[0]", "H", str2[0]);
	vtest::test("String::rget(1)", "!", str2.rget(1));
	vtest::test("String::>", "true", str2 > str0.len());
	vtest::test("String::>=", "true", str2 >= str0.len());
	vtest::test("String::<", "false", str2 < str0.len());
	vtest::test("String::<=", "false", str2 <= str0.len());
	vtest::test("String::>", "true", str2 > 2);
	vtest::test("String::>=", "true", str2 >= 2);
	vtest::test("String::<", "false", str2 < 2);
	vtest::test("String::<=", "false", str2 <= 2);
	vtest::test("String::>", "false", String("a") > String("b"));
	vtest::test("String::<", "true", String("a") < String("b"));
	vtest::test("String::>=", "true", String("a") >= String("a"));
	vtest::test("String::<=", "true", String("a") <= String("a"));
	vtest::test("String::>", "true", String("aa") > String("a"));
	vtest::test("String::<", "false", String("aa") < String("a"));
	str3 = 'H';
	vtest::test("String::constructor(T)", "H", str3.c_str());
	str3 = "Hi";
	vtest::test("String::=(T*)", "Hi", str3.c_str());
	str3 = 'H';
	vtest::test("String::=(T)", "H", str3.c_str());
	str3 = "Hello World!";
	int str3_len = 0;
	while (*str3) { ++str3_len; ++str3; }
	vtest::test("String::* && String::++", "12", str3_len);
	str3 = "Hello World!";
	str3_len = 1;
	while (*(++str3)) { ++str3_len; }
	vtest::test("String::* && String::++", "12", str3_len);
	str3 = "Hello World!";
	iter_test = "";
	for (auto& i: str3) { iter_test += i; }
	vtest::test("String::begin", "Hello World!", iter_test);
	iter_test = "";
	for (const auto& i: str3.iterate(6, 11)) { iter_test += i; }
	vtest::test("String::begin", "World", iter_test);
	iter_test = "";
	for (const auto& i: str3.iterate(str3.len() - 6, str3.len() - 1)) { iter_test += i; }
	vtest::test("String::begin", "World", iter_test);
	iter_test = "";
	for (auto& i: str3) { iter_test += i; }
	vtest::test("String::begin", "Hello World!", iter_test);
	str0 = "Hello!";
	str0.reset();
	vtest::test("String::reset", "", str0.c_str());

	str0 = "Hello World! World!";
	vtest::test("String::find", "6", str0.find("World!"));
	vtest::test("String::find", "13", str0.find("World", 7));
	vtest::test("String::find", std::to_string(NPos::npos), str0.find("World", 14));

	str0 = "Hello World! World!";
	str0.replace_h(6, 11, "Universe");
	vtest::test("String::replace", "Hello Universe! World!", str0.c_str());
	str0 = "Hello World! World!";
	str0.replace_h(6, 11, "You");
	vtest::test("String::replace", "Hello You! World!", str0.c_str());
	str0 = "Hello World! World!";

	vtest::test("String::replace", "Hi World! Hi", String("Hello World! Hello").replace_r("Hello", "Hi").c_str());
	vtest::test("String::replace", "Hello World! Hello", String("Hi World! Hi").replace_r("Hi", "Hello").c_str());
	vtest::test("String::replace", "hello=", String("hello = ").replace_r(" = ", "=").c_str());

	vtest::test("String::replace_h", "Hi!", String("Howdy!").replace_h(0, 5, "Hi").c_str());
	vtest::test("String::replace_h", "H!", String("Howdy!").replace_h(0, 5, "H").c_str());
	vtest::test("String::replace_h", "H!", String("How!").replace_h(0, 3, "H").c_str());
	vtest::test("String::replace_h", "H!", String("Ho!").replace_h(0, 2, "H").c_str());
	vtest::test("String::replace", " ( ( (", String("(((").replace_r("(", " (").c_str());
	vtest::test("String::replace_h", "/", String("//").replace_h(0, 2, "/").c_str());
	vtest::test("String::replace", "Hi", String("HiHiHiHi").replace_r("HiHi", "Hi").c_str());
	vtest::test("String::replace", "/", String("//").replace_r("//", "/").c_str());
	vtest::test("String::replace", "/", String("///").replace_r("//", "/").c_str());
	vtest::test("String::replace", "/", String("////").replace_r("//", "/").c_str());
	vtest::test("String::replace", "Hello Universe! Universe!", str0.copy().replace_r("World", "Universe").c_str());
	str0 = "Hello World!";
	str0.insert(5, '!');
	vtest::test("String::insert", "Hello! World!", str0.c_str());
	str0 = "CBA";
	vtest::test("String::sort", "ABC", str0.sort_r().c_str());
	str0 = "YCBAXGGZ";
	vtest::test("String::sort", "ABCGGXYZ", str0.sort_r().c_str());

	str0 = "Hello World!";
	vtest::test("String::json", "\"Hello World!\"", str0.json().c_str());

	str0 = "Hello World!\nHow Are you!\n";
	str0.save("/tmp/test.txt");
	str0 = String::load("/tmp/test.txt");
	vtest::test("String::load", "Hello World!\nHow Are you!\n", str0.c_str());
	String loaded_str = String::load("/tmp/test.txt");
	vtest::test("String::load", "Hello World!\nHow Are you!\n", loaded_str.c_str());

	str0 = "Something before {Hello World!} {Hi {Hello Universe!} There} {Hello Earth!} something after.";
	vtest::test("String::slice by chars", "Hello World!", str0.slice('{', '}', 0).c_str());
	vtest::test("String::slice by chars", "Hi {Hello Universe!} There", str0.slice('{', '}', 1).c_str());
	vtest::test("String::slice by chars", "Hello Earth!", str0.slice('{', '}', 2).c_str());
	vtest::test("String::slice by chars", "{Hello Earth!}", str0.slice('{', '}', 2, 0, NPos::npos, true).c_str());
	vtest::test("String::slice by chars", "", str0.slice('{', '}', 2, 0, 0, true).c_str());

	str0 = "!?@Hello World!";
	str0.replace_start_r("!?@");
	vtest::test("String::vreplace_start", "Hello World!", str0.c_str());
	str0 = "!Hello World!?@";
	str0.replace_end_r("!?@");
	vtest::test("String::vreplace_end", "!Hello World", str0.c_str());

	str0 = "Hello World! How Are You Doing?";
	vtest::test("String::split", "Hello", str0.split(" ")[0].c_str());
	vtest::test("String::split", "World!", str0.split(" ")[1].c_str());
	vtest::test("String::split", "Doing?", str0.split(" ").rget(1).c_str());
	vtest::test("String::split", "You", str0.split(" ").rget(2).c_str());
	vtest::test("String::split", "Hello World! How Are You Doing?", str0.split("UH?").rget(1).c_str());
	str0 = "  ";
	vtest::test("String::split", "", str0.split(" ")[0].c_str());
	vtest::test("String::split", "", str0.split(" ")[1].c_str());

	vtest::test("String", "Length is 10 not 15. Understood? true", (String() << "Length is " << 10 << " not " << 15 << ". Understood? " << true).c_str());

	vtest::test("String::*", "    ", (String(" ") * 4).c_str());
	vtest::test("String::/", "Hey", (String("HeyYou") / 2).str().c_str());
	vtest::test("String::/", "Hey", (String("HeyYouThere") / 3).str().c_str());
	vtest::test("String::%", "re", (String("HeyYouThere") % 3).c_str());

	// ---------------------------------------------------------
	// Code.

	Code code0;
	vtest::test("Code::isna", "true", code0.is_undefined());
	code0 = "Hi \"X\" Ho";
	vtest::test("Code::find", "4", code0.find("X"));
	vtest::test("Code::find", std::to_string(NPos::npos), code0.find_code("X", 0, NPos::npos, { .exclude_strings = true} ));
	code0 = "Hi 'X' Ho";
	vtest::test("Code::find", std::to_string(NPos::npos), code0.find_code("X", 0, NPos::npos, { .exclude_chars = true} ));
	code0 = "Hi // X \nHo";
	vtest::test("Code::find", std::to_string(NPos::npos), code0.find_code("X", 0, NPos::npos, { .exclude_comments = true} ));
	code0 = "  Hi  \"  X\" ";
	vtest::test("Code::remove_indent", "Hi  \"  X\" ", code0.remove_indent_r().c_str());
	code0 = "\nkey = (1u << 0),\ntoken = (1u << 1),\nsign = (1u << 2),\n";
	vtest::test("Code::add_indent", "\n    key = (1u << 0),\n    token = (1u << 1),\n    sign = (1u << 2),\n", code0.add_indent_r(4).c_str());
	code0 = "Hi // Hello \n// Hi there";
	vtest::test("Code::remove_comments", "Hi ", code0.remove_comments_r().c_str());
	code0 = "Hi // Hello \n// Hi there";
	vtest::test("Code::slice_comments", "// Hello \n// Hi there", code0.slice_comments_r().c_str());
	code0 = "Hello // Hello \n \"Hello\" 'Hello' ";
	vtest::test("Code::replace_double", "Helo // Helo \n \"Helo\" 'Helo' ", code0.replace_double_r("l", 0, NPos::npos).c_str());
	code0 = "Hello // Hello \n \"Hello\" 'Hello' ";
    vtest::test("Code::replace_double", "Helo // Helo \n \"Hello\" 'Helo' ", code0.replace_double_r("l", 0, NPos::npos, { .exclude_strings = true }).c_str());
	code0 = "Hello // Hello \n \"Hello\" 'Hello' ";
    vtest::test("Code::replace_double", "Helo // Helo \n \"Helo\" 'Hello' ", code0.replace_double_r("l", 0, NPos::npos, { .exclude_chars = true }).c_str());
	code0 = "Hello // Hello \n \"Hello\" 'Hello' ";
    vtest::test("Code::replace_double", "Helo // Hello \n \"Helo\" 'Helo' ", code0.replace_double_r("l", 0, NPos::npos, { .exclude_comments = true }).c_str());

	// ---------------------------------------------------------
	// Dictionary.

	Dict<String, String> dict0;
	Dict<String, String> dict1;
	Dict<String, String> dict2;
	vtest::test("Dict::isna", "true", dict0.is_undefined());
	dict0 = {
		{"a", "Hello"},
		{"b", "World"},
		{"c", "!"},
	};
	dict1 = dict0;
	dict2 = {{"a", "Hello"}};

	vtest::test("Dict::isna", "false", dict0.is_undefined());
	vtest::test("Dict::len", "3", dict0.len());
	vtest::test("Dict::first", "Hello", dict0.first().c_str());
	vtest::test("Dict::last", "!", dict0.last().c_str());
	vtest::test("Dict::eq", "true", dict0.eq(dict1));
	vtest::test("Dict::eq", "false", dict0.eq(dict2));
	vtest::test("Dict::key", "a", dict0.key(0).c_str());
	vtest::test("Dict::value", "Hello", dict0.value("a").c_str());
	dict0.expand(1);
	dict0.set(3, "d", "Hi there");
	vtest::test("Dict::value", "Hi there", dict0.value("d").c_str());
	iter_test = "";
	for (auto& [key, value]: dict0.iterate()) {
		iter_test += key.c_str();
		iter_test += ": ";
		iter_test += value.c_str();
		iter_test += ", ";
	}
	vtest::test("Dict::iterate", "a: Hello, b: World, c: !, d: Hi there, ", iter_test);
	iter_test = "";
	for (auto& [key, value]: dict0.iterate<Backwards>()) {
		iter_test += key.c_str();
		iter_test += ": ";
		iter_test += value.c_str();
		iter_test += ", ";
	}
	vtest::test("Dict::iterate", "d: Hi there, c: !, b: World, a: Hello, ", iter_test);
	iter_test = "";
	for (auto& [key, value]: dict0.iterate<Backwards>(1, 2)) {
		iter_test += key.c_str();
		iter_test += ": ";
		iter_test += value.c_str();
		iter_test += ", ";
	}
	vtest::test("Dict::iterate", "b: World, ", iter_test);
	vtest::test("Dict::str", "{\"a\": \"Hello\", \"b\": \"World\", \"c\": \"!\", \"d\": \"Hi there\"}", dict0.str().c_str());

	dict0 = Dict<String, String>::parse("{\"a\": \"Hello\", \"b\": \"World\", \"c\": \"!\"}");
	vtest::test("Dict::len", "3", dict0.len());
	vtest::test("Dict::parse", "{\"a\": \"Hello\", \"b\": \"World\", \"c\": \"!\"}", dict0.str().c_str());

	Dict<String, Int> dict3 = {{"b", 1}, {"a", 2}, {"c", 0}};
	vtest::test("Dict::sort", "{\"a\": 2, \"b\": 1, \"c\": 0}", dict3.copy().sort_r().str().c_str());
	vtest::test("Dict::sort_values", "{\"c\": 0, \"b\": 1, \"a\": 2}", dict3.copy().sort_values_r().str().c_str());

	// ---------------------------------------------------------
	// Json type.

	int status;
	Json json0("{\"success\": true,\"message\": \"Hello World!\",\"error\": null, \"data\": [0, 1, 2, 3]}");
	vtest::test("Json::json", "{\"success\":true,\"message\":\"Hello World!\",\"error\":null,\"data\":[0,1,2,3]}", json0.json().c_str());

	// ---------------------------------------------------------
	// Response type.

	// auto response0 = vlib::success<String>("Some success message.", "Hello World!");
	// vtest::test("response::success", "true", response0.success());
	// vtest::test("response::status", "0", response0.status());
	// vtest::test("response::message", "Some success message.", response0.message().c_str());
	// vtest::test("response::value", "Hello World!", response0.value().c_str());
 //
	// Response<String> response1 (response0);
	// vtest::test("response::=::success", "true", response1.success());
	// vtest::test("response::status", "0", response0.status());
	// vtest::test("response::=::message", "Some success message.", response1.message().c_str());
	// vtest::test("response::=::value", "Hello World!", response1.value().c_str());
 //
	// Response<> response2 = true;
	// vtest::test("response::success", "true", response2.success());
	// vtest::test("response::status", "0", response2.status());
 //
	// Response<> response3 = false;
	// vtest::test("response::success", "false", response3.success());
	// vtest::test("response::status", "-1", response3.status());
	// vtest::test("response::status", "true", !response3);
 //
	// auto response4 = test_response();
	// vtest::test("response::success", "true", response4.success());
	// vtest::test("response::status", "0", response4.status());
	// vtest::test("response::msg", "Howdy!", response4.message().c_str());
	
	// ---------------------------------------------------------
	// Date type.

	Date date0 (1662194582870);
	
	vtest::test("Date::week", "35", date0.week());
	vtest::test("Date::year", "2022", date0.year());
	
	vtest::test("Date::str", "%", date0.str("%%").c_str());
	vtest::test("Date::str", "Sat", date0.str("%a").c_str());
	vtest::test("Date::str", "Saturday", date0.str("%A").c_str());
	vtest::test("Date::str", "Sep", date0.str("%h").c_str());
	vtest::test("Date::str", "September", date0.str("%B").c_str());
	vtest::test("Date::str", "20", date0.str("%C").c_str());
	vtest::test("Date::str", "03", date0.str("%d").c_str());
	vtest::test("Date::str", " 3", date0.str("%_d").c_str());
	vtest::test("Date::str", " 3", date0.str("%e").c_str());
	vtest::test("Date::str", "09/03/22", date0.str("%D").c_str());
	vtest::test("Date::str", "2022-09-03", date0.str("%F").c_str());
	vtest::test("Date::str", "10", date0.str("%H").c_str());
	vtest::test("Date::str", "10", date0.str("%I").c_str());
	vtest::test("Date::str", "246", date0.str("%j").c_str());
	vtest::test("Date::str", "10", date0.str("%k").c_str());
	vtest::test("Date::str", "10", date0.str("%l").c_str());
	vtest::test("Date::str", "09", date0.str("%m").c_str());
	vtest::test("Date::str", "43", date0.str("%M").c_str());
	vtest::test("Date::str", "\n", date0.str("%n").c_str());
	vtest::test("Date::str", "8", date0.str("%1N").c_str());
	vtest::test("Date::str", "87", date0.str("%2N").c_str());
	vtest::test("Date::str", "870", date0.str("%3N").c_str());
	vtest::test("Date::str", "AM", date0.str("%p").c_str());
	vtest::test("Date::str", "am", date0.str("%P").c_str());
	vtest::test("Date::str", "10:43:02 AM", date0.str("%r").c_str());
	vtest::test("Date::str", "10:43", date0.str("%R").c_str());
	vtest::test("Date::str", "1662194582", date0.str("%s").c_str());
	vtest::test("Date::str", "02", date0.str("%S").c_str());
	vtest::test("Date::str", "\t", date0.str("%t").c_str());
	vtest::test("Date::str", "10:43:02", date0.str("%T").c_str());
	vtest::test("Date::str", "6", date0.str("%u").c_str());
	vtest::test("Date::str", "35", date0.str("%U").c_str());
	vtest::test("Date::str", "35", date0.str("%V").c_str());
	vtest::test("Date::str", "6", date0.str("%w").c_str());
	vtest::test("Date::str", "35", date0.str("%W").c_str());
	vtest::test("Date::str", "22", date0.str("%y").c_str());
	vtest::test("Date::str", "2022", date0.str("%Y").c_str());
	vtest::test("Date::str", "+0200", date0.str("%z").c_str());
	vtest::test("Date::str", "+02:00", date0.str("%:z").c_str());
	vtest::test("Date::str", "+02:00:00", date0.str("%::z").c_str());
	vtest::test("Date::str", "+02", date0.str("%:::z").c_str());
	vtest::test("Date::str", "CEST", date0.str("%Z").c_str());
	
	vtest::test("Date::str", "2022-09-03T10:43:02+02:00", date0.str().c_str());
	
	vtest::test("Date::str", "1662194582870", date0.json().c_str());
	const String& date0str = date0.json();
	vtest::test("Date::str", "1662194582870", Date::parse(date0str.data(), date0str.len()).json().c_str());

	// ---------------------------------------------------------
	// Permission type.

	vtest::test("Permission::user", "7", Permission(0710).user());
	vtest::test("Permission::user", "6", Permission(0610).user());
	vtest::test("Permission::user", "5", Permission(0510).user());
	vtest::test("Permission::user", "4", Permission(0410).user());
	vtest::test("Permission::user", "3", Permission(0310).user());
	vtest::test("Permission::user", "2", Permission(0210).user());
	vtest::test("Permission::user", "1", Permission(0110).user());
	vtest::test("Permission::user", "0", Permission(0010).user());
	vtest::test("Permission::group", "4", Permission(0741).group());
	vtest::test("Permission::shared", "1", Permission(0741).shared());
	// vtest::test("Permission::octal", "741", Permission(0741).octal());

	vtest::test("Permission::shared", "rwxr----x", Permission(0741).str().c_str());

	// ---------------------------------------------------------
	// User type.
	//
	// Is system dependend therefore not applicable for universal testing.
	//

	#if OSID <= 0 || OSID >= 4

	// User administrator("administrator");

	// vtest::test("User::uid", "1000", administrator.uid());

	// vtest::test("User::gid", "1000", administrator.gid());
	// vtest::test("User::name", "administrator", administrator.name().c_str());
	// vtest::test("User::pass", "x", administrator.pass().c_str());
	// vtest::test("User::home", "/home/administrator", administrator.home().c_str());

	// auto response = User::prompt_pass("Pass password:");
	// vtest::test("User::prompt_pass", "true", response.success());
	// std::cout << "Password authentication: " << administrator.verify_pass(*response, true).success() << "\n";

	// vtest::test("User::create", "0", User::create("johndoe", "John Doe", "HelloThere!").status());
	// vtest::test("User::set_pass", "0", User("johndoe").set_pass("HowdyThere!").status());
	// vtest::test("User::del", "0", User("johndoe").del().status());

	// auto response = User::create("johndoe", "John Doe", "HelloThere!");
	// std::cout << "SUCCESS: " << response.success() << "\n";
	// std::cout << "STATUS: " << response.status() << "\n";
	// if (response.has_message()) { std::cout << "MSG: " << response.message().c_str() << "\n"; }

	#elif OSID == 1

	// User administrator("administrator");

	// vtest::test("User::uid", "501", administrator.uid());
	// vtest::test("User::gid", "20", administrator.gid());
	// vtest::test("User::name", "administrator", administrator.name().c_str());
	// // vtest::test("User::pass", "********", administrator.pass().c_str());
	// vtest::test("User::home", "/Users/administrator", administrator.home().c_str());

	// String pass = "HelloThere!";
	// vtest::test("User::create", "0", User::create("johndoe", "John Doe", pass).status());
	// vtest::test("User::del", "0", User("johndoe").del().status());

	// auto response = User::create("johndoe", "John Doe", "HelloThere!");
	// std::cout << "response success: " << response.success() << "\n";
	// // std::cout << "response message: " << response.message().c_str() << "\n";
	// std::cout << "response status: " << response.status() << "\n";
	// vtest::test("User::create", "0", response.status());

	#endif

	// ---------------------------------------------------------
	// Group type.
	//
	// Is system dependend therefore not applicable for universal testing.
	//

	#if OSID <= 0 || OSID >= 4

	// Group rootg("root");

	// vtest::test("Group::gid", "0", rootg.gid());
	// vtest::test("Group::name", "root", rootg.name().c_str());
	// // vtest::test("Group::members", "{root}", rootg.members().join().c_str());
	//
	// vtest::test("Group::exists", "false", Group::exists("someunexistinggroup"));
	//
	// vtest::test("Group::create", "0", Group::create("vlibtestgroup").status());
	//
	// Group testgroup("vlibtestgroup");
	// vtest::test("Group::members", "[\"root\"]", testgroup.members().join().c_str());
	// vtest::test("Group::add", "0", testgroup.add("administrator").status());
	// vtest::test("Group::members", "[\"root\", \"administrator\"]", testgroup.members().join().c_str());
	//
	// vtest::test("Group::members", "[\"root\", \"administrator\"]", Group("vlibtestgroup").members().join().c_str());
	//
	// vtest::test("Group::remove", "0", testgroup.remove("administrator").status());
	// vtest::test("Group::members", "[\"root\"]", testgroup.members().join().c_str());
	//
	// vtest::test("Group::members", "[\"root\"]", Group("vlibtestgroup").members().join().c_str());
	//
	// vtest::test("Group::del", "0", Group("vlibtestgroup").del().status());

	#elif OSID == 1

	// Group wheel("wheel");

	// vtest::test("Group::gid", "0", wheel.gid());
	// vtest::test("Group::name", "wheel", wheel.name().c_str());
	// vtest::test("Group::members", "{root}", wheel.members().join().c_str());

	// vtest::test("Group::exists", "false", Group::exists("someunexistinggroup"));

	// vtest::test("Group::create", "0", Group::create("vlibtestgroup").status());

	// Group testgroup("vlibtestgroup");
	// vtest::test("Group::members", "{root}", testgroup.members().join().c_str());
	// vtest::test("Group::add", "0", testgroup.add("administrator").status());
	// vtest::test("Group::members", "{root, administrator}", testgroup.members().join().c_str());

	// vtest::test("Group::members", "{root, administrator}", Group("vlibtestgroup").members().join().c_str());

	// vtest::test("Group::remove", "0", testgroup.remove("administrator").status());
	// vtest::test("Group::members", "{root}", testgroup.members().join().c_str());

	// vtest::test("Group::members", "{root}", Group("vlibtestgroup").members().join().c_str());

	// vtest::test("Group::del", "0", Group("vlibtestgroup").del().status());

	#endif

	// ---------------------------------------------------------
	// Path type.

	vtest::test("Path_t::c_str", "/tmp/test", Path("/tmp/test").c_str());
	vtest::test("Path_t::c_str", "/tmp/test", Path("/tmp/test/").c_str());

	vtest::test("Path_t::c_str", "/tmp/test", Path("/tmp/test").str().c_str());

	vtest::test("Path_t::access", "true", Path("/").access());
	// vtest::test("Path_t::write_access", "false", Path("/").write_access());
	// vtest::test("Path_t::access", "true", Path("/Users/administrator/").access());

	vtest::test("Path_t::exists", "true", Path("/tmp/").exists());
	vtest::test("Path_t::exists", "true", Path("/tmp/test.txt").exists());
	vtest::test("Path_t::exists", "false", Path("/tmp/somefilethatdoesnotexist").exists());
	vtest::test("Path_t::exists", "false", Path("/tmp/somefilethatdoesnotexist").exists());

	vtest::test("Path_t::clean", "/tmp/test.txt", Path(" //tmp/test.txt ").clean().c_str());

	vtest::test("Path_t::full_name", "test.txt", Path("test.txt").full_name().c_str());
	vtest::test("Path_t::full_name", "test.txt", Path("/tmp/test.txt").full_name().c_str());

	vtest::test("Path_t::name", "", Path("/").name().c_str());
	vtest::test("Path_t::name", "me", Path("/tmp/dir/test/new/me.txt").name().c_str());
	vtest::test("Path_t::name", "test", Path("test.txt").name().c_str());
	vtest::test("Path_t::name", "test", Path("/tmp/test.txt").name().c_str());

	vtest::test("Path_t::extension", "txt", Path("/tmp/test.txt").extension().c_str());
	vtest::test("Path_t::extension", "txt", Path("test.txt").extension().c_str());
	vtest::test("Path_t::extension", "", Path("testtxt").extension().c_str());
	vtest::test("Path_t::extension", "", Path("/tmp/dir.txt").extension().c_str());

	// vtest::test("Path_t::atime", "X", Path("/tmp/my_array").atime());
	// vtest::test("Path_t::mtime", "X", Path("/tmp/my_array").mtime());
	// vtest::test("Path_t::ctime", "X", Path("/tmp/my_array").ctime());
	// vtest::test("Path_t::size", "X", Path("/tmp/my_array").size());

	// vtest::test("Path_t::permission::user", "4", Path("/tmp/my_array").permission().user());
	// vtest::test("Path_t::permission::group", "2", Path("/tmp/my_array").permission().group());
	// vtest::test("Path_t::permission::shared", "0", Path("/tmp/my_array").permission().shared());
	// vtest::test("Path_t::permission::umask", "420", Path("/tmp/my_array").permission().mode());
	// vtest::test("Path_t::user", "501", Path("/tmp/my_array").user().uid());
	// vtest::test("Path_t::gid", "0", Path("/tmp/my_array").gid());

	vtest::test("Path_t::base", "/tmp", Path("/tmp/test.txt").base().c_str());
	vtest::test("Path_t::base", "/", Path("/tmp/").base().c_str());
	vtest::test("Path_t::base", "/", Path("/tmp/").base().c_str());
	vtest::test("Path_t::base", "/", Path("/").base().c_str());
	vtest::test("Path_t::base", "/tmp/dir", Path("/tmp/dir/test.txt").base(1).c_str());
	vtest::test("Path_t::base", "/tmp", Path("/tmp/dir/test.txt").base(2).c_str());
	vtest::test("Path_t::base", "/tmp", Path("/tmp/dir/dir/dir/test.txt").base(4).c_str());

	vtest::test("Path_t::join", "/tmp/dir/dir/file", Path("/tmp/dir").join("/dir/file").c_str());

	// for (auto& i: Path("/tmp/").paths()) {
	// 	vlib::out << i.c_str() << " (" << i.size() << " bytes). \n";
	// }

	// ---------------------------------------------------------
	// File type.

	File file("/tmp/File");
	if (!file.exists()) {
        file.create();
	}
    file.open();
    file.write("Hello World!");
	vtest::test("File::read", "Hello World!", file.read().c_str());
    file.append(" Howdy!");
	vtest::test("File::read", "Hello World! Howdy!", file.read().c_str());
    file.remove();

	// ---------------------------------------------------------
	// Process type.
	
	Proc proc;

	proc.timeout = 0;
	vtest::test("Proc::execute", "0", proc.execute("echo Hello World! && sleep 10"));
	vtest::test("Proc::timedout", "true", proc.timedout());
	vtest::test("Proc::kill", "0", proc.kill());
	vtest::test("Proc::running", "false", proc.running());
	proc.timeout = -1;

	vtest::test("Proc::execute", "0", proc.execute("echo Hello World!"));
	vtest::test("Proc::exit_status", "0", proc.exit_status());
	vtest::test("Proc::output", "Hello World!\n", proc.out().c_str());
	
	vtest::test("Proc::execute", "0", proc.execute("echo Hello World! && exit 1"));
	vtest::test("Proc::exit_status", "256", proc.exit_status());
	vtest::test("Proc::output", "Hello World!\n", proc.out().c_str());
	
	vtest::test("Proc::execute", "0", proc.execute("echo Hello World! && exit 2"));
	vtest::test("Proc::exit_status", "512", proc.exit_status());
	vtest::test("Proc::output", "Hello World!\n", proc.out().c_str());
	
	vtest::test("Proc::execute", "0", proc.execute("/bin/bash", "bash", "-c", "echo Hello World!"));
	vtest::test("Proc::exit_status", "0", proc.exit_status());
	vtest::test("Proc::output", "Hello World!\n", proc.out().c_str());
	
	# if OSID == 1
		Proc proc1;
		if ((status = proc1.execute("/bin/zsh", "-exec", "-c", "echo Hello World!")) != 0) {
			std::cout << "Failed to execute zsh process [errno: " << proc1.err_number() << "]. \n";
			vtest::test("Proc::execute", "0", status);
		} else {
			vtest::test("Proc::exit_status", "0", proc1.exit_status());
			vtest::test("Proc::output", "Hello World!\n", proc1.out().c_str());
		}
	#endif

	// Works, its just too slow for testing.
	// vtest::test("Proc::execute", "0", proc.execute("echo Hello && sleep 3 && echo World!").status());
	// vtest::test("Proc::exit_status", "0", proc.exit_status());
	// vtest::test("Proc::output", "Hello\nWorld!\n", proc.output().c_str());

	// To test.
	// Script script0(
	// 				 "echo Error: some error.",
	// 				 "exit 2"
	// );
	// vtest::test("Proc::execute", "0", proc.execute(script0).status());
	// std::cout << "EXIT STATUS: " << proc.exit_status() << ".\n";
	// if (proc.has_err()) { std::cout << "ERROR: " << proc.error().c_str() << ".\n"; }
	// if (proc.has_out()) { std::cout << "OUTPUT: " << proc.output().c_str() << ".\n"; }

	// ---------------------------------------------------------
	// Variant.

	// @BUG ...
	// vtest::test("variant_t::construct", "Null", variant_t().type().c_str());
	// vtest::test("variant_t::construct", "Bool", variant_t(true).type().c_str());
	// vtest::test("variant_t::construct", "Int", variant_t(1).type().c_str());
	// vtest::test("variant_t::construct", "Double", variant_t(1.0).type().c_str());
	// vtest::test("variant_t::construct", "Len", variant_t(100000000000000000).type().c_str());
	// vtest::test("variant_t::construct", "String", variant_t("Hello World!").type().c_str());
	// vtest::test("variant_t::construct", "Array", variant_t(vArray({0, 1})).type().c_str());
	// vtest::test("variant_t::construct", "Dict", variant_t(vDict({{0, 1}})).type().c_str());

	// variant_t var0 = "Hello World!";
	// vtest::test("variant_t::find", "11", var0.as<String>().find('!'));
	// vtest::test("variant_t::find", "11", var0.str().find('!'));
	// vArray varr0({0, 1, 2}); // @BUG this causes a huge llvm bug on linux - stacktrace dump like bug.
	// variant_t var1 = varr0;
	// vtest::test("variant_t::dtype", "Array", var1.dtype().c_str());
	// vtest::test("variant_t::find", "2", var1.array().find(2));
	
	// ---------------------------------------------------------
	// Dataframe.
	
	// DataFrame df0 ("Hello World!");
	// print(df0);
	// DataFrame df1 (100);
	// print(df1);
	// DataFrame df2 (1.00);
	// print(df2);
	// DataFrame df3 ({
	// 	"Hello World!",
	// 	100,
	// 	1.00
	// });
	// print(df3);
	DataFrame df4 ({
		{"Hello World!", 101, 1.00},
		{"Howdy!", 234, 0.23},
		{"Hi!", 4693, 0.98},
	});
	df4.set_columns({"name", "price", "value"});
	// print(df4);
	DataFrame df41 = df4["value"];
	// print(df41);
	// df41.add_r(1);
	// print(df41);
	// df41.sub_r(1);
	// print(df41);
	// df41.mult_r(2);
	// print(df41);
	// df41.div_r(2);
	// print(df41);
	// df4["price"].mod_r(10);
	// print(df4["price"]);
	// print(df41);
    print(df41.ma());
    print(df41.ma(2));
    print(df41.ema());
    print(df41.ema(2));
    print(df41.wma());
    print(df41.wma(2));
    // print(DataFrame({22.73, 22.71, 22.57, 22.59, 22.72}).wma());
    // print(DataFrame({23, 36, 24, 13, 25}).wma());
    // print(DataFrame({22.73, 22.71, 22.57, 22.59, 22.72}).wma(2));
    // print(DataFrame({22.73, 22.71, 22.57, 22.59, 22.72}).wma(2).max());
    // print(DataFrame({22.73, 22.71, 22.57, 22.59, 22.72}).wma(2).min());
    // print(DataFrame({-22.73, 22.71}).abs());
	
	Date date(0);
	print(date.str());
	
	// ---------------------------------------------------------
	// Speed test.

	/*if (false) {
			
		// ---------------------------------------------------------
		// Length type.
		
		unsigned long long air = 0;
		auto mark = now();
		for (auto& i: range(0, 100)) {
			for (unsigned long long li = 0; li < 1000000000000000.0; ++li ) { if (true) {} ++air; } // add one zero more and it takes extremely long so it does work with "-O2".
		}
		auto mark0 = now() - mark;
		mark = now();
		for (auto& i: range(0, 100)) {
			for (Len li = 0; li < 1000000000000000.0; ++li ) { if (true) {} ++air; } // add one zero more and it takes extremely long so it does work with "-O2".
		}
		auto mark1 = now() - mark;
		std::cout << "Numeric::uLong: " << mark0 << "ms" << std::endl;
		std::cout << "Len: " << mark1 << "ms" << std::endl;
		std::cout << "air: " << air << std::endl;

		// ---------------------------------------------------------
		// Array.
		vtest::speed speed{ .class_a = "Array", .class_b = "std::vector"};

		// Constructor.
		speed.add("constructor"); speed.start();
		for (int i = 0; i < 1000000; ++i) { Array<int> test_arr = {0, 1, 2}; }
		speed.enda(); speed.start();
		for (int i = 0; i < 1000000; ++i) { std::vector<int> std_vector = {0, 1, 2}; }
		speed.endb();

		// Assignment operator.
		speed.add("assignment operator"); speed.start();
		Array<int> test_arr;
		for (int i = 0; i < 1000000; ++i) { test_arr = {0, 1, 2}; }
		speed.enda(); speed.start();
		std::vector<int> std_vector;
		for (int i = 0; i < 1000000; ++i) { std_vector = {0, 1, 2}; }
		speed.endb();

		// Append.
		speed.add("append"); speed.start();
		for (int i = 0; i < 1000000; ++i) { test_arr.append(0); }
		speed.enda(); speed.start();
		for (int i = 0; i < 1000000; ++i) { std_vector.push_back(0); }
		speed.endb();

		// Equals.
		speed.add("equals"); speed.start();
		test_arr = {0, 1, 2, 3, 4, 5, 6, 7, 8, 9};
		for (int i = 0; i < 1000000; ++i) { if (test_arr == test_arr) { ++air; } }
		speed.enda(); speed.start();
		std_vector = {0, 1, 2, 3, 4, 5, 6, 7, 8, 9};
		for (int i = 0; i < 1000000; ++i) { if (std_vector == std_vector) { ++air; } }
		speed.endb();

		// Dump.
		std::cout << "\n";
		speed.dump();
		
		// ---------------------------------------------------------
		// String.
		
		speed = vtest::speed{ .class_a = "String", .class_b = "std::string", .m_prev = speed.prev() };

		// Constructor.
		speed.add("constructor"); speed.start();
		for (int i = 0; i < 1000000; ++i) {
			String base_string = "Hi";
			// String base_string = {'H', 'i'};
		}
		speed.enda(); speed.start();
		for (int i = 0; i < 1000000; ++i) { std::string std_string = "Hi"; }
		speed.endb();

		// Assignment operator.
		speed.add("assignment operator"); speed.start();
		String base_string;
		for (int i = 0; i < 1000000; ++i) { base_string = "Hi"; }
		speed.enda(); speed.start();
		std::string std_string;
		for (int i = 0; i < 1000000; ++i) { std_string = "Hi"; }
		speed.endb();

		// Operator +=.
		speed.add("operator +="); speed.start();
		base_string = "";
		for (int i = 0; i < 1000000; ++i) { base_string += "Hi"; }
		speed.enda(); speed.start();
		std_string = "";
		for (int i = 0; i < 1000000; ++i) { std_string += "Hi"; }
		speed.endb();

		// Find.
		speed.add("find"); speed.start();
		base_string = "";
		for (int i = 0; i < 1000000; ++i) { air += base_string.find("Hello");  }
		speed.enda(); speed.start();
		std_string = "";
		for (int i = 0; i < 1000000; ++i) { air += std_string.find("Hello"); }
		speed.endb();

		// Dump.
		std::cout << "\n";
		speed.dump();

		// End.
		std::cout << "\nAir: " << air << "(ignore this)\n";

		
	}*/

	// End.
	return vtest::exit_status();

};
}; 		// End struct.
}; 		// End namespace.
#endif  // End header.

// search for auto


// DOCS SKIPPED FILES
// sockets/http/Client
// sockets/http/ClientTemplate
// sockets/https/Client
// types/base/*


// @return: Returns `0` upon success, and the error code upon failure (`< 0`).

/* @docs {
    @chapter: compression
    @title: Compression
    @description:
        Static compression struct, used to compress and decompress data.
    @usage:
        #include <vlib/compression.h>
        vlib::Compression compression;
} */

/*  @docs {
    @title: Constructor
    @description:
        Construct a compression object.
    @parameter: {
        @name: level
        @description: The compression level.
    }
    @parameter: {
        @name: maxbytes
        @description: The maximum bytes to compress, use `-1` to ignore the max bytes.
    }
    @usage:
        vlib::Compression compression(vlib::compression::level::def, -1);
} */

/*  @docs {
    @title: Max
	@type: ullong
    @description:
        Get the max bytes attribute.
} */

