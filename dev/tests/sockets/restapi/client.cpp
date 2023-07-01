// Author: Daan van den Bergh
// Copyright: © 2022 Daan van den Bergh.
//

// Includes.
#include "../../../include/vlib/sockets/https.h"

#include "../../../include/vlib/compression.h"

// Main.
// - Requires compiler flags: -I /usr/local/opt/openssl@3/include/ -L /usr/local/opt/openssl@3/lib/ -lcrypto -lssl -lz
int main() {

	// Initialize.
	int status;
	vlib::https::Client client({
		.ip = "127.0.0.1",
		.port = 9000,
		.api_key = "testuser+6GBXvVBjQRUwvBE8DJCblL5dVF4xdKR8wCKM8Vjr2s7TV8G3Ltp0ZdpFbxsyXzvk",
		.api_secret = "nB2ir30qJ8WuLShfp0ADDFpDaHKTG8a8fpcKZoIY3XWGAhYkOvI6yV8olMZpVayQ",
		.headers = {{"Content-Type", vlib::http::content_type::desc::json}},
	});

	// Make a request.
	vlib::http::Response response;
	
	if ((status = client.request(
		response,
		vlib::http::method::get,
		"/hello_world",
		{{"name", "Daan van den Bergh"}}
	)) < 0) {
		vlib::print("\nDebug info:");
		client.sock().debug();
		vlib::print();
		vlib::print("Error: ", vlib::strerr(status).c_str());
		return 1;
	}
	
	// if ((status = client.request(
	// 	response,
	// 	vlib::http::method::post,
	// 	"/sign_in",
	// 	{{"username", "testuser"}, {"password", "testpassword"}}
	// )) < 0) {
	// 	vlib::print("\nDebug info:");
	// 	client.sock().debug();
	// 	vlib::print();
	// 	vlib::print("Error: ", vlib::strerr(status).c_str());
	// 	return 1;
	// }
	
	vlib::print("Version: ", response.version());
	vlib::print("Status: ", response.status());
	vlib::print("Status desc: ", response.status_desc());
	vlib::print("Headers: ", response.headers());
	vlib::print("Body: ", vlib::Json(response.body()));
	return 0;
}
