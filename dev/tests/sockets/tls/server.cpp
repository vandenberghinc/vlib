// Author: Daan van den Bergh
// Copyright: © 2022 Daan van den Bergh.
//

// Includes.
#include "../../../include/vlib/sockets/tls.h"

// Main.
// - Requires compiler flags: -I /usr/local/opt/openssl@3/include/ -L /usr/local/opt/openssl@3/lib/ -lcrypto -lssl
int main() {

	// Initialize.
	int status;
	unsigned client;
	vlib::tls::Server socket(
		9000,
		"/Volumes/persistance/private/vinc/vlib/tests/sockets/tls/certs/cert.pem",
		"/Volumes/persistance/private/vinc/vlib/tests/sockets/tls/certs/key.pem",
		"HelloWorld!"
	);

	// Bind to the socket.
	vlib::out << "Binding... \n";
	if ((status = socket.bind()) < 0) {
		vlib::out << "Socket \"" << socket << "\": " << vlib::strerr(status) << ". \n";
		return 1;
	}

	// Start listening.
	vlib::out << "Listening... \n";
	if ((status = socket.listen()) < 0) {
		vlib::out << "Socket \"" << socket << "\": " << vlib::strerr(status) << ". \n";
		return 1;
	}

	// Accept a new client.
	vlib::out << "Accepting... \n";
	if ((status = socket.accept()) < 0) {
		vlib::out << "Socket \"" << socket << "\": " << vlib::strerr(status) << ". \n";
		return 1;
	}
	client = (unsigned int) status;

	// Send data.
	vlib::out << "Sending... \n";
	if ((status = socket.send(client, "Hello World!")) < 0) {
		vlib::out << "Socket: \"" << socket << "\": " << vlib::strerr(status) << ". \n";
		return 1;
	}

	// Close the socket and all connected clients.
	vlib::out << "Closing... \n";
	if ((status = socket.close()) < 0) {
		vlib::out << "Socket: \"" << socket << "\": " << vlib::strerr(status) << ". \n";
		return 1;
	}

	return 0;
}
