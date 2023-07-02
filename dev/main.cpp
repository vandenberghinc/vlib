// Author: Daan van den Bergh
// Copyright: © 2022 Daan van den Bergh.


// #include "include/vlib/types.h"
// #include "include/vlib/sockets/socket.h"
// int main() {
//     // vlib::print(vlib::dns_blacklist("172.105.128.12"));
//     vlib::print(vlib::dns_blacklist("84.84.132.194"));
// }

#include "codeql/main.cpp"

// #include "../include/vlib/types.h"
// int main() {
// 	using namespace vlib;
// 	Code code ("x = \"\\\"Hello!\\\"\"; ");
// 	String green_true = tostr(vlib::colors::green, "true", vlib::colors::end);
// 	String normal_false = "false";
// 	for (auto& i: code.iterate()) {
// 		print(
// 			  i.character(),
// 			  " (is_comment=", i.is_comment() ? green_true : normal_false,
// 			  " is_code=", i.is_code() ? green_true : normal_false,
// 			  " is_str=", i.is_str() ? green_true : normal_false,
// 			  " is_char=", i.is_char() ? green_true : normal_false,
// 		")");
// 	}
// }

// #include "../include/vlib/compression.h"

// int main() {
//     using namespace vlib::shortcuts::types;
//
//
//     // String raw;
//     // // raw.random_r(UINT_MAX * 2);
//     // raw.random_r(10000);
//     // String compressed = vlib::compress(raw);
//     // print("MATCH: ", vlib::decompress(compressed) == raw);
//
//     // vlib::Zip zip;
//     // // zip.create("//Users/administrator/Downloads/dir", "/Users/administrator/Downloads/archive.zip");
//     // zip.read("/Users/administrator/Downloads/archive.zip");
//     // Path::remove("/Users/administrator/Downloads/zip_extract/");
//     // zip.extract("/Users/administrator/Downloads/zip_extract/");
//     // // zip.read("/Users/administrator/Downloads/macos_archive.zip");
//
// 	Code code ("\" * offset: \" << entry.offset << \"\n\" << \n// \" * permission: \" << (entry.mode & (S_IRWXU | S_IRWXG | S_IRWXO)) << \"\n\" << \n\" * mode: \" << entry.mode << \"\n\" <<");
// 	String green_true = tostr(vlib::colors::green, "true", vlib::colors::end);
// 	String normal_false = "false";
// 	for (auto& i: code.iterate()) {
// 		print(
// 			  i.character(),
// 			  " (is_comment=", i.is_comment() ? green_true : normal_false,
// 			  " is_code=", i.is_code() ? green_true : normal_false,
// 			  " is_str=", i.is_str() ? green_true : normal_false,
// 			  " is_char=", i.is_char() ? green_true : normal_false,
// 		")");
// 	}
// }




// #include "include/vlib/crypto.h"
// #include "include/vlib/crypto/xchacha.h"
// int main() {
    // try {
    //     // print(vlib::crypto::random(12));
    //     vlib::String key = vlib::crypto::random(KEYSIZE);
    //     vlib::String nonce = vlib::crypto::random(IVSIZE);
    //     vlib::Array<uint8_t> data, encrypted, decrypted;
    //     // data.fill_r(64, (uint8_t) 90);
    //     // data = "Hello World!";
    //     data.append((uint8_t) 'H');
    //     data.append((uint8_t) 'i');
    //     data.append((uint8_t) '!');
    //     encrypted.resize(data.len());
    //     encrypted.len() = data.len();
    //     decrypted.resize(data.len());
    //     decrypted.len() = data.len();
    //     // vlib::crypto::XChaCha20::Context ctx;
    //     uint8_t counter[8] = {0x1};
    //     XChaCha_ctx ctx;
    //     
    //     xchacha_keysetup(&ctx, (uint8_t*) key.data(), (uint8_t*) nonce.data());
    //     
    //     xchacha_set_counter(&ctx, counter);
    //     
    //     xchacha_encrypt_bytes(&ctx, data.data(), encrypted.data(), (uint32_t) data.len());
    //     
    //     xchacha_encrypt_bytes(&ctx, encrypted.data(), decrypted.data(), (uint32_t) encrypted.len());
    //     
    //     std::cout << (char*) data.data() << "\n\n";
    //     std::cout << encrypted.data() << "\n\n";
    //     std::cout << (char*) decrypted.data() << "\n\n";
    //     
    // } DUMP_STACKTRACE
// }

// #include "include/vlib/types/_include.h"
// int main() {
//     STACKTRACE {
//         vlib::Serial serial { .port = "/dev/tty.usbserial-AQ01PNSU", .speed = 9600 };
//         serial.open();
//         serial.configure();
//         serial.flush();
//         vlib::print("CONNECT");
//         while (true) {
//             vlib::sleep::msec(100);
//             serial.write("CONNECT");
//             try {
//                 vlib::String data = serial.read(1 * 1000);
//                 if (data.is_defined()) {
//                     print("Read: ", data);
//                     break;
//                 }
//             } catch (vlib::exceptions::TimeoutError&) {}
//         }
//         vlib::print("SEND");
//         while (true) {
//             vlib::sleep::sec(1);
//             serial.write("Hi!");
//             try {
//                 vlib::String data = serial.read(5 * 1000);
//                 if (data.is_defined()) {
//                     print("Read: ", data);
//                     break;
//                 }
//             } catch (vlib::exceptions::TimeoutError&) {}
//         }
//         serial.close();
//         vlib::print("Done");
//     } DUMP_STACKTRACE
// }

// #include "tests/main.cpp"

// #include "tests/crypto/aes.cpp"

// #include "include/vlib/types.h"
// #include "include/vlib/crypto.h"
// int main() {
//     vlib::Base64::encode("Hello World!");
// }

// #include "tests/crypto/aes.cpp"

// #include "tests/sockets/tls/client.cpp"
// #include "tests/sockets/tls/server.cpp"

// #include "tests/sockets/restapi/server.cpp"
// #include "tests/sockets/restapi/client.cpp"

// #include "tests/thread/class.cpp"
// #include "tests/thread/func.cpp"

// MAKE BENCHMARK.
// #include "include/vlib/types.h"
// int main() {
// 	time_t now;
// 	now = vlib::date_t::get_mseconds();
// 	vlib::ullong air = 0;
// 	for (auto& i: vlib::range(1000000000)) {
// 		vlib::ptr_t<int> x = 0;
// 		++air;
// 	}
// 	vlib::print("Speed 1: ", vlib::date_t::get_mseconds() - now);
// 	now = vlib::date_t::get_mseconds();
// 	for (vlib::ullong i = 0; i < 1000000000; ++i) {
// 		int* x = new int (0);
// 		++air;
// 	}
// 	vlib::print("Speed 2: ", vlib::date_t::get_mseconds() - now);
// 	vlib::print("Ignore: ", air);
// 	return 0;
// }

// MAKE BENCHMARK FOR SWITCH BEFORE ITERATION OR SWITCH INSIDE ITERATION.
// #include "include/vlib/types.h"
// using namespace vlib;
// df_t iter_1(df_t& df) {
// 	df_t summed;
// 	switch (df.first().m_type) {
// 	case df::types::integer:
// 		summed.init_type(df::types::integer);
// 		break;
// 	case df::types::floating:
// 		summed.init_type(df::types::floating);
// 		break;
// 	}
// 	for (auto& i: df) {
// 		switch (i.m_type) {
// 		case df::types::integer:
// 			summed += *i.m_int;
// 			continue;
// 		case df::types::floating:
// 			summed += *i.m_float;
// 			continue;
// 		}
// 	}
// 	return summed;
// }
// df_t iter_2(df_t& df) {
// 	df_t summed;
// 	switch (df.first().m_type) {
// 	case df::types::integer:
// 		summed.init_type(df::types::integer);
// 		for (auto& i: df) {
// 			summed += *i.m_int;
// 		}
// 		break;
// 	case df::types::floating:
// 		summed.init_type(df::types::floating);
// 		for (auto& i: df) {
// 			summed += *i.m_float;
// 		}
// 		break;
// 	}
// 	return summed;
// }
// int main() {
// 	time_t now;
// 	now = vlib::date_t::get_mseconds();
// 	df_t df({1, 2, 3, 4, 5});
// 	for (auto& i: vlib::range(1000000)) {
// 		iter_1(df);
// 	}
// 	vlib::print("Speed 1: ", vlib::date_t::get_mseconds() - now);
// 	now = vlib::date_t::get_mseconds();
// 	for (auto& i: vlib::range(1000000)) {
// 		iter_2(df);
// 	}
// 	vlib::print("Speed 2: ", vlib::date_t::get_mseconds() - now);
// 	vlib::print("Ignore: ", df);
// 	return 0;
// }

// #include "include/vlib/types.h"
// #include <math.h>
// int main() {
// 	time_t now;
// 	now = vlib::date_t::get_mseconds();
// 	vlib::ullong i1;
// 	for (auto& i: vlib::range(100000000)) {
// 		i1 = 100;
// 		i1 = sqrt(i1);
// 	}
// 	vlib::print("Speed 1: ", vlib::date_t::get_mseconds() - now);
// 	now = vlib::date_t::get_mseconds();
// 	vlib::ullong i2;
// 	for (auto& i: vlib::range(100000000)) {
// 		i2 = 100;
// 		i2 = vlib::sqrt(i2);
// 	}
// 	vlib::print("Speed 2: ", vlib::date_t::get_mseconds() - now);
// 	vlib::print("Ignore: ", i1, i2);
// 	return 0;
// }


// #include "include/vlib/types.h"
// struct A {
// 	short m_t1 = 1;
// 	short m_t2 = 1;
// 	int m_i;
// 	A(const int& i) :
// 	m_i(i) {}
// 	constexpr
// 	auto& 	a(const int& i) {
// 		m_i += i;
// 		return *this;
// 	}
// 	constexpr
// 	auto& 	b(const int& i) {
// 		switch (m_t1) {
// 			case 1:
// 				switch (m_t2) {
// 					case 1:
// 						m_i += i;
// 						return *this;
// 					default:
// 						return *this;
// 				}
// 			default:
// 				return *this;
// 		}
// 	}
// };
// int main () {
// 	time_t now;
// 	now = vlib::date_t::get_mseconds();
// 	A i1 = 0;
// 	for (auto& i: vlib::range(100000000000000000)) {
// 		i1.a(1);
// 	}
// 	vlib::print("Speed 1: ", vlib::date_t::get_mseconds() - now);
// 	now = vlib::date_t::get_mseconds();
// 	A i2 = 0;
// 	for (auto& i: vlib::range(100000000000000000)) {
// 		i2.b(1);
// 	}
// 	vlib::print("Speed 2: ", vlib::date_t::get_mseconds() - now);
// 	vlib::print("Ignore: ", i1.m_i, i2.m_i);
// 	return 0;
// }


/*
#include <pthread.h>
#include <iostream>
#include <tuple>

class thread
{
	pthread_t _tid;

public:
	thread() :
	_tid(0)
	{ }

	template <typename F, typename... Args>
	thread(F f, Args... args)
	{
		auto l = new auto(
			[=] {
				f(args...);
			});
		auto te =
			[](void* rp) -> void*
			{
				auto p = reinterpret_cast<decltype(l)>(rp);
				(*p)();
				delete p;

				return nullptr;
			};
		pthread_create(&_tid, 0, te, l);
	}

	void join()
	{
		pthread_join(_tid, nullptr);
	}
};
// USAGE
void
test(int i, char c)
{
	std::cout << "test: ";
	while (i > 0) {
		std::cout << c;
		i--;
	}
	std::cout << std::endl;
}
int main(const int argc, const char** argv)
{
	thread t(test, 6, 'a');
	t.join();
}
*/

// #include "include/vlib/types.h"
// using namespace vlib;
//
// template <typename Func, typename... Args>
// void* test_proxy(void* func) {
// 	// vlib::print(a, b);
// 	void(*fn)(Args...) = reinterpret_cast<void(*)(Args...)>(func);
// 	fn("Hello", " World!");
// 	return NULL;
// }
// struct test_thread {
// 	template <typename Func, typename... Args>
// 	test_thread(Func(*fn)(Args...), Args... args) {
// 		pthread_t tid;
// 		pthread_create(&tid, 0, test_proxy<Func, Args...>, &fn);
// 		pthread_join(tid, NULL);
// 	}
// };
// void test (const char* a, const char* b) {
// 	vlib::print(a, b);
// }
// int main() {
// 	test_thread t(test, "Hello", " World!");
// 	return 0;
// }

// void dump() {}
// template <typename Arg, typename... Args>
// void dump(const Arg& arg, Args&&... args) {
// 	print(arg);
// 	dump(args...);
// }
// template <typename... Args>
// void* dump_proxy(Args&&... args) {
// 	dump(args...);
// }
// template <typename... Args>
// void* dump_thread(void* func) {
// 	// void(*fn)(Args...) = reinterpret_cast<void(*)(Args...)>(func);
// 	// fn("Hello ", "World!");
// 	return NULL;
// };
// template <typename... Args>
// void dump_start(Args&&... args) {
// 	fthread_t thread;
// 	thread.start(dump_thread<Args...>);
// 	thread.join();
// };
// int main() {
// 	dump_start("Hello ", "World!");
// }

// #include <pthread.h>
// #include <iostream>
//
// /** THREAD CLASS **/
// template <typename _ret_type, typename... _args_types>
// void*
// __thread_proxy(void* p)
// {
// 	_ret_type(*fn)(_args_types...) = reinterpret_cast<_ret_type(*)(_args_types...)>(p);
// 	std::cout << "Thread " << pthread_self() << " speaking! :)" << std::endl;
// 	fn(6, 'a');
// 	return NULL;
// }
//
// class thread
// {
// 	pthread_t _tid;
//
// public:
// 	thread() :
// 	_tid(0)
// 	{ }
//
// 	template <typename ret_type, typename... args_types>
// 	thread(ret_type(*fn)(args_types...), args_types... args)
// 	{
// 		pthread_create(&_tid, 0, __thread_proxy<ret_type, args_types...>, &fn);
// 		pthread_join(_tid, NULL);
// 	}
// };
//
// /** USAGE **/
// void
// test(int i, char c)
// {
// 	std::cout << "test: ";
// 	while (i > 0) {
// 		std::cout << c;
// 		i--;
// 	}
// 	std::cout << std::endl;
// }
//
// int main()
// {
// 	thread t(test, 6, 'a');
// }




// Benchmark for "attr" style attributes.
// #include "include/vlib/types.h"
// struct attr {
// 	unsigned long long a;
// };
// int main() {
// 	using Length = unsigned long long;
// 	Length iters = 1000000000000000000;
// 	attr test0{0};
// 	vlib::sptr_t<attr> test1(attr{0});
// 	vlib::sptr_t<attr> test2(attr{0});
// 	unsigned long long test3 = 0;
// 	auto now = vlib::date_t::now();
// 	for (Length i = 0; i < iters; ++i) {
// 		++test0.a;
// 	}
// 	vlib::print("Test 0: ", (vlib::date_t::now() - now).mtime());
// 	now = vlib::date_t::now();
// 	for (Length i = 0; i < iters; ++i) {
// 		++test1->a;
// 	}
// 	vlib::print("Test 1: ", (vlib::date_t::now() - now).mtime());
// 	now = vlib::date_t::now();
// 	for (Length i = 0; i < iters; ++i) {
// 		++test2.m_ptr->a;
// 	}
// 	vlib::print("Test 2: ", (vlib::date_t::now() - now).mtime());
// 	now = vlib::date_t::now();
// 	for (Length i = 0; i < iters; ++i) {
// 		++test3;
// 	}
// 	vlib::print("Test 3: ", (vlib::date_t::now() - now).mtime());
// 	vlib::print("Ignore: ", test0.a, test1->a, test2.p->a, test3);
// }

// HTTP GET request.
// #include "include/vlib/types.h"
// #include "include/vlib/sockets/http.h"
//
// #include <netdb.h>
// #include <unistd.h>
// #include <sys/types.h>
// #include <sys/socket.h>
// #include <arpa/inet.h>
// #include <string.h>
// #include <iostream>
// #include <vector>
// #include <locale>
// #include <sstream>
// using namespace std;
//
// int main( void ){
//
// 	int sock;
// 	struct sockaddr_in addr;
// 	struct hostent *host;
// 	locale local;
// 	char buffer[10000];
// 	long nDataLength;
// 	string website_HTML;
//
// 	// website url
// 	string url = "www.google.com";
//
// 	vlib::str_t ip;
// 	vlib::sockets::wrapper::lookup_ipv4(ip, url.c_str());
// 	print("IP: ", ip, "\n\n");
//
// 	//HTTP GET
// 	// string get_http = "GET / HTTP/1.1\r\nHost: " + url + "\r\nConnection: close\r\n\r\n";
// 	string get_http = "GET / HTTP/1.1\r\nConnection: close\r\n\r\n";
//
//
// 	sock = socket(AF_INET, SOCK_STREAM, IPPROTO_TCP);
//
// 	addr.sin_port= htons(80);
// 	addr.sin_family= AF_INET;
//
// 	inet_pton(AF_INET, ip.c_str(), &addr.sin_addr);
//
// 	// host = gethostbyname(url.c_str());
// 	// addr.sin_addr.s_addr = *((unsigned int*)host->h_addr);
//
// 	if(connect(sock,(struct sockaddr*) (&addr), sizeof(addr)) != 0){
// 		cout << "Could not connect";
// 		system("pause");
// 		//return 1;
// 	}
//
// 	// send GET / HTTP
// 	send(sock, get_http.c_str(), strlen(get_http.c_str()),0 );
//
// 	// recieve html
// 	while ((nDataLength = recv(sock, buffer, 10000, 0)) > 0){
// 		int i = 0;
// 		while (buffer[i] >= 32 || buffer[i] == '\n' || buffer[i] == '\r'){
//
// 			website_HTML+=buffer[i];
// 			i += 1;
// 		}
// 	}
//
// 	close(sock);
//
// 	// Display HTML source
// 	cout<<website_HTML;
//
// 	return 0;
// }


// Get IP by hostname.
// #include <iostream>
// #include <string.h>
// #include <netdb.h>
// #include <sys/types.h>
// #include <sys/socket.h>
// #include <arpa/inet.h>
// int main (void) {
// 	std::cout << "IPv4: " << lookup("google.com", AF_INET) << "\n";
// 	std::cout << "IPv6: " << lookup("google.com", AF_INET6) << "\n";
// }

// #include <zlib.h>
// #include <iostream>
// auto compressToGzip(const char* input, int inputSize, char*& output, int outputSize)
// {
// 	z_stream zs;
// 	zs.zalloc = Z_NULL;
// 	zs.zfree = Z_NULL;
// 	zs.opaque = Z_NULL;
// 	zs.avail_in = (uInt)inputSize;
// 	zs.next_in = (Bytef *)input;
// 	zs.avail_out = (uInt)outputSize;
// 	// zs.next_out = (Bytef *)output;
// 	zs.next_out = reinterpret_cast<Bytef*>(&output[0]);
//
// 	// hard to believe they don't have a macro for gzip encoding, "Add 16" is the best thing zlib can do:
// 	// "Add 16 to windowBits to write a simple gzip header and trailer around the compressed data instead of a zlib wrapper"
// 	deflateInit2(&zs, Z_DEFAULT_COMPRESSION, Z_DEFLATED, 15 | 16, 8, Z_DEFAULT_STRATEGY);
// 	deflate(&zs, Z_FINISH);
// 	deflateEnd(&zs);
// 	std::cout << "Compressed: [" << zs.next_in << "] \n";
// 	return zs.total_out;
// }
//
// int main() {
// 	const char* input = "Hello World!";
// 	int inputSize = 12 + 1;
// 	char* output = new char [100];
// 	int outputSize = 100;
// 	unsigned long len = compressToGzip(input, inputSize, output, outputSize);
// 	std::cout << "Compressed len: [" << len << "] \n";
// 	output[len] = '\0';
// 	std::cout << "Compressed: [" << output << "] \n";
// }

// #include <string.h>
// #include "include/vlib/types.h"
// int main() {
// 	using namespace vlib;
//
// 	// Shift to the left.
// 	array_t<int> arr_x({0, 1, 2, 3});
// 	arr_x.lshift(2, 0, 3);
// 	print("Array shifted left: ", arr_x);
//
// 	// Shift to the right.
// 	array_t<int> arr_y({0, 1, 2, 3, 4});
// 	arr_y.rshift(1, 1, 3);
// 	print("Array shifted right: ", arr_y);
//
// 	return 0;
// }
