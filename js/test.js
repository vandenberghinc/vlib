const vlib = require("./vlib.js");

// Unit tests.
const unit_tests = {};

// ---------------------------------------------------------
// Testing vlib.scheme module.

// Unit test.
unit_tests["scheme/test:1"] = function({hash, debug}) {
	const object = {
		description: "Hello World!",
		// name: "Hello Universe!",
	}
	try {
		vlib.scheme.verify({throw_err: true, check_unknown: true, object, scheme: {
            name: "string",
            description: "string",
        }})
	} catch (error) {
		debug(2, error.message); debug(1, hash(error.message));
		if (hash(error.message) !== "9e184f2f3bf3729a7c82fc33d6b342b856c26ebad5e21924991399e4c7f6c0bd") { return false; }
		return true;
	}
	return false;
}

// Unit test.
unit_tests["scheme/test:2"] = function({hash, debug}) {
	const object = {
		description: "Hello World!",
		name: "Hello Universe!",
	}
	try {
		vlib.scheme.verify({throw_err: true, check_unknown: true, object, scheme: {
            name: "string",
            description: "boolean",
        }})
	} catch (error) {
		debug(2, error.message); debug(1, hash(error.message));
		if (hash(error.message) !== "f0abb562a52e1adf943b097ce4804b33ebbd93faa3a03ac978fe2e1f422f2970") { return false; }
		return true;
	}
	return false;
}

// Unit test.
unit_tests["scheme/test:3"] = function({hash, debug}) {
	const object = {
		description: "Hello World!",
		name: false,
	}
	try {
		vlib.scheme.verify({throw_err: true, check_unknown: true, object, value_scheme: {
            type: "string",
        }})
	} catch (error) {
		debug(2, error.message); debug(1, hash(error.message));
		if (hash(error.message) !== "b795252b899fffb31a7be4ef142285d5e9bc2ecc644e0a2c9d4c8752d664de86") { return false; }
		return true;
	}
	return false;
}

// Unit test.
unit_tests["scheme/test:4"] = function({hash, debug}) {
	const object = {
		nested: {
			description: "Hello World!",
			name: false,
		}
	}
	try {
		vlib.scheme.verify({throw_err: true, check_unknown: true, object, scheme: {
			nested: {
				type: "object",
				value_scheme: {
		            type: "string",
		        }
		   	}
		}})
	} catch (error) {
		debug(2, error.message); debug(1, hash(error.message));
		if (hash(error.message) !== "80f3f3cb241a59af83df726888899b8a70722a120fc2c685b9d5a9c22c78654f") { return false; }
		return true;
	}
	return false;
}

// Unit test.
unit_tests["scheme/test:5"] = function({hash, debug}) {
	const object = {
		array: [{
			description: "Hello World!",
			name: false,
			unknown: "true",
		}]
	}
	try {
		vlib.scheme.verify({throw_err: true, check_unknown: true, object, scheme: {
			array: {
				type: "array",
				value_scheme: {
					type: "object",
					scheme: {
			            name: "string",
	            		description: "boolean",
	            	}
		        }
		   	}
		}})
	} catch (error) {
		debug(2, error.message); debug(1, hash(error.message));
		if (hash(error.message) !== "adf8f12be9b12ffeae591e1dbde466cdd1859454e9f4e2a9af06d2716486e32e") { return false; }
		return true;
	}
	return false;
}

// Unit test.
unit_tests["scheme/test:6"] = function({hash, debug}) {
	const object = {
		posts: {
			my_post: {
				description: "Hello World!",
				name: false,
				unknown: "true",
			},
		},
	}
	try {
		vlib.scheme.verify({throw_err: true, check_unknown: true, object, scheme: {
			posts: {
				type: "object",
				value_scheme: {
					type: "object",
					scheme: {
			            name: "string",
	            		description: "boolean",
	            	}
		        },
		   	},
		}})
	} catch (error) {
		debug(2, error.message); debug(1, hash(error.message));
		if (hash(error.message) !== "be683ccb57956f2c248dec620ce2e6bdedfc32b3c963d78fc9d2fb7cff16ad7c") { return false; }
		return true;
	}
	return false;
}

// Unit test.
unit_tests["scheme/test:7"] = function({hash, debug}) {
	const object = {
		posts: {
			my_post: {
				description: "Hello World!",
				name: "Hello Universe!",
				unknown: "true",
			},
		},
	}
	try {
		vlib.scheme.verify({throw_err: true, check_unknown: true, object, scheme: {
			posts: {
				type: "object",
				value_scheme: {
					type: "object",
					scheme: {
			            name: "string",
	            		description: "string",
	            	}
		        },
		   	},
		}})
	} catch (error) {
		debug(2, error.message); debug(1, hash(error.message));
		if (hash(error.message) !== "499eac757591a0f432b425feec62dfbc3dcab68736fb789988b6efd6f79301e2") { return false; }
		return true;
	}
	return false;
}

// Unit test.
unit_tests["scheme/test:8"] = function({hash, debug}) {
	const object = {
		documents: [
			{
				data: "Hello World!",
				name: "Hello Universe!",
				type: "jsx",
				unknown: "true"
			},
		],
	}
	try {
		vlib.scheme.verify({throw_err: true, check_unknown: true, object, scheme: {
			documents: {
				type: "array",
				value_scheme: {
					type: "object",
					scheme: {
						name: {type: "string", required: (obj) => obj.data != null},
						data: {type: "string", required: (obj) => obj.stylesheets == null},
						language: {type: "string", required: false},
						stylesheets: {type: "array", required: (obj) => obj.data == null},
						compile: {type: "boolean", def: false},
						type: {
		                    type: "string",
		                    enum: ["js", "jsx", "css", "lmx"],
		                },
					},
				},
			},
		}})
	} catch (error) {
		debug(2, error.message); debug(1, hash(error.message));
		if (hash(error.message) !== "ddbd2756d2db396725a9119279e6e6a016edeccac0c9588f67329b6ff35b8469") { return false; }
		return true;
	}
	return false;
}

// Unit test.
unit_tests["scheme/test:9"] = function({hash, debug}) {
	try {
		vlib.scheme.verify({
			throw_err: true,
			check_unknown: true,
			object: {
    			app_id: undefined,
		    	client_id: undefined,
		    	client_secret: undefined,
		    	private_key: undefined,
    		},
			scheme: {
    			app_id: "string",
		    	client_id: "string",
		    	client_secret: "string",
		    	private_key: "string",
    		},
		})
	} catch (error) {
		debug(2, error.message); debug(1, hash(error.message));
		if (hash(error.message) !== "ee894d706324391253fe2ba974b353ea22c6bb64b89693253042665d13faff88") { return false; }
		return true;
	}
	return false;
}

// ---------------------------------------------------------
// Commence unit tests.

vlib.unit_tests.perform({
	name: "vlib",
	unit_tests,
	target: vlib.cli.get({id: "--target", def: null}),
	debug: vlib.cli.get({id: "--debug", type: "number", def: 0}),
})
