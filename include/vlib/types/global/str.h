// Author: Daan van den Bergh
// Copyright: © 2022 Daan van den Bergh.

// Header.
#ifndef VLIB_STR_H
#define VLIB_STR_H

// Namespace vlib.
namespace vlib {

// Convert a char to uppercase.
constexpr
char	uppercase(char c) {
	switch (c) {
	case 'a': return 'A';
	case 'b': return 'B';
	case 'c': return 'C';
	case 'd': return 'D';
	case 'e': return 'E';
	case 'f': return 'F';
	case 'g': return 'G';
	case 'h': return 'H';
	case 'i': return 'I';
	case 'j': return 'J';
	case 'k': return 'K';
	case 'l': return 'L';
	case 'm': return 'M';
	case 'n': return 'N';
	case 'o': return 'O';
	case 'p': return 'P';
	case 'q': return 'Q';
	case 'r': return 'R';
	case 's': return 'S';
	case 't': return 'T';
	case 'u': return 'U';
	case 'v': return 'V';
	case 'w': return 'W';
	case 'x': return 'X';
	case 'y': return 'Y';
	case 'z': return 'Z';
	default: return c;
	}
}

// Convert a char to lowercase.
constexpr
char	lowercase(char c) {
	switch (c) {
	case 'A': return 'a';
	case 'B': return 'b';
	case 'C': return 'c';
	case 'D': return 'd';
	case 'E': return 'e';
	case 'F': return 'f';
	case 'G': return 'g';
	case 'H': return 'h';
	case 'I': return 'i';
	case 'J': return 'j';
	case 'K': return 'k';
	case 'L': return 'l';
	case 'M': return 'm';
	case 'N': return 'n';
	case 'O': return 'o';
	case 'P': return 'p';
	case 'Q': return 'q';
	case 'R': return 'r';
	case 'S': return 's';
	case 'T': return 't';
	case 'U': return 'u';
	case 'V': return 'v';
	case 'W': return 'w';
	case 'X': return 'x';
	case 'Y': return 'y';
	case 'Z': return 'z';
	default: return c;
	}
}

// Converts a hex character to its integer value.
char 	from_hex(char ch) {
  return isdigit(ch) ? ch - '0' : lowercase(ch) - 'a' + 10;
}

/* Converts an integer value to its hex character*/
char    to_hex(char code) {
  static constexpr const char hex[] = "0123456789abcdef";
  return hex[code & 15];
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

// Is lowercase.
bool    is_lowercase(char c) {
	switch (c) {
	case 'a': case 'b': case 'c': case 'd':
	case 'e': case 'f': case 'g': case 'h':
	case 'i': case 'j': case 'k': case 'l':
	case 'm': case 'n': case 'o': case 'p':
	case 'q': case 'r': case 's': case 't':
	case 'u': case 'v': case 'w': case 'x':
	case 'y': case 'z':
		return true;
	default:
		return false;
	}
}

// Is uppercase.
bool    is_uppercase(char c) {
	switch (c) {
	case 'A': case 'B': case 'C': case 'D':
	case 'E': case 'F': case 'G': case 'H':
	case 'I': case 'J': case 'K': case 'L':
	case 'M': case 'N': case 'O': case 'P':
	case 'Q': case 'R': case 'S': case 'T':
	case 'U': case 'V': case 'W': case 'X':
	case 'Y': case 'Z':
		return true;
	default:
		return false;
	}
}

// Is alphabetical.
bool    is_alphabetical(char c) {
	switch (c) {
	case 'a': case 'b': case 'c': case 'd':
	case 'e': case 'f': case 'g': case 'h':
	case 'i': case 'j': case 'k': case 'l':
	case 'm': case 'n': case 'o': case 'p':
	case 'q': case 'r': case 's': case 't':
	case 'u': case 'v': case 'w': case 'x':
	case 'y': case 'z':
	case 'A': case 'B': case 'C': case 'D':
	case 'E': case 'F': case 'G': case 'H':
	case 'I': case 'J': case 'K': case 'L':
	case 'M': case 'N': case 'O': case 'P':
	case 'Q': case 'R': case 'S': case 'T':
	case 'U': case 'V': case 'W': case 'X':
	case 'Y': case 'Z':
		return true;
	default:
		return false;
	}
}
bool    is_alphabetical_or_digit(char c) {
	switch (c) {
	case 'a': case 'b': case 'c': case 'd':
	case 'e': case 'f': case 'g': case 'h':
	case 'i': case 'j': case 'k': case 'l':
	case 'm': case 'n': case 'o': case 'p':
	case 'q': case 'r': case 's': case 't':
	case 'u': case 'v': case 'w': case 'x':
	case 'y': case 'z':
	case 'A': case 'B': case 'C': case 'D':
	case 'E': case 'F': case 'G': case 'H':
	case 'I': case 'J': case 'K': case 'L':
	case 'M': case 'N': case 'O': case 'P':
	case 'Q': case 'R': case 'S': case 'T':
	case 'U': case 'V': case 'W': case 'X':
	case 'Y': case 'Z':
	case '0': case '1': case '2': case '3':
	case '4': case '5': case '6': case '7':
	case '8': case '9':
		return true;
	default:
		return false;
	}
}

// Is escape sequence.
bool    is_escape_sequence(char c) {
    switch (c) {
        case '\a':
        case '\b':
        case '\e':
        case '\f':
        case '\n':
        case '\r':
        case '\t':
        case '\v':
        case '\\':
        case '\'':
        case '\"':
        case '\?':
            return true;
        default:
            return false;
    }
}

}; 		// End namespace vlib.
#endif 	// End header.
