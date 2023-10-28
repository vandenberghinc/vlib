// Author: Daan van den Bergh
// Copyright: © 2022 Daan van den Bergh.

// Header.
#ifndef VLIB_PERMISSION_T_H
#define VLIB_PERMISSION_T_H

// Includes.
#include <sys/stat.h>

// Namespace vlib.
namespace vlib {

// ---------------------------------------------------------
// Permission type

/* 	@docs
	@chapter: System
	@title: Permission
	@description:
		Permission type.
	@usage:
        #include <vlib/types.h>
		vlib::Permission permission(0777);
*/
struct Permission {

// ---------------------------------------------------------
// Public.
public:

	// ---------------------------------------------------------
	// Aliases.

	using 			This = 		Permission;
	using 			Type = 		short;

// ---------------------------------------------------------
// Public.
public:
	
	// ---------------------------------------------------------
	// Attributes.

	Type 	m_user;
	Type 	m_group;
	Type 	m_shared;
	Type 	m_octal;
	
	// ---------------------------------------------------------
	// Construct functions.
	
	// Copy.
	constexpr
	auto& 	copy(const This& obj) {
		m_user = obj.m_user;
		m_group = obj.m_group;
		m_shared = obj.m_shared;
		m_octal = obj.m_octal;
		return *this;
	}
	
	// Swap.
	constexpr
	auto& 	swap(This& obj) {
		m_user = obj.m_user;
		m_group = obj.m_group;
		m_shared = obj.m_shared;
		m_octal = obj.m_octal;
		return *this;
	}
	
	// ---------------------------------------------------------
	// Constructors.
	
	// Default constructor.
	constexpr
	Permission () : m_user(-1), m_group(-1), m_shared(-1), m_octal(-1) {}

	// Constructor from octal.
	/*  @docs
		@title: Constructor
		@description:
			Construct from an octal short.
		@warning:
			Causes undefined behaviour when the octal is not preceded by a `0`. For example numeric `777` is incorrect, the correct numeric would be `0777`.
		@parameter:
			@name: octal
			@description: The octal numeric indicating the permission.
		}
		@usage:
			vlib::Permission perm(0740);
	*/
	constexpr
	Permission (const Type& octal) : m_user(-1), m_group(-1), m_shared(-1), m_octal(octal) {}
	
	// Copy constructor.
	constexpr
	Permission (const This& obj) : m_user(obj.m_user), m_group(obj.m_group), m_shared(obj.m_shared), m_octal(obj.m_octal) {}
	
	// Move constructor.
	constexpr
	Permission (This&& obj) : m_user(obj.m_user), m_group(obj.m_group), m_shared(obj.m_shared), m_octal(obj.m_octal) {}
	
	// ---------------------------------------------------------
	// Assignment operators.
	
	// Copy assignment operator.
	constexpr
	auto&	operator =(const Type& octal) {
		m_user = -1;
		m_group = -1;
		m_shared = -1;
		m_octal = octal;
		return *this;
	}
	
	// Copy assignment operator.
	constexpr
	auto&	operator =(const This& obj) { return copy(obj); }
	
	// Move assignment operator.
	constexpr
	auto&	operator =(This&& obj) { return swap(obj); }
	
	// ---------------------------------------------------------
	// Functions.
	
	// Is undefined.
	/* @docs
	  @title: Is undefined
	  @description:
			Check if the object is undefined.
	  @usage:
			vlib::Permission x;
			x.is_undefined(); ==> true;
	*/
	constexpr
	bool 		is_undefined() const {
		return m_octal == -1;
	}
	
	// Reset all attributes.
	/* @docs
	  @title: Reset
	  @description:
			Reset all attributes.
	  @usage:
			vlib::Permission x = "/tmp/myfile.txt";
			x.reset().is_undefined(); ==> true;
	*/
	constexpr
	auto& 		reset() {
		m_user = -1;
		m_group = -1;
		m_shared = -1;
		m_octal = -1;
		return *this;
	}
	
	// Get the user permission.
	/* @docs
	  @title: User
	  @description:
			Get the user permission.
	  @usage:
			vlib::Permission x(0740);
			x.user(); ==> 7;
	*/
	constexpr
	auto& 		user() {
		if (m_user == -1) {
			switch (m_octal & S_IRWXU) {
				case S_IRWXU:
					m_user = 7;
					break;
				case S_IRUSR | S_IWUSR:
					m_user = 6;
					break;
				case S_IRUSR | S_IXUSR:
					m_user = 5;
					break;
				case S_IRUSR:
					m_user = 4;
					break;
				case S_IWUSR | S_IXUSR:
					m_user = 3;
					break;
				case S_IWUSR:
					m_user = 2;
					break;
				case S_IXUSR:
					m_user = 1;
					break;
				default:
					m_user = 0;
					break;
			}
		}
		return m_user;
	}
	
	// Get the group permission.
	/* @docs
	  @title: Group
	  @description:
			Get the group permission.
	  @usage:
			vlib::Permission x(0740);
			x.group(); ==> 4;
	*/
	constexpr
	auto& 		group() {
		if (m_group == -1) {
			switch (m_octal & S_IRWXG) {
				case S_IRWXG:
					m_group = 7;
					break;
				case S_IRGRP | S_IWGRP:
					m_group = 6;
					break;
				case S_IRGRP | S_IXGRP:
					m_group = 5;
					break;
				case S_IRGRP:
					m_group = 4;
					break;
				case S_IWGRP | S_IXGRP:
					m_group = 3;
					break;
				case S_IWGRP:
					m_group = 2;
					break;
				case S_IXGRP:
					m_group = 1;
					break;
				default:
					m_group = 0;
					break;
			}
		}
		return m_group;
	}
	
	// Get the shared permission.
	/* @docs
	  @title: Shared
	  @description:
			Get the shared permission.
	  @usage:
			vlib::Permission x(0740);
			x.shared(); ==> 0;
	*/
	constexpr
	auto& 		shared() {
		if (m_shared == -1) {
			switch (m_octal & S_IRWXO) {
				case S_IRWXO:
					m_shared = 7;
					break;
				case S_IROTH | S_IWOTH:
					m_shared = 6;
					break;
				case S_IROTH | S_IXOTH:
					m_shared = 5;
					break;
				case S_IROTH:
					m_shared = 4;
					break;
				case S_IWOTH | S_IXOTH:
					m_shared = 3;
					break;
				case S_IWOTH:
					m_shared = 2;
					break;
				case S_IXOTH:
					m_shared = 1;
					break;
				default:
					m_shared = 0;
					break;
			}
		}
		return m_shared;
	}
	
	// Get the octal permission.
	/* @docs
	  @title: Octal
	  @description:
			Get the octal permission.
	  @usage:
			vlib::Permission x(0740);
			x.octal(); ==> 0740;
	*/
	constexpr
	auto& 		octal() const {
		return m_octal;
	}

	// ---------------------------------------------------------
	// Casts.

	// As string.
	String		str() const {
		char* buff = new char [10];
		constexpr char chars[] = "rwxrwxrwx";
		for (ulong i = 0; i < 9; i++) {
			buff[i] = (m_octal & (1 << (8-i))) ? chars[i] : '-';
		}
		buff[9] = '\0';
		String x(buff, 9, 10);
		delete[] buff;
		return x;
	}
	
	// As "octal_t".
	operator 	Type() const {
		return m_octal;
	}
	
};

// ---------------------------------------------------------
// Instances.

// Is path type.
template<typename Type> struct is_Permission 					{ SICEBOOL value = false; };
template<> 				struct is_Permission<Permission> 			{ SICEBOOL value = true;  };

// ---------------------------------------------------------
// Shortcuts.

namespace types { namespace shortcuts {

using Permission =		vlib::Permission;

}; 		// End namespace sockets.
}; 		// End namespace shortcuts.

// ---------------------------------------------------------
// End.

}; 		// End namespace vlib.
#endif 	// End header.
