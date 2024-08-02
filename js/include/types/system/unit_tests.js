/*
 * @author: Daan van den Bergh
 * @copyright: © 2022 - 2023 Daan van den Bergh.
 */

vlib.unit_tests = {};

// Unit test decorator.
vlib.unit_tests._create_unit_test = (func, id, debug = 0) => {
	return function (args) {

		// Debug.
		if (debug > 0 || debug === args.id) { console.log(vlib.colors.blue + args.id + vlib.colors.end + ":"); }
		args.debug = function (level, ...args) {
			if (debug >= level || debug === id) { console.log(" *",...args); }
		}

		// Exec.
		return func(args)
	}
}

/*	@docs:
	@title: Unit tests
	@descr:
		Perform unit tests.

		Works by creating nodejs files that export a function. The (async) function should return false when the unit test has failed.
	@param:
		@name: unit_tests
		@descr: An object with unit test functions.
		@type: object
	@param:
		@name: exclude
		@descr: The file names to exclude.
		@type: string[]
	@param:
		@name: args
		@descr: The args that are past to the unit test functions.
		@type: string
	@param:
		@name: source
		@descr: The path to the unit tests directory, all functions will be required, the files must export a function.
		@type: string, function[]
		@deprecated: true
 */
vlib.unit_tests.perform = async function({
	name = "LMX",
	unit_tests = {},
	target = null,
	source = undefined,
	exclude = [".DS_Store"],
	args = {},
	debug = 0,
}) {
	
	// Default args.
	args.vlib = vlib;
	args.hash = vlib.utils.hash;

	console.log(`Commencing ${name} unit tests.`)
	let res, failed = 0, succeeded = 0;
	if (unit_tests) {

		// Extract target.
		if (target != null) {
			if (unit_tests[target] === undefined) {
				throw new Error(`Unit test "${target}" was not found`);
			}
			const unit_test = unit_tests[target]
			unit_tests = {}
			unit_tests[target] = unit_test;
		}

		// Start test.
		const names = Object.keys(unit_tests);
		for (let i = 0; i < names.length; i++) {
			const id = names[i];
			const func = vlib.unit_tests._create_unit_test(unit_tests[names[i]], id, debug);
			let res = func({...args, id});
			if (res instanceof Promise) { await res; }
			if (await res === false) {
				console.log(` * ${id} ${vlib.colors.red}${vlib.colors.bold}failed${vlib.colors.end}`);
				++failed;
			} else {
				console.log(` * ${id} ${vlib.colors.green}${vlib.colors.bold}succeeded${vlib.colors.end}`);
				++succeeded;
			}
		}
	} else {
		let paths = [];
		let base;
		source = new vlib.Path(source).abs();
		if (source.is_dir()) {
			paths = await source.paths(true);
			base = source;
		} else {
			paths = [source];
			base = source.base();
		}
		for (let i = 0; i < paths.length; i++) {
			const path = paths[i].abs();
			if (!path.is_dir() && !exclude.includes(path.name())) {
				const id = path.str().substr(base.str().length + 1);
				let res = require(path.str())({...args, id});
				if (res instanceof Promise) { await res; }
				if (await res === false) {
					console.log(` * ${id} ${vlib.colors.red}${vlib.colors.bold}failed${vlib.colors.end}`);
					++failed;
				} else {
					console.log(` * ${id} ${vlib.colors.green}${vlib.colors.bold}succeeded${vlib.colors.end}`);
					++succeeded;
				}
			}
		}
	}
	if (failed === 0) {
		console.log(` * All unit tests ${vlib.colors.green + vlib.colors.bold}passed${vlib.colors.end} successfully.`);	
	} else {
		console.log(` * Encountered ${failed === 0 ? vlib.colors.green : vlib.colors.red}${vlib.colors.bold}${failed}${vlib.colors.end} failed unit tests.`);
	}
}