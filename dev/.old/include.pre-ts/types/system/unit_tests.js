/*
 * @author: Daan van den Bergh
 * @copyright: © 2022 - 2023 Daan van den Bergh.
 */

vlib.unit_tests = {};

// Unit test decorator.
vlib.unit_tests._create_unit_test = (func, id, debug = 0) => {
	return function (args) {

		// Debug.
		if (debug > 0 || debug === args.id) { console.log(vlib.colors.blue + id + vlib.colors.end + ":"); }

		// Exec.
		return func({
			id,
			vlib,
			hash: vlib.utils.hash,
			debug: function (level, ...args) {
				if (debug >= level || debug === id) { console.log(" *",...args); }
			},
			...args,
		})
	}
}

/*	@docs:
	@nav: JS
	@chapter: Unit Testing
	@title: Unit tests
	@descr:
		Perform unit tests by creating an object with unit test functions.
		By default all tests will be performed without stopping on failures.
	@param:
		@name: name
		@descr: The global unit tests name.
		@type: string
	@param:
		@name: unit_tests
		@descr:
			An object with unit test functions.
		@type: object
		@attr:
			@name: [key]
			@descr: The unit test name.
			@type: string
		@attr:
			@name: [property]
			@type: function
			@descr:
				The unit test function.

				The function can accepts the following keyword assignment parameters:
				* `id`: The id of the unit test.
				* `hash`: A hash function to hash a string accepting arguments `(data)`.
				* `debug`: A function to print debug statements accepting arguments `(debug_level, ...args)`.
				And the defined `args` from `vlib.unit_tests.perform()` will be passed as well.

				```js Example usage
				vlib.unit_tests.perform({
					...
					unit_tests: {
						"my_unit_test": async ({hash, debug}) => {
							const result = await myfunc();
							debug(2, result)
							debug(1, hash(JSON.stringify(result)))
							return hash(JSON.stringify(result)) === "expected hash";
						},
					}
				})
				```
	@param:
		@name: target
		@descr: The target unit test name, when defined only this unit test will be executed.
		@type: boolean
	@param:
		@name: stop_on_failure
		@descr: Stop the unit tests on failure.
		@type: boolean
	@param:
		@name: debug_on_failure
		@descr: Only use the passed debug level on failed unit tests.
		@type: boolean
	@param:
		@name: args
		@descr: The args that are passed to the unit test functions.
		@type: string
	@param:
		@name: debug
		@descr: The debug level for the `debug()` function.
		@type: number
 */
vlib.unit_tests.perform = async function({
	name = "Unit Tests",
	unit_tests = {},
	target = null,
	stop_on_failure = false,
	debug_on_failure = false,
	args = {},
	debug = 0,
}) {

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
		const ids = Object.keys(unit_tests);
		for (const id of ids) {
			let res = vlib.unit_tests._create_unit_test(unit_tests[id], id, debug_on_failure ? 0 : debug)(args);
			if (res instanceof Promise) { res = await res; }
			if (res === false) {
				if (debug_on_failure) {
					const res = vlib.unit_tests._create_unit_test(unit_tests[id], id, debug)(args);
					if (res instanceof Promise) { await res; }
				}
				console.log(` * ${id} ${vlib.colors.red}${vlib.colors.bold}failed${vlib.colors.end}`);
				if (stop_on_failure) { return false; }
				++failed;
			} else {
				console.log(` * ${id} ${vlib.colors.green}${vlib.colors.bold}succeeded${vlib.colors.end}`);
				++succeeded;
			}
		}
	}
	if (failed === 0) {
		console.log(` * All unit tests ${vlib.colors.green + vlib.colors.bold}passed${vlib.colors.end} successfully.`);	
	} else {
		console.log(` * Encountered ${failed === 0 ? vlib.colors.green : vlib.colors.red}${vlib.colors.bold}${failed}${vlib.colors.end} failed unit tests.`);
	}
	return true;
}