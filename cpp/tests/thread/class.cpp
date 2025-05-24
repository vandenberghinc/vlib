// Author: Daan van den Bergh
// Copyright: © 2022 Daan van den Bergh.

// Includes.
#include "../../include/vlib/types.h"

// Create a thread class.
struct some_thread : public vlib::thread<some_thread> {

	// The thread run function.
	constexpr
	void* 	run(void) {
		vlib::print("Starting thread: ", id());
		return 0;
	}

};

int main() {
	some_thread thread;
	thread.start();
	thread.join();
	return 0;
}
