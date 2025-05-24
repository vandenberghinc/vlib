// Author: Daan van den Bergh
// Copyright: © 2022 Daan van den Bergh.
//
// Notes:
// - Requires compiler flags: -I /usr/local/opt/openssl@3/include/ -L /usr/local/opt/openssl@3/lib/ -lcrypto -lssl -lz
//

// Includes.
#include "../../../include/vlib/sockets/restapi.h"

// Initialize the server.
vlib::restapi::Server<> server({
	.port = 9000,
	.cert = "/Volumes/persistance/private/dev/vinc/vlib/tests/sockets/tls/certs/cert.pem",
	.key = "/Volumes/persistance/private/dev/vinc/vlib/tests/sockets/tls/certs/key.pem",
	.pass = "HelloWorld!",
	.database = "/tmp/restapi/",
});

// Endpoint: GET /sign_in.
struct sign_in {

	// Execute the endpoint.
	SICE
	auto 	execute(
		const vlib::String& 				,			// the username (undefined when not authenticated).
		const vlib::Json& 			params,		// the endpoint parameters.
		const vlib::http::Headers& 				// the endpoint headers.
	) {
		
		
		// Check username.
		auto username_index = params.find("username", 8, vlib::json::str);
		switch (username_index) {
			case vlib::json::error::not_found:
				return server.bad_request("Define parameter 'username'.");
			case vlib::json::error::incorrect_type:
				return server.bad_request("Parameter 'username' should be a string.");
			default: break;
		}
		auto& username = params.value(username_index).ass();
		
		// Check params.
		auto pass_index = params.find("password", 8, vlib::json::str);
		switch (pass_index) {
			case vlib::json::error::not_found:
				return server.bad_request("Define parameter 'password'.");
			case vlib::json::error::incorrect_type:
				return server.bad_request("Parameter 'password' should be a string.");
			default: break;
		}
		
		// Verify.
		if (server.verify_user(username, params.value(pass_index).ass()) != 0) {
			return server.response(
				vlib::http::status::unauthorized,
				{{"Content-Type", vlib::http::content_type::desc::json}},
				{{"error", "Invalid login credentials."}}
			);
		}
		
		// Create access token.
		vlib::String access_token;
		if (server.create_access_token(access_token, username) != 0) {
			return server.internal_server_error();
		}
		
		// Success.
		return server.response(
			vlib::http::status::success,
			{
				{"Content-Type", vlib::http::content_type::desc::json},
				{"Cache-Control", "no-store"},
			},
			{
				{"message", "Success."},
				{"access_token", access_token},
				{"token_type", "Bearer"},
				{"expires_in", 86400},
				{"refresh_token", vlib::null},
			}
		);
		
	};


	// Constructor.
	SICE
	auto	build() {
		return server.endpoint({
			.content_type = vlib::http::content_type::json,
			.method = vlib::http::method::post,
			.endpoint = "/sign_in",
			.rate_limit = 3,
			.rate_limit_format = vlib::restapi::rate_limit::sec,
			.rate_limit_duration = 60,
			.func = &execute,
		});
	}

};

// Endpoint: GET /hello_world.
struct hello_world {

	// Execute the endpoint.
	SICE
	auto 	execute(
		const vlib::String& 				username,	// the username (undefined when not authenticated).
		const vlib::Json& 			params,		// the endpoint parameters.
		const vlib::http::Headers& 	headers		// the endpoint headers.
	) {
		
		// Check params.
		auto name_index = params.find("name", 4, vlib::json::str);
		switch (name_index) {
			case vlib::json::error::not_found:
				return server.bad_request("Define parameter 'name'.");
			case vlib::json::error::incorrect_type:
				return server.bad_request("Parameter 'name' should be a string.");
			default: break;
		}

		// Success.
		return server.success({{"message", vlib::String("Hello ", 6).concats_r(params.value(name_index).ass(), "!")}});
		
	};


	// Constructor.
	SICE
	auto	build() {
		return server.endpoint({
			.content_type = vlib::http::content_type::json,
			.method = vlib::http::method::get,
			.endpoint = "/hello_world",
			.auth = vlib::restapi::auth::token | vlib::restapi::auth::key | vlib::restapi::auth::sign,
			// .rate_limit = 3,
			.rate_limit_format = vlib::restapi::rate_limit::sec,
			.rate_limit_duration = 60,
			.func = &execute,
		});
	}

};

// Main.
int main() {
	int status;
	
	// Add the endpoints.
	server.add_endpoints(
		sign_in::build(),
		hello_world::build()
	);

	// Initialize the server.
	if ((status = server.initialize()) != 0) {
		vlib::print("Encoutered an error while initializing the server: ", vlib::strerr(status), ".");
	}
	
	// Create a user.
	// if ((status = server.create_user("testuser", "testpassword")) != 0) {
	// 	return status;
	// }
	// vlib::String api_key, api_secret;
	// if ((status = server.create_api_key(api_key, api_secret, "testuser")) != 0) {
	// 	return status;
	// }
	// vlib::print("Created user: ");
	// vlib::print(" * api key: ", api_key);
	// vlib::print(" * api secret: ", api_secret);
	// if ((status = server.delete_user(0)) != 0) {
	// 	return status;
	// }
	//print(server.m_attr->passwords);
	
	// Start the server thread.
    server.start();
	server.join();
}
