// Author: Daan van den Bergh
// Copyright: © 2022 Daan van den Bergh.

// Header.
#ifndef VLIB_PATH_T_H
#define VLIB_PATH_T_H

// Includes.
#include <unistd.h>
#include <dirent.h>
#include <limits.h>
#include <stdlib.h>
#include <sys/stat.h>
#include <fcntl.h>
#include <utime.h>
#include <sys/time.h>
#if OSID == 1
#include <copyfile.h>
#else
#include <sys/sendfile.h>
#endif

// Namespace vlib.
namespace vlib {

// ---------------------------------------------------------
// Path type.

/* 	@docs {
	@chapter: system
	@title: Path
	@description:
		Path type.
	@usage:
        #include <vlib/types.h>
		vlib::Path my_dir("/tmp/mydir");
		vlib::Path my_file("/tmp/myfile.txt");
} */
// @TODO undefined behaviour for destructor.
// @TODO dont inherit String but rather a member as m_path, func like replace and forgotten funcs dont call post_edit and clean etc.
struct Path : public String {

// Private:
private:

	// ---------------------------------------------------------
	// Definitions.

	using		array_h = 		vlib::array<char, ullong>;

	// ---------------------------------------------------------
	// Private inherited functions.
	//
	// Any function that completely changes the path should be made private ...
	// Since a clean & post_path_edit_reset is required after the new path assignment.
	// Functions that do small edits are not necessarily required.
	//

	using		String::reconstruct;
	using		String::append;
	using		String::concat;
	using		String::operator +;
	using		String::operator +=;
	using		String::operator <<;
	
	// @TODO Do a good check for all the editing String funcs like replace_start etc.

// Public:
public:

	// ---------------------------------------------------------
	// Enums.

	// Types enum.
	enum types {
		any             = 'a',
		file            = 'f',
		directory       = 'd',
		symbolic_link   = 'l',
		socket          = 's',
		block_device    = 'b',
		char_device     = 'c',
		pipe            = 'p',
		unknown         = '?'
	};
	
	// ---------------------------------------------------------
	// Structs.

	struct SyncOptions {
		Bool    del = false; // delete files that do not exist on the "from" side.
		Bool    overwrite = false; // overwrite files that have a later modify timestamp on the "to" side.
	};

	// ---------------------------------------------------------
	// Aliases.

	using 		This = 		Path;

	// ---------------------------------------------------------
	// Shortcuts.

	using		String::m_arr;
	using		String::m_len;
	using		String::m_capacity;

	// ---------------------------------------------------------
	// Attributes.

	struct info {
		char			type = types::unknown;
		Permission	    permission;
		User			user;
		int				gid = -1;
		int				device = -1;
		long long		size = -1;
		int				block_size = -1;
		mtime_t			atime = -1;
		mtime_t			mtime = -1;
		mtime_t			ctime = -1;
		String 			full_name;
		String 			name;
		String			extension;
	};
	UPtr<info> 		p_info;

	// ---------------------------------------------------------
	// Functions.

	// Parse the stat property attributes.
	void	stat_wrapper() {
        if (!m_arr) {
            throw ParseError(tostr("Unable to parse path \"", *this, "\"."));
        }
		m_arr[m_len] = '\0';
		struct stat stat_info;
        if (::lstat(m_arr, &stat_info) == -1) {
            throw ParseError(tostr("Unable to parse path \"", *this, "\"."));
        }
		p_info = info{};
		switch (stat_info.st_mode & S_IFMT) {               // bitwise AND to determine file type
			case S_IFSOCK:
				p_info->type = types::socket;
				break;
			case S_IFLNK:
				p_info->type = types::symbolic_link;
				break;
			case S_IFREG:
				p_info->type = types::file;
				break;
			case S_IFBLK:
				p_info->type = types::block_device;
				break;
			case S_IFDIR:
				p_info->type = types::directory;
				break;
			case S_IFCHR:
				p_info->type = types::char_device;
				break;
			case S_IFIFO:
				p_info->type = types::pipe;
				break;
			default:
				p_info->type = types::unknown;
				break;
		}
		p_info->permission = stat_info.st_mode & (S_IRWXU | S_IRWXG | S_IRWXO);
		p_info->user = 		(int) stat_info.st_uid;
		p_info->gid = 		(int) stat_info.st_gid;
		p_info->device = 		stat_info.st_dev;
		p_info->size = 		stat_info.st_size;
		p_info->block_size = 	stat_info.st_blksize;
        #if OSID <= 0 || OSID >= 4 // linux
			p_info->atime = 	stat_info.st_atim.tv_nsec;
			p_info->mtime = 	stat_info.st_mtim.tv_nsec;
			p_info->ctime = 	stat_info.st_ctim.tv_nsec;
		#elif OSID == 1 // macos
			p_info->atime = 	Date::get_mseconds(stat_info.st_atimespec);
			p_info->mtime = 	Date::get_mseconds(stat_info.st_mtimespec);
			p_info->ctime = 	Date::get_mseconds(stat_info.st_ctimespec);
		#endif
	}

	// Post path edit reset.
	constexpr
	void 	post_path_edit_reset() {
		p_info = info{};
	}

// Public:
public:

	// ---------------------------------------------------------
	// Construct functions.

	// Copy.
	constexpr
	This&	copy(const This& obj) {
		if (this == &obj) { return *this; }
		array_h::copy(m_arr, m_len, m_capacity, obj.m_arr, obj.m_len, obj.m_capacity);
		p_info.copy(obj.p_info);
		return *this;
	}

	// Swap.
	constexpr
	This&	swap(This& obj) {
		if (this == &obj) { return *this; }
		array_h::swap(m_arr, m_len, m_capacity, obj.m_arr, obj.m_len, obj.m_capacity);
		p_info.swap(obj.p_info);
		return *this;
	}

	// ---------------------------------------------------------
	// Constructors.

	// Default constructor.
	constexpr
	Path () :
	String() {}

	// Constructor from an array with length and alloc length.
	constexpr
	Path (const char* arr, ullong len, ullong capacity) :
	String(arr, len, capacity)
	{
		clean();
	}

	// Constructor from an array with length.
	/*  @docs {
		@title: Constructor
		@description:
			Constructor from a char array with length.
		@parameter: {
			@name: arr
			@type: const char*
			@description: The char array.
		}
		@parameter: {
			@name: len
			@description: The length of the char array.
		}
		@usage:
			vlib::Path path("/tmp", 4);
	} */
	constexpr
	Path (const char* arr, ullong len) :
	String(arr, len)
	{
		clean();
	}

	// Constructor from a char array.
	/*  @docs {
		@title: Constructor
		@description:
			Constructor from a null-terminated char array.
		@parameter: {
			@name: arr
			@type: const char*
			@description: The null-terminated char array.
		}
		@usage:
			vlib::Path path("/tmp");
	} */
	constexpr
	Path (const char* arr) :
	String(arr)
	{
		clean();
	}

	// Constructor from initializer list.
	constexpr
	Path (const std::initializer_list<char>& x) :
	String(x)
	{
		clean();
	}

	// Copy constructor from "Pipe / CString / String".
	/*  @docs {
		@title: Constructor
		@description:
			Constructor from a `Pipe`, `CString` or `String`.
		@parameter: {
			@name: x
			@description: The object to construct from, supported types are: `Pipe`, `CString` and `String`.
		}
		@usage:
			String x("/tmp");
			vlib::Path path(x);
	} */
	template <typename Array> requires (
	   is_char<char>::value &&
	   (
		   is_Pipe<Array>::value ||
		   is_CString<Array>::value ||
		   is_String<Array>::value
	   )
   ) constexpr
	Path (const Array& x) :
	String(x)
	{
		clean();
	}

	// Move constructor from "Pipe / CString / String".
	template <typename Array> requires (
	   is_char<char>::value &&
	   (
		   is_Pipe<Array>::value ||
		   // is_CString<Array>::value ||
		   is_String<Array>::value
	   )
   ) constexpr
	Path (Array&& x) :
	String(x)
	{
		clean();
	}

	// Copy constructor.
	constexpr
	Path (const This& obj) :
	String(obj),
	p_info(obj.p_info) {}

	// Move constructor.
	constexpr
	Path (This&& obj) :
	String(obj),
	p_info(move(obj.p_info)) {}

	// ---------------------------------------------------------
	// Assignment operators.

	// Constructor from char*.
	constexpr
	This&	operator =(const char* x) {
		reconstruct(x);
		post_path_edit_reset();
		clean();
		return *this;
	}

	// Assignment operator from initializer list.
	constexpr
	This&	operator =(const std::initializer_list<char>& x) {
		reconstruct(x);
		post_path_edit_reset();
		clean();
		return *this;
	}

	// Copy assignment operator from "Pipe / CString / String".
	template <typename Array> requires (
		is_char<char>::value &&
		(
			is_Pipe<Array>::value ||
			is_CString<Array>::value ||
			is_String<Array>::value
		)
	) constexpr
	This&	operator =(const Array& x) {
		reconstruct(x);
		post_path_edit_reset();
		clean();
		return *this;
	}

	// Move assignment operator from "Pipe / CString / String".
	template <typename Array> requires (
		is_char<char>::value &&
		(
			is_Pipe<Array>::value ||
			// is_CString<Array>::value ||
			is_String<Array>::value
		)
	) constexpr
	This&	operator =(Array&&	x) {
		reconstruct(x);
		post_path_edit_reset();
		clean();
		return *this;
	}

	// Copy assignment operator.
	constexpr
	This&	operator =(const This& obj) {
		return copy(obj);
	}

	// Move assignment operator.
	constexpr
	This&	operator =(This&& obj) {
		return swap(obj);
	}

	// ---------------------------------------------------------
	// Property functions.
	
	// Get or set the type.
	/* 	@docs {
		@title: Type
		@description:
			Get or set the type.
		@warning:
			When the path does not exist the type is always "Path::types::unknown".
		@usage:
			vlib::Path x("/tmp");
			x.type() == Path::types::directory; ==> true;
			vlib::Path y("/tmp/newfile.txt");
			x.type() == Path::types::unknown; ==> true;
			y.type() = Path::types::file;
			x.type() == Path::types::file; ==> true;
	} */
	constexpr
	auto& 	type() {
		if (p_info.is_undefined() || p_info->type == types::unknown) { stat_wrapper(); }
		return p_info->type;
	}
	
	// Get atime.
	/* @docs {
		@title: Access time
		@description:
			Get the timestamp of the access in milliseconds.
		@warning:
			When the path does not exist or the attribute is undefined, the atime is always "-1".
	} */
	constexpr
	auto& 	atime() {
		if (p_info.is_undefined() || p_info->atime == -1) { stat_wrapper(); }
		return p_info->atime;
	}
	
	// Get mtime.
	/* @docs {
		@title: Modification time
		@description:
			Get the timestamp of the modification in milliseconds.
		@warning:
			When the path does not exist or the attribute is undefined, the mtime is always "-1".
	} */
	constexpr
	auto& 	mtime() {
		if (p_info.is_undefined() || p_info->mtime == -1) { stat_wrapper(); }
		return p_info->mtime;
	}
	
	// Get ctime.
	/* @docs {
		@title: Change time
		@description:
			Get the timestamp of the change in milliseconds.
		@warning:
			When the path does not exist or the attribute is undefined, the ctime is always "-1".
	} */
	constexpr
	auto& 	ctime() {
		if (p_info.is_undefined() || p_info->ctime == -1) { stat_wrapper(); }
		return p_info->ctime;
	}

	// Get the file size.
	/* @docs {
		@title: Size
		@description:
			Get the total file size in bytes.
		@warning:
			When the path does not exist or the attribute is undefined, the size is always "-1".
	} */
	constexpr
	auto&	size() {
		if (p_info.is_undefined() || p_info->size == -1) { stat_wrapper(); }
		return p_info->size;
	}

	// Get the path's permission.
	/* @docs {
		@title: Permission
		@description:
			Get the path's permission.
		@warning:
			When the path does not exist or the attribute is undefined, the permission is always undefined.
	} */
	constexpr
	auto&	permission() {
		if (p_info.is_undefined() || p_info->permission.is_undefined()) { stat_wrapper(); }
		return p_info->permission;
	}

	// Get the path's user.
	/* @docs {
		@title: User
		@description:
			Get the path's user.
		@warning:
			When the path does not exist or the attribute is undefined, the user is always undefined.
	} */
	constexpr
	auto&	user() {
		if (p_info.is_undefined() || p_info->user.is_undefined()) { stat_wrapper(); }
		return p_info->user;
	}
	
	/* @docs {
		@title: User id
		@description:
			Get the path's user id.
		@warning:
			When the path does not exist or the attribute is undefined, the user id is always undefined.
	} */
	constexpr
	auto&	uid() {
		if (p_info.is_undefined() || p_info->user.is_undefined()) { stat_wrapper(); }
		return p_info->user.uid();
	}

	// Get the path's group.
	/* @docs {
		@title: Group id
		@description:
			Get the path's group id.
		@warning:
			When the path does not exist or the attribute is undefined, the group is always undefined.
	} */
	constexpr
	auto&	gid() {
		if (p_info.is_undefined() || p_info->gid == -1) { stat_wrapper(); }
		return p_info->gid;
	}

	// Get the path's name with the extension.
	/* @docs {
	  @title: Full name
	  @description:
			Get the path's full name (with the extension).
	  @usage:
			vlib::Path x("/tmp/myfile.txt");
			x.full_name(); ==> "myfile.txt";
	} */
	constexpr
	String& full_name() {
		if (p_info.is_undefined()) { p_info = info{}; }
		else if (!p_info->full_name.is_undefined()) { return p_info->full_name; }
		ullong si = find<Backwards>('/');
		if (si == NPos::npos) {
			p_info->full_name.reconstruct(m_arr, m_len);
		} else {
			++si;
			p_info->full_name.reconstruct(m_arr + si, m_len - si);
		}
		return p_info->full_name;
	}
    constexpr
    String full_name() const {
        if (p_info->full_name.is_defined()) { return p_info->full_name; }
        ullong si = find<Backwards>('/');
        if (si == NPos::npos) {
            return String(m_arr, m_len);
        } else {
            ++si;
            return String(m_arr + si, m_len - si);
        }
    }

	// Get the path's name without the extension.
	/* @docs {
	  @title: Name
	  @description:
			Get the path's name without the extension.
	  @usage:
			vlib::Path x("/tmp/myfile.txt");
			x.name(); ==> "myfile";
	} */
	constexpr
	String& name() {
		if (p_info.is_undefined()) { p_info = info{}; }
		else if (!p_info->name.is_undefined()) { return p_info->name; }
		ullong si = find<Backwards>('/');
		ullong ei = find<Backwards>('.');
		if (si == NPos::npos && ei == NPos::npos) {
			p_info->name.reconstruct(m_arr, m_len);
			return p_info->name;
		}
		else if (si == NPos::npos) { si = 0; }
		else { ++si; }
		if (ei == NPos::npos) { ei = m_len; }
		if (si == ei) {
			p_info->name.reconstruct("", (ullong) 0);
		} else {
			p_info->name.reconstruct(m_arr + si, ei - si);
		}
		return p_info->name;
	}

	// Get the path's extension.
	/* @docs {
	  @title: Extension
	  @description:
			Get the path's extension.
			- Returns "" when the path does not have an extension.
	  @usage:
			vlib::Path x("/tmp/myfile.txt");
			x.extension(); ==> "txt";
	} */
	constexpr
	String& extension() {
		if (p_info.is_undefined()) { p_info = info{}; }
		else if (!p_info->extension.is_undefined()) { return p_info->extension; }
		ullong si = find<Backwards>('.');
		if (si == NPos::npos) {
			p_info->extension.reconstruct("", 0);
		} else {
			++si;
			p_info->extension.reconstruct(m_arr + si, m_len - si);
		}
		return p_info->extension;
	}
    
    // Check if the path is a file.
    /* @docs {
        @title: Is File
        @description:
            Check if the path is a file.
        @usage:
            vlib::Path x("/tmp");
            x.is_file() ==> false;
    } */
    constexpr
    Bool    is_file() {
        if (p_info.is_undefined() || p_info->type == types::unknown) { stat_wrapper(); }
        return p_info->type == types::file;
    }
    
    // Check if the path is a directory.
    /* @docs {
        @title: Is File
        @description:
            Check if the path is a file.
        @usage:
            vlib::Path x("/tmp");
            x.is_dir() ==> true;
    } */
    constexpr
    Bool    is_dir() {
        if (p_info.is_undefined() || p_info->type == types::unknown) { stat_wrapper(); }
        return p_info->type == types::directory;
    }

	// ---------------------------------------------------------
	// Functions.

	// Copy the object.
	/* @docs {
	  @title: Copy
	  @description:
			Copy the object.
	  @usage:
			vlib::Path x = "/tmp/dir";
			x.copy().join("myfile.txt"); ==> "/tmp/dir/myfile.txt"
	} */
	constexpr
	This 	copy() {
		This obj(m_arr, m_len, m_capacity);
		obj.p_info = p_info.copy();
		return obj;
	}
	constexpr
	This 	copy() const {
		This obj(m_arr, m_len, m_capacity);
		obj.p_info = p_info.copy();
		return obj;
	}

	// Reset all attributes.
	/* @docs {
	  @title: Reset
	  @description:
			Reset all attributes.
	  @usage:
			vlib::Path x = "/tmp/myfile.txt";
			x.reset(); ==> ""
	} */
	constexpr
	This& 	reset() {
		m_len = 0;
		if (m_arr) { m_arr[m_len] = '\0'; }
		post_path_edit_reset();
		return *this;
	}

	// Clean the path.
	/* @docs {
	  @title: Clean
	  @description:
			Clean the path.
	  @usage:
			vlib::Path x(" //tmp/myfile.txt ");
			x.clean(); ==> "/tmp/myfile.txt";
	} */
	constexpr
	This& 	clean() {
		unquote_r();
		replace_start_r(" ");
		replace_end_r(" ");
		replace_r("//", "/");
		if (m_len > 1 && m_arr[m_len - 1] == '/') {
			--m_len;
		}
		null_terminate();
		return *this;
	}

	// Check if the current user has access to the path.
	/* @docs {
	  @title: Access
	  @description:
			Check if the current user has access to the path.
	  @usage:
			vlib::Path x("/");
			x.access(); ==> false; // when executed without root permission.
	} */
	bool 	access() {
		return ::access(c_str(), F_OK) == 0;
	}
	bool 	read_access() {
		return ::access(c_str(), R_OK) == 0;
	}
	bool 	write_access() {
		return ::access(c_str(), W_OK) == 0;
	}
	bool 	exec_access() {
		return ::access(c_str(), X_OK) == 0;
	}

	// Get the numerical permission.
	// https://www.man7.org/linux/man-pages/man0/sys_stat.h.0p.html
	// https://jameshfisher.com/2017/02/24/what-is-mode_t/

	// Check if the path exists.
	/* @docs {
	  @title: Exists
	  @description:
		Check if the path exists.
	  @usage:
			$ mkdir /tmp/mydir
			vlib::Path x("/tmp/mydir");
			x.exists(); ==> true;
	} */
	bool 	exists() const {
		return ::access(c_str(), F_OK) == 0;
	}
    static inline
    bool    exists(const char* path) {
        return ::access(path, F_OK) == 0;
    }
    static inline
    bool    exists(const String& path) {
        return ::access(path.c_str(), F_OK) == 0;
    }

	// Get the path's base directory.
	/* 	@docs {
		@title: Base
		@description:
			Get the path's base directory.
			- Returns an empty `Path` when the path does not have a base.
		@usage:
			vlib::Path x("/tmp/dir/myfile.txt");
			x.base(); ==> "/tmp/dir";
			x.base(1); ==> "/tmp/dir";
			x.base(2); ==> "/tmp";
			x.base(3); ==> "/";
			x.base(4).is_undefined(); ==> true;
		@funcs: 3
	} */
	constexpr
	This& 	base_r() {
		const ullong index = find<Backwards>('/', 0, m_len);
		if (index == NPos::npos) {
			reconstruct(".", 1);
			return *this;
		}
		else if (index == 0) {
			reconstruct("/", 1);
			return *this;
		}
		slice_r(0, index);
		post_path_edit_reset();
		return *this;
	}
	constexpr
	This& 	base_r(ullong back) {
		ullong l_back = back;
		ullong index = m_len;
		while (l_back-- > 0 && index != NPos::npos) {
			index = find<Backwards>('/', 0, index);
		}
		if (index == NPos::npos) {
			reconstruct(".", 1);
			return *this;
		}
		else if  (index == 0) {
			reconstruct("/", 1);
			return *this;
		}
		slice_r(0, index);
		post_path_edit_reset();
		return *this;
	}
	template <typename... Args> constexpr
	This 	base(Args&&... args) const {
		return copy().base_r(args...);
	}

	// Join with a subpath.
	/* @docs {
		@title: Join
		@description: Join with a subpath.
		@usage:
			vlib::Path x("/tmp/dir");
			x.join("myfile.txt"); ==> "/tmp/dir/myfile.txt";
		@funcs: 4
	}*/
	constexpr
	This&	join_r(const char* subpath) {
        if (m_len != 0) {
            append('/');
        }
		concat_r(subpath);
		clean();
		return *this;
	}
	constexpr
	This&	join_r(const char* subpath, const ullong len) {
        if (m_len != 0) {
            append('/');
        }
		concat_r(subpath, len);
		clean();
		return *this;
	}
	constexpr
	This&	join_r(const This& subpath) {
        if (m_len != 0) {
            append('/');
        }
		concat_r(subpath);
		clean();
		return *this;
	}
	constexpr
	This&	join_r(const String& subpath) {
        if (m_len != 0) {
            append('/');
        }
		concat_r(subpath);
		clean();
		return *this;
	}
	template <typename... Args> constexpr
	This	join(Args&&... args) const {
		return copy().join_r(args...);
	}

	// Get the absolute path.
	/* 	@docs {
		@title: Absolute path
		@description:
			Get the absolute path.
		@return:
			Returns `0` when the operation was successfull, and the error code (`< 0`) upon failure.
		@usage:
			vlib::Path x("/tmp/dir/../file");
			x.abs_r(); ==> "/tmp/file";
	}*/
	auto&	abs_r() {
		This tmp;
		tmp.resize(PATH_MAX + 1);
		char* ctmp;
		if ((ctmp = realpath(c_str(), tmp.data())) == NULL) {
			throw CreateError(tostr("Unable to get the absolute path of \"", c_str(), "\" [", errno, "]."));
		}
		tmp.data() = ctmp;
		tmp.len() = vlib::len(ctmp);
		swap(tmp);
		return *this;
	}
	This	abs() const {
		This tmp;
		tmp.resize(PATH_MAX + 1);
		char* ctmp = realpath(c_str(), tmp.data());
		if (ctmp == NULL) {
			throw CreateError(tostr("Unable to get the absolute path of \"", c_str(), "\" [", errno, "]."));
		}
		tmp.data() = ctmp;
		tmp.len() = vlib::len(ctmp);
		return tmp;
	}
	
	// Create an empty file.
	/* @docs {
		@title: Touch
		@description: Create an empty file.
		@usage:
			vlib::Path x("/tmp/myfile.txt");
			x.touch();
        @notes:
            Only creates the file when the file does not exist.
	}*/
	void    touch(ushort permission = 0740) const {
        if (!exists()) {
            int fd;
            if ((fd = ::creat(c_str(), permission)) == -1) {
                throw CreateError(tostr("Unable to create path \"", c_str(), "\" [", errno, "]."));
            }
            ::close(fd);
        }
	}
    static inline
    void    touch(const String& path, ushort permission = 0740) {
        touch(path.c_str(), permission);
    }
	static inline
	void    touch(const char* path, ushort permission = 0740) {
        if (!exists(path)) {
            int fd;
            if ((fd = ::creat(path, permission)) == -1) {
                ::close(fd);
                throw CreateError(tostr("Unable to create path \"", path, "\" [", errno, "]."));
            }
            ::close(fd);
        }
	}
	
	// Create a directory.
	/*  @docs {
	 *  @title: Create directory
     *  @description:
     *      Create a directory.
     *
     *      No exceptions will be thrown when the path already exists.
     *
     *      Function `mkdir()` creates a directory for the main path. While function `mkdir_p()` recursively creates the base directories of the path when they do not exist. Therefore `mkdir_p()` is similair to `$ mkdir -p /tmp/dir1/dir2/dir3`.
     *  @usage:
     *      vlib::Path x("/tmp/dir");
     *      x.mkdir();
     *  @funcs: 2
     }*/
	void    mkdir(ushort permission = 0740) const {
        mkdir(c_str(), permission);
	}
    void    mkdir_p(ushort permission = 0740) const {
        mkdir_p(*this, permission);
    }
	static inline
	void    mkdir(const char* path, ushort permission = 0740) {
        errno = 0;
        if (::mkdir(path, permission) == -1 && errno != EEXIST) {
            throw CreateError(tostr("Unable to create directory \"", path, "\"."));
        }
	}
    static inline
    void    mkdir_p(const Path& path, ushort permission = 0740) {
        Path base = path.base();
        if (!base.exists()) {
            mkdir_p(base, permission);
        }
        mkdir(path.c_str(), permission);
    }
	
	// Set the owner & group of a path.
	/* @docs {
		@title: Set owner and group
		@description: Set the owner & group of a path.
		@usage:
			vlib::Path x("/tmp/dir");
			x.chown("someuser", "somegroup");
	}*/
	void    chown(uint uid, uint gid) {
		switch (::chown(c_str(), uid, gid)) {
			case 0: {
                if (p_info) {
                    p_info->user.reset();
                    p_info->gid = -1;
                }
				return ;
			};
			default:
                throw PermissionError(tostr("Unable to set the ownership and group of path \"", c_str(), "\"."));
		}
	}
	static inline
	void    chown(const char* path, uint uid, uint gid) {
		switch (::chown(path, uid, gid))  {
			case 0: return ;
			default:
                throw PermissionError(tostr("Unable to set the ownership and group of path \"", path, "\"."));
		}
	}
	
	// Set the owner & group of a path.
	/* @docs {
		@title: Set permission
		@description: Set the octal permission of a path.
		@usage:
			vlib::Path x("/tmp/dir");
			x.chmod(0740);
	}*/
	void    chmod(ushort permission) {
		switch (::chmod(c_str(), permission)) {
			case 0: {
                if (p_info) {
                    p_info->permission = permission;
                }
				return ;
			};
			default:
                throw PermissionError(tostr("Unable to set the permission of path \"", c_str(), "\"."));
		}
	}
	static inline
	void    chmod(const char* path, ushort permission) {
		switch (::chmod(path, permission)) {
			case 0: return ;
			default:
                throw PermissionError(tostr("Unable to set the permission of path \"", path, "\"."));
		};
	}
    
    // Set the atime & mtime of a path.
    /* @docs {
        @title: Set time
        @description: Set the atime & mtime in seconds of a path.
        @usage:
            vlib::Path x("/tmp/dir");
            x.set_time(time(NULL), time(NULL));
    }*/
    void    set_time(const time_t& atime, const time_t& mtime) {
        struct utimbuf totime {atime, mtime};
        switch (::utime(c_str(), &totime)) {
            case 0: {
                if (p_info) {
                    p_info->atime = atime;
                    p_info->mtime = mtime;
                }
                return ;
            };
            default:
                throw PermissionError(tostr("Unable to set the time of path \"", c_str(), "\"."));
        }
    }
	static inline
    void    set_time(const char* path, const mtime_t& atime, const time_t& mtime) {
        struct utimbuf totime {atime, mtime};
        switch (::utime(path, &totime)) {
            case 0: {
                return ;
            };
            default:
                throw PermissionError(tostr("Unable to set the time of path \"", path, "\"."));
        }
    }
	
	// Copy the path to another path.
	/* @docs {
		@title: Copy
		@description: Copy the file path to another file path.
		@usage:
			vlib::Path x("/tmp/src");
			x.cp("/tmp/dest");
		@funcs: 4
	}*/
	void	cp(const Path& dest) {
		cp(c_str(), dest.c_str());
	}
	void	cp(const char* dest) {
		cp(c_str(), dest);
	}
	static inline
	void	cp(const Path& src, const Path& dest) {
		cp(src.c_str(), dest.c_str());
	}
	static inline
	void	cp(const char* src, const char* dest) {
		
		// Vars.
		int sfd, dfd;
		
		// Open source file.
		if ((sfd = ::open(src, O_RDONLY)) == -1) {
			throw OpenError(tostr("Unable to open \"", src, "\" [", ::strerror(errno), "]."));
		}
        
        // Remove file.
        if (::remove(dest) != 0 && errno != ENOENT) {
            ::close(sfd);
            throw RemoveError(tostr("Unable to remove \"", dest, "\" [", ::strerror(errno), "]."));
        }
		
		// Create dest file.
        if ((dfd = ::open(dest, O_WRONLY | O_CREAT | O_TRUNC, 0740)) == -1) {
            ::close(sfd);
            throw CreateError(tostr("Unable to create \"", dest, "\" [", ::strerror(errno), "]."));
        }
		
		// Macos.
		#if defined(__APPLE__)
		
			// Copy.
			if (fcopyfile(sfd, dfd, 0, COPYFILE_ALL) == -1) {
                ::close(sfd);
                ::close(dfd);
				throw CopyError(tostr("Copy file error [", strerror(errno), "]."));
			}
		
			// Close.
			::close(sfd);
			::close(dfd);
		
		// Linux.
		#else
		
			// Get file info.
			struct stat stat_buf;
			if (::fstat(sfd, &stat_buf) != 0) {
				::close(sfd);
				::close(dfd);
				throw ScanError(tostr("Unable to scan \"", src, "\" [", ::strerror(errno), "]."));
			}
			
			/* V1 Copy
			- Is not reliable on all platforms.
			- Less reliable when the file already exists.
			- Some older versions have a 2GB limit.
			off_t offset = 0;
			ssize_t rc;
			if ((rc = ::sendfile(dfd, sfd, &offset, stat_buf.st_size)) == -1) {
                ::close(sfd);
                ::close(dfd);
				throw CopyError(tostr("Copy file error [", strerror(errno), "]."));
			}
			else if (rc != stat_buf.st_size) {
                ::close(sfd);
                ::close(dfd);
				throw CopyError("Incomplete transfer.");
			}
			*/
		
			// Open files.
			FILE* sfile = fdopen(sfd, "rb");
			FILE* dfile = fdopen(dfd, "wb");
			
			// Check err.
			if (sfile == NULL) {
				::close(sfd);
				::close(dfd);
				throw OpenError(tostr("Unable to open source \"", src, "\" [", ::strerror(errno), "]."));
			}
			if (dfile == NULL) {
				::close(dfd);
				::fclose(sfile);
				throw OpenError(tostr("Unable to destination \"", src, "\" [", ::strerror(errno), "]."));
			}
			
			// Read from source and write to dest.
			char buffer[1024 * 1024];
			size_t bytesRead;
			while ((bytesRead = fread(buffer, 1, sizeof(buffer), sfile)) > 0) {
				size_t bytesWritten = fwrite(buffer, 1, bytesRead, dfile);
				if (bytesWritten != bytesRead) {
					::fclose(sfile);
					::fclose(dfile);
					throw CopyError(tostr("Encountered an error while writing to \"", dest, "\" [", ::strerror(errno), "]."));
				}
			}
		
			// Set metadata.
			struct utimbuf totime {stat_buf.st_atim.tv_nsec, stat_buf.st_mtim.tv_nsec};
			if (::utime(dest, &totime) != 0) {
				::fclose(sfile);
				::fclose(dfile);
				throw PermissionError(tostr("Unable to set the time of path \"", dest, "\" [", ::strerror(errno), "]."));
			}
			if (::fchmod(dfd, stat_buf.st_mode & (S_IRWXU | S_IRWXG | S_IRWXO)) != 0) {
				::fclose(sfile);
				::fclose(dfile);
				throw PermissionError(tostr("Unable to set the permission of path \"", dest, "\" [", ::strerror(errno), "]."));
			};
			if (::fchown(dfd, stat_buf.st_uid, stat_buf.st_gid) != 0) {
				::fclose(sfile);
				::fclose(dfile);
				throw PermissionError(tostr("Unable to set the ownership and group of path \"", dest, "\" [", ::strerror(errno), "]."));
			}
			
			// Close.
			::fclose(sfile);
			::fclose(dfile);
		
		#endif
		
	}
	
	// Move the path to another path.
	/* @docs {
		@title: Move
		@description: Move the path to another path.
		@usage:
			vlib::Path x("/tmp/src");
			x.mv("/tmp/dest");
		@funcs: 4
	}*/
	void	mv(const Path& dest) {
		mv(c_str(), dest.c_str());
	}
	void	mv(const char*& dest) {
		mv(c_str(), dest);
	}
	static inline
	void	mv(const Path& src, const Path& dest) {
		mv(src.c_str(), dest.c_str());
	}
	static inline
	void	mv(const char* src, const char* dest) {
		switch (::rename(src, dest)) {
			case 0:
			default:
				throw MoveError(tostr("Unable to move \"", src, "\" to \"", dest, "\" [", errno, "]."));
		}
	}

	// Remove a file.
	/* @docs {
		@title: Remove
		@description: Remove a file.
		@usage:
			vlib::Path x("/tmp/dir");
			x.remove();
	}*/
	void	remove() {
        remove(c_str(), len());
        p_info = info{};
	}
    void    remove() const {
        remove(c_str(), len());
    }
    static inline
    void    remove(const String& path) {
        remove(path.c_str(), path.len());
    }
	static inline
	void	remove(const char* path, ullong len) {
        errno = 0;
        if (::remove(path) != 0 && errno != ENOENT) {
            if (errno == 66) {
                DIR *dir;
                if ((dir = ::opendir(path)) != NULL) {
                    struct dirent* ent;
                    while ((ent = ::readdir(dir)) != NULL) {
                        if (
                            !(ent->d_name[0] == '.' && ent->d_name[1] == '\0') &&
                            !(ent->d_name[0] == '.' && ent->d_name[1] == '.' && ent->d_name[2] == '\0')
                        ) {
                            String x;
                            x.concat_r(path, len);
                            x.append('/');
                            x.concat_r(ent->d_name);
                            remove(x.c_str(), x.len());
                        }
                    }
                    ::closedir(dir);
                    free(ent);
                    if (::remove(path) != 0 && errno != ENOENT) {
                        throw RemoveError(tostr("Unable to remove path \"", path, "\" [", errno, "]."));
                    }
                } else {
                    throw RemoveError(tostr("Unable to read path \"", path, "\" [", errno, "]."));
                }
            } else {
                throw RemoveError(tostr("Unable to remove path \"", path, "\" [", errno, "]."));
            }
        }
	}

	// Load a file.
	/* @docs {
		@title: Load
		@description: Load a file.
		@usage:
			vlib::Path x("/tmp/myfile.txt");
			String str0 = x.load();
	}*/
	String	load() const {
		return String::load(c_str());
	}
    static
    String  load(const String& path) {
        return String::load(path);
    }

	// Save a file.
	/* @docs {
		@title: Save
		@description: Save data to a file.
		@usage:
			vlib::Path x("/tmp/myfile.txt");
			x.save("Hello World!");
	}*/
	auto& 	save(
		const String& 	data				// the file data.
	) const {
		data.save(c_str());
		return *this;
	}
	auto& 	save(
		const char* data,		// the file data.
		ullong 		len			// the file data length.
	) const {
        save(c_str(), data, len);
        return *this;
	}
    static inline
    void    save(
        const String&  path,
        const String&  data
    ) {
        save(path.c_str(), data.data(), data.len());
    }
    static inline
    void    save(
        const char*     path,
        const char*     data,        // the file data.
		ullong   		len            // the file data length.
    ) {
        switch (vlib::save(path, data, len)) {
        case file::error::open:
            throw OpenError(String() << "Unable to open file \"" << path << "\" [" << ::strerror(errno) << "].");
        case file::error::read:
            throw ReadError(String() << "Unable to read file \"" << path << "\" [" << ::strerror(errno) << "].");
        case file::error::write:
            throw WriteError(String() << "Unable to write to file \"" << path << "\" [" << ::strerror(errno) << "].");
        }
    }
	
	// Sync.
	/* @docs {
		@title: Sync
		@description: Synchronize local paths.
		@notes: Function `sync` can be used for files & directories.
		@usage:
			vlib::Path x("/tmp/src");
			x.sync("/tmp/dest");
		@funcs: 3
	}*/
	void	sync(
		const Path&   		dest,
		const SyncOptions&  options = { .del = false, .overwrite = false }
	) const {
		sync(*this, dest, options);
	}
	static inline
	void	sync(
		const Path&   		src,
		const Path&   		dest,
		const SyncOptions&  options = { .del = false, .overwrite = false }
	);
    
    // Rsync.
    // constexpr
    // auto&     rsync(
    //     const String&   remote,
    //     const String&   options = "-azq",
    //     const Int&      timeout = -1
    // ) const;
    // constexpr
    // auto&     rsync_file(
    //     const String&   remote,
    //     const String&   options = "-azq",
    //     const Int&      timeout = -1
    // ) const;
    // template <typename Proc> constexpr
    // auto&     rsync_h(
    //     const String&   remote,
    //     const String&   options = "-azq",
    //     const Int&      timeout = -1,
    //     const Bool&     file = false
    // ) const {
    //     Proc proc { .timeout = timeout.value(), };
    //     String l = copy();
    //     String r = remote.copy();
    //     if (!file) {
    //         l.append('/');
    //         r.append('/');
    //     }
    //     if (proc.execute(tostr("rsync ", options, ' ', l, ' ', r)) != 0) {
    //         throw CopyError(tostr("Failed to synchronize \"", *this, "\" with \"", remote, "\"."));
    //     }
    //     if (proc.exit_status() != 0) {
    //         throw CopyError(tostr("Failed to synchronize \"", *this, "\" with \"", remote, "\"."));
    //     }
    //     return *this;
    // }
    
    // Link.
    /* @docs {
        @title: Link
        @description: Create a symbolic link.
        @usage:
            vlib::Path x("/tmp/myfile.txt");
            x.link("/tmp/myotherfile.txt");
    }*/
    constexpr
    auto&     link(
        const String&   remote,
        const String&   options = "-s",
        const Int&      timeout = -1
    ) const;
    template <typename Proc> constexpr
    auto&     link_h(
        const String&   remote,
        const String&   options = "-s",
        const Int&      timeout = -1
    ) const {
        Proc proc { .timeout = timeout.value(), };
        if (proc.execute(tostr("rm -fr ", remote, " && ln ", options, ' ', *this, ' ', remote)) != 0) {
            throw LinkError(tostr("Failed to link \"", *this, "\" with \"", remote, "\"."));
        }
        if (proc.exit_status() != 0) {
            throw LinkError(tostr("Failed to link \"", *this, "\" with \"", remote, "\"."));
        }
        return *this;
    }
	
	// Get all paths from a directory.
	/*  @docs {
	 *	@title: Paths
	 *	@description: Get all paths from a directory.
	 *  @parameter: {
	 *      @name: recursive
	 *      @description: Get all the paths recursively for each sub directory.
	 *  }
	 *  @parameter: {
	 *      @name: exclude
	 *      @description: The sub paths to exclude.
	 *  }
	 *  @parameter: {
	 *      @name: exclude_names
	 *      @description: The path names to exclude.
	 *  }
	 *	@usage:
	 *		 for (auto& i: vlib::Path("/tmp/").paths()) {
	 *			 ...
	 *		 }
	 }*/
    Array<Path> paths(
		bool recursive = false,
		const Array<String>& exclude = {},
		const Array<String>& exclude_names = {}
	) const {
		return paths_h(types::any, recursive, c_str(), m_len, m_len, exclude, exclude_names);
	}

	// Get all files from a directory.
	/* @docs {
	 *	@title: Files
	 *	@description: Get all files from a directory.
	 *  @parameter: {
	 *      @name: recursive
	 *      @description: Get all the paths recursively for each sub directory.
	 *  }
	 *  @parameter: {
	 *      @name: exclude
	 *      @description: The sub paths to exclude.
	 *  }
	 *  @parameter: {
	 *      @name: exclude_names
	 *      @description: The full name of paths to exclude.
	 *  }
	 *	@usage:
	 *		 for (auto& i: vlib::Path("/tmp/").paths()) {
	 *			 ...
	 *		 }
	 *	@usage:
	 *		 for (auto& i: vlib::Path("/tmp/").files()) {
	 *			 vlib::out << i << " (" << i.size() << " bytes). \n";
	 *		 }
	 }*/
    Array<Path> files(
		bool recursive = false,
		const Array<String>& exclude = {},
		const Array<String>& exclude_names = {}
	) const {
		return paths_h(types::file, recursive, c_str(), m_len, m_len, exclude, exclude_names);
	}
	
	// Get all directories from a directory.
	/* @docs {
	 *	@title: Directories
	 *	@description: Get all directories from a directory.
	 *  @parameter: {
	 *      @name: recursive
	 *      @description: Get all the paths recursively for each sub directory.
	 *  }
	 *  @parameter: {
	 *      @name: exclude
	 *      @description: The sub paths to exclude.
	 *  }
	 *  @parameter: {
	 *      @name: exclude_names
	 *      @description: The full name of paths to exclude.
	 *  }
	 *	@usage:
	 *		 for (auto& i: vlib::Path("/tmp/").paths()) {
	 *			 ...
	 *		 }
	 *	@usage:
	 *		 for (auto& i: vlib::Path("/tmp/").dirs()) {
	 *			 ...
	 *		 }
	 }*/
    Array<Path> dirs(
		bool recursive = false,
		const Array<String>& exclude = {},
		const Array<String>& exclude_names = {}
	) const {
		return paths_h(types::directory, recursive, c_str(), m_len, m_len, exclude, exclude_names);
	}

	// Get all symbolic links from a directory.
	/*  @docs {
	 *	@title: Links
	 *	@description: Get all symbolic links from a directory.
	 *  @parameter: {
	 *      @name: recursive
	 *      @description: Get all the paths recursively for each sub directory.
	 *  }
	 *  @parameter: {
	 *      @name: exclude
	 *      @description: The sub paths to exclude.
	 *  }
	 *  @parameter: {
	 *      @name: exclude_names
	 *      @description: The full name of paths to exclude.
	 *  }
	 *	@usage:
	 *		 for (auto& i: vlib::Path("/tmp/").paths()) {
	 *			 ...
	 *		 }
	 *	@usage:
	 *		 for (auto& i: vlib::Path("/tmp/").links()) {
	 *			 ...
	 *		 }
	 }*/
    Array<Path> links(
		bool recursive = false,
		const Array<String>& exclude = {},
		const Array<String>& exclude_names = {}
	) const {
		return paths_h(types::symbolic_link, recursive, c_str(), m_len, m_len, exclude, exclude_names);
	}

	// Get all socket paths from a directory.
	/*  @docs {
	 *	@title: Sockets
	 *	@description: Get all socket paths from a directory.
	 *  @parameter: {
	 *      @name: recursive
	 *      @description: Get all the paths recursively for each sub directory.
	 *  }
	 *  @parameter: {
	 *      @name: exclude
	 *      @description: The sub paths to exclude.
	 *  }
	 *  @parameter: {
	 *      @name: exclude_names
	 *      @description: The full name of paths to exclude.
	 *  }
	 *	@usage:
	 *		 for (auto& i: vlib::Path("/tmp/").paths()) {
	 *			 ...
	 *		 }
	 *	@usage:
	 *		 for (auto& i: vlib::Path("/tmp/").sockets()) {
	 *			 ...
	 *		 }
	 }*/
    Array<Path> sockets(
		bool recursive = false,
		const Array<String>& exclude = {},
		const Array<String>& exclude_names = {}
	) const {
		return paths_h(types::socket, recursive, c_str(), m_len, m_len, exclude, exclude_names);
	}

	// Get all block device paths from a directory.
	/*  @docs {
	 *	@title: Block devices
	 *	@description: Get all block device paths from a directory.
	 *  @parameter: {
	 *      @name: recursive
	 *      @description: Get all the paths recursively for each sub directory.
	 *  }
	 *  @parameter: {
	 *      @name: exclude
	 *      @description: The sub paths to exclude.
	 *  }
	 *  @parameter: {
	 *      @name: exclude_names
	 *      @description: The full name of paths to exclude.
	 *  }
	 *	@usage:
	 *		 for (auto& i: vlib::Path("/tmp/").paths()) {
	 *			 ...
	 *		 }
	 *	@usage:
	 *		 for (auto& i: vlib::Path("/tmp/").bdevices()) {
	 *			 ...
	 *		 }
	 }*/
    Array<Path> bdevices(
		bool recursive = false,
		const Array<String>& exclude = {},
		const Array<String>& exclude_names = {}
	) const {
		return paths_h(types::block_device, recursive, c_str(), m_len, m_len, exclude, exclude_names);
	}

	// Get all char device paths from a directory.
	/*  @docs {
	 *	@title: Char devices
	 *	@description: Get all char device paths from a directory.
	 *  @parameter: {
	 *      @name: recursive
	 *      @description: Get all the paths recursively for each sub directory.
	 *  }
	 *  @parameter: {
	 *      @name: exclude
	 *      @description: The sub paths to exclude.
	 *  }
	 *  @parameter: {
	 *      @name: exclude_names
	 *      @description: The full name of paths to exclude.
	 *  }
	 *	@usage:
	 *		 for (auto& i: vlib::Path("/tmp/").paths()) {
	 *			 ...
	 *		 }
	 *	@usage:
	 *		 for (auto& i: vlib::Path("/tmp/").cdevices()) {
	 *			 ...
	 *		 }
	 }*/
    Array<Path> cdevices(
		bool recursive = false,
		const Array<String>& exclude = {},
		const Array<String>& exclude_names = {}
	) const {
		return paths_h(types::char_device, recursive, c_str(), m_len, m_len, exclude, exclude_names);
	}

	// Get all pipe paths from a directory.
	/*  @docs {
	 *	@title: Pipes
	 *	@description: Get all pipe paths from a directory.
	 *  @parameter: {
	 *      @name: recursive
	 *      @description: Get all the paths recursively for each sub directory.
	 *  }
	 *  @parameter: {
	 *      @name: exclude
	 *      @description: The sub paths to exclude.
	 *  }
	 *  @parameter: {
	 *      @name: exclude_names
	 *      @description: The full name of paths to exclude.
	 *  }
	 *	@usage:
	 *		 for (auto& i: vlib::Path("/tmp/").paths()) {
	 *			 ...
	 *		 }
	 *	@usage:
	 *		 for (auto& i: vlib::Path("/tmp/").pipes()) {
	 *			 ...
	 *		 }
	 }*/
    Array<Path> pipes(
		bool recursive = false,
		const Array<String>& exclude = {},
		const Array<String>& exclude_names = {}
	) const {
		return paths_h(types::pipe, recursive, c_str(), m_len, m_len, exclude, exclude_names);
	}

	// ---------------------------------------------------------
	// Helper functions.

	// Parse a DT_X type from dirent.
	constexpr
	char	parse_dt_type(uchar type) const {
		switch (type) {               //bitwise AND to determine file type
			case DT_SOCK:  	return types::socket;
			case DT_LNK:   	return types::symbolic_link;
			case DT_REG:   	return types::file;
			case DT_BLK:   	return types::block_device;
			case DT_DIR:    return types::directory;
			case DT_CHR:	return types::char_device;
			case DT_FIFO:   return types::pipe;
			default: 		return types::unknown;
		}
	}

	// Get all specified type paths from a directory, optionally recursive.
	// - Use type 'a' for all.
	// - The directories "." and ".." are not included.
	Array<Path> paths_h(
		uchar type,									// the wanted type.
		bool recursive,								// get recursively.
		const char* path,							// the path.
		ullong len,									// the length of the path.
		ullong root_path_len = 0, 					// the length of the root path that is parsed, required for "exclude".
		const Array<String>& exclude = {},			// an array with subpaths to exclude.
		const Array<String>& exclude_names = {}		// exclude names.
	) const {
		Array<Path> arr;
		DIR *dir;
		struct dirent* ent;
		char d_type;
		if ((dir = ::opendir(path)) != NULL) {
			while ((ent = ::readdir(dir)) != NULL) {
				
				// Skip dirs "." and "..".
				if (
					!(ent->d_name[0] == '.' && ent->d_name[1] == '\0') &&
					!(ent->d_name[0] == '.' && ent->d_name[1] == '.' && ent->d_name[2] == '\0')
				) {
					d_type = parse_dt_type(ent->d_type);
					if (type == any || type == d_type) {
						
						// Exclude by names.
						if (exclude_names.is_defined() && exclude_names.contains(ent->d_name)) {
							continue;
						}
						
						// Construct path.
						Path x;
						x.concat_r(path, len);
						x.append('/');
						x.concat_r(ent->d_name);
						x.clean();
						
						// Exclude by sub paths.
						if (exclude.is_defined() && root_path_len != 0) {
							bool skip = false;
							for (auto& i: exclude) {
								if (i.eq(x.data() + (root_path_len + 1), x.len() - root_path_len - 1)) { // 1 for the / character.
									skip = true;
									break;
								}
							}
							if (skip) {
								continue;
							}
						}
						
						// Set path info.
						x.p_info = info {
							.type = d_type,
							.size = ent->d_reclen,
							.full_name = ent->d_name,
						};
						
						// Append.
						arr.append(x);
						
						// Recursive.
						if (recursive && d_type == directory) {
							arr.concat_r(
								paths_h(
									type,
									recursive,
									arr.last().data(),
									arr.last().len()
								)
							);
						}
						
					}
				}
			}
			::closedir(dir);
			free(ent);
			return arr;
		} else {
			throw ParseError(tostr("Unable to read the content of directory ", json().data(), "."));
			return arr;
		}
	};

	// ---------------------------------------------------------
	// Casts.

	// Get as String.
	/* @docs {
	  @title: str
	  @description:
			Get as `String`.
	  @usage:
			vlib::Path x(...);
			String y = x.str();
	} */
	constexpr
	String	str() const {
		return *this;
	}

	//
};

// ---------------------------------------------------------
// Instances.

// Is instance.
template<>				struct is_instance<Path, Path>	{ SICEBOOL value = true;  };

// Is type.
template<typename Type> struct is_Path 					{ SICEBOOL value = false; };
template<> 				struct is_Path<Path> 			{ SICEBOOL value = true;  };

// ---------------------------------------------------------
// Shortcuts.

namespace types { namespace shortcuts {

using Path =		vlib::Path;

}; 		// End namespace sockets.
}; 		// End namespace shortcuts.

// ---------------------------------------------------------
// End.

}; 		// End namespace vlib.
#endif 	// End header.
