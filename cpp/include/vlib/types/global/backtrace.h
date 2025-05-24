// Author: Daan van den Bergh
// Copyright: © 2022 Daan van den Bergh.

// Header.
#ifndef VLIB_BACKTRACE_H
#define VLIB_BACKTRACE_H

// Includes.
#include <signal.h>
#include <execinfo.h>
#include <cxxabi.h>
#include <dlfcn.h>
#include <string.h>

// Namespace vlib.
namespace vlib {

// Namespace utils.
namespace utils {

// ---------------------------------------------------------
// Static limits type.

// Segfault stacktrace.
void backtrace_handler(int sig) {
    void* callstack[128];
    int i, frames = ::backtrace(callstack, 128);
    std::cout << "Backtrace [" << strsignal(sig) << "]:\n";
    for (i = 2; i < frames; i++) {
        Dl_info info;
        if(!dladdr(callstack[i], &info)) {
            continue;
        }
        const char* mangled = info.dli_sname;
        char* demangled = abi::__cxa_demangle(mangled, NULL, NULL, NULL);
        std::cout << " > " << info.dli_fname << ": " << (demangled ? demangled : mangled) << " [" << callstack[i] << "]" << "\n";
        if (demangled) {
            free(demangled);
        }
    }
    exit(1);
}

// Set backtrace for signal.
//  - Only works when the program is compiled without optimization.
//  - Example: backtrace(SIGSEGV);
void backtrace(int sig) {
    ::signal(sig, backtrace_handler);
}

// ---------------------------------------------------------
// End.

};         // End namespace utils.
};         // End namespace vlib.
#endif     // End header.
