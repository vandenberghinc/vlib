// Author: Daan van den Bergh
// Copyright: © 2022 Daan van den Bergh.

// Header.
#ifndef VLIB_STACKTRACE_H
#define VLIB_STACKTRACE_H

// Includes.
#include <iostream>
#include <execinfo.h>
#include <dlfcn.h>
#include <dlfcn.h>
#if defined(__APPLE__)
    #include <mach-o/dyld.h>
#else
    #include <link.h>
#endif

// Enable stacktrace.
#ifndef vlib_enable_trace
#define vlib_enable_trace true
#endif

// Max stacktrace.
#ifndef vlib_max_trace
#define vlib_max_trace 32
#endif

// Namespace vlib.
namespace vlib {

// ---------------------------------------------------------
// Stacktrace.
//  - Works on MacOS & Linux.
//  - Must be compiled with "-g" and with "-rdynamic" on Linux.
//  - May need compiler flag "-gdwarf-4" or "-gdwarf-5" on Linux to work correctly.
//  - Do not use compiler flag "-gdwarf-5" on MacOS.
//  - May not work correctly when compiled with optimization.
//  - Requires "addr2line" to be installed to get line numbers.
//    * Install addr2line with on MacOS with "brew install binutils".
//    * Install addr2line with on Linux with "sudo apt install binutils".

struct StackTrace {
    
// Private.
private:
    
    // ---------------------------------------------------------
    // Structs.
    
    // Structure to store stacktrace entry information
    struct Entry {
        void*                   addr;           // address.
        void*                   offset_addr;    // offset address.
        internal::BaseString    func;           // function name.
        internal::BaseString    path;           // binary path.
        int                     line_number;    // line number.
        internal::BaseString    line;           // line data of the line number.
        bool                    skip;           // skip this entry.
    };
    
    // Structure to store library information
    struct LibraryInfo {
        int                     image;          // image index (MacOS).
        void*                   addr;           // address.
        internal::BaseString    path;           // binary path.
    };
    
    // ---------------------------------------------------------
    // Definitions.
    
    using Libs = internal::BaseArray<LibraryInfo, ullong>;
    
    // ---------------------------------------------------------
    // Attributes.
    
    void**  m_stack = nullptr;
    uint    m_len = 0;
    
    // ---------------------------------------------------------
    // Private functions.
    
    // Retrieve the current executable and the loaded library information.
    static
    Libs    get_libs() {
        Libs libs;
        
        // Apple.
        #if defined(__APPLE__)
        
        uint numImages = _dyld_image_count();
        for (uint i = 0; i <= numImages; ++i) {
            const struct mach_header* header = _dyld_get_image_header(i);
            if (header != NULL) {
                libs.append(LibraryInfo{
                    .image = (int) i,
                    // .addr = (void*)(uintptr_t)header,
                    .addr = (void*)header,
                    .path = _dyld_get_image_name(i),
                });
            }
        }
        
        // Linux.
        #else
        
        // Iteration callback.
        auto linux_callback = [](struct dl_phdr_info* info, size_t size, void* data) {
            Libs* libs = (Libs*) data;
            if (info->dlpi_addr != 0 && info->dlpi_name != nullptr) {
                libs->append(LibraryInfo{
                    .image = -1,
                    .addr = (void*) info->dlpi_addr,
                    .path = info->dlpi_name,
                });
            }
            return 0;
        };
        
        // Add local executable to the libs.
        Dl_info info;
        if (dladdr((void*)get_libs, &info) != 0) {
            libs.append(LibraryInfo{
                .image = -1,
                .addr = (void*) info.dli_fbase,
                .path = info.dli_fname,
            });
        }
        
        // Iterate.
        dl_iterate_phdr(linux_callback, &libs);
        
        #endif
        
        return libs;
    }
    
    // Resolve a path and line number for a stacktrace entry.
    void    resolve_entry(Entry& entry, const LibraryInfo& lib) const {
        
        // Vars.
        int pid, pipe[2];
        constexpr bool use_addr2line = true;
        
        // Create pipes.
        if (::pipe(pipe) == 0) {
            
            // Child.
            if ((pid = fork()) == 0) {
                
                // Dup.
                ::dup2(pipe[1], STDOUT_FILENO);
                ::dup2(pipe[1], STDERR_FILENO);
                
                // Close.
                ::close(pipe[0]);
                
                // Command.
                char cmd[1024];
                if (use_addr2line) {
                    snprintf(cmd, sizeof(cmd), "addr2line -e %s %p", lib.path.c_str(), entry.offset_addr);
                } else {
                    snprintf(cmd, sizeof(cmd), "atos -o %s %p", lib.path.c_str(), entry.offset_addr);
                }
                
                errno = 0;
                if (execlp("bash", "bash", "-c", cmd, NULL) == -1) {
                    printf("addr2line: %s [%i].", ::strerror(errno), errno); // keep as addr2line err for err detection.
                    ::exit(1);
                }
                
                ::exit(0);
            }
            
            // Parent.
            else if (pid > 0) {
                
                
                // Vars.
                internal::BaseString buff;
                buff.resize(1024);
                llong bytes = 0;
                char straddr[128];
                snprintf(straddr, 128, "%p\n", entry.offset_addr);
                
                // Read.
                bytes = ::read(pipe[0], buff.m_arr, buff.m_cap);
                buff.m_len = bytes;
                
                // Read.
                if (bytes > 0 &&
                    buff != "??:0\n" &&                 // not found for addr2line (macos).
                    buff != "??:?\n" &&                 // not found for addr2line (linux).
                    buff != straddr &&                  // not found for atos.
                    !buff.eq_first("addr2line:", 10) && // error.
                    !buff.eq_first("bash:", 5)          // error.
                ) {
                    
                    // Close pipes.
                    ::close(pipe[0]);
                    ::close(pipe[1]);
                    
                    // Slice path and line.
                    int len = (int) bytes;
                    int path_start = 0, line_start = 0, line_end = 0;
                    if (use_addr2line) {
                        line_end = len - 1;
                        for (int i = len - 1; i > 0; --i) {
                            switch (buff[i]) {
                                case ':':
                                    line_start = i + 1;
                                    break;
                                case '(': // sometimes the output is like "/vserver/storages/vinc/vlib/./test.cpp:23 (discriminator 2)".
                                    line_end = i - 1;
                                    continue;
                                default:
                                    continue;
                            }
                            break;
                        }
                    } else {
                        for (int i = len - 1; i > 0; --i) {
                            switch (buff[i]) {
                                case ':':
                                    line_start = i + 1;
                                    continue;
                                case '(':
                                    path_start = i + 1;
                                    break;
                                default:
                                    continue;
                            }
                            break;
                        }
                        line_end = len - 2;
                    }
                    
                    // No delimiter found.
                    if (line_start == 0) {
                        return ;
                    }
                    
                    // Set.
                    entry.path = internal::BaseString(buff.m_arr + path_start, line_start - path_start - 1);
                    entry.line_number = tonumeric<int>(buff.m_arr + line_start, line_end - line_start);
                    
                    // Clean ./ from line.
                    internal::BaseString cleaned;
                    uint index = 0;
                    for (auto& c: entry.path) {
                        if (c == '/' && index >= 2 && entry.path.m_arr[index - 1] == '.' && entry.path.m_arr[index - 2] == '/') {
                            cleaned.m_len -= 2;
                        }
                        cleaned.append(c);
                        ++index;
                    }
                    entry.path = cleaned;
                    return ;
                    
                }
                
                // Read in error.
                else {
                    // printf("READ ERR\n");
                    // if (bytes > 0) {
                    //     printf("%s\n", buff);
                    // }
                }
                
            }
            
            // Fork error.
            else {
                dprintf(STDERR_FILENO, "[%s:%i:%s] Error: Fork error.\n", __FILE__, __LINE__, __FUNCTION__);
            }
            
            // Close.
            ::close(pipe[0]);
            ::close(pipe[1]);
        }
        
    }
    
    // Resolve line data for a stacktrace entry.
    // Should be called after "resolve_entry()".
    void    resolve_line_data(Entry& entry, const internal::BaseString& prev_func) const {
        
        // When line number is found.
        if (entry.line_number != -1) {
            
			// Path injection prevention.
			//
			// Get real path.
			internal::BaseString real_path;
			real_path.resize(PATH_MAX + 1);
			if (realpath(entry.path.c_str(), real_path.data()) == NULL) {
				return ;
			}
			//
			// Check extension.
			uint dot = 0, index = 0;
			for (auto& i: real_path) {
				switch (i) {
					case '.': dot = index; break;
					default: break;
				}
				++index;
			}
			if (dot == 0) { return ; }
			internal::BaseString extension (real_path.data() + dot, real_path.len() - dot);
			if (extension != ".h" &&
				extension != ".hpp" &&
				extension != ".c" &&
				extension != ".cp" &&
				extension != ".cpp"
			) { return ; }
			
            // Load data.
            internal::BaseString buff;
            vlib::load(real_path.c_str(), buff.m_arr, buff.m_len);
            
            // Path found.
            if (buff.m_arr != nullptr) {
                
                // Set buff cap.
                buff.m_cap = buff.m_len;
                
                // Check for the current line and one back.
                for (int i = 0; i < 2; ++i) {
                    
                    // Convert line number.
                    int line_number = entry.line_number;
                    
                    // Check line number minus i.
                    // Sometimes the line before the line from addr2line is the correct one.
                    line_number -= i;
                    
                    // Iterate lines.
                    internal::BaseString line_data;
                    bool stop = false;
                    ullong index = 0, line_start = 0, iter_line = 1;
                    for (auto& c: buff) {
                        switch (c) {
                            case '\n':
                                if (iter_line == (ullong) line_number) {
                                    line_data = internal::BaseString(buff.m_arr + line_start, index - line_start);
                                    stop = true;
                                    break;
                                }
                                line_start = index + 1;
                                ++iter_line;
                                break;
                            default:
                                break;
                        }
                        ++index;
                        if (stop) { break; }
                    }
                    
                    // Remove whitespace.
                    bool whitespace = true;
                    entry.line.m_len = 0;
                    for (auto& c: line_data) {
                        if (whitespace) {
                            if (c != ' ') {
                                entry.line.append(c);
                                whitespace = false;
                            }
                        } else {
                            entry.line.append(c);
                        }
                    }
                    entry.line.null_terminate();
                    
                    // Reset line data when the previous func is not in the current line, but it its defined.
                    stop = false;
                    if (entry.line.m_arr == nullptr ||
                        (prev_func.m_len != 0 && strstr(entry.line.m_arr, prev_func.m_arr) == NULL)
                    ) {
                        entry.line.m_len = 0;
                    } else {
                        entry.line_number = line_number;
                        stop = true;
                    }
                    
                    // Set the stop boolean to true when the line data contains certain code.
                    // Since certain calls do not need to be visible in the stacktrace.
                    if (stop &&
                        entry.line.m_arr != nullptr &&
                        strstr(entry.line.m_arr, "CREATE_EXCEPTION") != NULL // stop at code with CREATE_EXCEPTION.
                    ) {
                        entry.skip = true;
                    }
                    
                    // Stop.
                    if (stop) { break; }
                }
            }
        }
    }
    
    // Resolve a stacktrace.
    Entry   resolve(void* addr, const Libs& libs, const internal::BaseString& prev_func) const {
        
        // Iterate over the loaded libraries
        for (const auto& lib : libs) {
            
            // Skip.
            if (lib.path.m_len == 0) {
                continue;
            }
            
            // Check if the address falls within the library's range
            if ((uintptr_t) addr >= (uintptr_t) lib.addr) {
                Dl_info info;
                if (dladdr((void*) addr, &info) != 0 && info.dli_fname != nullptr) {
                    
                    // Check if the symbol is defined in the library.
                    // And the mangled function name is found.
                    if (info.dli_fbase == lib.addr && info.dli_sname != NULL) {
                        
                        // Demangle name
                        char* demangled = abi::__cxa_demangle(info.dli_sname, NULL, NULL, NULL);
                        internal::BaseString func;
                        if (demangled == NULL) {
                            func = info.dli_sname;
                        } else {
                            func = demangled;
                            free(demangled);
                        }
                        func.null_terminate();
                        
                        // Offset address.
                        //
                        // MacOS.
                        #if defined(__APPLE__)
                        void* offset_addr = (void*) ((uintptr_t) addr - _dyld_get_image_vmaddr_slide(lib.image));
                        //
                        // Linux.
                        #else
                        void* offset_addr = (void*) ((uintptr_t) addr - (uintptr_t) lib.addr);
                        #endif
                        
                        // Return.
                        Entry entry {
                            .addr = addr,
                            .offset_addr = offset_addr,
                            .func = func,
                            .path = lib.path,
                            .line_number = -1,
                            .skip = false,
                        };
                        resolve_entry(entry, lib);
                        resolve_line_data(entry, prev_func);
                        return entry;
                    }
                }
            }
        }
        return Entry {
            .line_number = -1,
            .skip = false,
        };
    }
    
// Public.
public:
    
    // ---------------------------------------------------------
    // Constructors.
    
    // Default constructor.
    constexpr
    StackTrace() = default;
    
    // Copy constructor.
    constexpr
    StackTrace(const StackTrace& obj) {
        uint cap = 0;
        vlib::array<void*, uint>::copy(m_stack, m_len, cap, obj.m_stack, obj.m_len, obj.m_len);
    }
    
    // Move constructor.
    constexpr
    StackTrace(StackTrace&& obj) :
    m_stack(obj.m_stack),
    m_len(obj.m_len)
    {
        obj.m_stack = nullptr;
    }
    
    // Destructor.
    constexpr
    ~StackTrace() {
        if (m_stack != nullptr) {
            delete[] m_stack;
        }
    }
    
    // ---------------------------------------------------------
    // Operators.
    
    // Copy assignment operator.
    constexpr
    auto&   operator =(const StackTrace& obj) {
        uint cap = 0;
        vlib::array<void*, uint>::copy(m_stack, m_len, cap, obj.m_stack, obj.m_len, obj.m_len); // auto destructs m_stack when initialized.
        return *this;
    }
    
    // Move assignment operator.
    constexpr
    auto&   operator =(StackTrace&& obj) {
        uint cap = 0;
        vlib::array<void*, uint>::swap(m_stack, m_len, cap, obj.m_stack, obj.m_len, obj.m_len); // auto destructs m_stack when initialized.
        return *this;
    }
    
    // ---------------------------------------------------------
    // Functions.
    
    // Initialize the stacktrace.
    auto&   init() {
        if (m_stack != nullptr) {
            delete[] m_stack;
        }
        m_stack = new void* [vlib_max_trace];
        m_len = ::backtrace(m_stack, vlib_max_trace);
        return *this;
    }
    
    // Get the stacktrace as string.
    internal::BaseString trace(const int& indent = 0, const int& skip = 1) const {
        
        // Vars.
        internal::BaseString trace, prev_func;
        prev_func.resize(1);
        
        // Indent string.
        char indent_str[indent + 2];
        if (indent > 0) {
            indent_str[0] = '|';
        }
        for (int i = 1; i <= indent; ++i) {
            indent_str[i] = ' ';
        }
        if (indent > 0) {
            indent_str[indent + 1] = '\0';
        } else {
            indent_str[indent] = '\0';
        }
        
        // Get libraries.
        const Libs libs = get_libs();
        
        // Iterate over the addresses
        for (ullong i = 0; i < m_len; ++i) {
            
            // Resolve.
            Entry entry = resolve(m_stack[i], libs, prev_func);
            
            // Set previous function for the line number detection in the next "resolve() -> resolve_line_data()".
            // Only the raw function name with (, except if a template is detected.
            // So namespace- and class names are removed.
            prev_func.m_len = 0;
            if (entry.func.m_len > 0) {
                for (auto& c: entry.func) {
                    if (c == '(') {
                        prev_func.append(c);
                        break;
                    }
                    else if (c == '<') {
                        break;
                    }
                    else if (c == ':') {
                        prev_func.m_len = 0;
                    } else {
                        prev_func.append(c);
                    }
                }
            }
            prev_func.null_terminate();
            
            // Skip.
            if (entry.path.m_len == 0 || entry.skip) {
                continue;
            }
            
            // Stop.
            if (entry.func == "__libc_start_main") {
                break;
            }
            
            // Concat.
            if (i >= (ullong) skip) {
                
                // Line number as string.
                char line_number[20] = {'?', '\0'};
                if (entry.line_number != -1) {
                    snprintf(line_number, sizeof(line_number), "%i", entry.line_number);
                }
                
                // Concat.
                trace << indent_str << colors::bold.data() << entry.path << ":" << line_number << ": " << colors::end.data() <<
                "in " << entry.func << ":" << "\n";
                if (entry.line.m_len == 0) {
                    trace << indent_str << "    <unknown>" << "\n";
                } else {
                    trace << indent_str << "    " << colors::italic.data() << entry.line << colors::end.data() << "\n";
                    trace << indent_str << "    " << colors::green.data() << "^" << colors::end.data() << "\n";
                }
            }
            
        }
        
        // Remove last newline.
        if (trace.m_len > 0) {
            --trace.m_len;
            trace.null_terminate();
        }
        
        // Return.
        return trace;
        
    }
    
    // Dump the stacktrace.
    auto&   dump(const int& skip = 1) const {
        auto data = trace(skip);
        if (data.m_arr != nullptr) {
            printf("%s\n", data.c_str());
        } else {
            printf("No stack trace data available.\n");
        }
        return *this;
    }
    
};

// ---------------------------------------------------------
// End.

// Stacktrace handler.
// Dumps a stacktrace and then exits the program with status 1.
void    stacktrace_handler(int sig) {
    printf("%sError%s: %s [Signal %i].\n", colors::red.data(), colors::end.data(), ::strerror(sig), sig);
    StackTrace stack_trace;
    stack_trace.init();
    auto trace = stack_trace.trace(1);
    if (trace.m_arr != nullptr) {
        printf("%s\n", trace.c_str());
    }
    ::exit(1);
}

};         // End namespace vlib.
#endif     // End header.
