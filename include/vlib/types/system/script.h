// Author: Daan van den Bergh
// Copyright: © 2022 Daan van den Bergh.

// Header.
#ifndef VLIB_SCRIPT_T_H
#define VLIB_SCRIPT_T_H

// Includes.
#include <sys/stat.h>

// Namespace vlib.
namespace vlib {

// ---------------------------------------------------------
// Script type
// Beware that inherited functions from String that reset, copy or swap the Script should be made private since this will not account for the new attributes.
/* 	@docs
	@chapter: System
	@title: Script
	@description:
		Script type.
		- Automatically adds a newline after each constructor `Arg`.
		- Beware of the fact that a `Script` executed by `Proc` will be saved to `/tmp/script_$uid_XXXXXXXX` with permission `0770`, the path will be deleted upon any exit.
*/
// @TODO undefined behaviour for destructor.
struct Script : public String {

// Private.
private:

	// ---------------------------------------------------------
	// Shortcuts.

	using 		String::reconstruct;
	using 		String::copy;
	using 		String::swap;
	using 		String::operator=;
	using 		String::save;
	using 		String::load;

// Public.
public:

	// ---------------------------------------------------------
	// Aliases.
	
	using 		This = 			Script;

	// ---------------------------------------------------------
	// Shortcuts.

	using 		String::m_arr;
	using 		String::m_len;
	using 		String::m_capacity;

	// ---------------------------------------------------------
	// Attributes.

	UPtr<Path>	m_path;
	Permission	m_permission;
	
	// ---------------------------------------------------------
	// Construct functions.
	
	// Construct.
	constexpr
	This& 	script_reconstruct() {
		null_terminate();
		return *this;
	}
	template <typename... Args> constexpr
	This& 	script_reconstruct(const char* arr, Args&&... args) {
		concat_r(arr);
		append('\n');
		return script_reconstruct(args...);
	}
	template <typename Arg, typename... Args> requires (
		!is_cstr<Arg>::value &&
		(
			is_integral<Arg>::value ||
			is_CString<Arg>::value ||
			is_Pipe<Arg>::value ||
			is_String<Arg>::value
		)
	) constexpr
	This& 	script_reconstruct(const Arg& cast, Args&&... args) {
		concats_r(cast);
		append('\n');
		return script_reconstruct(args...);
	}
	template <typename... Args> constexpr
	This& 	reconstruct(Args&&... args) {
		m_len = 0;
		return script_reconstruct(args...);
	}
	
	// Copy.
	constexpr
	This&	copy(const This& obj) {
		vlib::array<char, ullong>::copy(m_arr, m_len, m_capacity, obj.m_arr, obj.m_len, obj.m_capacity);
		m_path.copy(obj.m_path);
		m_permission = obj.m_permission;
		return *this;
	}
	
	// Swap.
	constexpr
	This&	swap(This& obj) {
		vlib::array<char, ullong>::swap(m_arr, m_len, m_capacity, obj.m_arr, obj.m_len, obj.m_capacity);
		m_path.swap(obj.m_path);
		m_permission = obj.m_permission;
		return *this;
	}
	
	// ---------------------------------------------------------
	// Constructors.
	
	// Default constructor.
	constexpr
	Script() :
	String(),
	m_permission(0770) {}

	// Constructor.
	/*  @docs
		@title: Constructor
		@description:
			Construct a script object.
		@notes:
			- Automatically adds a newline after each `Arg`.
		@parameter:
			@name: arg
			@description: The first argument.
		}
		@parameter:
			@name: args
			@description: The other arguments.
		}
		@usage:
			vlib::Script script("setopt -e", "echo Hello World!);
		@funcs: 2
	*/
	template <typename... Args> constexpr
	Script (const char* arg, Args&&... args) :
	String(),
	m_permission(0770)
	{
		script_reconstruct(arg, args...);
	}
	template <typename Arg, typename... Args> requires (
		!is_cstr<Arg>::value &&
		(
			is_integral<Arg>::value ||
			is_CString<Arg>::value ||
			is_Pipe<Arg>::value ||
			is_String<Arg>::value
		)
	) constexpr
	Script (const Arg& arg, Args&&... args) :
	String(),
	m_permission(0770)
	{
		script_reconstruct(arg, args...);
	}

	// Copy constructor.
	constexpr
	Script (const This& obj)
	: String() { copy(obj); }

	// Move constructor.
	constexpr
	Script (This&& obj)
	: String() { swap(obj); }

	// ---------------------------------------------------------
	// Assignment operators.
	
	// Copy assignment operator.
	constexpr
	This&	operator=(const This& obj) { return copy(obj); }
	
	// Move assignment operator.
	constexpr
	This&	operator=(This&& obj) { return swap(obj); }
	
	// ---------------------------------------------------------
	// Properties.
	
	// Path.
	/* @docs
	  @title: Path
	  @description:
			Get the path of the script by reference.
	*/
	constexpr
	auto&	path() { return *m_path;	}
	constexpr
	auto&	path() const { return *m_path;	}

	// Permission.
	/* @docs
	  @title: Permission
	  @description:
			Get the permission of the script by reference.
	*/
	constexpr
	auto&	permission() { return m_permission;	}
	constexpr
	auto&	permission() const { return m_permission;	}
	
	// ---------------------------------------------------------
	// Functions.

	// Copy the object.
	/* @docs
	  @title: Copy
	  @description: Copy the data of the array to a new array.
	*/
	constexpr
	This 	copy() {
		return *this;
	}
	constexpr
	This 	copy() const {
		return *this;
	}

	// Reset.
	/* 	@docs
		@title: Reset
		@description: Reset all attributes.
	*/
	constexpr
	This&	reset() {
		m_len = 0;
		if (m_arr) { m_arr[m_len] = '\0'; }
		m_path.reset();
		return *this;
	}

	// Save.
	/* 	@docs
		@title: Save
		@description: Save the script to the assigned path.
	*/
	auto& 	save() const {
		if (m_path.is_undefined()) { throw InvalidUsageError("You must define the path of the script with \"path() = ...\"."); }
		save(m_path->c_str());
		return *this;
	}
	auto& 	save(const Permission& permission) const {
		if (m_path.is_undefined()) { throw InvalidUsageError("You must define the path of the script with \"path() = ...\"."); }
		save(m_path->c_str());
		::chmod(m_path->c_str(), (ushort) permission.octal());
		return *this;
	}
	auto& 	save(const char* path, const Permission& permission) const {
		save(path);
		::chmod(path, (ushort) permission.octal());
		return *this;
	}

	// Remove.
	/* 	@docs
		@title: Remove
		@description: Remove the script's path.
	*/
	void 	remove() const {
		if (m_path.is_undefined()) { throw InvalidUsageError("You must define the path of the script with \"path() = ...\"."); }
		File::remove(m_path->c_str());
	}

	// ---------------------------------------------------------
	// Casts.

	// Get as String.
	/* @docs
	  @title: str
	  @description:
			Get as `String`.
	  @usage:
			vlib::Script x(...);
			vlib::String y = x.str();
	*/
	constexpr
	String	str() const {
		return *this;
	}
	
};

// ---------------------------------------------------------
// Instances.

// Is type.
template<typename Type> struct is_Script 						{ SICEBOOL value = false; };
template<> 				struct is_Script<Script> 			{ SICEBOOL value = true;  };

// ---------------------------------------------------------
// Shortcuts.

namespace types { namespace shortcuts {

using Script =		vlib::Script;

}; 		// End namespace sockets.
}; 		// End namespace shortcuts.

// ---------------------------------------------------------
// End.

}; 		// End namespace vlib.
#endif 	// End header.
