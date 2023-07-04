// Author: Daan van den Bergh
// Copyright: © 2022 Daan van den Bergh.

// Header.
#ifndef VLIB_CODE_T_H
#define VLIB_CODE_T_H

// Namespace vlib.
namespace vlib {

// New type.
/*  @docs {
	@chapter: types
	@title: Code
	@description:
		Code type.
 
        Derived class of `String`.
	@usage:
        #include <vlib/types.h>
		vlib::Code x;
} */
// @TODO undefined behaviour for destructor.
// @TODO docs fix for inherited functions.
struct Code : public String {

// Private:
private:

	// ---------------------------------------------------------
	// Aliases.

	using 		This = 		Code;
	using 		Type = 		char;
	using 		Length = 	ullong;
	using 		array_h = 	vlib::array<Type, Length>;

// Public:
public:

	// ---------------------------------------------------------
	// Shortcuts.

	using 		String::m_arr;
	using 		String::m_len;
	using 		String::m_capacity;
	using 		String::reconstruct;
	using 		String::null_terminate_safe_h;
	
	// ---------------------------------------------------------
	// Duplicate functions.

	using 		String::find;

	// ---------------------------------------------------------
	// Construct functions.

	// Copy.
	constexpr
	This& 	copy(const This& obj) {
		if (this == &obj) { return *this; }
		array_h::copy(m_arr, m_len, m_capacity, obj.m_arr, obj.m_len, obj.m_capacity);
		null_terminate_safe_h();
		return *this;
	}

	// Swap with Array.
	constexpr
	This& 	swap(This& obj) {
		if (this == &obj) { return *this; }
		array_h::swap(m_arr, m_len, m_capacity, obj.m_arr, obj.m_len, obj.m_capacity);
		return *this;
	}

	// ---------------------------------------------------------
	// Constructors.

	// Default constructor.
	constexpr
	Code ()
	: String() {}

	// Constructor from an array with length and alloc length.
	constexpr
	Code (const Type* arr, const Length len, const Length capacity)
	: String(arr, len, capacity) {}

	// Constructor from an array with length.
    /*  @docs {
        @title: Constructor
        @description:
            Construct a `Code` object.
        @parameter: {
            @name: arr
            @description: The char array.
        }
        @parameter: {
            @name: len
            @description: The length of the char array.
        }
        @usage:
            vlib::Code code("Hello World!", 12);
    } */
	constexpr
	Code (const Type* arr, const Length len)
	: String(arr, len) {}

	// Constructor from a char array.
    /*  @docs {
        @title: Constructor
        @description:
            Construct a `Code` object.
        @parameter: {
            @name: arr
            @description: The null-terminated char array.
        }
        @usage:
            vlib::Code code("Hello World!");
    } */
	constexpr
	Code (const Type* arr)
	: String(arr) {}

	// Constructor from initializer list.
	constexpr
	Code (const std::initializer_list<Type>& x)
	: String(x) {}

	// Copy constructor from "Pipe / CString / String".
	template <typename Array> requires (
	   is_Pipe<Array>::value ||
	   is_CString<Array>::value ||
	   is_String<Array>::value
   ) constexpr
	Code (const Array& x)
	: String(x) {}

	// Move constructor from "Pipe / CString / String".
	template <typename Array> requires (
	   is_Pipe<Array>::value ||
	   is_CString<Array>::value ||
	   is_String<Array>::value
   ) constexpr
	Code (Array&& x)
	: String(x) {}

	// Copy constructor.
	constexpr
	Code (const This& obj)
	: String() { copy(obj); }

	// Move constructor.
	constexpr
	Code (This&& obj)
	: String() { swap(obj); }

	// ---------------------------------------------------------
	// Assignment operators.

	// Constructor from Type*.
	constexpr
	This&	operator =(const Type* x) {
		reconstruct(x);
		return *this;
	}

	// Assignment operator from initializer list.
	constexpr
	This&	operator =(const std::initializer_list<Type>& x) {
		reconstruct(x);
		return *this;
	}

	// Copy assignment operator from "Pipe / CString / String".
	template <typename Array> requires (
		is_Pipe<Array>::value ||
		is_CString<Array>::value ||
		is_String<Array>::value
	) constexpr
	This&	operator =(const Array& x) {
		reconstruct(x);
		return *this;
	}

	// Move assignment operator from "Pipe / CString / String".
	template <typename Array> requires (
		is_Pipe<Array>::value ||
		is_CString<Array>::value ||
		is_String<Array>::value
	) constexpr
	This&	operator =(Array&&	x) {
		reconstruct(x);
		return *this;
	}

	// Copy assignment operator.
	constexpr
	This&	operator =(const This& obj) {
		return copy(obj);
	}

	// Move assignment operator.
	constexpr
	This&	operator =(This&& obj) {
		return swap(obj);
	}
	
	// ---------------------------------------------------------
	// Iterations.
	
	// Iterate over a code file.
    /*  @docs {
        @title: Iterate
        @description:
            Iterate over a code file with a special iterator.
        @usage:
            vlib::Code code("...");
            for (auto& i: code.iterate()) {
                ...
            }
            for (auto& i: code.iterate<vlib::Backwards>()) {
                ...
            }
    } */
	template <typename Iter = Forwards, typename... Air> requires (is_Forwards<Iter>::value) constexpr
	auto iterate() const {
		return internal::code::iter_t(0, this->m_len, this->m_arr, false);
	}
	template <typename Iter> requires (is_Backwards<Iter>::value) constexpr
	auto iterate() const {
		return internal::code::iter_t(0, this->m_len, this->m_arr, true);
	}
	template <typename Iter = Forwards, typename... Air> requires (is_Forwards<Iter>::value) constexpr
	auto iterate(Len sindex) const {
		auto si = sindex.subscript(this->m_len);
		if (si == npos) {
			return internal::code::iter_t(0, 0, "", false);
		} else {
			return internal::code::iter_t(si, this->m_len, this->m_arr, false);
		}
	}
	template <typename Iter> requires (is_Backwards<Iter>::value) constexpr
	auto iterate(Len sindex) const {
		auto si = sindex.subscript(this->m_len);
		if (si == npos) {
			return internal::code::iter_t(0, 0, "", false);
		} else {
			return internal::code::iter_t(si, this->m_len, this->m_arr, true);
		}
	}
	template <typename Iter = Forwards, typename... Air> requires (is_Forwards<Iter>::value) constexpr
	auto iterate(Len sindex, Len eindex) const {
		auto si = sindex.subscript(this->m_len);
		if (si == npos) {
			return internal::code::iter_t(0, 0, "", false);
		} else {
			return internal::code::iter_t(si, eindex.subscript(this->m_len, this->m_len), this->m_arr, false);
		}
	}
	template <typename Iter> requires (is_Backwards<Iter>::value) constexpr
	auto iterate(Len sindex, Len eindex) const {
		auto si = sindex.subscript(this->m_len);
		if (si == npos) {
			return internal::code::iter_t(0, 0, "", false);
		} else {
			return internal::code::iter_t(si, eindex.subscript(this->m_len, this->m_len), this->m_arr, true);
		}
	}

	// ---------------------------------------------------------
	// Functions.
	
	// Copy.
    /*  @docs {
        @title: Copy
        @description:
            Create a copy of the object.
    } */
	constexpr
	This 	copy() {
		return *this;
	}
	constexpr
	This 	copy() const {
		return *this;
	}
	
    // Code patterns.
    /*  @docs {
        @title: Code patterns
        @description:
            Used to include / exclude characters from `Code` operations.
     
            ```struct code_patterns {
                bool    exclude_strings = false;    // exclude strings.
                bool    exclude_chars = false;      // exclude chars.
                bool    exclude_comments = false;   // exclude comments.
                bool    exclude_escaped = false;    // exclude items preceded by an escape character.
                int     parentheses_depth = -1;     // required parentheses depth (-1 to ignore).
                int     brackets_depth = -1;        // required brackets depth (-1 to ignore).
                int     curly_brackets_depth = -1;  // required curly brackets depth (-1 to ignore).
                int     template_depth = -1;        // required template depth (-1 to ignore).
            };```
    } */
    struct code_patterns {
        bool    exclude_strings = false;        // exclude strings.
        bool    exclude_chars = false;          // exclude chars.
        bool    exclude_comments = false;       // exclude comments.
        bool    exclude_escaped = false;        // exclude items preceded by an escape character.
        int     parentheses_depth = -1;         // required parentheses depth (-1 to ignore).
        int     brackets_depth = -1;            // required brackets depth (-1 to ignore).
        int     curly_brackets_depth = -1;      // required curly brackets depth (-1 to ignore).
        int     template_depth = -1;            // required template depth (-1 to ignore).
    };
    
	// Find char / substring in code.
    /*  @docs {
        @title: Find code
        @description:
            Find a substring in the code.
     
            Offers special exclude / include patterns.
		@return:
			Returns the start index of the substring when the substring is found.
			Returns `vlib::NPos::npos` when the substring is not found.
        @parameter {
            @name: to_find
            @description: The substring to find.
        }
        @parameter {
            @name: sindex
            @description: The start index.
        }
        @parameter {
            @name: eindex
            @description: The end index (use `vlib::NPos::npos` to use the length of the `Code` as the eindex).
        }
        @parameter {
            @name: patterns
            @description: The exclude / include code patterns.
        }
        @usage:
             vlib::Code code ("Hi \"X\" Ho");
             code.find("X"); ==> 4
             code.find_code("X", 0, NPos::npos, { .exclude_strings = true } ); ==> npos
        @funcs: 2
    } */
	constexpr
	ullong 	find_code(
		// The string or char to find.
		const char* to_find,
		// The start index.
        const Len& sindex = 0,
		// The end index.
		// Leave `NPos::npos` to use the length attribute.
        const Len& eindex = NPos::npos,
		// Exclude patterns.
		const code_patterns& patterns = {false, false, false, false, -1, -1, -1, -1}
	) const {
		if (this->m_len == 0) { return NPos::npos; }
		auto nto = vlib::len(to_find);
		bool is_char = nto == 1;
		for (auto i: this->iterate(sindex, eindex)) {
			if (
				(!patterns.exclude_strings || !i.is_str()) &&
				(!patterns.exclude_chars || !i.is_char()) &&
				(!patterns.exclude_comments || !i.is_comment()) &&
				(!patterns.exclude_escaped || (i.index == 0 || i.prev() != '\\')) &&
				(patterns.parentheses_depth == -1 || patterns.parentheses_depth == i.parentheses_depth()) &&
				(patterns.brackets_depth == -1 || patterns.brackets_depth == i.brackets_depth()) &&
				(patterns.curly_brackets_depth == -1 || patterns.curly_brackets_depth == i.curly_brackets_depth()) &&
				(patterns.template_depth == -1 || patterns.template_depth == i.template_depth())
			) {
				if (is_char && i.character() == to_find[0]) { return i.index; }
				else if (!is_char && eq(m_arr + i.index, nto, to_find, nto)) { return i.index; }
			}
		}
		return NPos::npos;
	}
	ullong 	find_code(
		// The string or char to find.
		const char* to_find,
		// Exclude patterns.
		const code_patterns& patterns = {false, false, false, false, -1, -1, -1, -1}
	) const {
		return find_code(to_find, 0, NPos::npos, patterns);
	}
	
	// Remove indent.
	/*  @docs {
		@title: Remove indent
		@description:
			Remove the indent from the code.
	 
			Offers special exclude / include patterns.
		@return:
			Function `remove_indent` returns a new object while function `remove_indent_r` updates the current object and returns a reference to the current object.
		@parameter {
			@name: sindex
			@description: The start index.
		}
		@parameter {
			@name: eindex
			@description: The end index (use `vlib::NPos::npos` to use the length of the `Code` as the eindex).
		}
		@parameter {
			@name: patterns
			@description: The exclude / include code patterns.
		}
		@usage:
			 vlib::Code code ("  Hi");
			 code.remove_indent_r(); ==> "Hi"
		@funcs: 2
	} */
	constexpr
	This 	remove_indent(
        const Len& 		sindex = 0,					// the start index.
        const Len& 		eindex = NPos::npos,		// the end index.
        const code_patterns& patterns = {false, false, false, false, -1, -1, -1, -1} // Exclude patterns.
	) {
		This obj;
		remove_indent_h(obj, sindex, eindex, patterns);
		return obj;
	}
	constexpr
	This& 	remove_indent_r(
		const Len& 		sindex = 0,					// the start index.
		const Len& 		eindex = NPos::npos,		// the end index.
		const code_patterns& patterns = {false, false, false, false, -1, -1, -1, -1} // Exclude patterns.
	) {
		This obj;
		remove_indent_h(obj, sindex, eindex, patterns);
		return swap(obj);
	}
	
	// Add indent.
	/*  @docs {
		@title: Add indent
		@description:
			Add the indent to the code.
	 
			Offers special exclude / include patterns.
		@return:
			Function `add_indent` returns a new object while function `add_indent_r` updates the current object and returns a reference to the current object.
		@parameter {
			@name: indent
			@description: The indent length, `4` means four space characters.
		}
		@parameter {
			@name: sindex
			@description: The start index.
		}
		@parameter {
			@name: eindex
			@description: The end index (use `vlib::NPos::npos` to use the length of the `Code` as the eindex).
		}
		@parameter {
			@name: patterns
			@description: The exclude / include code patterns.
		}
		@usage:
			 vlib::Code code ("Hi");
			 code.add_indent_r(2); ==> "Hi"
		@funcs: 2
	} */
	constexpr
	This 	add_indent(
		const Int&		indent = 4,
		const Len& 		sindex = 0,					// the start index.
		const Len& 		eindex = NPos::npos,		// the end index.
		const code_patterns& patterns = {false, false, false, false, -1, -1, -1, -1} // Exclude patterns.
	) {
        bool first_line = true;
		bool already_indented_this_line = false;
        ullong last_index = m_len - 1;
        Int l_indent = indent;
        Int indent_step = indent == 0 ? 4 : indent;
        This obj;
        obj.resize(this->m_len);
        for (auto i: iterate(sindex, eindex)) {
            const char& c = i.character();
			
			// New line.
			if (c == '\n') {
				already_indented_this_line = false;
			}
            
			// Add / remove indent.
            if (!already_indented_this_line && (c == '(' || c == '{')) {
                l_indent += indent_step;
				already_indented_this_line = true;
            }
            else if (c == ')' || c == '}') {
                l_indent -= indent_step;
            }
            
            if (
                (patterns.exclude_strings || i.is_str()) &&
                (patterns.exclude_chars || i.is_char()) &&
                (patterns.exclude_comments || i.is_comment()) &&
                (patterns.exclude_escaped || (i.index == 0 || i.prev() == '\\')) &&
                (patterns.parentheses_depth == i.parentheses_depth()) &&
                (patterns.brackets_depth == i.brackets_depth()) &&
                (patterns.curly_brackets_depth == i.curly_brackets_depth()) &&
                (patterns.template_depth == i.template_depth())
            ) {
                obj.append(c);
            } else if (i.index != last_index && c == '\n') {
                obj.append(c);
                Int while_indent = l_indent;
                if (i.next() == ')' || i.next() == '}') {
                    while_indent -= indent_step;
                }
                while (--while_indent >= 0) {
                    obj.append(' ');
                }
                first_line = false;
			} else if (i.index != last_index && first_line) {
				Int while_indent = l_indent;
				if (i.next() == ')' || i.next() == '}') {
					while_indent -= indent_step;
				}
				while (--while_indent >= 0) {
					obj.append(' ');
				}
				obj.append(c);
				first_line = false;
			}
			
			// Raw append.
            else {
                obj.append(c);
            }
        }
        return obj;
	}
	constexpr
	This& 	add_indent_r(
		const Int&		indent = 4,
		const Len& 		sindex = 0,					// the start index.
		const Len& 		eindex = NPos::npos,		// the end index.
		const code_patterns& patterns = {false, false, false, false, -1, -1, -1, -1} // Exclude patterns.
	) {
		This obj = add_indent(indent, sindex, eindex, patterns);
		return swap(obj);
	}
	
	// Remove comments.
	/*  @docs {
		@title: Remove comments
		@description:
			Remove the comments from the code.
	 
			Offers special exclude / include patterns.
		@return:
			Function `remove_comments` returns a new object while function `remove_comments_r` updates the current object and returns a reference to the current object.
		@parameter {
			@name: sindex
			@description: The start index.
		}
		@parameter {
			@name: eindex
			@description: The end index (use `vlib::NPos::npos` to use the length of the `Code` as the eindex).
		}
		@parameter {
			@name: patterns
			@description: The exclude / include code patterns.
		}
		@usage:
			 vlib::Code code ("Hello // World!");
			 code.remove_comments_r(); ==> "Hello "
		@funcs: 2
	} */
	constexpr
	This 		remove_comments(
		const Len& 		sindex = 0,					// the start index.
		const Len& 		eindex = NPos::npos,		// the end index.
		const code_patterns& patterns = {false, false, false, false, -1, -1, -1, -1} // Exclude patterns.
	) {
		This obj;
		remove_comments_h(obj, sindex, eindex, patterns);
		return obj;
	}
	constexpr
	This& 		remove_comments_r(
        const Len& 		sindex = 0,					// the start index.
        const Len& 		eindex = NPos::npos,		// the end index.
        const code_patterns& patterns = {false, false, false, false, -1, -1, -1, -1} // Exclude patterns.
	) {
		This obj;
		remove_comments_h(obj, sindex, eindex, patterns);
		return swap(obj);
	}
	
	// Slice comments.
	/*  @docs {
		@title: Slice comments
		@description:
			Slice the comments from the code.
	 
			Offers special exclude / include patterns.
		@return:
			Function `slice_comments` returns a new object while function `slice_comments_r` updates the current object and returns a reference to the current object.
		@parameter {
			@name: sindex
			@description: The start index.
		}
		@parameter {
			@name: eindex
			@description: The end index (use `vlib::NPos::npos` to use the length of the `Code` as the eindex).
		}
		@parameter {
			@name: patterns
			@description: The exclude / include code patterns.
		}
		@usage:
			 vlib::Code code ("Hello // World!");
			 code.slice_comments_r(); ==> " World!"
		@funcs: 2
	} */
	constexpr
	This 		slice_comments(
		const Len& 		sindex = 0,					// the start index.
		const Len& 		eindex = NPos::npos		// the end index.
	) {
		This obj;
		slice_comments_h(obj, sindex, eindex);
		return obj;
	}
	constexpr
	This& 		slice_comments_r(
        const Len& 		sindex = 0,					// the start index.
        const Len& 		eindex = NPos::npos		// the end index.
	) {
		This obj;
		slice_comments_h(obj, sindex, eindex);
		return swap(obj);
	}
	
	// Replace double.
	/*  @docs {
		@title: Replace double
		@description:
			Replace double characters with a single character.
	 
			Offers special exclude / include patterns.
		@return:
			Function `slice_comments` returns a new object while function `slice_comments_r` updates the current object and returns a reference to the current object.
		@parameter {
			@name: replacements
			@description: The char array with single chars that will be replaced.
		}
		@parameter {
			@name: sindex
			@description: The start index.
		}
		@parameter {
			@name: eindex
			@description: The end index (use `vlib::NPos::npos` to use the length of the `Code` as the eindex).
		}
		@parameter {
			@name: patterns
			@description: The exclude / include code patterns.
		}
		@usage:
			 vlib::Code code ("Hello  World!!");
			 code.replace_double_r(" !"); ==> "Hello World!"
		@funcs: 2
	} */
	constexpr
	This 		replace_double(
		const char* 	replacements,				// the replacements array with chars.
        const Len& 	sindex = 0,					// the start index.
        const Len& 	eindex = NPos::npos,		// the end index.
        const code_patterns& patterns = {false, false, false, false, -1, -1, -1, -1} // Exclude patterns.
	) {
		This obj;
		replace_double_h(obj, replacements, sindex, eindex, patterns);
		return obj;
	}
	constexpr
	This& 		replace_double_r(
		const char* 	replacements,				// the replacements array with chars.
			const Len& 			sindex = 0,					// the start index.
			const Len& 			eindex = NPos::npos,		// the end index.
		const code_patterns& patterns = {false, false, false, false, -1, -1, -1, -1} // Exclude patterns.
	) {
		This obj;
		replace_double_h(obj, replacements, sindex, eindex, patterns);
		return swap(obj);
	}
	
	// Split code by delimiter.
	/* @docs {
		@title: Split code
		@description:
			Split code by delimiter.
	 
			Offers special exclude / include patterns.
	}*/
	constexpr
	Array<Code> 	split_code(
		const Type* delimiter,
		const code_patterns& patterns = {false, false, false, false, -1, -1, -1, -1}
	) const {
		Length ndelimiter = vlib::len(delimiter);
		Array<This> splitted;
		Length pos = 0;
		Length lpos = internal::npos;
		bool run = true;
		while (run) {
			pos = find_code(delimiter, pos, NPos::npos, patterns);
			if (pos == internal::npos) {
				pos = m_len;
				run = false;
			}
			if (lpos == internal::npos) {
				lpos = 0;
			}
			This str;
			str.m_len = pos - lpos;
			str.m_capacity = str.m_len;
			array_h::alloc(str.m_arr, str.m_len);
			array_h::copy(str.m_arr, m_arr + lpos, pos - lpos);
			splitted.append(move(str));
			pos += ndelimiter;
			lpos = pos;
		}
		return splitted;
	}
	
// Private.
private:
	
	// ---------------------------------------------------------
	// Helper functions.
	
	// Remove indent.
	constexpr
	void 	remove_indent_h(
		This& 		obj,						// the result object.
		Len 		sindex = 0,					// the start index.
		Len 		eindex = NPos::npos,		// the end index.
        const code_patterns& patterns = {false, false, false, false, -1, -1, -1, -1} // Exclude patterns.
	) {
		bool is_newline = true;
		obj.resize(this->m_len);
		for (auto i: iterate(sindex, eindex)) {
			const char& c = i.character();
			if (
                (patterns.exclude_strings || i.is_str()) &&
                (patterns.exclude_chars || i.is_char()) &&
                (patterns.exclude_comments || i.is_comment()) &&
                (patterns.exclude_escaped || (i.index == 0 || i.prev() == '\\')) &&
                (patterns.parentheses_depth == i.parentheses_depth()) &&
                (patterns.brackets_depth == i.brackets_depth()) &&
                (patterns.curly_brackets_depth == i.curly_brackets_depth()) &&
                (patterns.template_depth == i.template_depth())
			) {
				obj.set(obj.m_len, c);
			} else if (c == '\n') {
				obj.set(obj.m_len, c);
				is_newline = true;
			} else if (!is_newline) {
				obj.set(obj.m_len, c);
			} else if (is_newline && !is_space(c)) { //  && c != '\220'
				obj.set(obj.m_len, c);
				is_newline = false;
			}
		}
	}

	// Remove comments.
	constexpr
	void 	remove_comments_h(
		This& 		obj,						// the result object.
		Len 		sindex = 0,					// the start index.
		Len 		eindex = NPos::npos,		// the end index.
        const code_patterns& patterns = {false, false, false, false, -1, -1, -1, -1} // Exclude patterns.
	) {
		obj.resize(m_capacity);
		for (auto i: iterate(sindex, eindex)) {
			if (
                (patterns.exclude_strings || i.is_str()) &&
                (patterns.exclude_chars || i.is_char()) &&
                (patterns.exclude_comments || i.is_comment()) &&
                (patterns.exclude_escaped || (i.index == 0 || i.prev() == '\\')) &&
                (patterns.parentheses_depth == i.parentheses_depth()) &&
                (patterns.brackets_depth == i.brackets_depth()) &&
                (patterns.curly_brackets_depth == i.curly_brackets_depth()) &&
                (patterns.template_depth == i.template_depth())
			) {
				obj.set(obj.m_len, i.character());
			} 	else if (!i.is_comment()) {
				obj.set(obj.m_len, i.character());
			}
		}
	}

	// Slice comments.
	constexpr
	void	slice_comments_h(
		This& 		obj,						// the result object.
		Len 		sindex = 0,					// the start index.
		Len 		eindex = NPos::npos		// the end index.
	) {
		obj.resize(m_capacity);
		for (auto i: iterate(sindex, eindex)) {
			if (i.is_comment()) {
				obj.set(obj.m_len, i.character());
			}
		}
	}

	// Replace double chars to a singe char.
	constexpr
	void 	replace_double_h(
		This& 			obj,						// the result object.
		const char* 	replacements,				// the replacements array with chars.
		Len 			sindex = 0,					// the start index.
		Len 			eindex = NPos::npos,		// the end index.
        const code_patterns& patterns = {false, false, false, false, -1, -1, -1, -1} // Exclude patterns.
	) {
		// auto len = vlib::len(replacements);
		bool found;
		obj.resize(m_capacity);
		const char* r;
		for (auto i: iterate(sindex, eindex)) {
			if (
                (!patterns.exclude_strings || !i.is_str()) &&
                (!patterns.exclude_chars || !i.is_char()) &&
                (!patterns.exclude_comments || !i.is_comment()) &&
                (!patterns.exclude_escaped || (i.index == 0 || i.prev() != '\\')) &&
                (patterns.parentheses_depth == -1 || patterns.parentheses_depth == i.parentheses_depth()) &&
                (patterns.brackets_depth == -1 || patterns.brackets_depth == i.brackets_depth()) &&
                (patterns.curly_brackets_depth == -1 || patterns.curly_brackets_depth == i.curly_brackets_depth()) &&
                (patterns.template_depth == -1 || patterns.template_depth == i.template_depth())
			) {
				found = false;
				r = replacements;
				while (*r) {
					if (*r == i.character() && *r == i.prev()) {
						found = true;
						break;
					}
					++r;
				}
				// for (auto& i1: range(len)) {
				// 	if (replacements[i1] == i.character() && replacements[i1] == i.prev()) {
				// 		found = true;
				// 		break;
				// 	}
				// }
				if (!found) {
					obj.set(obj.m_len, i.character());
				}
			}
			else { obj.set(obj.m_len, i.character()); }
		}
	}

	

	//
};

// ---------------------------------------------------------
// Instances.

// Is instance.
template<> 				struct is_instance<Code, Code>		{ SICEBOOL value = true;  };

// Is type.
template<typename Type> struct is_Code 					{ SICEBOOL value = false; };
template<> 				struct is_Code<Code> 			{ SICEBOOL value = true;  };

// ---------------------------------------------------------
// Shortcuts.

namespace types { namespace shortcuts {

using Code =		vlib::Code;

}; 		// End namespace sockets.
}; 		// End namespace shortcuts.

// ---------------------------------------------------------
// End.

}; 		// End namespace vlib.
#endif 	// End header.
