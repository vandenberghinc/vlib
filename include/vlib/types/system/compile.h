/*
 Author: Daan van den Bergh
 Copyright: © 2022 Daan van den Bergh.
*/

// Header.
#ifndef VLIB_COMPILE_H
#define VLIB_COMPILE_H

// Namespace vlib.
namespace vlib {

// ---------------------------------------------------------
// Internal utility functions.

namespace internal {

// - Check if a json value that should be a non json value ...
//   is actually a json with os specific values.
constexpr
auto& check_os_json(const Path& config, const Json& json, const String& key) {
	auto& value = json[key];
	if (value.isj()) {
		if (OSID == 1) {
			if (!value.asj().contains("macos")) {
				throw ConfigError("Configuration file ", (config.is_defined() ? config.quote().append(' ') : ""), "key \"", key, "\", has not specfied a value for operating system \"macos\".");
			}
			return value.asj()["macos"];
		} else if (OSID == 0) {
			if (!value.asj().contains("linux")) {
				throw ConfigError("Configuration file ", (config.is_defined() ? config.quote().append(' ') : ""), "key \"", key, "\", has not specfied a value for operating system \"linux\".");
			}
			return value.asj()["linux"];
		} else {
			throw ConfigError("Unsupported operating system.");
		}
	} else {
		return value;
	}
};

// End namespace internal.
}

// ---------------------------------------------------------
// Compile.

// Build.
/*	@docs: {
 *	@chapter: system
 *	@title: Compile
 *	@parameter: {
 *		@name: source_dir
 *		@description: The path of the source directory. Used to replace $SOURCE in the configuration json.
 *	}
 *	@parameter: {
 *		@name: config_path
 *		@description: The path to the configuration json.
 *	}
 *	@parameter: {
 *		@name: config
 *		@description: The compile configuration.
 *	}
 *	@parameter: {
 *		@name: log
 *		@description: Allow logging to the console.
 *	}
 *	@description:
 *		Compile c++ code.
 *
 *		The supported fields for the configuration json are: `[compiler, input, output, std, include_paths, library_paths, linked_libraries, other_flags]`.
 *
 *		Path values in the configuration file may use `$SOURCE` which will be replaced with the `source_dir` parameter.
 *
 *		Every value in the configuration json can either be the value to use, or a nested json with os specific values.
 *		For example `"other_flags": ["-g"]` may also be `"other_flags": {"macos": ["-g"], "linux": ["-g", "-rdynamic"]}`.
 *		The supported os types are `macos` and `linux`.
 *
 *		An example configuration json.
 *		```{
 *			"compiler": "clang++",
 *			"input": "$SOURCE/build.cpp",
 *			"output": "$SOURCE/bin/build",
 *			"std": "c++2b",
 *			"include_paths": [
 *				"/opt/vinc/include/",
 *				"/opt/homebrew/opt/openssl@3.1/include/"
 *			],
 *			"library_paths": [
 *				"/opt/homebrew/opt/openssl@3.1/lib/"
 *			],
 *			"linked_libraries": {
 *				"macos": [
 *					"-lssl",
 *					"-lcrypto",
 *					"-lz"
 *				],
 *				"linux": [
 *					"-lssl",
 *					"-lcrypto",
 *					"-lz",
 *					"-lcrypt",
 *					"-ldl"
 *				]
 *			},
 *			"other_flags": [
 *				"-g",
 *				"-rdynamic",
 *				"-fsanitize=undefined",
 *				"-Wno-unknown-escape-sequence"
 *			]
 *		}```
 *	@warning:
 *		This function is mainly implemented for other vinc libraries so it may be subject to change.
 } */
void     compile(
	const Json& config,
	const Path& source_dir = {},
	const Path& config_path = {},
	const Bool& log = false
) {
	
	// Check keys.
	for (auto& key: {"compiler", "input", "output"}) {
		ullong index = config.find(key);
		if (index == NPos::npos) {
			throw ConfigError("The configuration file ", (config_path.is_defined() ? config_path.quote().append(' ') : ""), "does not contain required build configuration key \"", key, "\".");
		}
		if (!config.value(index).iss()) {
			throw ConfigError("The configuration file ", (config_path.is_defined() ? config_path.quote().append(' ') : ""), "has an invalid type for build configuration key \"", key, "\", valid type is \"String\".");
		}
	}
	
	// Create command.
	Array<String> cmd;
	String& compiler = internal::check_os_json(config_path, config, "compiler").ass();
	if (compiler.eq("clang++", 7) || compiler.eq("g++", 3)) {
		cmd.append(tostr("/usr/bin/", compiler));
	} else {
		cmd.append(compiler);
	}
	if (config.contains("std")) {
		cmd.append(tostr("-std=", internal::check_os_json(config_path, config, "std").ass()));
	}
	if (config.contains("other_flags")) {
		for (auto& i: internal::check_os_json(config_path, config, "other_flags").asa()) {
			cmd.append(i.ass());
		}
	}
	if (config.contains("include_paths")) {
		for (auto& i: internal::check_os_json(config_path, config, "include_paths").asa()) {
			cmd.append(tostr("-I", i.ass()));
		}
	}
	if (config.contains("library_paths")) {
		for (auto& i: internal::check_os_json(config_path, config, "library_paths").asa()) {
			cmd.append(tostr("-L", i.ass()));
		}
	}
	String output = internal::check_os_json(config_path, config, "output").ass().replace("$SOURCE", source_dir);
	String input = internal::check_os_json(config_path, config, "input").ass().replace("$SOURCE", source_dir);
	cmd.append("-o");
	cmd.append(output);
	cmd.append(input);
	if (compiler.contains("nvcc")) {
		String x;
		for (auto& i: cmd) { x << i << ' '; }
	}
	if (config.contains("linked_libraries")) {
		for (auto& i: internal::check_os_json(config_path, config, "linked_libraries").asa()) {
			cmd.append(i.ass());
		}
	}
	
	// Execute.
	Proc proc { .timeout = 60 * 5 * 1000 };
	if (proc.execute(cmd) != 0) {
	} else if (proc.has_err()) {
		throw CompileError("Failed to build the package: \n", proc.err().replace_end_r("\n"));
	} else if (proc.has_out()) {
		throw CompileError("Failed to build the package: \n", proc.out().replace_end_r("\n"));
	} else if (proc.exit_status() != 0) {
		throw CompileError("Failed to build the package [", proc.exit_status(), "].");
	}
	
	if (log) {
		print_marker("Build \"", input, "\" to \"", output, "\".");
	}
}

// ---------------------------------------------------------
// End.

}; 		// End namespace vlib.
#endif 	// End header.
