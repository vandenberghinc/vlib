// Author: Daan van den Bergh
// Copyright: © 2022 Daan van den Bergh.

// Header.
#ifndef VLIB_CAST_H
#define VLIB_CAST_H

// Namespace vlib.
namespace vlib {

// ---------------------------------------------------------
// Cast to bool.

// Cast from string.
inline constexpr
void 	to_bool_r(bool& value, const char* arr, ullong len) {
	if (
		(len == 4 && arr[0] == 't' && arr[1] == 'r' && arr[2] == 'u' && arr[3] == 'e') ||
		(len == 4 && arr[0] == 'T' && arr[1] == 'R' && arr[2] == 'U' && arr[3] == 'E') ||
		(len == 1 && arr[0] == '1')
	) {
		value = true;
	} else {
		value = false;
	}
}
inline constexpr
void 	to_bool_r(bool& value, const char* arr) {
	return to_bool_r(value, arr, vlib::len(arr));
}

// Cast with return.
/* 	@docs {
	@chapter: casts
	@title: To bool
	@description:
		Cast to a bool.
	@usage:
        #include <vlib/types.h>
		vlib::to_bool("true") ==> true;
		vlib::to_bool("false") ==> false;
} */
template <typename... Args> inline constexpr
bool 	to_bool(Args&&... args) {
	bool value;
	to_bool_r(value, args...);
	return value;
}

// ---------------------------------------------------------
// Cast to char.

// Cast from a single digit [0/9].
template <typename Type> requires (is_short<Type>::value || is_any_integer<Type>::value) inline constexpr
void 	to_char_r(char& value, const Type& digit) {
	switch (digit) {
		case 0: { value = '0'; break; }
		case 1: { value = '1'; break; }
		case 2: { value = '2'; break; }
		case 3: { value = '3'; break; }
		case 4: { value = '4'; break; }
		case 5: { value = '5'; break; }
		case 6: { value = '6'; break; }
		case 7: { value = '7'; break; }
		case 8: { value = '8'; break; }
		case 9: { value = '9'; break; }
		default: {
			std::cerr << "Error digit: " << digit << "\n";
			throw std::runtime_error("Invalid usage, the digit must be between 0 & 9.");
		}
	}
}

// Cast with return.
/* 	@docs {
 *	@chapter: casts
 *	@title: To char
 *	@description:
 *		Cast to a char.
 *		- Currently only supports casts from a single digit [0..9].
 *	@usage:
 *      #include <vlib/types.h>
 *		vlib::to_char(0) ==> '0';
 *		vlib::to_char(9) ==> '9';
 *		vlib::to_char(100) ==> '0'; // ERROR: the digit's range is [0..9].
 *	@funcs: 2
} */
template 		<typename... Args> inline constexpr
char	to_char(Args&&... args) {
	char value;
	to_char_r(value, args...);
	return value;
}

// ---------------------------------------------------------
// Cast to digit.

// Cast from char to digit.
short to_digit(char c) {
    switch (c) {
        case '0': { return 0; }
        case '1': { return 1; }
        case '2': { return 2; }
        case '3': { return 3; }
        case '4': { return 4; }
        case '5': { return 5; }
        case '6': { return 6; }
        case '7': { return 7; }
        case '8': { return 8; }
        case '9': { return 9; }
        default:
            printf("Error char: [%c]\n", c);
            throw std::runtime_error("Invalid usage, the char must be [0, 1, 2, 3, 4, 5, 6, 7, 8].");
    }
}

// ---------------------------------------------------------
// Octal casts.

// Cast numeric to octal.
// WARNING: Still experimental.
int to_octal(int decimal) {
    int octal = 0;
    int place = 1;
    while (decimal > 0) {
        int remainder = decimal % 8;
        octal += remainder * place;
        decimal /= 8;
        place *= 10;
    }
    return octal;
}

// Cast octal to numeric.
// WARNING: Still experimental.
int from_octal(int octal) {
    int decimal = 0;
    int power = 0;
    while (octal > 0) {
        int digit = octal % 10;
        decimal += digit * pow(8, power);
        octal /= 10;
        ++power;
    }
    return decimal;
}

// ---------------------------------------------------------
// Numeric casts.

// Cast from string.
// Valid strings [true, TRUE, false, FALSE, 0...9].
template <typename Cast> requires (is_any_numeric<Cast>::value) inline constexpr
void 	to_num_r(Cast& value, const char* arr, ullong len) {
	if (arr == nullptr) {
		value = 0;
		return;
	}
	else if (
		(len == 4 && arr[0] == 't' && arr[1] == 'r' && arr[2] == 'u' && arr[3] == 'e') ||
		(len == 4 && arr[0] == 'T' && arr[1] == 'R' && arr[2] == 'U' && arr[3] == 'E')
	) {
		value = 1;
		return;
	}
	else if (
		(len == 5 && arr[0] == 'f' && arr[1] == 'a' && arr[2] == 'l' && arr[3] == 's' && arr[4] == 'e') ||
		(len == 5 && arr[0] == 'F' && arr[1] == 'A' && arr[2] == 'L' && arr[3] == 'S' && arr[4] == 'E')
	) {
		value = 0;
		return;
	}
	double d = 0;
	int p = 0;
	bool startdot = false;
	bool dot = false;
	bool neg = false;
	for (ullong i = 0; i < len; ++i) {
		switch (arr[i]) {
			case '.': { dot = true; continue; }
			case '-': { neg = true; continue; }
			case '0': {
				if (dot) {
					if (d == 0) { d = (Cast) 0.1; startdot = true; ++p; continue; }
					else { d = (Cast) ((d * pow(10, p)) + 0.0) / (Cast) pow(10, p); ++p; continue; }
				} else {
					if (d == 0) { d = 0; continue; }
					else { d *= 10; d += 0;continue; }
				}
			}
			case '1': {
				if (dot) {
					if (d == 0) { d = (Cast) 0.1; ++p; continue; }
					else { d = (Cast) ((d * pow(10, p)) + 0.1) / (Cast) pow(10, p); ++p; continue; }
				} else {
					if (d == 0) { d = 1; continue; }
					else { d *= 10; d += 1; continue; }
				}
			}
			case '2': {
				if (dot) {
					if (d == 0) { d = (Cast) 0.2; ++p; continue; }
					else { d = (Cast) ((d * pow(10, p)) + 0.2) / (Cast) pow(10, p); ++p; continue; }
				} else {
					if (d == 0) { d = 2; continue; }
					else { d *= 10; d += 2; continue; }
				}
			}
			case '3': {
				if (dot) {
					if (d == 0) { d = (Cast) 0.3; ++p; continue; }
					else { d = (Cast) ((d * pow(10, p)) + 0.3) / (Cast) pow(10, p); ++p; continue; }
				} else {
					if (d == 0) { d = 3; continue; }
					else { d *= 10; d += 3; continue; }
				}
			}
			case '4': {
				if (dot) {
					if (d == 0) { d = (Cast) 0.4; ++p; continue; }
					else { d = (Cast) ((d * pow(10, p)) + 0.4) / (Cast) pow(10, p); ++p; continue; }
				} else {
					if (d == 0) { d = 4; continue; }
					else { d *= 10; d += 4; continue; }
				}
			}
			case '5': {
				if (dot) {
					if (d == 0) { d = (Cast) 0.5; ++p; continue; }
					else { d = (Cast) ((d * pow(10, p)) + 0.5) / (Cast) pow(10, p); ++p; continue; }
				} else {
					if (d == 0) { d = 5; continue; }
					else { d *= 10; d += 5; continue; }
				}
			}
			case '6': {
				if (dot) {
					if (d == 0) { d = (Cast) 0.6; ++p; continue; }
					else { d = (Cast) ((d * pow(10, p)) + 0.6) / (Cast) pow(10, p); ++p; continue; }
				} else {
					if (d == 0) { d = 6; continue; }
					else { d *= 10; d += 6; continue; }
				}
			}
			case '7': {
				if (dot) {
					if (d == 0) { d = (Cast) 0.7; ++p; continue; }
					else { d = (Cast) ((d * pow(10, p)) + 0.7) / (Cast) pow(10, p); ++p; continue; }
				} else {
					if (d == 0) { d = 7; continue; }
					else { d *= 10; d += 7; continue; }
				}
			}
			case '8': {
				if (dot) {
					if (d == 0) { d = (Cast) 0.8; ++p; continue; }
					else { d = (Cast) ((d * pow(10, p)) + 0.8) / (Cast) pow(10, p); ++p; continue; }
				} else {
					if (d == 0) { d = 8; continue; }
					else { d *= 10; d += 8; continue; }
				}
			}
			case '9': {
				if (dot) {
					if (d == 0) { d = (Cast) 0.9; ++p; continue; }
					else { d = (Cast) ((d * pow(10, p)) + 0.9) / (Cast) pow(10, p); ++p; continue; }
				} else {
					if (d == 0) { d = 9; continue; }
					else { d *= 10; d += 9; continue; }
				}
			}
			default: continue;
		}
	}
	if (startdot) { d -= (Cast) 0.1; }
	if (neg) { d = -d; }
	value = (Cast) d;
}
template <typename Cast> requires (is_any_numeric<Cast>::value) inline constexpr
void 	to_num_r(Cast& value, const char* arr) {
	to_num_r(value, arr, vlib::len(arr));
}

// Cast with return.
/* 	@docs {
	@chapter: casts
	@title: To numeric
	@description:
		Cast to any numeric.
	@usage:
        #include <vlib/types.h>
		vlib::to_num<int>("1") ==> 1;
} */
template 		<typename Cast, typename... Args> inline constexpr
Cast	to_num(Args&&... args) {
	Cast value;
	to_num_r(value, args...);
	return value;
}

// ---------------------------------------------------------
// String casts.

// - Null termination is handled internally, therefore "null_terminate()" should never have to be called, unless you edit attribute "m_arr".
template <typename String, typename... Args> inline constexpr
void 	to_str_r(String& value, Args&&... args) {
	value.concats_r(args...);
}

// ---------------------------------------------------------
// Hex casts.

// Converts an integer value to its hex character*/
char    to_hex(char code) {
  static constexpr const char hex_chars[] = "0123456789ABCDEF";
  return hex_chars[code & 15];
}

/* Converts an integer value to its hex character*/
uint	to_hex(char* hex, ullong value) {
	static constexpr const char hex_chars[] = "0123456789ABCDEF";
	
	// Create tmp hex.
	int i = 0;
	char* tmp = new char [17];
	do {
		tmp[i++] = hex_chars[value & 0xF];
		value >>= 4;
	} while (value != 0);
	uint len = (uint) i;
	
	// Reverse the characters
	int j = 0;
	for (int i = len - 1; i >= 0; i--) {
		hex[j++] = tmp[i];
	}
	hex[j] = '\0';
	delete[] tmp;
	return len;
}

// To hex with string.
String	to_hex(ullong value);
void	to_hex_r(String& hex, ullong value);

// Converts a hex character to its integer value.
char 	from_hex(char ch) {
  return isdigit(ch) ? ch - '0' : lowercase(ch) - 'a' + 10;
}

// Hexadecimal string to numeric.
constexpr
llong   from_hex(const char* hex, ullong len) {
	ullong base = 1;
	ullong dec_val = 0;
	for (llong i = len - 1; i >= 0; i--) {
		char c = uppercase(hex[i]);
		if (c >= '0' && c <= '9') {
			dec_val += (ullong(c) - 48) * base;
			base = base * 16;
		}
		else if (c >= 'A' && c <= 'F') {
			dec_val += (ullong(c) - 55) * base;
			base = base * 16;
		}
	}
    return dec_val;
}

// From hex.
ullong	from_hex(const String& hex);
void	from_hex_r(ullong& value, const String& hex);

// ---------------------------------------------------------
// End.

}; 		// End namespace vlib.
#endif 	// End header.

