// Author: Daan van den Bergh
// Copyright: © 2022 Daan van den Bergh.
//

// Includes.
#include "../../../include/vlib/sockets/https.h"

#include "../../../include/vlib/compression.h"

void* 	make_request(int id) {
	int status;
	vlib::https::Client client({
		.ip = "127.0.0.1",
		.port = 9000,
		.api_key = "testuser+6GBXvVBjQRUwvBE8DJCblL5dVF4xdKR8wCKM8Vjr2s7TV8G3Ltp0ZdpFbxsyXzvk",
		.api_secret = "nB2ir30qJ8WuLShfp0ADDFpDaHKTG8a8fpcKZoIY3XWGAhYkOvI6yV8olMZpVayQ",
		.headers = {{"Content-Type", vlib::http::content_type::desc::json}},
	});
	vlib::http::Response response;
	if ((status = client.request(
		response,
		vlib::http::method::get,
		"/hello_world",
		{{"name", "Daan van den Bergh"}}
	)) < 0) {
		vlib::print("Thread: ", id, " - error: ", vlib::strerr(status).c_str());
		return NULL;
	}
	// vlib::print(response);
	return NULL;
}

// Main.
// - Requires compiler flags: -I /usr/local/opt/openssl@3/include/ -L /usr/local/opt/openssl@3/lib/ -lcrypto -lssl -lz
int main() {
	vlib::Array<vlib::fthread> threads;
	int max = 10000;
	threads.resize(max);
	threads.len() = max;
	vlib::print("Starting threads...");
	auto now = vlib::Date::get_seconds();
	for (auto i = 0; i < max; ++i) {
		vlib::sleep::mseconds(5);
		threads.get(i).start(make_request, i);
	}
	vlib::print("Joining threads...");
	for (auto& i: threads) {
		i.join();
	}
	vlib::print("Time elapsed: ", vlib::Date::get_seconds() - now, "s");
}
