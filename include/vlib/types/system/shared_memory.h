// Author: Daan van den Bergh
// Copyright: © 2022 Daan van den Bergh.

// Header.
#ifndef VLIB_SHARED_MEMORY_H
#define VLIB_SHARED_MEMORY_H

// Namespace vlib.
namespace vlib {

// ---------------------------------------------------------
// Daemon type.

/*     @docs {
    @chapter: system
    @title: SharedMemory
    @description:
        Shared memory between threads.
} */
template <typename Type>
struct SharedMemory {
    
    // ---------------------------------------------------------
    // Definitions.
    
    using     This =      SharedMemory;
    
    // ---------------------------------------------------------
    // Attributes.
    
    Type*   m_data;
    
    // ---------------------------------------------------------
    // Constructors.
    
    // Default constructor.
    constexpr
    SharedMemory()
    {
        m_data = (Type*) mmap(NULL, sizeof(Type), PROT_READ|PROT_WRITE, MAP_SHARED|MAP_ANONYMOUS, -1, 0);
    }
    
    // Constructor.
    constexpr
    SharedMemory(const Type& data, const int& prot = PROT_READ|PROT_WRITE, const int& flags = MAP_SHARED|MAP_ANONYMOUS)
    {
        m_data = (Type*) mmap(NULL, sizeof(Type), prot, flags, -1, 0);
        *m_data = data;
    }
    constexpr
    SharedMemory(Type&& data, const int& prot = PROT_READ|PROT_WRITE, const int& flags = MAP_SHARED|MAP_ANONYMOUS)
    {
        m_data = (Type*) mmap(NULL, sizeof(Type), prot, flags, -1, 0);
        *m_data = data;
    }
    
    // Constructor.
    constexpr
    ~SharedMemory()
    {
        if (m_data != nullptr) {
            munmap(m_data, sizeof(Type));
            m_data = nullptr;
        }
    }
    
// Public.
public:
    
    // ---------------------------------------------------------
    // Public functions.
    
    // Get the underlying data.
    /* @docs {
        @title: Data
        @description:
            Get the underlying data.
        @funcs: 4
    */
    constexpr
    auto&     data() {
        return *m_data;
    }
    constexpr
    auto&     data() const {
        return *m_data;
    }
    constexpr
    auto&     operator *() {
        return *m_data;
    }
    constexpr
    auto&     operator *() const {
        return *m_data;
    }
    constexpr
    auto&     operator ->() {
        return m_data;
    }
    constexpr
    auto&     operator ->() const {
        return m_data;
    }
    
    
    
};

// ---------------------------------------------------------
// Shortcuts.

namespace shortcuts {
namespace types {

template <typename Type>
using SharedMemory =        vlib::SharedMemory<Type>;

};         // End namespace types.
};         // End namespace shortcuts.


// ---------------------------------------------------------
// End.

};         // End namespace vlib.
#endif     // End header.
