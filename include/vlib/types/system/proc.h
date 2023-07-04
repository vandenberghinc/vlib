// Author: Daan van den Bergh
// Copyright: © 2022 Daan van den Bergh.

// Header.
#ifndef VLIB_PROC_T_H
#define VLIB_PROC_T_H

// Includes.
#include <sys/types.h>
#include <sys/wait.h>
#include <sys/stat.h>
#include <errno.h>
#include <stdio.h>
#include <unistd.h>
#include <signal.h>
#include <fcntl.h>
#include <poll.h>
#include <array>

// Namespace vlib.
namespace vlib {

// ---------------------------------------------------------
// Process type
/*     @docs {
    @chapter: system
    @title: Process
    @description:
        Process type.
        - By default it executes a bash script / command.
    @usage:
        #include <vlib/types.h>
        vlib::Proc proc0;
        if (proc0.execute("echo Hello World!") != 0) { ... }
 
        // Execute a synchronous process.
        vlib::Proc proc1 { .async = true };
        if (proc1.execute("echo Hello World!") == 0) {
            ...
            if (proc1.join() == 0) {
                ...
            }
        }
 
        // The avaiable construct options and their default values.
        vlib::Proc proc2 {
            .input = "",
            .input_len = 0,
            .timeout = 15000,
            .async = false,
        }
} */
// @TODO change Response to error codes.
// @TODO update docs.
struct Proc {

// Public.
public:

    // ---------------------------------------------------------
    // Aliases.
    
    using                     This =             Proc;
    
    // ---------------------------------------------------------
    // Arguments.
    
    const char*     input =         "";         // the input string ("" for no input).
    ullong          input_len =     0;          // the length of the input string (optional)
    mtime_t         timeout =         15000;    // timeout in milliseconds (-1 for no timeout).
    bool            async =         false;      // execute asynchronously.
    bool            log = false;                // log output.
    
    // ---------------------------------------------------------
    // System attributes.
    
    int             m_pid =         -2;                // the process' id.
    int             m_estatus =     -1;                // the process' exit status.
    int             m_errno =         0;                // the process' errno (only defined when an error has occurred in the parent process).
    String*         m_routput =         nullptr;        // the process' read output.
    String*         m_woutput =     nullptr;        // the process' write output.
    String*         m_eoutput =     nullptr;        // the process' error output.
    SICE int        rpend = 0, wpend = 1;            // pipe read and write ends.
    int             rpipe[2], wpipe[2], epipe[2];    // pipes.

    // Poll file descriptors.
    struct pollfd*             pfds = nullptr;                    // file descriptors.
    
// Public.
public:
    
    // ---------------------------------------------------------
    // Construct functions.
    
    // Copy.
    constexpr
    auto&    copy(const This& obj) {
        input = obj.input;
        input_len = obj.input_len;
        timeout = obj.timeout;
        async = obj.async;
        m_pid = obj.m_pid;
        m_estatus = obj.m_estatus;
        m_errno = obj.m_errno;
        vlib::ptr::copy(m_routput, obj.m_routput);
        vlib::ptr::copy(m_woutput, obj.m_woutput);
        vlib::ptr::copy(m_eoutput, obj.m_eoutput);
        rpipe[0] = obj.rpipe[0];
        rpipe[1] = obj.rpipe[1];
        wpipe[0] = obj.wpipe[0];
        wpipe[1] = obj.wpipe[1];
        epipe[0] = obj.epipe[0];
        epipe[1] = obj.epipe[1];
        pfds = obj.pfds; // todo creates a real copy.
        return *this;
    }
    
    // Swap.
    constexpr
    auto&    swap(This& obj) {
        input = obj.input;
        input_len = obj.input_len;
        timeout = obj.timeout;
        async = obj.async;
        m_pid = obj.m_pid;
        m_estatus = obj.m_estatus;
        m_errno = obj.m_errno;
        vlib::ptr::swap(m_routput, obj.m_routput);
        vlib::ptr::swap(m_woutput, obj.m_woutput);
        vlib::ptr::swap(m_eoutput, obj.m_eoutput);
        rpipe[0] = obj.rpipe[0];
        rpipe[1] = obj.rpipe[1];
        wpipe[0] = obj.wpipe[0];
        wpipe[1] = obj.wpipe[1];
        epipe[0] = obj.epipe[0];
        epipe[1] = obj.epipe[1];
        pfds = obj.pfds;
        obj.pfds = nullptr;
        return *this;
    }
    
    // ---------------------------------------------------------
    // Constructors.
    
    // Destructor.
    constexpr
    ~Proc() {
        delete m_routput;
        delete m_woutput;
        delete m_eoutput;
        delete[] pfds;
    }
    
    // ---------------------------------------------------------
    // Assignment operators.
    
    // Copy assignment operator.
    constexpr
    auto&    operator=(const This& obj) {
        return copy(obj);
    }
    
    // Move assignment operator.
    constexpr
    auto&    operator=(This&& obj) {
        return swap(obj);
    }
    
    // ---------------------------------------------------------
    // Attribute functions.
    
    // Get the process' id.
    /* @docs {
       @title: Process id
       @description:
            Get the process' id.
            - Only defined when `execute()` is called.
    } */
    constexpr
    auto&     pid() { return m_pid; }
    
    // Get the process' exit status.
    /* @docs {
       @title: Exit status
       @description:
            Get the process' exit status.
            - Only defined when one of the following conditions is met:
              * `async == false` and `execute()` is called.
              * `async == true` and `join()` is called.
    } */
    constexpr
    auto&     exit_status() { return m_estatus; }
    
    // Get the errno encoutered by the parent process.
    /* @docs {
       @title: Error number
       @description: Get the errno encoutered by the parent process.
    } */
    constexpr
    auto&     err_number() { return m_errno; }
    
    // Check if the process' has stdin output.
    /* @docs {
       @title: Has input
       @description: Check if the process' has stdin output.
    } */
    constexpr
    bool     has_in() { return m_routput; }
    
    // Check if the process' has stdout output.
    /* @docs {
       @title: Has output
       @description: Check if the process' has stdout output.
    } */
    constexpr
    bool     has_out() { return m_woutput; }
    
    // Check if the process' has stderr output.
    /* @docs {
       @title: Has error
       @description: Check if the process' has stderr output.
    } */
    constexpr
    bool     has_err() { return m_eoutput; }
    
    // Get the process' stdin output.
    /* @docs {
       @title: Input
       @description:
            Get the process' stdin output.
            - Only defined when one of the following conditions is met:
              * `async == false` and `execute()` is called.
              * `async == true` and `join()` is called.
        @warning:
            Causes undefined behaviour when the process has no stdin output, see `has_in()`.
    } */
    constexpr
    auto&     in() { return *m_routput; }
    
    // Get the stdout output.
    /* @docs {
       @title: Output
       @description:
            Get the process' stdout output.
            - Only defined when one of the following conditions is met:
              * `async == false` and `execute()` is called.
              * `async == true` and `join()` is called.
        @warning:
            Causes undefined behaviour when the process has no stdout output, see `has_out()`.
    } */
    constexpr
    auto&     out() { return *m_woutput; }
    
    // Get the stderr output.
    /* @docs {
       @title: Error
       @description:
            Get the process' stderr output.
            - Only defined when one of the following conditions is met:
              * `async == false` and `execute()` is called.
              * `async == true` and `join()` is called.
        @warning:
            Causes undefined behaviour when the process has no stderr output, see `has_err()`.
    } */
    constexpr
    auto&     err() { return *m_eoutput; }
    
    // Get the stdin output pointer.
    /* @docs {
       @title: Input pointer
       @description:
            Get the pointer to the process' stdin output.
            - Only defined when one of the following conditions is met:
              * `async == false` and `execute()` is called.
              * `async == true` and `join()` is called.
    } */
    constexpr
    auto&     in_ptr() { return m_routput; }
    
    // Get the stdout output pointer.
    /* @docs {
       @title: Output pointer
       @description:
            Get the pointer to the process' stdout output.
            - Only defined when one of the following conditions is met:
              * `async == false` and `execute()` is called.
              * `async == true` and `join()` is called.
    } */
    constexpr
    auto&     out_ptr() { return m_woutput; }
    
    // Get the stderr output pointer.
    /* @docs {
       @title: Error pointer
       @description:
            Get the pointer to the process' stderr output.
            - Only defined when one of the following conditions is met:
              * `async == false` and `execute()` is called.
              * `async == true` and `join()` is called.
    } */
    constexpr
    auto&     err_ptr() { return m_eoutput; }
    
    // Get the stderr or stdin output.
    /*  @docs {
     *  @title: Get Error / Output
     *  @description:
     *      Get the stderr output when defined or de the stdout output when defined. An empty string is returned when both stderr and stdin are undefined.
     } */
    constexpr
    String  err_or_out() {
        if (has_err()) {
            return err();
        } else if (has_out()) {
            return out();
        }
        return {};
    }
    
    // ---------------------------------------------------------
    // Functions.
    
    // Has started.
    /* @docs {
       @title: Started
       @description: Check if the process has started.
    } */
    constexpr
    bool     started() {
        return m_pid != -2;
    }
    
    // Is running.
    /* @docs {
       @title: Running
       @description: Check if the process is still running.
    } */
    bool     running() {
        return ::waitpid(m_pid, &m_estatus, WNOHANG) == 0;
    }
    
    // Build the pipes.
    /* @docs {
       @title: Build the pipes
       @description:
            Build the pipes.
            - Will be called automatically inside `execute()`.
    } */
    int     build() {

        // Pipes.
        if (
            ::pipe(rpipe) < 0 ||
            ::fcntl(rpipe[rpend], F_SETFL, fcntl(rpipe[rpend], F_GETFL) | O_NONBLOCK) == -1
        ) {
            m_errno = errno;
            return proc::error::build_rpipe;
        }
        if (
            ::pipe(wpipe) < 0 ||
            ::fcntl(wpipe[rpend], F_SETFL, fcntl(wpipe[rpend], F_GETFL) | O_NONBLOCK) == -1
        ) {
            ::close(rpipe[rpend]);
            ::close(rpipe[wpend]);
            m_errno = errno;
            return proc::error::build_wpipe;
        }
        if (
           ::pipe(epipe) < 0 ||
           ::fcntl(epipe[rpend], F_SETFL, fcntl(epipe[rpend], F_GETFL) | O_NONBLOCK) == -1
        ) {
            ::close(rpipe[rpend]);
            ::close(rpipe[wpend]);
            ::close(wpipe[rpend]);
            ::close(wpipe[wpend]);
            m_errno = errno;
            return proc::error::build_epipe;
        }
        
        // Set read end to non blocking.
        // fcntl(wpipe[rpend], F_SETFL, fcntl(wpipe[rpend], F_GETFL, 0) | O_NONBLOCK);
        // fcntl(epipe[rpend], F_SETFL, fcntl(epipe[rpend], F_GETFL, 0) | O_NONBLOCK);

        // Handler.
        return 0;
        
    }

    // Close all pipes.
    /* @docs {
       @title: Close
       @description:
            Close all pipes.
            - Will be called automatically inside `execute()` when `async` is `false` or when an error has occured.
            - Returns `0` upon success.
    } */
    int     close() {
        ::close(rpipe[rpend]);
        ::close(rpipe[wpend]);
        ::close(wpipe[rpend]);
        ::close(wpipe[wpend]);
        ::close(epipe[rpend]);
        ::close(epipe[wpend]);
        return 0;

    }
    
    // Fork the process.
    /* @docs {
       @title: Fork
       @description:
            Fork the process
            - Will be called automatically inside `execute()`.
    } */
    template <typename... Args> constexpr
    int     fork(Args&&... args) {
        
        // Parent.
        if((m_pid = ::fork()) > 0) {
            ::close(rpipe[rpend]);        // parent does not read from stdin
            ::close(wpipe[wpend]);      // parent does not write to stdout
            ::close(epipe[wpend]);      // parent does not write to stderr
            if (input[0] != '\0') {
                if (input_len == 0) { input_len = vlib::len(input); }
                if (::write(rpipe[wpend], input, input_len) < 0) {
                    m_errno = errno;
                    return proc::error::write_input;
                }
            }
            ::close(rpipe[wpend]);
        }

        // Child.
        else if(m_pid == 0) {
            ::dup2(rpipe[rpend], STDIN_FILENO);
            ::dup2(wpipe[wpend], STDOUT_FILENO);
            ::dup2(epipe[wpend], STDERR_FILENO);

            ::close(rpipe[wpend]);       // child does not write to stdin
            ::close(wpipe[rpend]);       // child does not read from stdout
            ::close(epipe[rpend]);       // child does not read from stderr
            
            // @TODO: Do not use `execlp()`, `execvp()`, and `execvpe()` here! `exec*p*` functions are vulnerable to PATH variable evaluation attacks.
            if (::execlp(args..., NULL) == -1) {
                ::exit(EXIT_FAILURE);
            } else {
                ::exit(EXIT_SUCCESS);
            }
        }

        // Error.
        else {
            ::close(rpipe[rpend]);
            ::close(rpipe[wpend]);
            ::close(wpipe[rpend]);
            ::close(wpipe[wpend]);
            ::close(epipe[rpend]);
            ::close(epipe[wpend]);
            m_errno = errno;
            return proc::error::fork;
        }
        
        // Handler.
        return 0;
        
    }
    int     forkve(const Array<String>& args) {
        
        // Parent.
        if((m_pid = ::fork()) > 0) {
            ::close(rpipe[rpend]);        // parent does not read from stdin
            ::close(wpipe[wpend]);      // parent does not write to stdout
            ::close(epipe[wpend]);      // parent does not write to stderr
            if (input[0] != '\0') {
                if (input_len == 0) { input_len = vlib::len(input); }
                if (::write(rpipe[wpend], input, input_len) < 0) {
                    m_errno = errno;
                    return proc::error::write_input;
                }
            }
            ::close(rpipe[wpend]);
        }

        // Child.
        else if(m_pid == 0) {
            ::dup2(rpipe[rpend], STDIN_FILENO);
            ::dup2(wpipe[wpend], STDOUT_FILENO);
            ::dup2(epipe[wpend], STDERR_FILENO);

            ::close(rpipe[wpend]);       // child does not write to stdin
            ::close(wpipe[rpend]);       // child does not read from stdout
            ::close(epipe[rpend]);       // child does not read from stderr
            
            const char* arr[100];
            for (auto& index: args.indexes()) {
                arr[index] = args[index].c_str();
            }
            arr[args.len()] = (char*)0;
            if (::execvp(arr[0], (char**) arr) == -1) {
                String err = tostr("ERROR: ", ::strerror(errno), ".");
                ::write(epipe[wpend], err.data(), err.len());
                ::exit(EXIT_FAILURE);
            } else {
                ::exit(EXIT_SUCCESS);
            }
        }

        // Error.
        else {
            ::close(rpipe[rpend]);
            ::close(rpipe[wpend]);
            ::close(wpipe[rpend]);
            ::close(wpipe[wpend]);
            ::close(epipe[rpend]);
            ::close(epipe[wpend]);
            m_errno = errno;
            return proc::error::fork;
        }
        
        // Handler.
        return 0;
        
    }

    // Parse the process' exit status.
    /* @docs {
       @title: Parse exit status
       @description:
            Parse the process' exit status.
            - This function does not return the exit status, use `exit_status()` to retrieve the exit status.
            - Will be called automatically inside `execute()` when `async` is `false`.
    } */
    constexpr
    int     parse_exit_status() {
        if (m_estatus >= 0) { return 0; }
        int status;
        if ((status = ::waitpid(m_pid, &m_estatus, WNOHANG)) < 0) { // error.
            m_errno = errno;
            m_estatus = -1;
            return proc::error::parse_exit_status;
        } else if (status == 0) { // still running.
            m_estatus = -2;
        } else {
            if (WIFEXITED(m_estatus)) {
                m_estatus = WEXITSTATUS(m_estatus);
            } else { // unknown error.
                m_estatus = -3;
                m_errno = errno;
                return proc::error::parse_exit_status;
            }
        }
        return 0;
    }
    
    // Join the process.
    /* @docs {
       @title: Join
       @description:
            Await the process.
            - Will be called automatically inside `execute()` when `async` is `false`.
            - Always calls `close()`, including when an error or timeout has occured.
            - Automatically calls `parse_exit_status()` on a successfull `join()`.
    } */
    int     join() {
        
        // Initialize buffer.
        constexpr uint buffer_size = 256;
        char buffer[buffer_size];

        // V1 variables.
        constexpr uint maxfds = 2;
        delete[] pfds;
        pfds = new struct pollfd [maxfds];
        pfds[0].fd = wpipe[rpend];
        pfds[0].events = POLLIN;
        pfds[1].fd = epipe[rpend];
        pfds[1].events = POLLIN;
        int l_timeout = (int) timeout; // does get updated but the original wont.
        llong bytes = 0;
        
        // V2 vars.
        // long end_time = Date::get_mseconds() + timeout;

        // Loop.
        int status;
        // ullong bytes;
        while (true) {
            
            /* V2 with read
            bytes = 0;
            if ((bytes = ::read(wpipe[rpend], buffer, buffer_size)) == (ullong) -1) {
                if (errno != EAGAIN) {
                    print("ERROR ", ::strerror(errno));
                    m_errno = errno;
                    close();
                    return proc::error::closed;
                }
            } else if (bytes > 0) {
                if (!m_woutput) { m_woutput = new String; }
                m_woutput->concat_r(buffer, bytes);
                if (log) {
                    vlib::out.dump(buffer, bytes);
                }
            }
            bytes = 0;
            if ((bytes = ::read(epipe[rpend], buffer, buffer_size)) == (ullong) -1) {
                if (errno != EAGAIN) {
                    print("ERROR ", ::strerror(errno));
                    m_errno = errno;
                    close();
                    return proc::error::closed;
                }
            } else if (bytes > 0) {
                if (!m_eoutput) { m_eoutput = new String; }
                m_eoutput->concat_r(buffer, bytes);
                if (log) {
                    vlib::out.dump(buffer, bytes);
                }
            }
            
            // Check timeout.
            if (timeout != -1 && Date::get_mseconds() > end_time) {
                print("TIMEOUT ");
                close();
                return proc::error::timeout;
            }
            
            // Break when pid has finished.
            if ((status = ::waitpid(m_pid, &m_estatus, WNOHANG)) != 0) {
                break;
            }
            
            // Sleep.
            vlib::sleep::msec(100);
            */
            
            /* V1 with poll */
             
            // Poll error.
            if ((status = ::poll(pfds, maxfds, l_timeout)) < 0) {
                // if (errno == EINTR) continue;
                m_errno = errno;
                close();
                return proc::error::poll;

            // Poll timeout.
            } else if (status == 0) {
                // if (timeout != -1 && Date::get_mseconds() - start_time > timeout) {
                //     close();
                //     return proc::error::timeout;
                // }
                if (timeout == -1) {
                    m_errno = errno;
                    close();
                    return proc::error::timeout;
                } else {
                    m_estatus = -2;
                    return 0;
                }

            // Poll success.
            } else {

                // Read stdout.
                if (pfds[0].revents & POLLIN) {
                    while ((bytes = ::read(wpipe[rpend], buffer, buffer_size)) > 0) {
                        if (!m_woutput) { m_woutput = new String; }
                        m_woutput->concat_r(buffer, bytes);
                        if (log) {
                            vlib::out.dump(buffer, bytes);
                        }
                    }
                }
                else if (pfds[0].revents & POLLNVAL)  {
                    m_errno = errno;
                    close();
                    return proc::error::closed;
                }
                else if (pfds[0].revents & POLLERR)  {
                    m_errno = errno;
                    close();
                    return proc::error::poll;
                }

                // Read stderr.
                if (pfds[1].revents & POLLIN) {
                    while ((bytes = ::read(epipe[rpend], buffer, buffer_size)) > 0) {
                        if (!m_eoutput) { m_eoutput = new String; }
                        m_eoutput->concat_r(buffer, bytes);
                        if (log) {
                            vlib::err.dump(buffer, bytes);
                        }
                    }
                }
                else if (pfds[1].revents & POLLNVAL)  {
                    m_errno = errno;
                    close();
                    return proc::error::closed;
                }
                else if (pfds[1].revents & POLLERR)  {
                    m_errno = errno;
                    close();
                    return proc::error::poll;
                }

            }
            // Break when pid has finished.
            if ((status = ::waitpid(m_pid, &m_estatus, WNOHANG)) != 0) {
                break;
            }
        }
        
        // Wait max 10 sec till the process has finished.
        // Since the processes is sometimes still running while one of the file descriptors is ready.
        if (timeout == -1) {
            int slept = 0;
            while ((status = ::waitpid(m_pid, &m_estatus, WNOHANG)) == 0 && slept < 10000) {
                vlib::sleep::msec(10);
                slept += 10;
            }
        }

        // Parse the exit status.
        if ((status = parse_exit_status()) != 0) {
            close();
            return status;
        }
        
        // Close the pipes.
        if ((status = close()) != 0) {
            return status;
        }
                
        // Handler.
        return 0;
        
    }
    
    // Execute the process.
    /* @docs {
       @title: Execute
       @description:
            Execute the process.
            - Returns `0` upon success.
            - The arguments must be of type `const char*`.
            - Beware of the fact that a `Script` executed by `execute()` will be saved to the assigned `Script` path, with the assigned `Script` permission. The path will be deleted upon any exit.
       @usage:
            // Execute a bash process.
            Proc proc;
            int status = proc.execute("echo Hello World!");
     
            // Is equal to.
            status = proc.execute("/bin/bash", "-c", "bash", "echo Hello World!");
     
            // Execute a zsh process.
            status = proc.execute("/bin/zsh", "-exec", "-c", "echo Hello World!");
    } */
    int     execute(const char* arg) {
        reset_h();
        int status;
        if ((status = build()) != 0) { return status; }
        if ((status = fork("/bin/bash", "bash", "-c", arg)) != 0) { return status; }
        if (!async && (status = join()) != 0) { return status; }
        return 0;
    }
    int     execute(const String& arg) {
        reset_h();
        int status;
        if ((status = build()) != 0) { return status; }
        if ((status = fork("/bin/bash", "bash", "-c", arg.c_str())) != 0) { return status; }
        if (!async && (status = join()) != 0) { return status; }
        return 0;
    }
    int     execute(const Array<String>& args) {
        reset_h();
        int status;
        if ((status = build()) != 0) { return status; }
        if ((status = forkve(args)) != 0) { return status; }
        if (!async && (status = join()) != 0) { return status; }
        return 0;
    }
    template <typename... Args>
    int     execute(const char* arg_0, const char* arg_1, Args&&... args) {
        reset_h();
        int status;
        if ((status = build()) != 0) { return status; }
        if ((status = fork(arg_0, arg_1, args...)) != 0) { return status; }
        if (!async && (status = join()) != 0) { return status;    }
        return 0;
    }
    // - For now it can only be executed with a bash interpreter.
    // template <typename... Args>
    // int     execute(const Script& script, Args&&... args) {
    //     reset_h();
    //     int status;
    //     if ((status = build()) != 0) { return status; }
    //     Path path = script.path();
    //     if (path.is_undefined()) {
    //         path = toString("/tmp/script_", getuid(), "_", String::random(12));
    //     }
    //     script.save(path.c_str(), script.permission());
    //     if ((status = fork("/bin/bash", "bash", path, args...)) != 0) {
    //         ::remove(path.c_str());
    //         return status;
    //     }
    //     if (!async && (status = join()) != 0) {
    //         ::remove(path.c_str());
    //         return status;
    //     }
    //     ::remove(path.c_str());
    //     return 0;
    // }

    // Signal.
    /* @docs {
       @title: Signal
       @description: Signal the process.
    } */
    int     signal(int signal = 0) {
        if (::kill(m_pid, signal) < 0) {
            m_errno = errno;
            return proc::error::kill;
        }
        return 0;
    }

    // Kill.
    /* @docs {
       @title: Kill
       @description:
            Kills the process with a sending SIGKILL signal.
            - Always calls `close()` after a kill signal is send.
            - Automatically calls `::waitpid` after a successfull kill.
    } */
    int     kill(int signal = SIGTERM) {
        if (!running()) { return 0; }
        if (::kill(m_pid, signal) < 0) {
            m_errno = errno;
            close();
            return proc::error::kill;
        }
        if (::waitpid(m_pid, NULL, 0) <= 0 && errno != EINTR) { // @TODO not sure if the exception of EINT is correct.
            m_errno = errno;
            close();
            return proc::error::kill;
        }
        close();
        return 0;
    }

    // Killed.
    /* @docs {
       @title: Killed
       @description: Check if the process was killed by a SIGKILL signal.
    } */
    bool     killed() {
        return kill_signal() == SIGKILL;
    }
    
    // Get the kill signal.
    /* @docs {
       @title: Kill signal
       @description: Get the kill signal.
    } */
    int     kill_signal() {
        return WTERMSIG(m_estatus);
    }

    // Timed out.
    /* @docs {
       @title: Timedout
       @description: Check if the join function has timed out.
    } */
    bool     timedout() {
        return m_estatus == -2;
    }

    
// ---------------------------------------------------------
// Private.
private:
    
    // ---------------------------------------------------------
    // Helper functions.
    
    // Reset all non argument attributes when the process is already executed once.
    constexpr
    void reset_h() {
        if (m_pid != -2) {
            m_pid = -2;
            m_estatus = -1;
            m_errno = 0;
            if (m_routput) {
                delete m_routput;
                m_routput = nullptr;
            }
            if (m_woutput) {
                delete m_woutput;
                m_woutput = nullptr;
            }
            if (m_eoutput) {
                delete m_eoutput;
                m_eoutput = nullptr;
            }
            rpipe[0] = 0;
            rpipe[1] = 0;
            wpipe[0] = 0;
            wpipe[1] = 0;
            epipe[0] = 0;
            epipe[1] = 0;
        }
    }

};

// ---------------------------------------------------------
// Out of line definitions.

// Define the "User::create" function.
constexpr
void     User::create(
    const char*     name,
    const char*     realname,
    const String&   pass,
	int         	uid,
	int         	gid,
    bool        	superuser,
    const char*     homes,
    const char*     shell
) {
    User::create_h<Proc, Script>(
        name,
        realname,
        pass,
        uid,
        gid,
        superuser,
        homes,
        shell
    );
}

// Define the "User::del" function.
constexpr
void     User::del() {
    del_h<Proc, Script>();
}

// Define the "User::set_pass" function.
#if OSID <= 0 || OSID >= 4
void     User::set_pass(
    const String&     pass
) {
    set_pass_h<Proc, Script>(pass);
}
#endif

// Define the "Group::create" function.
constexpr
void     Group::create(
    const char*      name,
    const String&    pass,
    int		         gid
) {
    Group::create_h<Proc, Script>(
        name,
        pass,
        gid
    );
}

// Define the "Group::del" function.
constexpr
void     Group::del() {
    del_h<Proc, Script>();
}

// Define the "Group::add" function.
template <typename... Args> constexpr
void     Group::add(const char* username, Args&&... args) {
    add_h<Proc, Script>(username, args...);
}

// Define the "Group::remove" functions.
template <typename... Args> constexpr
void     Group::remove(const char* username, Args&&... args) {
    remove_h<Proc, Script>(username, args...);
}

// Define the "Path::rsync" functions.
// constexpr
// auto&     Path::rsync(
//     const String&   remote,
//     const String&   options,
//     const Int&      timeout
// ) const { return rsync_h<Proc>(remote, options, timeout, false); }
// constexpr
// auto&     Path::rsync_file(
//     const String&   remote,
//     const String&   options,
//     const Int&      timeout
// ) const { return rsync_h<Proc>(remote, options, timeout, true); }

// Define the "Path::link" functions.
constexpr
auto&     Path::link(
    const String&   remote,
    const String&   options,
    const Int&      timeout
) const { return link_h<Proc>(remote, options, timeout); }

// ---------------------------------------------------------
// Instances.

// Is instance.
template<>                struct is_instance<Proc, Proc>    { SICEBOOL value = true;  };

// Is type.
template<typename Type> struct is_Proc                     { SICEBOOL value = false; };
template<>                 struct is_Proc<Proc>             { SICEBOOL value = true;  };

// ---------------------------------------------------------
// Shortcuts.

namespace types { namespace shortcuts {

using Proc =        vlib::Proc;

};         // End namespace sockets.
};         // End namespace shortcuts.

// ---------------------------------------------------------
// End.

};         // End namespace vlib.
#endif     // End header.
