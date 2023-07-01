// Author: Daan van den Bergh
// Copyright: © 2022 Daan van den Bergh.
//

// Includes.
#include "../../../include/vlib/sockets/socket.h"

// Main.
int main() {

	// Initialize.
	int status, client;
	vlib::sockets::Socket socket;

	// Construct the server.
	vlib::out << "Constructing... \n";
	if ((status = socket.server(9001)) < 0) {
		vlib::out << "Socket \"" << socket << "\" server: " << vlib::strerr(status) << ". \n";
		return 1;
	}

	// Bind to the socket.
	vlib::out << "Binding... \n";
	if ((status = socket.bind()) < 0) {
		vlib::out << "Socket \"" << socket << "\" bind: " << vlib::strerr(status) << ". \n";
		return 1;
	}

	// Start listening.
	vlib::out << "Listening... \n";
	if ((status = socket.listen()) < 0) {
		vlib::out << "Socket \"" << socket << "\" listen: " << vlib::strerr(status) << ". \n";
		return 1;
	}

	// Accept a new client.
	vlib::out << "Accepting... \n";
	vlib::String ip;
	int port;
	if ((status = socket.accept(ip, port)) < 0) { // param addr is not required.
		vlib::out << "Socket \"" << socket << "\" accept: " << vlib::strerr(status) << ". \n";
		return 1;
	}
	client = status;
	vlib::out << "Connected with client [" << ip << ":" << port << "]. \n";

	// Send data.
	vlib::out << "Sending... \n";
	if ((status = socket.send(client, "Hello World!", 12)) < 0) {
		vlib::out << "Socket \"" << socket << "\" send: " << vlib::strerr(status) << ". \n";
		return 1;
	}

	// Close the client.
	vlib::out << "Closing the client... \n";
	if ((status = socket.close(client)) < 0) {
		vlib::out << "Socket \"" << socket << "\" close: " << vlib::strerr(status) << ". \n";
		return 1;
	}

	// Close the socket.
	vlib::out << "Closing... \n";
	if ((status = socket.close()) < 0) {
		vlib::out << "Socket \"" << socket << "\" close: " << vlib::strerr(status) << ". \n";
		return 1;
	}
	return 0;
}
