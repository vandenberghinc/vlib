// Author: Daan van den Bergh
// Copyright: © 2022 Daan van den Bergh.

// Header.
#ifndef VLIB_FILE_H
#define VLIB_FILE_H

// Includes.
#include <stdio.h>
#include <fcntl.h>

// Namespace vlib.
namespace vlib {

namespace file {
// Source: https://www.man7.org/linux/man-pages/man3/fopen.3.html
enum mode {
	read =		O_RDWR,
	write =		O_RDWR | O_CREAT | O_TRUNC,
	append = 	O_RDWR | O_CREAT | O_APPEND,
};
};

// Safely open file.
//
// The returned `FILE*` is `nullptr` when an error occured.
//
// CWE-732: Do not use fopen but fdopen due to world-wide permissions.
//
inline
FILE*	open(const char* path, int mode, int permission = 0640) {
	int fd = ::open(path, mode, permission);
	if (fd == -1) { return nullptr; }
	FILE* f;
	switch (mode) {
		case file::mode::append:
			f = fdopen(fd, "a");
			break;
		case file::mode::write:
			f = fdopen(fd, "w");
			break;
		case file::mode::read:
		default: // on an invalid file open with read permission.
			f = fdopen(fd, "r");
			break;
	}
	if (f == NULL) { f = nullptr; }
	return f;
}

// Load a file.
// - Returns 0 on success, < 0 on failure.
// - The data buffer will be deleted, so by default it should be initialized with "nullptr".
// - The data buffer will always be deleted upon failure.
// - Max size of "len" is the max of a "ulong".
inline
int 	load(
	const char* 	path, 	// the file path.
	char*& 			data, 	// a reference to the data buffer, will be deleted before read (only for output).
	ullong&			len		// a reference to the length of the data buffer (only for output).
) {
	delete[] data;
	FILE *f = open(path, file::read);
	if (f == nullptr) {
		data = nullptr;
		return file::error::open;
	}
	fseek(f, 0, SEEK_END);
	len = (ullong) ftell(f);
	fseek(f, 0, SEEK_SET);
	data = new char [len + 1];
	if (fread(data, sizeof(char), len, f) != len) {
		delete[] data;
		data = nullptr;
		fclose(f);
		return file::error::read;
	}
	fclose(f);
	data[len] = '\0';
	return 0;
}

// Save a file.
// - Returns 0 on success, < 0 on failure.
// - Max size of "len" is the max of a "ulong".
inline
int 	save(
	const char* 	path, 	// the file path.
	const char*		data, 	// the data to save.
	ullong			len		// the data length.
) {
	if (len == 0) {
		return 0;
	}
	FILE *f = open(path, file::write);
	if (!f) {
		return file::error::open;
	}
	fseek(f, 0, SEEK_SET);
	if (fwrite(data, len, 1, f) != 1) {
		fclose(f);
		return file::error::write;
	}
	fclose(f);
	return 0;
}

}; 		// End namespace vlib.
#endif 	// End header.
