// Author: Daan van den Bergh
// Copyright: © 2022 Daan van den Bergh.

// Header.
#ifndef VLIB_PACK_H
#define VLIB_PACK_H

// Namespace vlib.
namespace vlib {

// Pack type.
template <typename... Packs>
struct Pack {};

// Pack type 1.
template <typename T0, typename T1, typename... Packs>
struct Pack<T0, T1, Packs...> {
	T0 	value_0;
	T1 	value_1;
};

// Pack type 2.
template <typename T0, typename T1, typename T2>
struct Pack<T0, T1, T2> {
	T0 	value_0;
	T1 	value_1;
	T2 	value_2;
};

// Pack type 3.
template <typename T0, typename T1, typename T2, typename T3>
struct Pack<T0, T1, T2, T3> {
	T0 	value_0;
	T1 	value_1;
	T2 	value_2;
	T3 	value_3;
};

// Pack type 4.
template <typename T0, typename T1, typename T2, typename T3, typename T4>
struct Pack<T0, T1, T2, T3, T4> {
	T0 	value_0;
	T1 	value_1;
	T2 	value_2;
	T3 	value_3;
	T4 	value_4;
};

// Pack type 5.
template <typename T0, typename T1, typename T2, typename T3, typename T4, typename T5>
struct Pack<T0, T1, T2, T3, T4, T5> {
	T0 	value_0;
	T1 	value_1;
	T2 	value_2;
	T3 	value_3;
	T4 	value_4;
	T5 	value_5;
};

// Pack type 6.
template <typename T0, typename T1, typename T2, typename T3, typename T4, typename T5, typename T6>
struct Pack<T0, T1, T2, T3, T4, T5, T6> {
	T0 	value_0;
	T1 	value_1;
	T2 	value_2;
	T3 	value_3;
	T4 	value_4;
	T5 	value_5;
	T6 	value_6;
};

// Pack type 7.
template <typename T0, typename T1, typename T2, typename T3, typename T4, typename T5, typename T6, typename T7>
struct Pack<T0, T1, T2, T3, T4, T5, T6, T7> {
	T0 	value_0;
	T1 	value_1;
	T2 	value_2;
	T3 	value_3;
	T4 	value_4;
	T5 	value_5;
	T6 	value_6;
	T7 	value_7;
};

// Pack type 8.
template <typename T0, typename T1, typename T2, typename T3, typename T4, typename T5, typename T6, typename T7, typename T8>
struct Pack<T0, T1, T2, T3, T4, T5, T6, T7, T8> {
	T0 	value_0;
	T1 	value_1;
	T2 	value_2;
	T3 	value_3;
	T4 	value_4;
	T5 	value_5;
	T6 	value_6;
	T7 	value_7;
	T8 	value_8;
};

// Pack type 8.
template <typename T0, typename T1, typename T2, typename T3, typename T4, typename T5, typename T6, typename T7, typename T8, typename T9>
struct Pack<T0, T1, T2, T3, T4, T5, T6, T7, T8, T9> {
	T0 	value_0;
	T1 	value_1;
	T2 	value_2;
	T3 	value_3;
	T4 	value_4;
	T5 	value_5;
	T6 	value_6;
	T7 	value_7;
	T8 	value_8;
	T9 	value_9;
};

// ---------------------------------------------------------
// Shortcuts.

namespace types { namespace shortcuts {

}; 		// End namespace sockets.
}; 		// End namespace shortcuts.

// ---------------------------------------------------------
// End.

}; 		// End namespace vlib.
#endif 	// End header.
