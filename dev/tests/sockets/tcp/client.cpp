// Author: Daan van den Bergh
// Copyright: © 2022 Daan van den Bergh.
//

// Includes.
#include "../../../include/vlib/sockets/tcp.h"

// Main.
int main() {

	// Initialize.
	int status;
	vlib::tcp::Client socket("127.0.0.1", 9001);

	// Connect to the server.
	vlib::out << "Connecting... \n";
	if ((status = socket.connect()) < 0) {
		vlib::out << "Socket \"" << socket << "\" connect: " << vlib::strerr(status) << " [" << errno << "]. \n";
		return 1;
	}

	// Receive data.
	vlib::out << "Receiving... \n";
	vlib::String received;
	if ((status = socket.receive(received)) < 0) {
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
