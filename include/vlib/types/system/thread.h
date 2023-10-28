// Author: Daan van den Bergh
// Copyright: © 2022 Daan van den Bergh.

// Header.
#ifndef VLIB_THREAD_H
#define VLIB_THREAD_H

// Namespace vlib.
namespace vlib {

// ---------------------------------------------------------
// Base thread type.
// - Should be inherited by other classes.
//
// Sources:
// - https://coliru.stacked-crooked.com/a/a6c607514601b013
//
/* @docs
	@chapter: System
	@title: Thread
	@description:
		Thread type.
	
		Can be used to use as a base class for another type.
 
		Can be used to start a thread function.
	@notes:
		- The thread acts as a shared pointer.
	@usage:
				
		 // --------------------------------------------------------
		 // Thread class.
 
		 #include <vlib/types.h>
		 
		 // Create a thread class.
		 struct some_thread : public vlib::Thread<some_thread> {

			 // The thread run function.
			 void* 	run(void) {
                vlib::print("Starting thread: ", id()));
                return NULL;
			 }

		 };

		 int main() {
			 some_thread thread;
			 thread.start();
			 thread.join();
			 return 0;
		 }
		 
		 // --------------------------------------------------------
		 // Thread function.
 
		 #include <vlib/types.h>
 
		 // A thread function without args.
		 void* some_func(void*) {
			 vlib::print("Hello World!");
			 return NULL;
		 }

		 // The thread function.
		 void* some_func_with_args(vlib::String day, vlib::String name) {
			 vlib::print("Good ", day, " ", name, "!");
			 return NULL;
		 }

		 int main() {

			 // Start a thread without arguments.
			 vlib::FThread thread0;
			 thread0.start(some_func);
			 thread0.join();

			 // Start a thread with arguments.
			 vlib::FThread thread1;
			 thread1.start(some_func_with_args, "Sunday", "World");
			 thread1.join();

			 return 0;

		 }
*/

template <typename Derived = vlib::Null>
struct Thread {

    // ---------------------------------------------------------
    // Exceptions.
    
    static excid_t start_err;
    static excid_t deadlock_err;
    static excid_t not_joinable_err;
    static excid_t not_found_err;
    static excid_t join_err;
    static excid_t detach_err;
    static excid_t mutex_init_err;
    static excid_t lock_err;
    static excid_t cond_init_err;
    static excid_t cond_wait_err;
    static excid_t cond_sig_err;
    static excid_t signal_err;
    static excid_t kill_err;
    
// Public.
public:

	// ---------------------------------------------------------
	// Definitions.

	using 		This = 		Thread;

	// ---------------------------------------------------------
	// Attributes.

    SPtr<pthread_t>         t_id;
    SPtr<pthread_mutex_t>   t_mutex;
    SPtr<pthread_cond_t>    t_cond;

	// ---------------------------------------------------------
	// Private functions.
	
	// Static run.
	static inline constexpr
	void*	run_s(void* obj)  requires (!is_Null<Derived>::value) {
		return ((Derived*) obj)->run();
	}
	
// Public.
public:

	// ---------------------------------------------------------
	// Constructors.

	// Default constructor.
	constexpr
    Thread() :
	t_id(pthread_t()),
    t_mutex(pthread_mutex_t()),
    t_cond(pthread_cond_t()) {}
	
	// Copy constructor.
	explicit constexpr
    Thread(const This& obj) :
    t_id(obj.t_id),
    t_mutex(obj.t_mutex),
    t_cond(obj.t_cond) {}
	
	// Move constructor.
	explicit constexpr
    Thread(This&& obj) :
    t_id(move(obj.t_id)),
    t_mutex(move(obj.t_mutex)),
    t_cond(move(obj.t_cond)) {}
	
	// ---------------------------------------------------------
	// Assignment operators.
	
	// Copy constructor.
	constexpr
	auto&	operator =(const This& obj) {
		t_id = obj.t_id;
        t_mutex = obj.t_mutex;
        t_cond = obj.t_cond;
		return *this;
	}
	
	// Move constructor.
	constexpr
	auto&	operator =(This&& obj) {
		t_id = move(obj.t_id);
        t_mutex = move(obj.t_mutex);
        t_cond = move(obj.t_cond);
		return *this;
	}
	
	// ---------------------------------------------------------
	// Propeties.
	
	// Id.
	/*  @docs
		@title: Id
		@description: Get thread id attribute as integer.
	*/
	constexpr
	ullong 	id() const {
		return (ullong) *t_id;
	}
	
	// Mutex.
	/*  @docs
		@title: Mutex
		@type: mutex&
		@description: Get mutex attribute.
	*/
    // constexpr
    // auto&     mutex() {
    //     return t_mutex;
    // }
    // constexpr
    // auto&     mutex() const {
    //     return t_mutex;
    // }
	
	// ---------------------------------------------------------
	// Functions.

	// Start.
	/*  @docs
		@title: Start
		@description:
			Start a derived thread class.
		@notes:
			- The derived class must have the function `void* run(void)`.
	*/
	constexpr
	auto&    start() requires (!is_Null<Derived>::value) {
		if (pthread_create(&(*t_id), NULL, &run_s, (void*) &*this) != 0) {
            throw StartError(start_err);
		}
        return *this;
	}
	/*  @docs
		@title: Start
		@description:
			Start a thread function without any arguments.
		@parameter:
			@name: func
			@description: A reference to the function.
		}
		@notes:
			- The function should be like `void* somefunc(void*)`.
	*/
	template <typename Func> requires (is_Null<Derived>::value) constexpr
	auto&    start(Func&& func)  {
		if (pthread_create(&(*t_id), NULL, func, NULL) != 0) {
            throw StartError(start_err);
		}
        return *this;
	}
	/*  @docs
		@title: Start
		@description:
			Start a thread function with arguments.
		@parameter:
			@name: func
			@description: A reference to the function.
		}
		@parameter:
			@name: args
			@description: The function arguments.
		}
		@notes:
			- The function should be like `void* somefunc(...)`.
	*/
	template <typename Func, typename... Args> requires (is_Null<Derived>::value) constexpr
	auto&    start(Func&& func, Args&&... args) {
        auto l = new auto(
            [=]() -> void* {
                return func(args...);
            }
        );
		auto te = [](void* rp) -> void* {
			auto p = reinterpret_cast<decltype(l)>(rp);
			void* res = (*p)();
			delete p;
			return res;
		};
		if (pthread_create(&(*t_id), NULL, te, l) != 0) {
            throw StartError(start_err);
		}
        return *this;
	}

	// Join.
	/*  @docs
		@title: Join
		@description: Join and await the thread.
		@funcs: 2
	*/
	constexpr
	auto&    join() {
        short status;
		if ((status = pthread_join((*t_id), NULL)) != 0) {
            switch (status) {
                case EDEADLK:
                    throw JoinError(deadlock_err);
                case EINVAL:
                    throw JoinError(not_joinable_err);
                case ESRCH:
                    throw JoinError(not_found_err);
                default:
                    throw JoinError(join_err);
            }
		}
        return *this;
	}
    // constexpr
    // auto&    join(void*& result) {
    //     if (pthread_join((*t_id), &result) != 0) {
    //         throw JoinError(to_str("Unable to join thread \"", id(), "\"."));
    //     }
    //     return *this;
    // }
    template <typename Type> constexpr
    auto&    join(Type*& result) {
        short status;
        if ((status = pthread_join((*t_id), (void**) &result)) != 0) {
            switch (status) {
                case EDEADLK:
                    throw JoinError(deadlock_err);
                case EINVAL:
                    throw JoinError(not_joinable_err);
                case ESRCH:
                    throw JoinError(not_found_err);
                default:
                    throw JoinError(join_err);
            }
        }
        return *this;
    }

	// Detach.
	/*  @docs
		@title: Detach
		@description: Detach from the thread.
	*/
	constexpr
    auto&    detach() {
		if (pthread_detach(*t_id) != 0) {
            throw DetachError(detach_err);
		}
        return *this;
	}
    
    // Sleep.
    /*  @docs
        @title: Sleep
        @description: Put the thread to sleep.
    */
    constexpr
    auto&    sleep() {
        if (pthread_mutex_init(t_mutex.ptr(), NULL) != 0) {
            throw ThreadError(mutex_init_err);
        }
        if (pthread_cond_init(t_cond.ptr(), NULL) != 0) {
            throw ThreadError(cond_init_err);
        }
        if (pthread_mutex_lock(t_mutex.ptr()) != 0) {
            print(errno, ": ", strerror(errno));
            throw ThreadError(lock_err);
        }
        if (pthread_cond_wait(t_cond.ptr(), t_mutex.ptr()) != 0) {
            throw ThreadError(cond_wait_err);
        }
        return *this;
    }
    
    // Wake.
    /*  @docs
        @title: Wake
        @description: Wake the sleeping thread.
    */
    constexpr
    auto&    wake() {
        if (pthread_cond_signal(&(*t_cond)) != 0) {
            throw ThreadError(cond_sig_err);
        }
        return *this;
    }
    
    // Signal.
    /*  @docs
        @title: Signal
        @description: Send a signal to the thread.
     */
    constexpr
    auto&    signal(const Int& signal) {
        if (pthread_kill(*t_id, signal.value()) != 0) {
            throw SignalError(signal_err);
        }
        return *this;
    }
    
    // Kill.
    /*  @docs
        @title: Kill
        @description: Kill and exit the thread.
     */
    constexpr
    auto&    kill() {
        if (pthread_cancel(*t_id) != 0) {
            throw KillError(kill_err);
        }
        return *this;
    }
    
    // Reset.
    /*  @docs
        @title: Reset
        @description: Reset the thread.
    */
    constexpr
    auto&    reset() {
        t_id = pthread_t();
        return *this;
    }

};

// Exceptions.
template <typename Type> excid_t Thread<Type>::start_err = exceptions::add_err("Unable to start the thread.");
template <typename Type> excid_t Thread<Type>::deadlock_err = exceptions::add_err("Unable to join thread: deadlock detected.");
template <typename Type> excid_t Thread<Type>::not_joinable_err = exceptions::add_err("Unable to join thread: thread is not joinable or another thread has already joined this thread.");
template <typename Type> excid_t Thread<Type>::not_found_err = exceptions::add_err("Unable to join thread: thread could not be found.");
template <typename Type> excid_t Thread<Type>::join_err = exceptions::add_err("Unable to join thread.");
template <typename Type> excid_t Thread<Type>::detach_err = exceptions::add_err("Unable to detach from thread.");
template <typename Type> excid_t Thread<Type>::mutex_init_err = exceptions::add_err("Unable to initialize the mutex.");
template <typename Type> excid_t Thread<Type>::lock_err = exceptions::add_err("Unable to lock the mutex.");
template <typename Type> excid_t Thread<Type>::cond_init_err = exceptions::add_err("Unable to initialize the cond.");
template <typename Type> excid_t Thread<Type>::cond_wait_err = exceptions::add_err("Unable to wait for the condition.");
template <typename Type> excid_t Thread<Type>::cond_sig_err = exceptions::add_err("Unable to signal the condition.");
template <typename Type> excid_t Thread<Type>::signal_err = exceptions::add_err("Unable to signal the thread.");
template <typename Type> excid_t Thread<Type>::kill_err = exceptions::add_err("Unable to kill the thread.");

// ---------------------------------------------------------
// Aliases.

using FThread = Thread<Null>;

// ---------------------------------------------------------
// Thread pool for FThreads.
/* @docs
    @chapter: System
    @title: Thread Pool
    @description:
        Thread Pool type.
    
        Currently only supports function threads.
    @usage:
 
        // ---------------------------------------------------------
        // Standard thread pool.
 
         // Include.
         #include <vlib/types.h>
 
         // A thread function.
         void* some_func(const Int& i) {
             vlib::print("Running thread: ", i, ".");
             return NULL;
         }

         int main() {

             // Start a thread without arguments.
             vlib::ThreadPool thread_pool(25); // maximum 25 threads.

             // Iterate threads.
             Int index = 0;
             for (auto& thread: thread_pool) {
                 thread.start(some_func, index);
                 ++index;
             }
             for (auto& thread: thread_pool) {
                 thread.join();
             }
             return 0;

         }
 
         // ---------------------------------------------------------
         // Managed thread pool.
         // The current example creates 100 threads.
         // But only 25 will be running simultaneously.

          // Include.
          #include <vlib/types.h>

          // A thread function.
          void* some_func(const Int& i) {
              vlib::print("Running thread: ", i, ".");
              return NULL;
          }

          int main() {

              // Start a thread without arguments.
              vlib::ThreadPool thread_pool(25); // maximum 25 threads.

              // Iterate threads.
              for (auto& index: range(100)) {
                  thread_pool.start(somefunc, index);
              }
              return 0;

          }
*/
struct ThreadPool {

// Private.
private:
    
    // ---------------------------------------------------------
    // Attributes.
    
    UInt            m_max_threads;
    UInt            m_running_threads;
    Array<FThread>  m_threads;
    Array<short>    m_is_running;
    Mutex           m_mutex;
    
// Public.
public:
    
    // ---------------------------------------------------------
    // Static attributes.
    
    static excid_t parent_id;
    static excid_t start_err;
    
    // ---------------------------------------------------------
    // Constructors.
    
    // Default constructor.
    /*  @docs
        @title: Contructor
        @description:
            Initialize the `ThreadPool` object.
        @parameter:
            @name: max_threads
            @description: Specify the amount of maximum threads.
    */
    constexpr
    ThreadPool(const UInt& max_threads = 25) :
    m_max_threads(max_threads),
    m_running_threads(0)
    {
        m_threads.resize(max_threads.value());
        m_threads.len() = max_threads.value();
        m_is_running.fill_r(max_threads.value(), 0);
    }
    
    // ---------------------------------------------------------
    // Attributes.
    
    // Max threads.
    /*  @docs
        @title: Max Threads
        @description:
            Get the max threads integer attribute.
    */
    constexpr
    auto& max_threads() const {
        return m_max_threads;
    }
    
    // Running threads.
    /*  @docs
        @title: Running Threads
        @description:
            Get the running threads integer attribute.
    */
    constexpr
    auto& running_threads() const {
        return m_running_threads;
    }
    
    // Threads.
    /*  @docs
        @title: Threads
        @description:
            Get the threads array attribute.
    */
    constexpr
    auto& threads() const {
        return m_threads;
    }
    
    // Is running.
    /*  @docs
        @title: Is Running
        @description:
            Get the is running array attribute.
    */
    constexpr
    auto& is_running() const {
        return m_is_running;
    }
    
    // Is running.
    /*  @docs
        @title: Mutex
        @description:
            Get the is mutex attribute.
    */
    constexpr
    auto& mutex() {
        return m_mutex;
    }
    constexpr
    auto& mutex() const {
        return m_mutex;
    }
    
    // ---------------------------------------------------------
    // Functions.
    
    // Claim thread, waits till one is available.
    /*  @docs
        @title: Claim Thread
        @description:
            Claim a thread index, waits indefinitely till one is available.
    */
    constexpr
    uint claim_id() {
        m_running_threads = 0;
        int available_index = -1;
        while (available_index == -1) {
            for (auto& index: m_is_running.indexes()) {
                switch (m_is_running[index]) {
                    case 1:
                        // print("Thread ", index, " has finished running.");
                        m_threads[index].join().reset();
                        m_is_running[index] = 0;
                        // fall through.
                    case 0:
                        // print("Thread ", index, " is unused.");
                        switch (available_index) {
                            case -1:
                                available_index = (uint) index;
                                break;
                            default:
                                break;
                        }
                        break;
                    case 2:
                        // print("Thread ", index, " is still running.");
                        ++m_running_threads;
                        break;
                }
            }
        }
        return (uint) available_index;
    }
    constexpr
    auto& claim() {
        return m_threads[claim_id()];
    }
    
    // Get thread by id.
    /*  @docs
        @title: Get Thread
        @description:
            Get a thread by index.
    */
    constexpr
    auto& thread(uint index) {
        return m_threads[index];
    }
    
    // Set thread id to running.
    /*  @docs
        @title: Set Running
        @description:
            Set a thread's status to running.
    */
    constexpr
    void set_running(uint index) {
        m_is_running[index] = 2;
    }
    
    // Set thread id to finished.
    /*  @docs
        @title: Set Finished
        @description:
            Set a thread's status to finished running.
    */
    constexpr
    void set_finished(uint index) {
        m_is_running[index] = 1;
    }
    
    // Start a thread.
    /*  @docs
        @title: Start
        @description:
            Start a thread.
        @warning:
            This function must be called in order to limit the amount of simultaneosly running threads.
        @usage:
            ThreadPool thread_pool (25);
            for (auto& thread: thread_pool) {
                ...
            }
    */
    template <typename Func, typename... Args> constexpr
    void start(Func&& func, Args&&... args) {
        uint tid = claim_id();
        set_running(tid);
        auto& t = m_threads[tid];
        auto l = new auto(
            [=, this]() -> void* {
                void* r = (void*) func(args...);
                m_mutex.lock();
                set_finished(tid);
                m_mutex.unlock();
                return r;
            }
        );
        auto te = [](void* rp) -> void* {
            auto p = reinterpret_cast<decltype(l)>(rp);
            void* res = (*p)();
            delete p;
            return res;
        };
        if (pthread_create(&(*t.t_id), NULL, te, l) != 0) {
            throw StartError(start_err);
        }
    }
    
    // Join.
    /*  @docs
        @title: Join
        @description:
            Join all threads.
        @usage:
            ThreadPool thread_pool (25);
            for (auto& thread: thread_pool) {
                ...
            }
            thread_pool.join();
    */
    constexpr
    void    join() {
        for (auto& index: m_threads.indexes()) {
            // m_threads[index].join();
            switch (m_is_running[index]) {
                case 2:
                    m_threads[index].join();
                    break;
                default:
                    break;
            }
        }
    }
    
    // Iterate threads.
    /*  @docs
        @title: Iterate
        @description:
            Iterate threads.
        @usage:
            ThreadPool thread_pool (25);
            for (auto& thread: thread_pool) {
                ...
            }
        @funcs: 4
    */
    constexpr
    auto& begin() {
        return m_threads.begin();
    }
    constexpr
    auto& begin() const {
        return m_threads.begin();
    }
    constexpr
    auto end() {
        return m_threads.end();
    }
    constexpr
    auto end() const {
        return m_threads.end();
    }
    
    // Iterate thread indexes.
    /*  @docs
        @title: Iterate Indexes
        @description:
            Iterate the thread indexes.
        @usage:
            ThreadPool thread_pool (25);
            for (auto& index: thread_pool.indexes()) {
                ...
            }
    */
    constexpr
    auto indexes() {
        return m_threads.indexes();
    }
    
    
};

// Exceptions.
excid_t ThreadPool::start_err = exceptions::add_err("Unable to start the thread.");

// ---------------------------------------------------------
// End.

}; 		// End namespace vlib.
#endif 	// End header.
