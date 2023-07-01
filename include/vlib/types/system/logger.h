// Author: Daan van den Bergh
// Copyright: © 2022 Daan van den Bergh.

// Header.
#ifndef VLIB_LOGGER_H
#define VLIB_LOGGER_H

// Namespace vlib.
namespace vlib {

// ---------------------------------------------------------
// Logger type.

/* 	@docs {
	@chapter: system
	@title: Logger
	@description:
		Used for logging to the console and saving the logs to a file.
    @notes:
        The loggers acts as a shared pointer.
	@usage:
        #include <vlib/types.h>
		vlib::Logger logger("/tmp/logs/logs.txt");
} */
class Logger {

// Private.
private:

    // ---------------------------------------------------------
    // Aliases.
    
    using   This = Logger;
    
	// ---------------------------------------------------------
	// Attributes.
	
    File    m_file;

// Public.
public:

	// ---------------------------------------------------------
	// Constructors.

	// Default constructor.
	constexpr
    Logger () = default;

	// Constructor from path.
	/*  @docs {
		@title: Constructor
		@description:
			Constructor from path and mode.
		@parameter: {
			@name: path
			@description: The path of the file.
		}
		@parameter: {
			@name: mode
			@description: The file mode.
		}
		@usage:
			vlib::File file("/tmp/myfile.txt", vlib::file::mode::append);
		@funcs: 2
	} */
	constexpr
    Logger(const File& file) :
	m_file(file) {}
	constexpr
    Logger(File&& file) :
	m_file(file) {}

	// Copy constructor.
	constexpr
    Logger(const This& obj) :
	m_file(obj.m_file) {}

	// Move constructor.
	constexpr
    Logger(This&& obj) :
	m_file(move(obj.m_file)) {}

	// ---------------------------------------------------------
	// Assignment operators.

	// Assignment operator from path.
	constexpr
	auto&	operator =(const File& file) { return reconstruct(file); }
	constexpr
	auto&	operator =(File&& file) { return reconstruct(file); }

	// Copy assignment operator.
	constexpr
	auto&	operator =(const This& obj) { return copy(obj); }

	// Swap assignment operator.
	constexpr
	auto&	operator =(This&& obj) { return swap(obj); }
	
	// ---------------------------------------------------------
	// Construct functions.

	// Reconstruct.
	/*  @docs {
		@title: Reconstruct
		@description:
			Reconstruct from path and mode.
		@parameter: {
			@name: path
			@description: The path of the file.
		}
		@parameter: {
			@name: mode
			@description: The file mode.
		}
		@return:
			Returns a reference to the current object.
		@usage:
			vlib::File file (...);
			file.reconstruct("/tmp/myfile.txt", vlib::file::mode::append);
		@funcs: 2
	} */
	constexpr
	This&	reconstruct(const File& file) {
        m_file = file;
		return *this;
	}
	constexpr
	This&	reconstruct(File& file) {
        m_file = file;
		return *this;
	}

	// Copy.
	constexpr
	This&	copy(const This& obj) {
		m_file.copy(obj.m_file);
		return *this;
	}

	// Swap.
	constexpr
	This&	swap(This& obj) {
		m_file.swap(obj.m_file);
		return *this;
	}

	// ---------------------------------------------------------
	// Properties.

	// Path.
	/*  @docs {
		@title: File
		@type: File&
		@description: Get the file attribute.
	} */
	constexpr
	auto& 	file() { return m_file; }

	// Is defined.
	/*  @docs {
		@title: Is defined
		@description: Check if the file is defined.
	} */
	constexpr
	Bool 	is_defined() const { return m_file.is_defined(); }

	// Is undefined.
	/*  @docs {
		@title: Is defined
		@description: Check if the file is undefined.
	} */
	constexpr
	Bool 	is_undefined() const { return m_file.is_undefined(); }

	// ---------------------------------------------------------
	// Functions.

	// Exists.
	/*  @docs {
		@title: Log
		@description: Log to the console and save to Athe file.
	} */
    void 	log(const String& msg, const Bool& console = true) {
        return log(msg.data(), msg.len(), console);
    }
    void    log(const char* msg, ullong len, const Bool& console = true) {
        if (console) {
            vlib::out.dump(msg, len);
        }
        m_file.append(msg, len);
        m_file.flush();
    }

};

// ---------------------------------------------------------
// Instances.

// Is instance.
template<>				struct is_instance<Logger, Logger>	{ SICEBOOL value = true;  };

// Is type.
template<typename Type> struct is_Logger 					{ SICEBOOL value = false; };
template<> 				struct is_Logger<Logger> 			{ SICEBOOL value = true;  };

// ---------------------------------------------------------
// Shortcuts.

namespace shortcuts {
namespace types {

using Logger =		vlib::Logger;

}; 		// End namespace types.
}; 		// End namespace shortcuts.

// ---------------------------------------------------------
// End.

}; 		// End namespace vlib.
#endif 	// End header.
