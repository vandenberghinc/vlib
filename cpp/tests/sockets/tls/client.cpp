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
	vlib::tls::Client socket("127.0.0.1", 9000);

	// Connect to the server.
	vlib::out << "Connecting... \n";
	if ((status = socket.connect()) < 0) {
		vlib::out << "Socket \"" << socket << "\": " << vlib::strerr(status) << ". \n";
		return 1;
	}

	// Receive data.
	vlib::out << "Receiving... \n";
	vlib::String received;
	if ((status = socket.receive(received)) < 0) {
		vlib::out << "Socket \"" << socket << "\": " << vlib::strerr(status) << ". \n";
		return 1;
	}
	vlib::out << "Received: \"" << received << "\". \n";

	// Close the client.
	vlib::out << "Closing... \n";
	if ((status = socket.close()) < 0) {
		vlib::out << "Socket \"" << socket << "\": " << vlib::strerr(status) << ". \n";
		return 1;
	}
	return 0;
}
