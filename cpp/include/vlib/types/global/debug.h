// Author: Daan van den Bergh
// Copyright: © 2022 Daan van den Bergh.

// Header.
#ifndef VLIB_DEBUG_H
#define VLIB_DEBUG_H

// Namespace vlib.
namespace vlib {

// Enable or disable funccall
#ifndef VLIB_FUNCCALL
#define VLIB_FUNCCALL 1
#endif

// Static debug struct.
struct debug {

	// Function call for debugging.
	// Still advised to comment & uncomment using replace all.
	#if VLIB_FUNCCALL == 1
		static inline
		void 	func(
			const char* 	path = 		__builtin_FILE(),
			int 			line = 		__builtin_LINE(),
			const char* 	func = 		__builtin_FUNCTION()
		) {
			std::cout << path << ":" << line << ":" << func << "\n";
		}
	#else
		SICE void func() {}
	#endif

}; 		// End struct debug.
}; 		// End namespace vlib.
#endif 	// End header.
