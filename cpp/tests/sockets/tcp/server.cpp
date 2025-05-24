// Author: Daan van den Bergh
// Copyright: © 2022 Daan van den Bergh.
//

// Includes.
#include "../../../include/vlib/sockets/tcp.h"

// Main.
int main() {

	// Initialize.
	int status;
	unsigned int client;
	vlib::tcp::Server socket(9001);

	// Bind to the socket.
	vlib::out << "Binding... \n";
	if ((status = socket.bind()) < 0) {
		vlib::out << "Socket \"" << socket << "\" bind: " << vlib::strerr(status) << " [" << errno << "]. \n";
		return 1;
	}

	// Start listening.
	vlib::out << "Listening... \n";
	if ((status = socket.listen()) < 0) {
		vlib::out << "Socket \"" << socket << "\" listen: " << vlib::strerr(status) << " [" << errno << "]. \n";
		return 1;
	}

	// Accept a new client.
	vlib::out << "Accepting... \n";
	if ((status = socket.accept()) < 0) {
		vlib::out << "Socket \"" << socket << "\" accept: " << vlib::strerr(status) << " [" << errno << "]. \n";
		return 1;
	}
	client = (unsigned int) status;

	// Send data.
	vlib::out << "Sending... \n";
	if ((status = socket.send(client, "Hello World!", 12)) < 0) {
		vlib::out << "Socket \"" << socket << "\" send: " << vlib::strerr(status) << " [" << errno << "]. \n";
		return 1;
	}

	// Close the socket and all connected clients.
	vlib::out << "Closing... \n";
	if ((status = socket.close()) < 0) {
		vlib::out << "Socket \"" << socket << "\" close: " << vlib::strerr(status) << " [" << errno << "]. \n";
		return 1;
	}

	return 0;
}
