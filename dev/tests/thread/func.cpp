// Author: Daan van den Bergh
// Copyright: © 2022 Daan van den Bergh.

// Includes.
#include "../../include/vlib/types.h"

// A thread function without args.
void* some_func(void*) {
	vlib::print("Hello World!");
	return 0;
}

// The thread function.
void* some_func_with_args(vlib::String day, vlib::String name) {
	vlib::print("Good ", day, " ", name, "!");
	return 0;
}

int main() {

	// Start a thread without arguments.
	vlib::fthread thread0;
	thread0.start(some_func);
	thread0.join();

	// Start a thread with arguments.
	vlib::fthread thread1;
	thread1.start(some_func_with_args, "Sunday", "World");
	thread1.join();

	return 0;

}
