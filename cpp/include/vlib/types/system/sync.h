/*
 Author: Daan van den Bergh
 Copyright: © 2022 Daan van den Bergh.
 
 Synchronize multiple file paths.
 
 Library VSS is dependend on this file.
*/

// Header.
#ifndef VLIB_SYNC_H
#define VLIB_SYNC_H

// Namespace vlib.
namespace vlib {

// Namespace internal.
namespace internal {

// ---------------------------------------------------------
// Structs.

struct ScanInfo {
	String  path;
	time_t  atime;
	time_t  mtime;
	short   permission;
	String  owner;
	Int     uid;
	String  group;
	Int     gid;
	ullong  size;
	Bool    is_dir;
	
	// Is defined.
	constexpr
	bool is_defined() const {
		return path.is_defined();
	}
	
	// Is undefined.
	constexpr
	bool is_undefined() const {
		return path.is_undefined();
	}
	
	// Parse.
	// Note that not all attributes are parsed, merely the ones required by "Client::push" and "Client::pull".
	SICE
	ScanInfo parse(const char* data, ullong len) {
		ullong start = 0;
		short mode = 0;
		ScanInfo info;
		for (ullong i = 0; i < len; ++i) {
			auto& c = data[i];
			switch (c) {
				case ':':
					switch (mode) {
						case 0:
							info.path.reconstruct(data, i);
							mode = 1;
							break;
						case 1:
							info.atime = vlib::to_num<time_t>(data + start, i - start);
							mode = 2;
							break;
						case 2:
							info.mtime = vlib::to_num<time_t>(data + start, i - start);
							mode = 3;
							break;
						case 3:
							info.permission = vlib::to_num<short>(data + start, i - start);
							mode = 4;
							break;
						case 4:
							info.owner.reconstruct(data + start, i - start);
							mode = 5;
							break;
						case 5:
							info.group.reconstruct(data + start, i - start);
							if (i + 1 >= len) {
								throw ParseError("Unsupported format.");
							}
							info.is_dir = data[i + 1] == '1';
							return info;
						default:
							throw ParseError("Unsupported format.");
					}
					start = i + 1;
					continue;
				default:
					continue;
			}
		}
		return info;
	}
	
	// To string.
	// Note that not all attributes are displayed, merely the ones required by "Client::push" and "Client::pull".
	constexpr
	String  json() const {
		return String() << path << ':' << atime << ':' << mtime << ':' << permission << ':' << owner << ':' << group << ':' << (is_dir == true ? '1' : '0');
	}
	
};

// ---------------------------------------------------------
// Internal functions.

// Check a single path.
ScanInfo scan_file(const char* path) {
	struct stat sinfo;
	ScanInfo info {
		.path = path,
	};
	if (stat(path, &sinfo) == 0) {
		if (sinfo.st_mode & S_IFREG) {
			info.is_dir = false;
		} else if (sinfo.st_mode & S_IFDIR) {
			info.is_dir = true;
		} else {
			throw ParseError(to_str("Type of path \"", path, "\" is not supported."));
		}
		info.permission = sinfo.st_mode & (S_IRWXU | S_IRWXG | S_IRWXO);
		info.uid = sinfo.st_uid;
		info.gid = sinfo.st_gid;
		info.owner = User::get_name(sinfo.st_uid);
		try {
			info.group = Group::get_name(sinfo.st_gid);
		} catch (vlib::Exception& e) {
			info.group = info.owner;
		}
		info.size = sinfo.st_size;
#if OSID <= 0 || OSID >= 4
		info.atime = sinfo.st_atim.tv_nsec;
		info.mtime = sinfo.st_mtim.tv_nsec;
#elif OSID == 1
		info.atime = Date::get_seconds(sinfo.st_atimespec);
		info.mtime = Date::get_seconds(sinfo.st_mtimespec);
#else
		throw OSError("vss:Sync", "Function not supported for current operating system.");
#endif
	} else {
		throw ParseError(to_str("Unable to scan path \"", path, "\"."));
	}
	return info;
}

// Scan a directory's timestamps.
// Uses the first base path, not the base of the path to scan.
void    scan_dir(Array<ScanInfo>& paths, const String& base, const char* path, ullong len) {
	DIR *dir;
	struct dirent* ent;
	struct stat sinfo;
	if (!Path::exists(path)) { return ; }
	if ((dir = ::opendir(path)) != NULL) {
		while ((ent = ::readdir(dir)) != NULL) {
			if (
				!(ent->d_name[0] == '.' && ent->d_name[1] == '\0') &&
				!(ent->d_name[0] == '.' && ent->d_name[1] == '.' && ent->d_name[2] == '\0')
				) {
					String full_path (path, len);
					full_path.append('/');
#if OSID == 1
					full_path.concat_r(ent->d_name, ent->d_namlen);
#else
					full_path.concat_r(ent->d_name, vlib::len(ent->d_name));
#endif
					ScanInfo info {
						.path = String(full_path.data() + base.len(), full_path.len() - base.len()),
						.is_dir = ent->d_type == DT_DIR,
					};
					if (stat(full_path.c_str(), &sinfo) == 0) {
						info.permission = sinfo.st_mode & (S_IRWXU | S_IRWXG | S_IRWXO);
						info.size = sinfo.st_size;
#if OSID <= 0 || OSID >= 4
						info.atime = sinfo.st_atim.tv_nsec;
						info.mtime = sinfo.st_mtim.tv_nsec;
#elif OSID == 1
						info.atime = Date::get_seconds(sinfo.st_atimespec);
						info.mtime = Date::get_seconds(sinfo.st_mtimespec);
#else
						throw OSError("vss:Sync", "Function not supported for current operating system.");
#endif
						info.uid = sinfo.st_uid;
						info.gid = sinfo.st_gid;
						info.owner = User::get_name(sinfo.st_uid);
						try {
							info.group = Group::get_name(sinfo.st_gid);
						} catch (vlib::Exception& e) {
							info.group = info.owner;
						}
					}
					if (info.is_dir) {
						paths.append(info);
						scan_dir(paths, base, full_path.c_str(), full_path.len());
					} else {
						paths.append(info);
					}
				}
		}
		::closedir(dir);
		free(ent);
	}
	else {
		throw ParseError(to_str("Unable to read the content of directory \"", path, "\"."));
	}
}
Array<ScanInfo> scan_dir(const Path& path) {
	Path abs = path.abs();
	Array<ScanInfo> paths;
	internal::scan_dir(paths, abs, abs.c_str(), abs.len());
	return paths;
}

// Compare scans.
void    compare_scans(
	Array<const ScanInfo*>& dirs,
	Array<const ScanInfo*>& files,
	Array<const String*>& deletions,
	const Array<ScanInfo>& src_scan,
	const Array<ScanInfo>& dest_scan,
	const Path::SyncOptions& options
) {
	
	// Thread.
	struct Results {
		Array<const ScanInfo*> dirs, files;
		Array<const String*> deletions;
	};
	auto do_thread = [&src_scan, &dest_scan, &options](ullong start, ullong end) -> Results* {
		
		Results* results = new Results;
		
		// Check push and dirs.
		for (auto& f: src_scan.iterate(start, end)) {
			bool update = true;
			if (f.is_dir) {
				for (auto& t: dest_scan) {
					if (f.path == t.path) {
						update = false;
						break;
					}
				}
			} else {
				for (auto& t: dest_scan) {
					if (f.path == t.path) {
						if (f.mtime == t.mtime) {
							update = false;
						} else if (f.mtime > t.mtime) {
							update = true;
						} else if (options.overwrite && f.mtime < t.mtime) {
							update = true;
						} else if (f.is_dir != t.is_dir) {
							update = false;
						}
						break;
					}
				}
			}
			if (update) {
				if (f.is_dir) {
					results->dirs.append(&f);
				} else {
					results->files.append(&f);
				}
			}
		}
		
		// Check deletions.
		if (options.del) {
			for (auto& t: src_scan.iterate(start, end)) {
				Bool update = true;
				for (auto& f: dest_scan) {
					if (t.path == f.path) {
						update = false;
						break;
					}
				}
				if (update) {
					results->deletions.append(&t.path);
				}
			}
		}
		
		// Handler.
		return results;
		
	};
	
	// Start threads.
	uint max_threads = 10;
	vlib::ThreadPool thread_pool(max_threads);
	uint index = 0, start = 0, step = (uint) src_scan.len() / max_threads;
	for (auto& thread: thread_pool) {
		if (index == max_threads - 1) {
			thread.start(do_thread, start, src_scan.len());
		} else {
			thread.start(do_thread, start, start + step);
		}
		start += step;
		++index;
	}
	for (auto& thread: thread_pool) {
		Results* res;
		thread.join(res);
		dirs.concat_r(res->dirs);
		files.concat_r(res->files);
		deletions.concat_r(res->deletions);
		delete res;
	}
	
}

// ---------------------------------------------------------
// End.

}; 		// End namespace internal.

// Define function Path::sync.
void    Path::sync(
	const Path& src,
	const Path& dest,
	const SyncOptions& options
) {
	
	// Vars.
	Array<internal::ScanInfo> src_scan, dest_scan;
	Array<const internal::ScanInfo*> dirs, files;
	Array<const String*> deletions;
	Path subpath;
	// vlib::SpeedTest speed_test;
	
	// Scan.
	// speed_test.start("Scanning");
	src_scan = internal::scan_dir(src);
	if (dest.exists()) {
		dest_scan = internal::scan_dir(dest);
	}
	// speed_test.end();
	
	// Compare.
	// speed_test.start("Comparing");
	internal::compare_scans(dirs, files, deletions, src_scan, dest_scan, options);
	
	// Calculate size.
	ullong size = 0;
	for (auto& i: files) {
		size += i->size;
	}
	float gb = float(size) / (1024 * 1024 * 1024);
	// speed_test.end();
	
	// Delete dirs.
	// speed_test.start("Deletions");
	for (auto& i: deletions) {
		dest.join(*i).remove();
	}
	// speed_test.end();
	
	// Create dirs.
	// speed_test.start("Create directories");
	if (!dest.exists()) {
		dest.mkdir();
	}
	Path l_src = src, l_dest = dest;
	l_dest.chmod(l_src.permission());
	l_dest.set_time(l_src.atime(), l_src.mtime());
	l_dest.chown(l_src.uid(), l_src.gid());
	for (auto& i: dirs) {
		subpath = dest.join(i->path);
		subpath.mkdir();
		subpath.chmod(i->permission);
		subpath.set_time(i->atime, i->mtime);
		subpath.chown(i->uid.value(), i->gid.value());
	}
	// speed_test.end();
	
	// Save files single process.
	if (gb <= 0.25) { // 10GB
		// speed_test.start("Save files");
		constexpr ullong buff_capacity = 1024 * 1024;
		#if defined(__APPLE__)
			char* buff = NULL;
		#elif defined(__linux__)
			char* buff = new char [buff_capacity];
		#else
			#error "The current operating system is not supported."
		#endif
		Path s, d;
		for (auto& i: files) {
			s = src.join(i->path);
			d = dest.join(i->path);
			Path::cp(s.c_str(), d.c_str(), buff, buff_capacity);
		}
		#if defined(__linux__)
			delete[] buff;
		#endif
		// speed_test.end();
	}
	
	// Save files in parralel.
	else {
		// speed_test.start("Save files");
		auto save_files = [&dest, &src](const Array<const internal::ScanInfo*>* files) -> Exception* {
			try {
				Path subpath;
				constexpr ullong buff_capacity = 1024 * 1024;
				#if defined(__APPLE__)
					char* buff = NULL;
				#elif defined(__linux__)
					char* buff = new char [1024 * 1024];
				#else
					#error "The current operating system is not supported."
				#endif
				Path s, d;
				for (auto& i: *files) {
					s = src.join(i->path);
					d = dest.join(i->path);
					Path::cp(s.c_str(), d.c_str(), buff, buff_capacity);
				}
				#if defined(__linux__)
					delete[] buff;
				#endif
				return NULL;
			} catch (Exception& e) {
				return new Exception(e);
			}
		};
		int max_threads;
		if (gb <= 0.25) {
			max_threads = 5;
		} else if (gb <= 0.5) {
			max_threads = 10;
		} else if (gb <= 1.0) {
			max_threads = 15;
		} else if (gb <= 1.5) {
			max_threads = 20;
		} else {
			max_threads = 25;
		}
		vlib::ThreadPool thread_pool (max_threads);
		const Array<Array<const internal::ScanInfo*>> div = files / max_threads;
		uint i = 0;
		for (auto& t: thread_pool) {
			t.start(save_files, &div[i]);
			++i;
		}
		Exception error;
		Bool success = true;
		for (auto& t: thread_pool) {
			Exception* e;
			t.join(e);
			if (e != NULL) {
				error = *e;
				success = false;
				delete e;
			}
		}
		if (!success) {
			throw error;
		}
		// speed_test.end();
	}
	
	// Set timestamps.
	// speed_test.start("Set timestamps");
	for (auto& i: dirs) {
		dest.join(i->path).set_time(i->atime, i->mtime);
	}
	// speed_test.end();
	
	// speed_test.dump();
	
}


// ---------------------------------------------------------
// End.

}; 		// End namespace vlib.
#endif 	// End header.
