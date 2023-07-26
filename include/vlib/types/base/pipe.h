// Author: Daan van den Bergh
// Copyright: © 2022 Daan van den Bergh.

// Header.
#ifndef VLIB_PIPE_T_H
#define VLIB_PIPE_T_H

// Includes.
#include <unistd.h>

// Namespace vlib.
namespace vlib {

// Pipe type.
/* 	@docs {
	@chapter: types
	@title: Pipe
	@description:
		Pipe type.
	@usage:
        #include <vlib/types.h>
 
		// Dump to the stdout console.
		vlib::out << "Hello World! \n";
 
		// Dump to the stderr console.
		vlib::err << "Error: ... \n";

		// Create a class that can be dumped using "Pipe".
		class myclass {
			constexpr
			const char* c_str() const {
				return "Hello World!";
			}
			friend
			auto& operator <<(vlib::Pipe& pipe, const myclass& obj) {
				return pipe << obj.c_str();
			}
		};

} */
struct Pipe {

// Public:
public:

	// ---------------------------------------------------------
	// Aliases.

	using 			This = 			Pipe;
	using 			Type = 			char;
	using 			Length = 		ullong;
	using 			array_h = 		vlib::array<Type, Length>;

	// ---------------------------------------------------------
	// Attributes.

	Type* 			m_arr;
	Length			m_len;
	Length			m_capacity;

// Private:
private:

	// ---------------------------------------------------------
	// Attributes.

	int 	m_fd;
	uint 	m_increaser = 4;

// Public:
public:

	// ---------------------------------------------------------
	// Static attributes.

	SICE const char 		end = 		'\n';
	#if DEBUG == 0
	SICE const char* 		back = 		"\033[A";
	#else
	SICE const char* 		back = 		"";
	#endif

	// ---------------------------------------------------------
	// Construct functions.

	// Copy.
	constexpr
	auto& 	copy(const This& obj) {
		array_h::copy(m_arr, m_len, m_capacity, obj.m_arr, obj.m_len, obj.m_capacity);
		return *this;
	}
	// Swap.
	constexpr
	auto& 	swap(This& obj) {
		array_h::swap(m_arr, m_len, m_capacity, obj.m_arr, obj.m_len, obj.m_capacity);
		return *this;
	}

	// ---------------------------------------------------------
	// Constructors.

	// Default constructor.
	constexpr
	Pipe() :
	m_arr(nullptr),
	m_len(0),
	m_capacity(0),
	m_fd(-1) {}

	// Special constructor with file descriptor.
	constexpr
	Pipe	(int fd) :
	m_arr(nullptr),
	m_len(0),
	m_capacity(0),
	m_fd(fd) {}

	// Copy constructor.
	constexpr
	Pipe	(const This& obj) :
	m_arr(nullptr),
	m_len(obj.m_len),
	m_capacity(obj.m_capacity),
	m_fd(obj.m_fd)
	{
		if (obj.m_arr) {
			array_h::alloc(m_arr, m_len);
			array_h::copy(m_arr, obj.m_arr, m_len);
			m_arr[m_len] = '\0';
		}
	}

	// Move constructor.
	constexpr
	Pipe	(This&& obj) :
	m_arr(obj.m_arr),
	m_len(obj.m_len),
	m_capacity(obj.m_capacity),
	m_fd(obj.m_fd)
	{
		obj.m_arr = nullptr;
	}

	// Destrcutor.
	constexpr
	~Pipe() {
		delete[] m_arr;
	}

	// ---------------------------------------------------------
	// Assignment operators.

	// Copy assignment operator.
	constexpr
	auto&	operator =(const This& obj) {
		return copy(obj);
	}

	// Move assignment operator.
	constexpr
	auto&	operator =(This&& obj) {
		return swap(obj);
	}

	// ---------------------------------------------------------
	// Default functions.

	// Length.
	constexpr
	auto& 	len() {
		return m_len;
	}
	constexpr
	auto& 	len() const {
		return m_len;
	}

	// Allocated length.
	constexpr
	auto& 	capacity() {
		return m_capacity;
	}
	constexpr
	auto& 	capacity() const {
		return m_capacity;
	}

	// Data.
	// - Warning: the array's data may contain garbage items, use it in combiation with "len()" to avoid garbage items.
	constexpr
	auto& 	data() {
		return m_arr;
	}
	constexpr
	auto& 	data() const {
		return m_arr;
	}

	// Is undefined.
	/* @docs {
	  @title: Is undefined
	  @description:
			Check if the object is undefined.
	  @usage:
			Pipe x;
			x.is_undefined(); ==> true;
	} */
	constexpr
	bool 	is_undefined() const {
		return m_arr == nullptr;
	}

	// Equals.
	// - Give len_x and len_y the same value to check if the first n items of the array are equal.
	constexpr
	bool 	eq(const This& obj) const {
		return array_h::eq(m_arr, m_len, obj.m_arr, obj.m_len);
	}
	constexpr
	bool 	eq(const Type* arr, Length len) const {
		return array_h::eq(m_arr, m_len, arr, len);
	}
	constexpr
	bool 	eq(const Type* arr) const {
		return array_h::eq(m_arr, m_len, arr, vlib::len(arr));
	}

	// Null terminate.
	constexpr
	auto& 	null_terminate() {
		if (m_arr == nullptr) { array_h::expand(m_arr, m_len, m_capacity, 1, m_increaser); }
		m_arr[m_len] = '\0';
		return *this;
	}

	// ---------------------------------------------------------
	// Functions.
	
	// Reset the buffer & attributes.
	// - This will delete the buffer in opposition to "String::reset()".
	constexpr
	auto&	reset(){
		delete[] m_arr;
		m_arr = nullptr;
		m_len = 0;
		m_capacity = 0;
		return *this;
	}
	
	// Check if the pipe's array will overflow when length is added.
	constexpr
	bool 	overflow(ullong len) {
		return m_len + len > limits<ullong>::max;
	}

	// Dump.
	//  - Currently only for posix systems.
	constexpr
	int		dump(const char* msg, ullong len){
		if (m_fd == -1) {
			if (overflow(len)) { reset(); }
			array_h::expand(m_arr, m_len, m_capacity, len, m_increaser);
			array_h::copy(m_arr + m_len, msg, len);
			m_len += len;
		}
		else {
			while (len > 0) {
				long ret = ::write(m_fd, msg, len);
				if (ret < 0) { return -1; } // error.
				msg += ret;
				len -= (uint) ret; // edit, repeat.
			}
		}
		return 0;
	}
	constexpr
	int		dump(const char* msg){
		return dump(msg, vlib::len(msg));
	}
	constexpr
	int		dump(char msg){
		return dump(&msg, 1);
	}
    constexpr
    int     write(const char* msg, ullong len){
        dump(msg, len);
        return 0;
    }

	// ---------------------------------------------------------
	// Casts.

	// As String.
	constexpr
	auto	str() const;

	// As json formatted String.
	constexpr
	auto	json() const;

	// ---------------------------------------------------------
	// Operators.

	// With "char*".
	constexpr
	This&	operator <<(const char* x) {
        if (x) {
            dump(x, vlib::len(x));
        } else {
            dump("NULL", 4);
        }
		return *this;
	}

	// With char.
	constexpr
	This&	operator <<(char x) {
		dump(&x, 1);
		return *this;
	}

	// With integral types.
	template <typename Cast> requires (!is_char<Cast>::value && is_integral<Cast>::value) constexpr
	This&	operator <<(const Cast& x);

	// With "color_t".
	constexpr
	This&	operator <<(const color_t& x) {
		dump(x.data(), x.len());
		return *this;
	}
    
    // With "std::string".
    This&    operator <<(const std::string& x) {
        dump(x.data(), x.size());
        return *this;
    }
    
    // With "internal::BaseString".
    This&    operator <<(const internal::BaseString& x) {
        dump(x.data(), x.len());
        return *this;
    }
    
    // Dump to pipe.
    constexpr
    auto&     operator <<(const This&) {
        dump("null", 4);
        return *this;
    }

	//
};

// ---------------------------------------------------------
// Constants.

// [[clang::no_destroy]] Pipe in(STDIN_FILENO);
// [[clang::no_destroy]] Pipe out(STDOUT_FILENO);
// [[clang::no_destroy]] Pipe err(STDERR_FILENO);
Pipe in(STDIN_FILENO);
Pipe out(STDOUT_FILENO);
Pipe err(STDERR_FILENO);

// ---------------------------------------------------------
// Instances.

// Is pipe type.
template<typename Type> struct is_Pipe 						{ SICEBOOL value = false; };
template<> 				struct is_Pipe<Pipe> 				{ SICEBOOL value = true;  };

// ---------------------------------------------------------
// Global functions.

// Length of "Pipe".
constexpr
ullong len(const Pipe& x) { return x.len(); }

// Print.
constexpr
void print() {
	out << "\n";
}
template <typename Arg, typename... Args> constexpr
void print(const Arg& arg, Args&&... args) {
	out << arg;
	print(args...);
}

// Print marker.
template <typename Arg, typename... Args> constexpr
void print_marker(const Arg& arg, Args&&... args) {
    out << vlib::colors::blue << ">>> " << vlib::colors::end << arg;
    print(args...);
}

// Print warning.
template <typename Arg, typename... Args> constexpr
void print_warning(const Arg& arg, Args&&... args) {
    out << vlib::colors::yellow << ">>> " << vlib::colors::end << arg;
    print(args...);
}

// Print error.
template <typename Arg, typename... Args> constexpr
void print_error(const Arg& arg, Args&&... args) {
    out << vlib::colors::red << ">>> " << vlib::colors::end << arg;
    print(args...);
}

// ---------------------------------------------------------
// Shortcuts.

namespace types { namespace shortcuts {

using Pipe =		vlib::Pipe;

template <typename... Args> constexpr
void print(Args&&... args) {
    vlib::print(args...);
}
template <typename... Args> constexpr
void print_marker(Args&&... args) {
    vlib::print_marker(args...);
}
template <typename... Args> constexpr
void print_warning(Args&&... args) {
    vlib::print_warning(args...);
}
template <typename... Args> constexpr
void print_error(Args&&... args) {
    vlib::print_error(args...);
}

}; 		// End namespace types.
}; 		// End namespace shortcuts.

// ---------------------------------------------------------
// End.

}; 		// End namespace vlib.
#endif 	// End header.
