// Author: Daan van den Bergh
// Copyright: © 2022 Daan van den Bergh.
//

// Includes.
#include "../../../include/vlib/sockets/socket.h"

// Main.
int main() {

	// Initialize.
	int status;
	vlib::sockets::Socket socket;

	// Construct the client.
	vlib::out << "Constructing... \n";
	if ((status = socket.client("127.0.0.1", 9001)) < 0) {
		vlib::out << "Socket \"" << socket << "\" client: " << vlib::strerr(status) << ". \n";
		return 1;
	}

	// Connect to the server.
	vlib::out << "Connecting... \n";
	if ((status = socket.connect()) < 0) {
		vlib::out << "Socket \"" << socket << "\" connect: " << vlib::strerr(status) << ". \n";
		return 1;
	}

	// Receive data.
	vlib::out << "Receiving... \n";
	vlib::String received;
	if ((status = socket.receive(received, socket.m_fd)) < 0) {
		vlib::out << "Socket \"" << socket << "\" receive: " << vlib::strerr(status) << ". \n";
		return 1;
	}
	vlib::out << "Received: \"" << received << "\". \n";

	// Close the client.
	vlib::out << "Closing... \n";
	if ((status = socket.close()) < 0) {
		vlib::out << "Socket \"" << socket << "\" close: " << vlib::strerr(status) << ". \n";
		return 1;
	}

	return 0;
}
