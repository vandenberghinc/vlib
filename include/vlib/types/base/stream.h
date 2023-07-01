// Author: Daan van den Bergh
// Copyright: © 2022 Daan van den Bergh.

// Header.
#ifndef VLIB_STREAM_H
#define VLIB_STREAM_H

// Namespace vlib.
namespace vlib {

// Pipe type.
/*     @docs {
    @chapter: types
    @title: Stream
    @description:
        Very simple stream type.
} */
template <typename Type = char>
struct Stream {

// Private:
private:

    // ---------------------------------------------------------
    // Aliases.

    using       This =           Stream;
    using       Length =         ullong;
    using       wrapper =        vlib::array<Type, Length>;

    // ---------------------------------------------------------
    // Attributes.

    Type*       m_arr;
    Length      m_len;
    Length      m_capacity;
    uint        m_increaser = 4;

// Public:
public:
    
    // ---------------------------------------------------------
    // Construct functions.

    // Copy.
    constexpr
    auto&     copy(const This& obj) {
        wrapper::copy(m_arr, m_len, m_capacity, obj.m_arr, obj.m_len, obj.m_capacity);
        return *this;
    }
    // Swap.
    constexpr
    auto&     swap(This& obj) {
        wrapper::swap(m_arr, m_len, m_capacity, obj.m_arr, obj.m_len, obj.m_capacity);
        return *this;
    }

    // ---------------------------------------------------------
    // Constructors.

    // Default constructor.
    constexpr
    Stream() :
    m_arr(nullptr),
    m_len(0),
    m_capacity(0) {}

    // Copy constructor.
    constexpr
    Stream(const This& obj) :
    m_arr(nullptr),
    m_len(obj.m_len),
    m_capacity(obj.m_capacity)
    {
        if (obj.m_arr) {
            wrapper::alloc(m_arr, m_len);
            wrapper::copy(m_arr, obj.m_arr, m_len);
            m_arr[m_len] = '\0';
        }
    }

    // Move constructor.
    constexpr
    Stream(This&& obj) :
    m_arr(obj.m_arr),
    m_len(obj.m_len),
    m_capacity(obj.m_capacity)
    {
        obj.m_arr = nullptr;
    }

    // Destrcutor.
    constexpr
    ~Stream() {
        delete[] m_arr;
    }

    // ---------------------------------------------------------
    // Assignment operators.

    // Copy assignment operator.
    constexpr
    auto&    operator =(const This& obj) {
        return copy(obj);
    }

    // Move assignment operator.
    constexpr
    auto&    operator =(This&& obj) {
        return swap(obj);
    }

    // ---------------------------------------------------------
    // Default functions.

    // Length.
    constexpr
    auto&     len() {
        return m_len;
    }
    constexpr
    auto&     len() const {
        return m_len;
    }

    // Allocated length.
    constexpr
    auto&     capacity() {
        return m_capacity;
    }
    constexpr
    auto&     capacity() const {
        return m_capacity;
    }

    // Data.
    // - Warning: the array's data may contain garbage items, use it in combiation with "len()" to avoid garbage items.
    constexpr
    auto&     data() {
        return m_arr;
    }
    constexpr
    auto&     data() const {
        return m_arr;
    }

    // Is undefined.
    /* @docs {
      @title: Is undefined
      @description:
            Check if the object is undefined.
      @usage:
            Pipe x;
            x.is_undefined(); ==> true;
    } */
    constexpr
    bool     is_undefined() const {
        return m_arr == nullptr;
    }

    // Equals.
    // - Give len_x and len_y the same value to check if the first n items of the array are equal.
    constexpr
    bool     eq(const This& obj) const {
        return wrapper::eq(m_arr, m_len, obj.m_arr, obj.m_len);
    }
    constexpr
    bool     eq(const Type* arr, Length len) const {
        return wrapper::eq(m_arr, m_len, arr, len);
    }
    constexpr
    bool     eq(const Type* arr) const {
        return wrapper::eq(m_arr, m_len, arr, vlib::len(arr));
    }

    // Null terminate.
    constexpr
    auto&     null_terminate() {
        if (m_arr == nullptr) { wrapper::expand(m_arr, m_len, m_capacity, 1, m_increaser); }
        m_arr[m_len] = '\0';
        return *this;
    }

    // ---------------------------------------------------------
    // Functions.
    
    // Reset the buffer & attributes.
    // - This will delete the buffer in opposition to "String::reset()".
    constexpr
    auto&    reset(){
        delete[] m_arr;
        m_arr = nullptr;
        m_len = 0;
        m_capacity = 0;
        return *this;
    }
    
    // Check if the pipe's array will overflow when length is added.
    constexpr
    bool     overflow(ullong len) {
        return m_len + len > limits<ullong>::max;
    }
    
    // Write.
    constexpr
    int     write(const Type* msg, ullong len){
        dump(msg, len);
        return 0;
    }

    // ---------------------------------------------------------
    // Casts.

    // As String.
    constexpr
    String    str() const {
        return String(m_arr, m_len);
    }
    
    // ---------------------------------------------------------
    // Operators.
    
    // Dump to pipe.
    constexpr friend
    auto&   operator <<(Pipe& pipe, const This& obj) {
        return pipe.dump(obj.m_arr, obj.m_len);
    }

    //
};

// ---------------------------------------------------------
// Instances.

// Is instance.
template<typename Type>
struct is_instance<Stream<Type>, Stream<Type>>  { SICEBOOL value = true;  };

// Is pipe type.
template<typename Type> struct is_Stream                { SICEBOOL value = false; };
template<typename Type> struct is_Stream<Stream<Type>>  { SICEBOOL value = true;  };

// ---------------------------------------------------------
// Shortcuts.

namespace shortcuts {
namespace types {

// template<typename Type = char>
// using Stream =        vlib::Stream<Type>;

};         // End namespace types.
};         // End namespace shortcuts.

// ---------------------------------------------------------
// End.

};         // End namespace vlib.
#endif     // End header.
