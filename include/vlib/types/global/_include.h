// Author: Daan van den Bergh
// Copyright: © 2022 Daan van den Bergh.

// ---------------------------------------------------------
// Debugging.

#ifndef DEBUG
#define DEBUG 0
#endif

// ---------------------------------------------------------
// Type definitions.

// Required for "Numeric".
#define Float float
#define Double double
#undef Float
#undef Double

// ---------------------------------------------------------
// Operating system

// Debian, Ubuntu, Gentoo, Fedora, openSUSE, RedHat, Centos and other
#if defined(__linux__)
	#define OS "linux"
	#define OSID 0

// Apple OSX and iOS (Darwin)
#elif defined(__APPLE__) && defined(__MACH__)
	#include <TargetConditionals.h>

	// Apple OSX
	#if TARGET_OS_MAC == 1
		#define OS "macos"
		#define OSID 1

	// Apple iOS
	#elif TARGET_OS_IPHONE == 1
		#define OS "ios"
		#define OSID 2

	// Apple iOS
	#elif TARGET_IPHONE_SIMULATOR == 1
		#define OS "ios"
		#define OSID 3
	#endif

// FreeBSD, NetBSD, OpenBSD, DragonFly BSD
#elif defined(__unix__) || !defined(__APPLE__) && defined(__MACH__)
	#include <sys/param.h>
	#if defined(BSD)
		#define OS "bsd"
		#define OSID 4
	#endif

// Windows
#elif defined(_WIN32) || defined(_WIN64)
	#define OS "windows"
	#define OS "windows"
	#define OSID 5

// Windows (Cygwin POSIX under Microsoft Window)
#elif defined(__CYGWIN__) && !defined(_WIN32)
	#define OS "windows"
	#define OSID 5

// Android (implies Linux)
#elif defined(__ANDROID__)
	#define OS "android"
	#define OSID 6

// HP-UX
#elif defined(__hpux)
	#define OS "hp-ux"
	#define OSID 7

// IBM AIX
#elif defined(_AIX)
	#define OS "aix"
	#define OSID 8


// Oracle Solaris, Open Indiana
#elif defined(__sun) && defined(__SVR4)
	#define OS "solaris"
	#define OSID 9

// Unknown.
#else
	#define OS "unknown"
	#define OSID -1
#endif

// Check operating system.
#if OSID != 0 && OSID != 1
	#error Operating system is not supported.
#endif

// ---------------------------------------------------------
// Standard library includes.

#include <iostream>
#include <vector>

// ---------------------------------------------------------
// Includes.

#include "errors.h"
#include "types.h"
#include "limits.h"
#include "debug.h"
#include "move.h"
#include "npos.h"
#include "math.h"
#include "len.h"
#include "sleep.h"
#include "range.h"
#include "random.h"
#include "colors.h"
#include "file.h"
#include "ptr.h"
#include "array.h"
#include "str.h"
#include "cast.h"
#include "backtrace.h"
