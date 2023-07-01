// Author: Daan van den Bergh
// Copyright: © 2022 Daan van den Bergh.

// Include testing.
#include <vtest/vtest.h>

// Include test files.
#include "types.h"
#include "compression.h"
#include "crypto.h"
#include "sockets.h"
#include "cli.h"

// Start test.
int main() {

	// Options.
	vtest::show_correct(false);
	vtest::show_incorrect(true);
	vtest::set_instant_exit(true);

	// Start test.
	return vtest::start(
		test::types(),
		test::compression(),
		test::crypto(),
		test::sockets(),
		test::cli()
	);
}
