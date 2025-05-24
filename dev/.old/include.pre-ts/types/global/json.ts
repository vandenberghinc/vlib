/*
 * Author: Daan van den Bergh
 * Copyright: © 2022 - 2023 Daan van den Bergh.
 */

export type JsonPrimitive = string | number | boolean | null;
export type JsonArray = Array<JsonValue>;
export type JsonObject = { [key: string]: JsonValue };
export type JsonValue = JsonPrimitive | JsonArray | JsonObject;

/** @docs
 *  @chapter Utils
 *  @title JSON Parser
 *  @description
 *      Object parser capable of parsing an array or object from a string. Supports objects with a javascript syntax.
 *      
 *      The parser is slower than `JSON.parse` but its purpose is to support the parsing javascript syntax objects.
 *      
 *      When the string data does not contain any arrays or objects an error will be thrown.
 *  @param
 *      @name data
 *      @description The string representation of an array or object
 *      @type string
 *  @returns
 *      @type JsonValue
 *      @description The parsed array or object
 */
export function parse(data: string): JsonValue {

	// Parse object.
	function parse_js_object(_start_index = 0, _return_end_index = false) {

		// Variables that should not be reset after appending a pair.
		const object = {};
		let object_depth = 0;
		let is_before_initial_object = true;
		let c;

		// Variables that should be reset after appending a pair.
		let key = [];
		let value = [];
		let value_end_char = null;
		let is_key = true;
		let is_string = false;
		let is_primitive = false;

		// Append pair.
		const append_pair = () => {

			// Convert key.
			if (key.length > 0) {
				let c;
				while ((c = key.last()) === " " || c === "\t" || c === "\n") {
					--key.length;
				}
				if ((c = key[0]) === "'" || c === "\"" || c === "`") {
					--key.length;
					key = key.slice(1);
				}
				key = key.join("");
				if (key.length > 0) {

					// Parse string value types.
					// String values never have prefixed or suffixed whitespace.
					if (is_string) {
						--value.length;
						value = value.slice(1).join("");
					}

					// Parse primitive value types.
					// Primitive values never have prefixed or suffixed whitespace.
					else if (is_primitive) {
						value = value.join("")
						switch (value) {
							case "true": value = true; break;
							case "false": value = false; break;
							case "null": value = null; break;
							default:
								let primitive;
								if (value.includes('.')) {
									primitive = parseFloat(value);
								} else {
									primitive = parseInt(value);
								}
								if (!isNaN(primitive)) {
									value = primitive;
								}
								// else {
								// 	throw new Error(`Unable to parse primitive value "${value}".`)
								// }
								break;
						}
					}

					// Do not process value when not string and not array.
					// Because then it is an already parsed array or object.

					// Append.
					object[key] = value;
				}
			}

			// Reset.
			key = [];
			value = [];
			value_end_char = null;
			is_key = true;
			is_string = false;
			is_primitive = false;
		}

		// Iterate.
		for (let i = _start_index; i < data.length; i++) {
			c = data.charAt(i);

			// Count object depth in non string mode.
			if (!is_string) {
				switch (c) {
					case "{":
						++object_depth;
						if (is_before_initial_object) {
							is_before_initial_object = false;
							continue; // continue to next iteration otherwise the { will be appended to the key.
						}
						break;
					case "}":
						--object_depth;

						// Reached the end of the object.
						if (object_depth === 0) {
							append_pair();
							if (_return_end_index) {
								return {index: i, object};
							}
							return object;
						}
						break;
					default:
						break;
				}
			}

			// Not yet inside object.
			if (is_before_initial_object) {
				continue;
			}

			// Key mode.
			else if (is_key) {
				switch (c) {
				case "'":
				case "\"":
				case "`":
					if (is_string) {
						if (value_end_char === c) {
							is_string = false;
							value_end_char = null;
						}
					} else {
						value_end_char = c;
						is_string = true;
					}
					key.append(c)
					break;
				case ":":
					is_key = false;
					value_end_char = null;
					is_string = false;
					continue;
				case ",": // reset when a new key is reached by comma, this can be an error but it also happens after a string value just closed.
					key = [];
					continue;
				case " ":
				case "\t":
				case "\n":
					if (!is_string) {
						continue; // skip whitespace.
					}
					// fallthrough.
				default:
					key.append(c)
					break;
				}
			}

			// Value mode.
			else {

				// Open of string/primitive/array/object.
				if (value_end_char === null && (c !== " " && c !== "\t" && c !== "\n")) {
					switch (c) {

						// Open string.
						case "'":
						case "\"":
						case "`":
							value_end_char = c;
							is_string = true;
							break;

						// Open object.
						case "{": {
							const response = parse_js_object(i, true);
							i = response.index;
							value = response.object;
							append_pair();
							--object_depth; // decrease obj depth since we are skipping the end "}" char from the object but the start "{" was counted.
							continue;
						}

						// Open array.
						case "[": {
							const response = parse_js_array(i, true);
							i = response.index;
							value = response.object;
							append_pair();
							continue;
						}

						// Open primitive.
						default:
							value_end_char = false;
							is_primitive = true;
							break;
					}
				}

				// End string.
				else if (is_string && value_end_char === c && data.charAt(i-1) !== "\\") {
					value.append(c);
					append_pair();
					continue;
				}

				// End of primitive.
				// Encountering a whitspace inside a primitive value type likely means a missed comma, so just add it.
				else if (is_primitive && (c === "," || c === " " || c === "\t" || c === "\n")) {
					append_pair();
					continue;
				}

				// Skip whitespace at the start of a value.
				if (value.length === 0 && (c === " " || c === "\t" || c === "\n")) {
					continue;
				}

				// Append char.
				value.append(c);
			}
		}
		append_pair();

		// Response.
		if (_return_end_index) {
			return {index: data.length - 1, object};
		}
		return object;
	}

	// Parse array.
	function parse_js_array(_start_index = 0, _return_end_index = false) {

		// Variables that should not be reset after appending a pair.
		const object = [];
		let object_depth = 0;
		let is_before_initial_object = true;
		let c;

		// Variables that should be reset after appending a pair.
		let value = [];
		let value_end_char = null;
		let is_string = false;
		let is_primitive = false;
		let is_object = false;

		// Append value.
		const append_value = () => {
			if (is_object || value.length > 0) {

				// Parse string value types.
				// String values never have prefixed or suffixed whitespace.
				if (is_string) {
					--value.length;
					value = value.slice(1).join("");
				}

				// Parse primitive value types.
				// Primitive values never have prefixed or suffixed whitespace.
				else if (is_primitive) {
					value = value.join("")
					switch (value) {
						case "true": value = true; break;
						case "false": value = false; break;
						case "null": value = null; break;
						default:
							let primitive;
							if (value.includes('.')) {
								primitive = parseFloat(value);
							} else {
								primitive = parseInt(value);
							}
							if (!isNaN(primitive)) {
								value = primitive;
							} 
							// else {
							// 	throw new Error(`Unable to parse primitive value "${value}".`)
							// }
							break;
					}
				}

				// Do not process value when not string and not array.
				// Because then it is an already parsed array or object.

				// Append.
				object.append(value);
			}

			// Reset.
			value = [];
			value_end_char = null;
			is_string = false;
			is_primitive = false;
			is_object = false;
		}

		// Iterate.
		for (let i = _start_index; i < data.length; i++) {
			c = data.charAt(i);

			// Count object depth in non string mode.
			if (!is_string) {
				switch (c) {
					case "[":
						++object_depth;
						if (is_before_initial_object) {
							is_before_initial_object = false;
							continue; // continue to next iteration otherwise the { will be appended to the key.
						}
						break;
					case "]":
						--object_depth;

						// Reached the end of the object.
						if (object_depth === 0) {
							append_value();
							if (_return_end_index) {
								return {index: i, object};
							}
							return object;
						}
						break;
					default:
						break;
				}
			}

			// Not yet inside object.
			if (is_before_initial_object) {
				continue;
			}

			// Open of string/primitive/array/object and reset upon comma.
			else if (value_end_char === null && (c !== " " && c !== "\t" && c !== "\n")) {
				switch (c) {

					// Reset value on comma.
					case ",":
						value = [];
						continue;

					// Open string.
					case "'":
					case "\"":
					case "`":
						value_end_char = c;
						is_string = true;
						break;

					// Open object.
					case "{": {
						const response = parse_js_object(i, true);
						i = response.index;
						value = response.object;
						is_object = true;
						append_value();
						continue;
					}

					// Open array.
					case "[": {
						const response = parse_js_array(i, true);
						i = response.index;
						value = response.object;
						is_object = true;
						append_value();
						--object_depth; // decrease obj depth since we are skipping the end "}" char from the object but the start "{" was counted.
						continue;
					}

					// Open primitive.
					default:
						value_end_char = false;
						is_primitive = true;
						break;
				}
			}

			// End string.
			else if (is_string && value_end_char === c && data.charAt(i-1) !== "\\") {
				value.append(c);
				append_value();
				continue;
			}

			// End of primitive.
			// Encountering a whitspace inside a primitive value type likely means a missed comma, so just add it.
			else if (is_primitive && (c === "," || c === " " || c === "\t" || c === "\n")) {
				append_value();
				continue;
			}

			// Skip whitespace at the start of a value.
			if (value.length === 0 && (c === " " || c === "\t" || c === "\n")) {
				continue;
			}

			// Append char.
			value.append(c);
		}
		append_value();

		// Response.
		if (_return_end_index) {
			return {index: data.length - 1, object};
		}
		return object;
	}

	// Detect array or object.
	for (let i = 0; i < data.length; i++) {
		const c = data.charAt(i);
		switch (c) {
			case "{":
				return parse_js_object(i);
			case "[":
				return parse_js_array(i);
			default:
				break;
		}
	}
	throw new Error("Unable to detect an object or array in the string data.");
}

// Export the namespace if needed for backward compatibility
export const json = {
    parse,
};

// For CommonJS compatibility
export default {
    parse,
    JsonPrimitive,
    JsonArray,
    JsonObject,
    JsonValue,
};