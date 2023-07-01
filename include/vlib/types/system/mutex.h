// Author: Daan van den Bergh
// Copyright: © 2022 Daan van den Bergh.

// Header.
#ifndef VLIB_MUTEX_T_H
#define VLIB_MUTEX_T_H

// ---------------------------------------------------------
// Includes.

#include <sys/mman.h>
#include <pthread.h>

// Namespace vlib.
namespace vlib {

// ---------------------------------------------------------
// Mutex type.
/* @docs {
	@chapter: system
	@title: Mutex
	@description:
		Mutex type.
 
		- Acts as a shared pointer.
	@usage:
		#include <vlib/types.h>
		vlib::Mutex mutex;
} */
struct Mutex {

// Private.
private:

	// ---------------------------------------------------------
	// Definitions.

	using 		This = 		Mutex;

	// ---------------------------------------------------------
	// Attributes.

	SPtr<pthread_mutex_t>		m_mutex;	// the mutex lock.

// Public.
public:

	// ---------------------------------------------------------
	// Constructors.

	// Default constructor.
	/*  @docs {
		@title: Constructor
		@description:
			The default constructor.
		@usage:
			vlib::mutex mutex;
	} */
	constexpr
    Mutex() :
	m_mutex(pthread_mutex_t())
	{
		pthread_mutex_init(&(*m_mutex), NULL);
	}

	// Constructor with mutex.
	/*  @docs {
		@title: Constructor
		@description:
			Constructor from pthread mutex.
		@parameter: {
			@name: mutex
			@description: The uninitialized pthread mutex object.
		}
		@usage:
			pthread_mutex_t pmutex;
			vlib::mutex mutex(pmutex);
		@funcs: 2
	} */
	constexpr
    Mutex(const pthread_mutex_t& mutex) :
	m_mutex(mutex)
	{
		pthread_mutex_init(&(*m_mutex), NULL);
	}
	constexpr
    Mutex(pthread_mutex_t&& mutex) :
	m_mutex(mutex)
	{
		pthread_mutex_init(&(*m_mutex), NULL);
	}
	
	// Copy constructor.
	constexpr
    Mutex(const This& obj) :
	m_mutex(obj.m_mutex) {}
	
	// Constructor with mutex.
	constexpr
    Mutex(This&& obj) :
	m_mutex(move(obj.m_mutex)) {}
	
	// ---------------------------------------------------------
	// Assignment operators.
	
	// Copy assignment operator.
	constexpr
	auto&	operator =(const This& obj) {
		m_mutex.copy(obj.m_mutex);
		return *this;
	}
	
	// Move assignment operator.
	constexpr
	auto&	operator =(This&& obj) {
		m_mutex.swap(obj.m_mutex);
		return *this;
	}
	
	// ---------------------------------------------------------
	// Functions.

	// Copy.
	/*  @docs {
		@title: Lock
		@description:
			Lock the mutex.
		@usage:
			vlib::mutex mutex;
			mutex.lock();
	} */
	void		lock() const {
		if (pthread_mutex_lock(&(*m_mutex)) != 0 && errno != EDEADLK) {
            throw LockError("Encoutered an error while locking the mutex.");
		}
	}

	// Unlock mutex.
	/*  @docs {
		@title: Unlock
		@description:
			Unlock the mutex.
		@usage:
			vlib::mutex mutex;
			mutex.unlock();
	} */
	void		unlock() const {
		if (pthread_mutex_unlock(&(*m_mutex)) != 0) {
            throw UnlockError("Encoutered an error while locking the mutex.");
		}
	}

};

// ---------------------------------------------------------
// Shared Mutex type.
/* @docs {
    @chapter: system
    @title: Shared Mutex
    @description:
        Shared Mutex type.
 
        - Acts as a shared pointer.
    @usage:
        #include <vlib/types.h>
        struct SharedData {
            pthread_mutex_t mutex;
        };
        static SharedData* shared_data = NULL;
        vlib::SharedMutex mutex (shared_data);
} */
template <typename SharedData>
struct SharedMutex {

// Private.
private:
    
    // ---------------------------------------------------------
    // Definitions.

    using         This =         Mutex;
    
    // ---------------------------------------------------------
    // Attributes.

    SharedData* m_data;
    
// Public.
public:

    // ---------------------------------------------------------
    // Constructors.

    // Default constructor.
    /*  @docs {
        @title: Constructor
        @description:
            The default constructor.
        @usage:
            vlib::mutex mutex;
    } */
    constexpr
    SharedMutex(SharedData*& data, const int& prot = PROT_READ | PROT_WRITE, const int& flags = MAP_SHARED | MAP_ANONYMOUS)
    {
        data = (SharedData*) mmap(NULL, sizeof(SharedData), prot, flags, -1, 0);
        assert(data);
        pthread_mutexattr_t attr;
        pthread_mutexattr_init(&attr);
        pthread_mutexattr_setpshared(&attr, PTHREAD_PROCESS_SHARED);
        pthread_mutex_init(&data->mutex, &attr);
        m_data = data;
    }
    
    // Destructor.
    constexpr
    ~SharedMutex() {
        munmap(m_data, sizeof(m_data));
    }
    
    // ---------------------------------------------------------
    // Assignment operators.

    
    // ---------------------------------------------------------
    // Functions.

    // Copy.
    /*  @docs {
        @title: Lock
        @description:
            Lock the mutex.
        @usage:
            vlib::mutex mutex;
            mutex.lock();
    } */
    constexpr
    void        lock() {
        if (pthread_mutex_lock(&m_data->mutex) != 0) {
            throw LockError("Encoutered an error while locking the mutex.");
        }
    }

    // Unlock mutex.
    /*  @docs {
        @title: Unlock
        @description:
            Unlock the mutex.
        @usage:
            vlib::mutex mutex;
            mutex.unlock();
    } */
    constexpr
    void        unlock() {
        if (pthread_mutex_unlock(&m_data->mutex) != 0) {
            throw UnlockError("Encoutered an error while locking the mutex.");
        }
    }

};

// ---------------------------------------------------------
// End.

}; 		// End namespace vlib.
#endif 	// End header.
