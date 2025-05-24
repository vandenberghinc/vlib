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
#include "../include/vlib/sockets/socket.h"
#include "../include/vlib/sockets/tcp.h"
#include "../include/vlib/sockets/tls.h"
#include "../include/vlib/sockets/http.h"
#include "../include/vlib/sockets/https.h"
#include "../include/vlib/sockets/websocket.h"

// #include "../include/vlib/sockets/tcp.h"
// #include "../include/vlib/sockets/tls.h"
// #include "../include/vlib/sockets/http.h"

// Header.
#ifndef TEST_SOCKETS_H
#define TEST_SOCKETS_H

// Tester.
namespace test {
struct sockets {
int operator()() const {

	// Namespaces.
	using namespace vlib;
	// vtest::show_correct();

	vlib::sockets::Socket sock;
	vtest::test("vlib::sockets::socket::client", "0", sock.client_by_host("https://www.google.com"));
	vtest::test("vlib::sockets::socket::connect", "0", sock.connect());
	vtest::test("vlib::sockets::socket::client", "0", sock.client_by_host("https://www.httpbin.org"));
	vtest::test("vlib::sockets::socket::connect", "0", sock.connect());


	// ---------------------------------------------------------
	// HTTP Request.
	
	http::Request request0;
	request0.add_method(http::method::get);
	request0.add_endpoint("/hello_world");
	request0.add_version(http::version::v1_1);
	request0.add_header("Retry-After", 11, "0", 1);
	request0.add_body("{\"success\":true,\"message\":\"Hello World!\"}");
	request0.null_terminate();
	print(request0.data());

	http::Request request1(request0.data());
	vtest::test("http::Request::parse -> method", std::to_string(http::method::get), request1.method());
	vtest::test("http::Request::parse -> endpoint", "/hello_world", request1.endpoint().c_str());
	vtest::test("http::Request::parse -> version", "11", request1.version());
	vtest::test("http::Request::parse -> headers -> len", "1", request1.headers().len());
	vtest::test("http::Request::parse -> body", "{\"success\":true,\"message\":\"Hello World!\"}", request1.body().c_str());

	// ---------------------------------------------------------
	// HTTP Response.

	http::Response response0;
	response0.add_version(http::version::v1_1);
	response0.add_status(200);
	response0.add_header("Retry-After", 11, "0", 1);
	response0.add_header("Content-Type", 12, "application/json", 16);
	response0.add_body("{\"success\":true,\"message\":\"Hello World!\"}");
	response0.null_terminate();

	http::Response response1 (response0.data());
	vtest::test("http::Request::parse -> version", "11", response1.version());
	vtest::test("http::Request::parse -> status", "200", response1.status());
	vtest::test("http::Request::parse -> status_desc", "OK", response1.status_desc().c_str());
	vtest::test("http::Request::parse -> headers -> len", "2", response1.headers().len());
	vtest::test("http::Request::parse -> body", "{\"success\":true,\"message\":\"Hello World!\"}", response1.body().c_str());
	vtest::test("http::Request::parse -> header -> Retry-After", "0", response1.header("Retry-After", 11).c_str());
	vtest::test("http::Request::parse -> header -> Content-Type", "application/json", response1.header("Content-Type", 12).c_str());

	vtest::test("http::Request::body", "{\"success\":true,\"message\":\"Hello World!\"}", Json(response1.body()).json().c_str());

	// ---------------------------------------------------------
	// Parsing an URL query string.

	// Json params;
	// http::wrapper::parse_query_string(params, query.data(), query.len())

	// ---------------------------------------------------------
	// Lookup hostname.

	// String host ("https://www.google.com/");
	// String ip = {};
	// unsigned int port;
	// status = vlib::http::wrapper::lookup_ipv4(ip, port, host);
	// vtest::test("vlib::sockets::wrapper::lookup_ipv4", "0", status);
	// vtest::test("vlib::sockets::wrapper::lookup_ipv4", "172.217.168.196:443", (ip << ':' << port).c_str());

	// ---------------------------------------------------------
	// HTTP client.


	vlib::http::Client<AF_INET, SOCK_STREAM, 0, 1024, false> client0("http://httpbin.org", {
		{"Host", "httpbin.org"},
		{"Accept", "application/json"},
		{"Connection", "close"},
	});
	vlib::http::Response response2 = client0.request(vlib::http::method::get, "/ip");
	vtest::test("http::Client::request -> status", "200", response2.status());
	// print("Version: ", response2.version());
	// print("Status: ", response2.status());
	// print("Status desc: ", response2.status_desc());
	// print("Headers: ");
	// for (auto& i: response2.headers()) {
	// 	print(" * ", i.key(), ": ", i.value());
	// }
	// Json body(response2.body());
	// print("Body: ");
	// for (auto& i: body.indexes()) {
	// 	print(" * ", body.key(i), ": ", body.value(i));
	// }

	// ---------------------------------------------------------
	// HTTPS client.

	vlib::https::Client<AF_INET, SOCK_STREAM, 0, 1024, false, tls::version::any> client1("https://httpbin.org", {
		{"Host", "httpbin.org"},
		{"Accept", "application/json"},
		{"Connection", "close"},
	});
	vlib::http::Response response3 = client1.request(vlib::http::method::get, "/ip");
	vtest::test("http::Client::request -> status", "200", response3.status());
	// print("Version: ", response3.version());
	// print("Status: ", response3.status());
	// print("Status desc: ", response3.status_desc());
	// print("Headers: ");
	// for (auto& i: response3.headers()) {
	// 	print(" * ", i.key(), ": ", i.value());
	// }
	// Json body(response3.body());
	// print("Body: ");
	// for (auto& i: body.indexes()) {
	// 	print(" * ", body.key(i), ": ", body.value(i));
	// }

	// ---------------------------------------------------------
	// End.
	return vtest::exit_status();

};
}; 		// End struct.
}; 		// End namespace.
#endif  // End header.














