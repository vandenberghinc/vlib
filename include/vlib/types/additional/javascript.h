// Author: Daan van den Bergh
// Copyright: © 2022 Daan van den Bergh.
//
// NOTES:
// - DataFrame is still a very basic dataframe type, not yet ready for real-world usage.
//

// Header.
#ifndef VLIB_JS_H
#define VLIB_JS_H

// Namespace vlib.
namespace vlib {

// ---------------------------------------------------------
// Values type.

/*  @docs
 *  @chapter: JavaScript
 *  @title: JavaScript
 *  @description:
 *      JavaScript compile class.
 */
struct JavaScript {
			
	// Bundle javascript files.
	struct BundleArgs {
		Path 			source; // source directory.
		Array<String> 	include_order; // sub paths that should be included first.
		Array<String> 	exclude; // exclude sub paths.
		String 			header; // top header of the bundled file.
		Bool 			newlines = true; // allow single new lines.
		Bool 			double_newlines = false; // allow double new lines.
		Bool 			whitespace = false; // allow whitespace.
		Bool 			comments = false; // allow comments.
	};
	/* 	@docs
	 * 	@title: Bundle javascript
	 * 	@description:
	 * 		Bundle javascript files into a single file.
	 * 	@parameter:
	 * 		@name: args
	 * 		@description:
	 *			The bundle arguments.
	 *			```
	 *			struct BundleArgs {
	 *				Path 			source; // source directory.
	 *				Array<String> 	include_order; // sub paths that should be included first.
	 *				Array<String> 	exclude; // exclude sub paths.
	 *				String 			header; // top header of the bundled file.
	 *				Bool 			newlines = true; // allow single new lines.
	 *				Bool 			double_newlines = false; // allow double new lines.
	 *				Bool 			whitespace = false; // allow whitespace.
	 *				Bool 			comments = false; // allow comments.
	 *			};
	 *			```
	 */
	static
	String	bundle(const BundleArgs& args) {
		
		// Vars.
		String js;
		Array<Path> paths;
		TrimArgs trim_args = {
			.newlines = args.newlines,
			.double_newlines = args.double_newlines,
			.whitespace = args.whitespace,
			.comments = args.comments,
		};
		
		// Header.
		js << args.header;
		
		// Define paths in order.
		for (auto& subpath: args.include_order) {
			Path path = args.source.join(subpath);
			paths.append(path);
			trim(js, path.load(), trim_args);
		}
		
		// Parse.
		for (auto& path: args.source.paths(true)) {
			String subpath = path.slice(args.source.len() + 1);
			if (path.extension() == "js" && !args.exclude.contains(subpath) && !paths.contains(path)) {
				paths.append(path);
				trim(js, path.load(), trim_args);
			}
		}
		return js;
	}
	
	// Trim js.
	struct TrimArgs {
		Bool newlines = true; // allow single new lines.
		Bool double_newlines = false; // allow double new lines.
		Bool whitespace = false; // allow whitespace.
		Bool comments = false; // allow comments.
	};
	/* 	@docs
	 * 	@title: Trim javascript
	 * 	@description:
	 * 		Trim a javascript code file.
	 * 	@parameter:
	 * 		@name: code
	 * 		@description: The javascript code to trim.
	 * 	@parameter:
	 * 		@name: args
	 * 		@description:
	 *			The trim arguments.
	 *			```
	 *			struct TrimArgs {
	 *				Bool newlines = true; // allow single new lines.
	 *				Bool double_newlines = true; // allow double new lines.
	 *				Bool whitespace = false; // allow whitespace.
	 *				Bool comments = false; // allow comments.
	 *			};
	 *			```
	 *	@funcs: 2
	 */
	static
	String	trim(const Code& data, const TrimArgs& args) {
		String js;
		trim(js, data, args);
		return js;
	}
	static
	void	trim(String& js, const Code& data, const TrimArgs& args) {
		
		// Expand.
		js.expand(data.len());
		
		//@TODO when comments are placed after a code line the newline should not be removed by default.
		
		// Trim.
		static String remove_whitespace_on_last_or_next = {
			'\n',
			';',
			':',
			'!',
			'=',
			'+',
			'-',
			'*',
			'/',
			'%',
			'<',
			'>',
			'(',
			')',
			'{',
			'}',
			',',
			'&',
			'|',
		};
		for (auto& i: data.iterate()) {
			if (
				(!args.comments && i.is_comment()) ||
				(i.is_code() && (
					(!args.double_newlines && (js.len() == 0 || js.last() == '\n') && i.character() == '\n') ||
					(!args.whitespace && (js.len() == 0 || js.last() == ' ' || js.last() == '\t') && (i.character() == ' ' || i.character() == '\t')) ||
					(!args.whitespace && (i.character() == ' ' || i.character() == '\t') && ((js.len() == 0 || remove_whitespace_on_last_or_next.contains(js.last())) || remove_whitespace_on_last_or_next.contains(i.next())))
				))
			) {
				continue;
			} else {
				js.append(i.character());
			}
		}
		
		// Remove all newlines last since removing leading and trailing whitespace requires newlines.
		if (!args.newlines) {
			js.remove_r('\n');
		}
		
	}
	
	// Join lines like ["Hello World!" "\n"] to ["Hello World!\n"].
	static
	String	join_strings(const Code& code) {
		
		// Vars.
		String js;
		String join_str_batch;
		bool is_str = false;
		ullong str_end_index = 0;
		String allowed_between_str_chars = "\n\t ";
		
		// Iterate.
		for (auto& i: code.iterate()) {
			
			// Append.
			bool append = str_end_index == 0;
			if (str_end_index != 0 && i.is_any_str()) {
				join_str_batch.reset();
				str_end_index = 0;
				--js.len();
				append = false;
			} else if (str_end_index != 0) {
				if (allowed_between_str_chars.contains(i.character())) {
					join_str_batch.append(i.character());
					append = false;
				} else {
					str_end_index = 0;
					js.concat_r(join_str_batch);
					join_str_batch.reset();
					append = true;
				}
			}
			
			// Start of string.
			if (!is_str && i.is_any_str()) {
				is_str = true;
			}
			
			// End of string.
			else if (is_str && !i.is_any_str()) {
				is_str = false;
				if (allowed_between_str_chars.contains(i.character())) {
					str_end_index = i.index;
					join_str_batch.append(i.character());
					append = false;
				}
			}
			
			// Append.
			if (append) {
				js.append(i.character());
			}
			
		}
		
		// Handler.
		return js;
		
	}
	
};

// ---------------------------------------------------------
// End.

}; 		// End namespace vlib.
#endif 	// End header.
