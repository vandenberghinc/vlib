// Author: Daan van den Bergh
// Copyright: © 2022 Daan van den Bergh.
/* Notes:
  - The "is_..." 	 is reserved for integral types.
  - The "is_..._t" is used for created types.
*/

// Header.
#ifndef VLIB_TYPES_H
#define VLIB_TYPES_H

// Namespace vlib.
namespace vlib {

#define SICE static inline constexpr
#define SCE static constexpr
#define SICEBOOL static inline constexpr bool

// ---------------------------------------------------------
// Type definitions.

typedef unsigned char		uchar;
typedef unsigned short		ushort;
typedef unsigned int		uint;
typedef long long 			llong;
typedef unsigned long 		ulong;
typedef unsigned long long 	ullong;
typedef long double 		ldouble;

// ---------------------------------------------------------
// Is integral type.

// Is shared type.
template<typename Type> 		struct is_integral 								{ SICEBOOL value = false; };

template<> 						struct is_integral<bool> 						{ SICEBOOL value = true;  };
template<> 						struct is_integral<char> 						{ SICEBOOL value = true;  };
template<> 						struct is_integral<uchar> 				{ SICEBOOL value = true;  };
template<> 						struct is_integral<short> 						{ SICEBOOL value = true;  };
template<> 						struct is_integral<ushort> 				{ SICEBOOL value = true;  };
template<> 						struct is_integral<int> 						{ SICEBOOL value = true;  };
template<> 						struct is_integral<uint> 				{ SICEBOOL value = true;  };
template<> 						struct is_integral<long> 						{ SICEBOOL value = true;  };
template<> 						struct is_integral<ulong> 				{ SICEBOOL value = true;  };
template<> 						struct is_integral<long long> 					{ SICEBOOL value = true;  };
template<> 						struct is_integral<ullong> 			{ SICEBOOL value = true;  };
template<> 						struct is_integral<float> 						{ SICEBOOL value = true;  };
template<> 						struct is_integral<double> 						{ SICEBOOL value = true;  };
template<> 						struct is_integral<long double> 				{ SICEBOOL value = true;  };

// ---------------------------------------------------------
// Is true.

// Is shared type.
template<bool X> 				struct is_true 								{};
template<> 						struct is_true<true> 						{ SICEBOOL value = true;   };
template<> 						struct is_true<false> 						{ SICEBOOL value = false;  };

// ---------------------------------------------------------
// Is nullptr.

// Is type.
template<typename Type> 		struct is_nullptr 							{ SICEBOOL value = false;  };
template<> 						struct is_nullptr<std::nullptr_t> 						{ SICEBOOL value = true;  };

// ---------------------------------------------------------
// Short (integral type).

// Is short.
template<typename Type> 		struct is_short 							{ SICEBOOL value = false;  };
template<> 						struct is_short<short> 						{ SICEBOOL value = true;  };

// ---------------------------------------------------------
// Bool (integral type).

template<typename Type> 		struct is_bool 								{ SICEBOOL value = false; };
template<> 						struct is_bool<bool> 						{ SICEBOOL value = true;  };

// ---------------------------------------------------------
// Signed char (integral type).

template<typename Type> 		struct is_char 								{ SICEBOOL value = false; };
template<> 						struct is_char<char> 						{ SICEBOOL value = true;  };

// ---------------------------------------------------------
// Unnsigned char (integral type).
template<typename Type> 		struct is_uchar 							{ SICEBOOL value = false; };
template<> 						struct is_uchar<uchar> 				{ SICEBOOL value = true;  };

// ---------------------------------------------------------
// Signed int (integral type).
template<typename Type> 		struct is_int 								{ SICEBOOL value = false; };
template<> 						struct is_int<int> 							{ SICEBOOL value = true;  };

// ---------------------------------------------------------
// Unsigned int (integral type).
template<typename Type> 		struct is_uint 								{ SICEBOOL value = false; };

// ---------------------------------------------------------
// Is any integral integer type.

// Is any int.
template<typename Type> 		struct is_any_integer 								{ SICEBOOL value = false; };
template<> 						struct is_any_integer<short> 						{ SICEBOOL value = true;  };
template<> 						struct is_any_integer<ushort> 				{ SICEBOOL value = true;  };
template<> 						struct is_any_integer<int> 							{ SICEBOOL value = true;  };
template<> 						struct is_any_integer<uint> 				{ SICEBOOL value = true;  };
template<> 						struct is_any_integer<long> 						{ SICEBOOL value = true;  };
template<> 						struct is_any_integer<ulong> 				{ SICEBOOL value = true;  };
template<> 						struct is_any_integer<long long> 					{ SICEBOOL value = true;  };
template<> 						struct is_any_integer<ullong> 			{ SICEBOOL value = true;  };

// Is signed any int.
template<typename Type> 		struct is_signed_numeric 						{ SICEBOOL value = false; };
template<> 						struct is_signed_numeric<short> 				{ SICEBOOL value = true;  };
template<> 						struct is_signed_numeric<int> 					{ SICEBOOL value = true;  };
template<> 						struct is_signed_numeric<long> 					{ SICEBOOL value = true;  };
template<> 						struct is_signed_numeric<long long> 			{ SICEBOOL value = true;  };

// Is unsigned any int.
template<typename Type> 		struct is_unsigned_numeric 							{ SICEBOOL value = false; };
template<> 						struct is_unsigned_numeric<ushort> 			{ SICEBOOL value = true;  };
template<> 						struct is_unsigned_numeric<uint> 			{ SICEBOOL value = true;  };
template<> 						struct is_unsigned_numeric<ulong> 			{ SICEBOOL value = true;  };
template<> 						struct is_unsigned_numeric<ullong> 		{ SICEBOOL value = true;  };

// ---------------------------------------------------------
// Float (integral type).

// Is float.
template<typename Type> 		struct is_float 							{ SICEBOOL value = false; };
template<> 						struct is_float<float> 						{ SICEBOOL value = true;  };

// ---------------------------------------------------------
// Double (integral type).

// Is double.
template<typename Type> 		struct is_double 							{ SICEBOOL value = false; };
template<> 						struct is_double<double> 					{ SICEBOOL value = true;  };
template<> 						struct is_double<long double> 				{ SICEBOOL value = true;  };

// ---------------------------------------------------------
// Is any floating integral type.

template<typename Type> 		struct is_floating 						{ SICEBOOL value = false; };
template<> 						struct is_floating<float> 				{ SICEBOOL value = true;  };
template<> 						struct is_floating<double> 				{ SICEBOOL value = true;  };
template<> 						struct is_floating<long double> 			{ SICEBOOL value = true;  };

// ---------------------------------------------------------
// Long (integral type).

// Is long.
template<typename Type> 		struct is_long 								{ SICEBOOL value = false; };
template<> 						struct is_long<long> 						{ SICEBOOL value = true;  };

// Is long.
template<typename Type> 		struct is_llong 								{ SICEBOOL value = false; };
template<> 						struct is_llong<long long> 					{ SICEBOOL value = true;  };

// Is ulong.
template<typename Type> 		struct is_ulong 								{ SICEBOOL value = false; };
template<> 						struct is_ulong<ulong> 					{ SICEBOOL value = true;  };
// Is ulong.
template<typename Type> 		struct is_ullong 								{ SICEBOOL value = false; };
template<> 						struct is_ullong<ullong> 			{ SICEBOOL value = true;  };

// ---------------------------------------------------------
// Is any integral numeric type.

template<typename Type> 		struct is_any_numeric 							{ SICEBOOL value = false; };
template<> 						struct is_any_numeric<short> 					{ SICEBOOL value = true;  };
template<> 						struct is_any_numeric<int> 						{ SICEBOOL value = true;  };
template<> 						struct is_any_numeric<float> 					{ SICEBOOL value = true;  };
template<> 						struct is_any_numeric<double> 					{ SICEBOOL value = true;  };
template<> 						struct is_any_numeric<long double> 				{ SICEBOOL value = true;  };
template<> 						struct is_any_numeric<long> 			{ SICEBOOL value = true;  };
template<> 						struct is_any_numeric<long long> 				{ SICEBOOL value = true;  };
template<> 						struct is_any_numeric<ushort> 					{ SICEBOOL value = true;  };
template<> 						struct is_any_numeric<uint> 					{ SICEBOOL value = true;  };
template<> 						struct is_any_numeric<ulong> 		{ SICEBOOL value = true;  };
template<> 						struct is_any_numeric<ullong> 					{ SICEBOOL value = true;  };

// ---------------------------------------------------------
// Signed (integral type).
//
// Only types that can be either signed or unsigned are included in the "is_signed" and "is_unsigned" instance checks.
//

// Is signed.
template<typename Type> 		struct is_signed 							{ SICEBOOL value = false; };
template<> 						struct is_signed<int> 						{ SICEBOOL value = true;  };
template<> 						struct is_signed<char> 						{ SICEBOOL value = true;  };
template<> 						struct is_signed<long> 						{ SICEBOOL value = true;  };
template<> 						struct is_signed<long long> 				{ SICEBOOL value = true;  };

// ---------------------------------------------------------
// Unsigned (integral type).
//
// Only types that can be either signed or unsigned are included in the "is_signed" and "is_unsigned" instance checks.
//

// Is unsigned.
template<typename Type> 		struct is_unsigned 									{ SICEBOOL value = false; };
template<> 						struct is_unsigned<uint> 					{ SICEBOOL value = true;  };
template<> 						struct is_unsigned<uchar> 					{ SICEBOOL value = true;  };
template<> 						struct is_unsigned<ulong> 					{ SICEBOOL value = true;  };
template<> 						struct is_unsigned<ullong> 				{ SICEBOOL value = true;  };

// ---------------------------------------------------------
// String.

// Is cstr.
template<typename Type> 	 	struct is_cstr 								{ SICEBOOL value = false; };
template<> 						struct is_cstr<const char*> 				{ SICEBOOL value = true;  };

// Is str.
template<typename Type> 	 	struct is_str 								{ SICEBOOL value = false; };
template<> 						struct is_str<char*> 				{ SICEBOOL value = true;  };

// ---------------------------------------------------------
// Const.

// Is const.
template<typename Type> 		struct is_const 							{ SICEBOOL value = false; };
template<typename Type>			struct is_const<const Type> 				{ SICEBOOL value = true;  };
template<typename Type>			struct is_const<const Type&> 				{ SICEBOOL value = true;  };
template<typename Type>			struct is_const<const Type&&>				{ SICEBOOL value = true;  };
template<typename Type>			struct is_const<const Type*>				{ SICEBOOL value = true;  };
template<typename Type>     	struct is_const<const Type**>          		{ SICEBOOL value = true;  };

// Is const type.
template<typename Type>
using is_const_t = is_const<Type>;

// ---------------------------------------------------------
// Pointer.

// Is pointer.
template<typename Type> 		struct is_ptr 								{ SICEBOOL value = false; };
template<typename Type>			struct is_ptr<Type*>					{ SICEBOOL value = true;  };
template<typename Type>     	struct is_ptr<Type**>          { SICEBOOL value = true;  };
template<typename Type>			struct is_ptr<const Type*>					{ SICEBOOL value = true;  };
template<typename Type>     	struct is_ptr<const Type**>          { SICEBOOL value = true;  };
template<typename Type>			struct is_ptr<Type*&>					{ SICEBOOL value = true;  };
template<typename Type>     	struct is_ptr<Type**&>          { SICEBOOL value = true;  };
template<typename Type>			struct is_ptr<const Type*&>					{ SICEBOOL value = true;  };
template<typename Type>     	struct is_ptr<const Type**&>          { SICEBOOL value = true;  };

// ---------------------------------------------------------
// Forwards type.

struct 							Forwards 										{ SICEBOOL value = true;  };

// Is type.
template<typename Type> 		struct is_Forwards 								{ SICEBOOL value = false; };
template<> 						struct is_Forwards<Forwards> 					{ SICEBOOL value = true;  };

// ---------------------------------------------------------
// Backwards type.

struct 							Backwards 										{ SICEBOOL value = false; };

// Is type.
template<typename Type> 		struct is_Backwards 							{ SICEBOOL value = false; };
template<> 						struct is_Backwards<Backwards> 				{ SICEBOOL value = true;  };

// ---------------------------------------------------------
// Unique type.

struct 							Unique 										{ SICEBOOL value = true;  };

// Is type.
template<typename Type> 		struct is_Unique 								{ SICEBOOL value = false; };
template<> 						struct is_Unique<Unique> 					{ SICEBOOL value = true;  };

// ---------------------------------------------------------
// Shared type.

struct 							Shared 										{ SICEBOOL value = false; };

// Is type.
template<typename Type> 		struct is_Shared 								{ SICEBOOL value = false; };
template<> 						struct is_Shared<Shared> 					{ SICEBOOL value = true;  };

// ---------------------------------------------------------
// Is instance.

// Only supports the non const lvalue of the type.
template<typename X, typename Y> 	struct is_instance 												{ SICEBOOL value = false; };
template<> 							struct is_instance<bool, bool> 					{ SICEBOOL value = true;  };
template<> 							struct is_instance<int, int> 					{ SICEBOOL value = true;  };
template<> 							struct is_instance<uint, uint> 					{ SICEBOOL value = true;  };
template<> 							struct is_instance<char, char> 					{ SICEBOOL value = true;  };
template<> 							struct is_instance<uchar, uchar> 					{ SICEBOOL value = true;  };
template<> 							struct is_instance<float, float> 					{ SICEBOOL value = true;  };
template<> 							struct is_instance<double, double> 					{ SICEBOOL value = true;  };
template<> 							struct is_instance<ldouble, ldouble> 					{ SICEBOOL value = true;  };
template<> 							struct is_instance<long, long> 					{ SICEBOOL value = true;  };
template<> 							struct is_instance<ulong, ulong> 					{ SICEBOOL value = true;  };
template<> 							struct is_instance<llong, llong> 					{ SICEBOOL value = true;  };
template<> 							struct is_instance<ullong, ullong> 					{ SICEBOOL value = true;  };
template<> 							struct is_instance<Forwards, Forwards> 					{ SICEBOOL value = true;  };
template<> 							struct is_instance<Backwards, Backwards> 					{ SICEBOOL value = true;  };
template<> 							struct is_instance<Unique, Unique> 					{ SICEBOOL value = true;  };
template<> 							struct is_instance<Shared, Shared> 					{ SICEBOOL value = true;  };

// ---------------------------------------------------------
// Shortcuts.

namespace types { namespace shortcuts {

using uchar = vlib::uchar;
using ushort = vlib::ushort;
using uint = vlib::uint;
using llong = vlib::llong;
using ulong = vlib::ulong;
using ullong = vlib::ullong;
using ldouble = vlib::ldouble;
using Forwards = vlib::Forwards;
using Backwards = vlib::Backwards;

}; 		// End namespace types.
}; 		// End namespace shortcuts.


}; 		// End namespace vlib.
#endif 	// End header.
