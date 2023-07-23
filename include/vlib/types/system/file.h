// Author: Daan van den Bergh
// Copyright: © 2022 Daan van den Bergh.

// Header.
#ifndef VLIB_FILE_T_H
#define VLIB_FILE_T_H

// Namespace vlib.
namespace vlib {

// ---------------------------------------------------------
// File type.

/* 	@docs {
	@chapter: system
	@title: File
	@description:
		File type.
		
		Object `File` acts as a shared pointer, use `File::copy()` to create a real copy without any links.
 
		The available file modes are (can not be combined):
		- `vlib::file::r`.
		- `vlib::file::w`.
		- `vlib::file::a`.
	@usage:
        #include <vlib/types.h>
		vlib::File file("/tmp/myfile.txt");
} */
struct File {

// Public.
public:

	// ---------------------------------------------------------
	// Aliases.

	using 		This = 		    File;
    using       Type = char;
	using 		Length = 	    ullong;
	
	// ---------------------------------------------------------
	// Structures.
	
	
    
	// ---------------------------------------------------------
	// Attributes.

	struct attr {
		Path	path;						// the file path.
		FILE*	file =	nullptr;			// the file pointer.
		int		mode =	vlib::file::append;	// the file mode.
	};
	SPtr<attr>	m_attr;

// Private.
private:

	// ---------------------------------------------------------
	// Private helpers.
	
	// Constructor from attr.
	constexpr
	File (const attr& a) :
	m_attr(a) {}
	constexpr
	File (attr&& a) :
	m_attr(a) {}

// Public.
public:

	// ---------------------------------------------------------
	// Constructors.

	// Default constructor.
	constexpr
	File () :
	m_attr(attr{}) {}

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
	File (Path path, int mode = vlib::file::append) :
	m_attr(attr{ .path = move(path), .mode = mode }) {}
    constexpr
    File (const char* path, int mode = vlib::file::append) :
    m_attr(attr{ .path = path, .mode = mode }) {}

	// Copy constructor.
	constexpr
	File (const This& obj) :
	m_attr(obj.m_attr) {}

	// Move constructor.
	constexpr
	File (This&& obj) :
	m_attr(move(obj.m_attr)) {}

	// Destructor.
	constexpr
	~File() {
		if (m_attr.links() == 0 && m_attr->file != nullptr) {
			::fclose(m_attr->file);
		}
	}

	// ---------------------------------------------------------
	// Assignment operators.

	// Assignment operator from path.
	constexpr
	auto&	operator =(const Path& path) { return reconstruct(path); }
	constexpr
	auto&	operator =(Path&& path) { return reconstruct(path); }

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
	This&	reconstruct(const Path& path, int mode = vlib::file::append) {
		close();
		m_attr = attr{ .path = path, .mode = mode };
		return *this;
	}
	constexpr
	This&	reconstruct(Path& path, int mode = vlib::file::append) {
		close();
		m_attr = attr{ .path = move(path), .mode = mode };
		return *this;
	}

	// Copy.
	constexpr
	This&	copy(const This& obj) {
		m_attr.copy(obj.m_attr);
		return *this;
	}

	// Swap.
	constexpr
	This&	swap(This& obj) {
		m_attr.swap(obj.m_attr);
		return *this;
	}

	// Destruct.
	constexpr
	This&	destruct() {
		m_attr.destruct();
		return *this;
	}

	// ---------------------------------------------------------
	// Properties.

	// Path.
	/*  @docs {
		@title: Path
		@type: Path&
		@description: Get the file path attribute.
	} */
	constexpr
	auto& 	path() { return m_attr->path; }

	// Length of the file data.
	/*  @docs {
		@title: Length
		@type: ullong
		@description: Get the length of the file data.
	} */
	constexpr
	Length 	len() {
		if (m_attr->file == nullptr) { return 0; }
		::fseek(m_attr->file, 0, SEEK_END);
		const Length len = (Length) ::ftell(m_attr->file);
		::fseek(m_attr->file, 0, SEEK_SET);
		return len;
	}

	// The file pointer.
	/*  @docs {
		@title: File pointer
		@type: FILE*&
		@description: Get the file pointer.
	} */
	constexpr
	auto& 	file() { return m_attr->file; }
    
    // The file number.
    /*  @docs {
        @title: File number
        @description: Get the file number.
    } */
    int     fileno() { return ::fileno(m_attr->file); }
	
	// The file mode.
	/*  @docs {
		@title: Mode
		@type: short&
		@description: Get the file mode.
	} */
	constexpr
	auto& 	mode() { return m_attr->mode; }

	// Is defined.
	/*  @docs {
		@title: Is defined
		@type: bool
		@description: Check if the file is defined.
	} */
	constexpr
	bool 	is_defined() const { return m_attr->path.is_defined(); }

	// Is undefined.
	/*  @docs {
		@title: Is defined
		@type: bool
		@description: Check if the file is undefined.
	} */
	constexpr
	bool 	is_undefined() const { return m_attr->file == nullptr; }

	// ---------------------------------------------------------
	// Functions.

	// Exists.
	/*  @docs {
		@title: Exists
		@description: Check if the file path exists.
		@return: Returns a boolean indicating whether the file exists.
		@usage:
			vlib::File file("/tmp/myfile.txt");
			bool exists = file.exists();
	} */
	bool 	exists() {
		return ::access(m_attr->path.c_str(), F_OK) == 0;
	}

	// Access.
	/*  @docs {
		@title: Access
		@description: Check if the executing user has access to the file.
		@return: Returns a boolean indicating whether the executing user has access to the file.
		@usage:
			vlib::File file("/tmp/myfile.txt");
			bool exists = file.access();
		@funcs: 4
	} */
	bool 	access() {
		return ::access(m_attr->path.c_str(), F_OK) == 0;
	}
	bool 	read_access() {
		return ::access(m_attr->path.c_str(), R_OK) == 0;
	}
	bool 	write_access() {
		return ::access(m_attr->path.c_str(), W_OK) == 0;
	}
	bool 	exec_access() {
		return ::access(m_attr->path.c_str(), X_OK) == 0;
	}

	// Create.
	/*  @docs {
		@title: Create
		@description: Create the file.
		@usage:
			vlib::File file("/tmp/myfile.txt");
			file.create();
	} */
	void 	create(ushort permission = 0740) {
        m_attr->path.touch(permission);
	}

	// Remove.
	/*  @docs {
		@title: Remove
		@description:
			Remove the file.
	 
			Automatically calls `close()`.
		@usage:
			vlib::File file("/tmp/myfile.txt");
			file.remove();
	} */
    void 	remove() {
		close();
        m_attr->path.remove();
	}
	static inline
    void 	remove(const char* path, ullong len) {
        Path::remove(path, len);
	}
	static inline
	void 	remove(const String& path) {
        Path::remove(path.c_str(), path.len());
	}
	
	// Open.
	/*  @docs {
		@title: Open
		@description:
			Open the file.
			
			Function `open()` is automatically called when writing to or reading from the file.
		@usage:
			vlib::File file("/tmp/myfile.txt");
			file.open();
	} */
	constexpr
	void 	open() {
		if (m_attr->file != nullptr) {
			return ;
		}
		if (m_attr->path.is_undefined()) {
            throw InvalidUsageError("Path is undefined.");
		}
		m_attr->file = vlib::open(m_attr->path.c_str(), m_attr->mode);
		if (m_attr->file == nullptr) {
            throw OpenError(to_str("Unable to open file \"", m_attr->path, "\" [", ::strerror(errno), "]."));
		}
	}

	// Reopen with mode.
	/*  @docs {
		@title: Reopen
		@description:
			Reopen the file with a defined mode.
		@usage:
			vlib::File file("/tmp/myfile.txt");
			file.reopen(vlib::file::mode::write);
	} */
	constexpr
	void 	reopen(int mode) {
		if (m_attr->mode == mode && m_attr->file != nullptr) {
			return ;
		}
		if (m_attr->path.is_undefined()) {
            throw InvalidUsageError("Path is undefined.");
		}
		if (m_attr->file != nullptr) {
			::fclose(m_attr->file);
		}
		m_attr->mode = mode;
		m_attr->file = vlib::open(m_attr->path.c_str(), m_attr->mode);
		if (m_attr->file == nullptr) {
			throw OpenError(to_str("Unable to open file \"", m_attr->path, "\" [", ::strerror(errno), "]."));
		}
	}
	
	// Read.
	/*  @docs {
		@title: Read
		@description:
			Read all the data from the file.
	 
			Reopening the file for the required mode is handled automatically.
		@usage:
			vlib::File file("/tmp/myfile.txt");
			vlib::String output = file.read();
	} */
	String 	read() {
        reopen(file::mode::read);
		const Length l = len();
        String output;
		output.resize(output.len() + l);
		if (fread(output.data(), sizeof(char), l, m_attr->file) != l) {
            throw ReadError(to_str("Unable to read file \"", m_attr->path, "\" [", ::strerror(errno), "]."));
		}
		output.len() = l;
		output.null_terminate();
		return output;
	}
	
	// Write.
	/*  @docs {
		@title: Write
		@description:
			Write data to the file.
		
			Reopening the file for the required mode is handled automatically.
	 
			Function `write()` overwrites all previously written data, use `append()` to append to the file.
		@parameter: {
			@name: data
			@description: The data to write to the file.
		}
		@usage:
			vlib::File file("/tmp/myfile.txt");
			file.write("Hello World!\n");
		@funcs: 2
	} */
	void 	 write(const String& data) {
		return write(data.data(), data.len());
	}
    void 	 write(const char* data, const Length len) {
        reopen(file::mode::write);
		if (fwrite(data, len, 1, m_attr->file) != 1) {
            throw WriteError(to_str("Unable to write to file \"", m_attr->path, "\" [", ::strerror(errno), "]."));
		}
	}
    void     write(const uchar* data, const Length len) {
        reopen(file::mode::write);
        if (fwrite(data, len, 1, m_attr->file) != 1) {
            throw WriteError(to_str("Unable to write to file \"", m_attr->path, "\" [", ::strerror(errno), "]."));
        }
    }
	
	// Append.
	/*  @docs {
		@title: Append
		@description:
			Append data to the file.
		
			Reopening the file for the required mode is handled automatically.
		@parameter: {
			@name: data
			@description: The data to append to the file.
		}
		@usage:
			vlib::File file("/tmp/myfile.txt");
			int status = file.append("Hello World!\n");
		@funcs: 2
	} */
	void 	append(const String& data) {
		return append(data.data(), data.len());
	}
    void 	append(const char* data, const Length len) {
        reopen(file::mode::append);
		if (fwrite(data, len, 1, m_attr->file) != 1) {
            throw WriteError(to_str("Unable to append to file \"", m_attr->path, "\" [", ::strerror(errno), "]."));
		}
	}

	// Flush.
	/*  @docs {
		@title: Flush
		@description:
			Flush the file.
		@usage:
			vlib::File file("/tmp/myfile.txt");
			file.flush();
	} */
	void 	flush() {
		if (::fflush(m_attr->file) != 0) {
            throw FlushError(to_str("Unable to flush file \"", m_attr->path, "\" [", ::strerror(errno), "]."));
		}
	}

	// Sync.
	/*  @docs {
		@title: Sync
		@description:
			Synchronize the file buffer with the system.
		@usage:
			vlib::File file("/tmp/myfile.txt");
			file.sync();
	} */
	void 	sync() {
		if (::fsync(::fileno(m_attr->file)) != 0) {
            throw SyncError(to_str("Unable to flush file \"", m_attr->path, "\" [", ::strerror(errno), "]."));
		}
	}
	
	// Get line.
	/*  @docs {
	 *	@title: Get line
	 *	@description:
	 *		Get the current line.
	 *
	 *		Function `read_line` reopens the file if required and resizes the `line` parameter when the capacity is 0. Function `read_line_h` only reads the line and does not check the file mode nor buffer capacity.
	 *
	 *	@return:
	 *		Returns a `true` when there is a line to read, and `false` when there are no more lines to read.
	 *	@usage:
	 *		vlib::File file("/tmp/myfile.txt");
	 *		String line;
	 *		Bool success = file.read_line(line);
	 *	@funcs: 2
	} */
	Bool 	get_line(String& line) {
		reopen(vlib::file::mode::read);
		switch (line.capacity()) {
			case 0:
				line.resize(10000);
			default:
				break;
		}
		return fgets(line.data(), (int)line.capacity(), m_attr->file) != NULL;
	}
	Bool 	get_line_h(String& line) {
		return fgets(line.data(), (int)line.capacity(), m_attr->file) != NULL;
	}

	// Close.
	/*  @docs {
		@title: Close
		@description:
			Close the file.
	 
			Function `close()` is automatically called in the destructor.
		@return:
			Returns `0` upon success, and the error code upon failure (`< 0`).
		@usage:
			vlib::File file("/tmp/myfile.txt");
			file.close();
	} */
	constexpr
	void 	close() {
		if (m_attr->file != nullptr) {
			::fclose(m_attr->file);
			m_attr->file = nullptr;
		}
	}

};

// ---------------------------------------------------------
// Instances.

// Is instance.
template<>				struct is_instance<File, File>	{ SICEBOOL value = true;  };

// Is type.
template<typename Type> struct is_File 					{ SICEBOOL value = false; };
template<> 				struct is_File<File> 			{ SICEBOOL value = true;  };

// ---------------------------------------------------------
// Shortcuts.

namespace types { namespace shortcuts {

using File =		vlib::File;

}; 		// End namespace types.
}; 		// End namespace shortcuts.

// ---------------------------------------------------------
// End.

}; 		// End namespace vlib.
#endif 	// End header.
