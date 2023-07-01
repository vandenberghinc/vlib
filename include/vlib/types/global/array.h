// Author: Daan van den Bergh
// Copyright: © 2022 Daan van den Bergh.

// Header.
#ifndef VLIB_ARRAY_H
#define VLIB_ARRAY_H

// Namespace vlib.
namespace vlib {

// ---------------------------------------------------------
// Static array struct.
//
// Notes:
// - For internal use only.
//
// @TODO check out strlcat & strlcpy since strcat etc can cause buffer overflows (insecure in network programming).
//

template <typename Type, typename Length = ullong>
struct array {
    
    // Static attributes.
    SICE Length 	limit = limits<Length>::max - 1;
    
    // Alloc.
	SICE
	Type*	alloc(const Length& req_len = 1) {
		if (req_len + 1 > limit) {
			throw std::overflow_error("Buffer overflow.");
		}
		return new Type [req_len + 1];
	}
    SICE
    void 	alloc(Type*& m_arr, const Length& req_len = 1) {
        m_arr = alloc(req_len);
    }
    
    // Realloc.
    SICE
    void 	realloc(Type*& m_arr, Length& m_len, const Length& req_len) {
        Type* arr = alloc(req_len);
        move(arr, m_arr, m_len);
        delete[] m_arr;
        m_arr = arr;
    }
    
    // Destruct.
    SICE
    void 	destruct(Type*& m_arr) {
        delete[] m_arr;
        m_arr = nullptr;
    }
    
    // Only destruct when Type is not a char.
    SICE
    void	destruct_when_array(Type*& m_arr) requires (!is_char<Type>::value) {
        destruct(m_arr);
    }
    SICE
    void	destruct_when_array(Type*&) requires (is_char<Type>::value) {}
    
    // Copy array items.
    SICE
    void 	copy(Type* dest, const Type* src, Length len) {
        while (len-- > 0) { dest[len] = src[len]; }
    }
    
    // Move array items.
    SICE
    void 	move(Type* dest, Type* src, Length len) requires (is_integral<Type>::value) {
        if (dest < src) {
            for (Length i = 0; i < len; ++i) { dest[i] = src[i]; }
        } else {
            while (len-- > 0) { dest[len] = src[len]; }
            // for (Length i = len; i > 0; --i) { dest[i-1] = src[i-1]; }
        }
    }
    SICE
    void 	move(Type* dest, Type* src, Length len) requires (!is_integral<Type>::value) {
        if (dest < src) {
            for (Length i = 0; i < len; ++i) { dest[i] = vlib::move(src[i]); }
        } else {
            while (len-- > 0) { dest[len] = vlib::move(src[len]); }
            // for (Length i = len; i > 0; --i) { dest[i-1] = src[i-1]; }
        }
    }
    
    // Copy arrays.
    SICE
    void 	copy(Type*& m_arr, Length& m_len, Length& m_capacity, const Type* arr, const Length& len, const Length& capacity) {
        if (m_arr == arr) { return ; }
        destruct_when_array(m_arr);
        resize(m_arr, m_len, m_capacity, capacity);
        m_len = len;
        copy(m_arr, arr, m_len);
        null_terminate_safe(m_arr, m_len);
        // delete[] m_arr;
        // alloc(m_arr, capacity);
        // copy(m_arr, arr, len);
        // null_terminate_safe(m_arr, len);
        // m_capacity = capacity;
        // m_len = len;
    }
    
    // Swap arrays.
    SICE
    void 	swap(Type*& m_arr, Length& m_len, Length& m_capacity, Type*& arr, const Length& len, const Length& capacity) {
        destruct(m_arr);
        m_arr = arr;
        m_len = len;
        m_capacity = capacity;
        arr = nullptr;
    }
    
    // Resize the array.
    SICE
    int		resize(Type*& m_arr, Length& m_len, Length& m_capacity, const Length& req_len = 1) {
        if (m_arr == nullptr) {
            m_capacity = req_len;
            alloc(m_arr, m_capacity);
        } else if (req_len > m_capacity) {
			m_capacity = req_len;
            realloc(m_arr, m_len, m_capacity);
        }
        return 0;
    }
    
    // Expand the array.
    SICE
    int		expand(Type*& m_arr, Length& m_len, Length& m_capacity, const Length& with_len, const uint& increaser = 4) {
        if (m_arr == nullptr) {
            m_capacity = with_len;
            alloc(m_arr, m_capacity);
        } else if (m_len + with_len > m_capacity) {
            m_capacity = (m_capacity + with_len) * increaser;
            realloc(m_arr, m_len, m_capacity);
        }
        return 0;
    }
    
    // Concat to the array.
    SICE
    int     concat(Type*& m_arr, Length& m_len, Length& m_capacity, const Type* arr, const Length& len, const uint& increaser = 4) {
        int status;
        if (m_len + len > m_capacity) {
            if ((status = expand(m_arr, m_len, m_capacity, len, increaser)) != 0) {
                return status;
            }
        }
        for (Length i = 0; i < len; ++i) {
            m_arr[m_len] = arr[i];
            ++m_len;
        }
        return 0;
    }
    
    // Equals.
    SICE
    bool 	eq(const Type* arr_x, const Length& len_x, const Type* arr_y, const Length& len_y) {
        if (len_x != len_y) { return false; }
        Length len = len_y;
        while (len-- > 0) { if (*arr_x++ != *arr_y++) { return false; }}
        return true;
    }
    SICE
    bool 	eq(const Type* arr_x, const Type* arr_y) {
        return eq(arr_x, vlib::len(arr_x), arr_y, vlib::len(arr_y));
    }
    
    // Append an item to the array.
    SICE
    void	append(Type*& m_arr, Length& m_len, Length& m_capacity, const Type& x, const uint& increaser = 4) {
        expand(m_arr, m_len, m_capacity, 1, increaser);
        m_arr[m_len] = x;
        ++m_len;
    }
    SICE
    void	append(Type*& m_arr, Length& m_len, Length& m_capacity, Type&& x, const uint& increaser = 4) {
        expand(m_arr, m_len, m_capacity, 1, increaser);
        m_arr[m_len] = x;
        ++m_len;
    }
    
    // Null terminate.
    SICE
    void 	null_terminate(Type*&, Length&, Length&) requires (!is_char<Type>::value) {}
    SICE
    void 	null_terminate(Type*& m_arr, Length& m_len, Length& m_capacity) requires (is_char<Type>::value) {
        if (m_arr == nullptr) { expand(m_arr, m_len, m_capacity, 1); }
        m_arr[m_len] = '\0';
    }
    SICE
    void 	null_terminate_safe(Type*&, const Length&) requires (!is_char<Type>::value) {}
    SICE
    void 	null_terminate_safe(Type*& m_arr, const Length& m_len) requires (is_char<Type>::value) {
        if (m_arr != nullptr) {
            m_arr[m_len] = '\0';
        }
    }
    
    //
};

// base array.
namespace internal {
template <typename Type, typename Length>
struct BaseArray {
    
    // ---------------------------------------------------------
    // Definitions.
    
    using wrapper = array<Type, Length>;
    
    // ---------------------------------------------------------
    // Attributes.
    
    Type*   m_arr = nullptr;
    Length  m_len = 0;
    Length  m_cap = 0;
    
    // ---------------------------------------------------------
    // Constructors.
    
    // Constructor.
    constexpr
    BaseArray() = default;
    
    // Copy array.
    constexpr
    BaseArray(const Type* arr, const Length& len) {
        wrapper::copy(m_arr, m_len, m_cap, arr, len, len);
    }
    
    // Copy string.
    constexpr
    BaseArray(const Type* arr) requires (is_char<Type>::value) {
        const Length len = vlib::len<Length>(arr);
        wrapper::copy(m_arr, m_len, m_cap, arr, len, len);
    }
    
    // Copy constructor.
    constexpr
    BaseArray(const BaseArray& obj) {
        wrapper::copy(m_arr, m_len, m_cap, obj.m_arr, obj.m_len, obj.m_cap);
    }
    
    // Move constructor.
    // BaseArray(BaseArray&& obj) {
    //     wrapper::swap(m_arr, m_len, m_cap, obj.m_arr, obj.m_len, obj.m_cap);
    // }
    
    // Detructor.
    constexpr
    ~BaseArray() {
        if (m_arr != nullptr) {
            delete[] m_arr;
            m_arr = nullptr;
        }
    }
    
    // ---------------------------------------------------------
    // Attributes.
    
    // Len.
    constexpr auto& len() { return m_len; }
    constexpr auto& len() const { return m_len; }
    
    // Capacity.
    constexpr auto& capacity() { return m_cap; }
    constexpr auto& capacity() const { return m_cap; }
    
    // Data.
    constexpr auto& data() { return m_arr; }
    constexpr auto& data() const { return m_arr; }
    
    // ---------------------------------------------------------
    // Iterations.

    // Begin.
    constexpr
    auto&     begin() const {
        return m_arr;
    }
    constexpr
    auto     begin(const Length& index) const {
        return m_arr + index;
    }

    // End
    constexpr
    auto     end() const {
        return m_arr + m_len;
    }
    constexpr
    auto     end(const Length& index) const {
        return m_arr + index;
    }
    
    // ---------------------------------------------------------
    // Functions.
    
    // Resize.
    constexpr
    auto&   resize(const Length& to) {
        wrapper::resize(m_arr, m_len, m_cap, to);
        return *this;
    }
    
    // Append.
    constexpr
    auto&   append(const Type& x) {
        wrapper::append(m_arr, m_len, m_cap, x);
        return *this;
    }
    
    // Concat.
    constexpr
    auto&   concat_r(const Type* x, const Length& len) {
        resize(m_len + len);
        wrapper::copy(m_arr + m_len, x, len);
        m_len += len;
        return *this;
    }
    constexpr
    auto&   concat_r(const BaseArray& x) {
        return concat_r(x.m_arr, x.m_len);
    }
    constexpr
    auto&   concat_r(const Type* x) requires (is_char<Type>::value) {
        return concat_r(x, vlib::len<Length>(x));
    }
    
    // Equal to operator.
    constexpr
    bool    eq_first(const Type* arr, const Length& len) {
        if (m_len < len) { return false; }
        return wrapper::eq(m_arr, len, arr, len);
    }
    
    // As const char*.
    constexpr
    const char*    c_str() requires(is_char<Type>::value) {
        if (m_arr == nullptr) { return ""; }
        switch (m_arr[m_len]) {
            case '\0': return m_arr;
            default: {
                m_arr[m_len] = '\0';
                return m_arr;
            }
        }
    }
    constexpr
    const char*    c_str() const requires(is_char<Type>::value) {
        if (m_arr == nullptr) { return ""; }
        switch (m_arr[m_len]) {
            case '\0': return m_arr;
            default: {
                char* arr = m_arr;
                arr[m_len] = '\0';
                return arr;
            }
        }
    }
    
    // Null terminate.
    constexpr
    auto&   null_terminate() requires(is_char<Type>::value) {
        resize(1);
        m_arr[m_len] = '\0';
        return *this;
    }
    
    // ---------------------------------------------------------
    // Operators.
    
    // Ítring assignment operator.
    constexpr
    auto&   operator =(const Type* arr) requires (is_char<Type>::value) {
        const Length len = vlib::len<Length>(arr);
        wrapper::copy(m_arr, m_len, m_cap, arr, len, len);
        return *this;
    }
    
    // Copy assignment operator.
    constexpr
    auto&   operator =(const BaseArray& obj) {
        wrapper::copy(m_arr, m_len, m_cap, obj.m_arr, obj.m_len, obj.m_cap);
        return *this;
    }
    
    // Copy assignment operator.
    constexpr
    auto&   operator =(BaseArray&& obj) {
        wrapper::swap(m_arr, m_len, m_cap, obj.m_arr, obj.m_len, obj.m_cap);
        return *this;
    }
    
    // Equals.
    constexpr
    bool    operator ==(const BaseArray& x) {
        return wrapper::eq(m_arr, m_len, x.m_arr, x.m_len);
    }
    constexpr
    bool    operator ==(const Type* x) requires (is_char<Type>::value) {
        return wrapper::eq(m_arr, m_len, x, vlib::len<Length>(x));
    }
    
    // Equals not.
    constexpr
    bool    operator !=(const BaseArray& x) {
        return !wrapper::eq(m_arr, m_len, x.m_arr, x.m_len);
    }
    constexpr
    bool    operator !=(const Type* x) requires (is_char<Type>::value) {
        return !wrapper::eq(m_arr, m_len, x, vlib::len<Length>(x));
    }
    
    // Get.
    constexpr
    auto&   operator[](const Length& index) {
        return m_arr[index];
    }
    
    // Concat.
    constexpr
    auto&   operator <<(const BaseArray& x) {
        return concat_r(x);
    }
    constexpr
    auto&   operator <<(const Type* x) requires (is_char<Type>::value) {
        return concat_r(x);
    }
    
};

// Base string.
using BaseString = BaseArray<char, ullong>;

// Is type.
template<typename Type>                     struct is_BaseArray                             { SICEBOOL value = false; };
template<typename Type, typename Length>    struct is_BaseArray<BaseArray<Type, Length>>    { SICEBOOL value = true;  };

// Is type.
template<typename Type>         struct is_BaseString                { SICEBOOL value = false; };
template<>                      struct is_BaseString<BaseString>    { SICEBOOL value = true;  };

};      // End namespace internal.
}; 		// End namespace vlib.
#endif 	// End header.
