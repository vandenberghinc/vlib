// Author: Daan van den Bergh
// Copyright: © 2022 Daan van den Bergh.

// Header.
#ifndef VLIB_PTR_H
#define VLIB_PTR_H

// Namespace vlib.
namespace vlib {

// Static ptr struct.
struct ptr {

	// Copy pointers.
	// - Both pointers should by default be initialized with nullptr.
	template <typename Type> SICE
	void 		copy(
		Type*& 			dest,			// the destination pointer.
		const Type* 	source			// the source pointer.
	) {
		delete dest;
		if (source) {
			dest = new Type (*source);
		}
	}
	
	// Swap pointers.
	// - Both pointers should by default be initialized with nullptr.
	template <typename Type> SICE
	void 		swap(
		Type*& 			dest,			// the destination pointer.
		Type*& 			source			// the source pointer.
	) {
		delete dest;
		dest = source;
		source = nullptr;
	}
	
	// Destruct a pointer.
	// - The pointer should by default be initialized with nullptr.
	template <typename Type> SICE
	void 		destruct(
		Type*& 			ptr			// the pointer.
	) {
		delete ptr;
		ptr = nullptr;
	}

};

}; 		// End namespace vlib.
#endif 	// End header.
