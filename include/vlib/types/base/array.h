// Author: Daan van den Bergh
// Copyright: © 2022 Daan van den Bergh.

//
// NOTES:
//
//  - Check if a function "funcname_c" exists before using "copy().funcname()".
//

// Header.
#ifndef VLIB_BARRAY_T_H
#define VLIB_BARRAY_T_H

// Namespace vlib.
namespace vlib {

// @TODO docs different from Array.

// ---------------------------------------------------------
// To string casts.

// Namespace casts.
namespace casts {

// Namespace tostr.
namespace tostr {

// The precision for double casts.
static inline uint 	precision = 		6;

// Add zero padding for double casts.
static inline bool  zero_padding = 		true;

};		// End namespace tostr.
};		// End namespace casts.

// ---------------------------------------------------------
// Array type.
/*  @docs {
 *	@chapter: types
 *	@title: Array
 *	@description:
 *		Dynamic array.
 *
 *		A vlib string is a type definition of `Array<char>` accessable as `String`.
 *	@template: {
 *		@name: Type
 *		@description: The type of the array children.
 *	}
 *	@template: {
 *		@name: Length
 *		@def: unsigned long long
 *		@description: The numerical type for the length, index and capacity variables. The default type is `unsigned long long`.
 *	}
 *	@usage:
 *		Array<Int> x = {1, 2, 3};
} */
/*  @docs {
 *	@name: String
 *	@chapter: types
 *	@title: String
 *	@description:
 *		Dynamic string.
 *
 *		`String` is a type definition of `Array<char>` so some documented functions may describe the `Array` object. These documented functions are exactly the same for `String`.
 *	@template: {
 *		@name: Type
 *		@ignore: true
 *	}
 *	@template: {
 *		@name: Length
 *		@ignore: true
 *	}
 *	@usage:
 *		String x = "Hello World!";
} */
// @TODO fix docs with String and Array since I cant test now.
template <
	typename 		Type,
	typename 		Length
>
struct Array {

	// ---------------------------------------------------------
	// Aliases.

	using 		This = 				Array;
	using		array_h = 			vlib::array<Type, Length>;

	// ---------------------------------------------------------
	// Type definitions.

    // typedef     Array<char, ullong>        String;
	typedef 	Type					value_type;
    typedef     Type ValueType;
    
    // Is string template for g++ compiler.
    template <typename LType> requires (!std::is_same<const LType, const String>::value) SICE
    bool is_String_h() { return false; }
    template <typename LType> requires (std::is_same<const LType, const String>::value) SICE
    bool is_String_h() { return true; }

	// ---------------------------------------------------------
	// Attributes.
	
	Type* 			m_arr;				// the array.
	Length 			m_len; 				// the arrays length.
	Length	 		m_capacity;		// the arrays allocated length.
	uint			m_increaser = 4;	// the expand increaser.

	// ---------------------------------------------------------
	// Wrappers.

	// Shift the array 1 pos to the right.
	constexpr
	This& 	rshift_h(const Length sindex = 0, const Length eindex = internal::npos) {
		const Length shift = 1;
		Length sum = shift + sindex;
		Length i;
		switch (eindex) {
			case internal::npos: {
				i = m_len + shift;
				expand(shift);
				// m_len += shift;
				break;
			}
			default: {
				i = eindex + shift;
				if (eindex + shift > m_len) {
					expand(shift);
					// m_len = eindex + shift;
				}
				break;
			}
		}
		while (i-- > sum) {
			m_arr[i] = m_arr[i - shift];
		}
		return *this;
	}

	// Shift the array 1 pos to the left.
	constexpr
	This& 	lshift_h(const Length sindex = 0, const Length eindex = internal::npos) {
		const Length shift = 1;
		switch (eindex) {
			case internal::npos: {
				for (Length i = sindex; i < m_len; ++i) {
					m_arr[i] = m_arr[i + shift];
				}
				// m_len -= shift;
				return *this;
			}
			default: {
				for (Length i = sindex; i < eindex; ++i) {
					m_arr[i] = m_arr[i + shift];
				}
				// if (eindex + shift > m_len) {
				// 	m_len -= (eindex - shift);
				// }
				return *this;
			}
		}
	}

	// ---------------------------------------------------------
	// Construct functions.

	// Reconstruct an array from another array with alloc length.
	constexpr
	This& 	reconstruct(const Type* arr, const Length len, const Length capacity) {
		destruct_when_array_h();
		resize(capacity);
		m_len = len;
		array_h::copy(m_arr, arr, m_len);
		null_terminate_safe_h();
		return *this;
	}

	// Reconstruct an array from another array without alloc length.
	constexpr
	This& 	reconstruct(const Type* arr, const Length len) {
		destruct_when_array_h();
		resize(len);
		m_len = len;
		array_h::copy(m_arr, arr, m_len);
		null_terminate_safe_h();
		return *this;
	}

	// Reconstruct an array from an initializer list.
	constexpr
	This& 	reconstruct(const std::initializer_list<Type>& x) {
		destruct_when_array_h();
		resize(x.size());
		m_len = 0;
		for (auto& i: x) {
			m_arr[m_len] = i;
			++m_len;
		}
		null_terminate_safe_h();
		return *this;
	}

	This& 	reconstruct(std::initializer_list<Type>& x) requires (!is_integral<Type>::value) {
		destruct_when_array_h();
		resize(x.size());
		m_len = 0;
		for (auto& i: x) {
			m_arr[m_len] = move(i);
			++m_len;
		}
		null_terminate_safe_h();
		return *this;
	}

	// Reconstruct a char array from another char array without length.
	constexpr
	This& 	reconstruct(const Type* arr) requires (is_char<Type>::value) {
		if (arr) {
			m_len = 0;
			concat_r(arr);
			null_terminate_safe_h();
		} else {
			reset();
		}
		return *this;
	}
	
	// Copy reconstruct.
	// - Mainly for `Path` etc.
	constexpr
	This& 	reconstruct(const This& obj) {
		array_h::copy(m_arr, m_len, m_capacity, obj.m_arr, obj.m_len, obj.m_capacity);
		return *this;
	}

	// Reconstruct a char array from a bool / char / numeric.
	template <typename Cast> requires (is_char<Type>::value && is_integral<Cast>::value) constexpr
	This& 	reconstruct(const Cast& cast) {
		m_len = 0;
		concats_r(cast);
		return *this;
	}

	// Copy array.
	constexpr
	This& 	copy(const Type*& arr, const Length len, const Length capacity) {
		array_h::copy(m_arr, m_len, m_capacity, arr, len, capacity);
		return *this;
	}

	// Copy.
	constexpr
	This& 	copy(const This& obj) {
		array_h::copy(m_arr, m_len, m_capacity, obj.m_arr, obj.m_len, obj.m_capacity);
		return *this;
	}

	// Copy from CString / Pipe.
	template <typename Array> requires (is_char<Type>::value && (is_CString<Array>::value || is_Pipe<Array>::value || internal::is_BaseArray<Array>::value)) constexpr
	This& 	copy(const Array& obj) {
		resize(obj.m_len);
		m_len = obj.m_len;
		array_h::copy(m_arr, obj.m_arr, m_len);
		null_terminate_safe_h();
		return *this;
	}

	// Swap array.
	constexpr
	This& 	swap(Type*&	arr, const Length len, const Length capacity) {
		array_h::swap(m_arr, m_len, m_capacity, arr, len, capacity);
		return *this;
	}

	// Swap.
	constexpr
	This& 	swap(This& obj) {
		array_h::swap(m_arr, m_len, m_capacity, obj.m_arr, obj.m_len, obj.m_capacity);
		obj.m_len = 0;
		obj.m_capacity = 0;
		return *this;
	}

	// Swap with CString / Pipe.
	template <typename Array> requires (is_char<Type>::value && (is_Pipe<Array>::value || internal::is_BaseArray<Array>::value)) constexpr
	This& 	swap(Array&	obj) {
		delete[] m_arr;
		m_arr = obj.m_arr;
		m_len = obj.m_len;
		m_capacity = obj.m_capacity;
		obj.m_arr = nullptr;
		obj.m_len = 0;
		obj.m_capacity = 0;
		return *this;
	}

	// Safely destruct the array.
	constexpr
	This& 	destruct() {
		array_h::destruct(m_arr);
		m_len = 0;
		m_capacity = 0;
		return *this;
	}

	// Only destruct when Type is not a char.
	constexpr
	void	destruct_when_array_h() requires (!is_char<Type>::value) {
		array_h::destruct(m_arr);
	}
	constexpr
	void	destruct_when_array_h() requires (is_char<Type>::value) {}

	// ---------------------------------------------------------
	// Constructors.

	// Default constructor.
	constexpr
	Array () :
	m_arr(nullptr),
	m_len(0),
	m_capacity(0) {}
	constexpr
	Array (const Null&) :
	m_arr(nullptr),
	m_len(0),
	m_capacity(0) {}

	// Constructor from an array with length and alloc length.
	constexpr
	Array (const Type* arr, const Length len, const Length capacity) :
	m_arr(nullptr),
	m_len(len),
	m_capacity(capacity)
	{
		if (arr) {
			array_h::alloc(m_arr, capacity);
			array_h::copy(m_arr, arr, m_len);
			null_terminate_safe_h();
		}
	}

	// Constructor from an array with length.
	constexpr
	Array (const Type* arr, const Length len) :
	m_arr(nullptr),
	m_len(len),
	m_capacity(len)
	{
		if (arr) {
			array_h::alloc(m_arr, len);
			array_h::copy(m_arr, arr, m_len);
			null_terminate_safe_h();
		}
	}
    
	// Constructor from initializer list.
	/*  @docs {
	 *	@parent: vlib::Array
	 *	@title: Constructor
	 *	@description:
	 *		Construct an `Array` object.
	 *	@usage:
	 *		Array<int> x ({1, 2, 3});
	} */
	constexpr
	Array (const std::initializer_list<Type>& x) :
	m_arr(nullptr),
	m_len(0),
	m_capacity(x.size())
	{
		array_h::alloc(m_arr, x.size());
		for (auto& i: x) {
			m_arr[m_len] = i;
			++m_len;
		}
		null_terminate_safe_h();
	}
	constexpr
	Array (std::initializer_list<Type>&& x) requires (!is_integral<Type>::value) :
	m_arr(nullptr),
	m_len(0),
	m_capacity(x.size())
	{
		array_h::alloc(m_arr, x.size());
		for (auto& i: x) {
			m_arr[m_len] = move(i);
			++m_len;
		}
		null_terminate_safe_h();
	}

	// Constructor from a char array.
	/*  @docs {
	 *	@parent: vlib::String
	 *	@title: Construct
	 *	@description:
	 *		Construct a `String` object from a char array without length.
	 *	@usage:
	 *		String x ("Hello World!");
	 } */
	constexpr
	Array (const Type* arr) requires (is_char<Type>::value) :
	m_arr(nullptr),
	m_len(0),
	m_capacity(0)
	{
		if (arr) {
			concat_r(arr);
			null_terminate_safe_h();
		}
	}

	// Construct a char array from a bool / char / numeric.
	/*  @docs {
	 *	@parent: vlib::String
	 *	@title: Cast Construct
	 *	@description:
	 *		Construct a `String` from an integral type cast.
	 *	@usage:
	 *		String x (1);
	 *		x => "1";
	 } */
	template <typename Cast> requires (is_char<Type>::value && is_integral<Cast>::value)
	explicit constexpr
	Array (const Cast& cast) :
	m_arr(nullptr),
	m_len(0),
	m_capacity(0)
	{
		concats_r(cast);
	}

	// Copy constructor.
	constexpr
	Array (const This& obj) :
	m_arr(nullptr),
	m_len(obj.m_len),
	m_capacity(obj.m_capacity)
	{
		if (obj.m_arr) {
			array_h::alloc(m_arr, m_capacity);
			array_h::copy(m_arr, obj.m_arr, m_len);
			array_h::null_terminate(m_arr, m_len, m_capacity);
		}
	}
	
	// Copy constructor from CString / Pipe.
	template <typename Template> requires (is_char<Type>::value && (is_CString<Template>::value || is_Pipe<Template>::value || internal::is_BaseArray<Template>::value)) constexpr
	Array (const Template& obj) :
	m_arr(nullptr),
	m_len(obj.len()),
	m_capacity(obj.capacity())
	{
		if (obj.data()) {
			array_h::alloc(m_arr, m_len);
			array_h::copy(m_arr, obj.data(), m_len);
			null_terminate_safe_h();
		}
	}

	// Move constructor.
	constexpr
	Array (This&& obj) :
	m_arr(obj.m_arr),
	m_len(obj.m_len),
	m_capacity(obj.m_capacity)
	{
		obj.m_arr = nullptr;
		obj.m_len = 0;
		obj.m_capacity = 0;
	}

	// Move constructor from CString / Pipe.
	template <typename Template> requires (is_char<Type>::value && (is_Pipe<Template>::value || internal::is_BaseArray<Template>::value)) constexpr
	Array (Template&& obj) :
	m_arr(nullptr),
	m_len(obj.len()),
	m_capacity(obj.capacity())
	{
		m_arr = obj.data();
		obj.data() = nullptr;
		obj.len() = 0;
		obj.capacity() = 0;
	}

	// Destructor.
	constexpr
	~Array () {
		delete[] m_arr;
	}

	// ---------------------------------------------------------
	// Assignment operators.

	// Assignment operator from initializer list.
	constexpr
	This&	operator =(const std::initializer_list<Type>& x) {
		return reconstruct(x);
	}
	constexpr
	This&	operator =(std::initializer_list<Type>&& x) {
		return reconstruct(x);
	}

	// Constructor from Type*.
	constexpr
	This&	operator =(const Type* x) requires (is_char<Type>::value) {
		return reconstruct(x);
	}

	// Construct a str from a bool / char / numeric.
	template <typename Cast> requires (is_char<Type>::value && is_integral<Cast>::value) constexpr
	This&	operator =(const Cast& cast) {
		return reconstruct(cast);
	}

	// Copy assignment operator.
	constexpr
	This&	operator =(const This& obj) {
		return copy(obj);
	}

	// Copy assignment operator from CString / Pipe.
	template <typename Array> requires (is_char<Type>::value && (is_CString<Array>::value || is_Pipe<Array>::value || internal::is_BaseArray<Array>::value)) constexpr
	This&	operator =(const Array& x) {
		return copy(x);
	}

	// Move assignment operator.
	constexpr
	This&	operator =(This&& obj) {
		return swap(obj);
	}

	// Move assignment operator from CString / Pipe.
	template <typename Array> requires (is_char<Type>::value && (is_Pipe<Array>::value || internal::is_BaseArray<Array>::value)) constexpr
	This&	operator =(Array&& x) {
		return swap(x);
	}


	// ---------------------------------------------------------
	// Attribute functions.

	// Length.
	/*  @docs {
		@title: Length
		@type: ullong&
		@description:
			Get the length attribute.
	} */
	constexpr
	auto& 	len() {
		return m_len;
	}
	constexpr
	auto& 	len() const {
		return m_len;
	}

	// Allocated length.
	/*  @docs {
		@title: Capacity
		@type: ullong&
		@description:
			Get the length attribute.
	} */
	constexpr
	auto& 	capacity() {
		return m_capacity;
	}
	constexpr
	auto& 	capacity() const {
		return m_capacity;
	}

	// Data.
	// - Warning: the array's data may contain garbage items, use it in combiation with "len()" to avoid garbage items.
	/*  @docs {
		@title: Data
		@type: Type&
		@description:
			Get a reference to the internal data pointer.
		@warning:
			The array's data may contain garbage items, use it in combination with `len()` to avoid garbage items.
	} */
	constexpr
	auto& 	data() {
		return m_arr;
	}
	constexpr
	auto& 	data() const {
		return m_arr;
	}

	// Is undefined.
	/* @docs {
	  @title: Is undefined
	  @description:
			Check if the object is undefined.
	  @usage:
			Array<Int> x;
			x.is_undefined(); ==> true;
	} */
    constexpr
	bool 	is_undefined() const {
		return m_len == 0; // since reset assigns m_len to 0.
	}

	// Is defined.
	/* @docs {
	  @title: Is defined
	  @description:
			Check if the object is defined.
	  @usage:
			Array<Int> x;
			x.is_defined(); ==> false;
	} */
	constexpr
	bool 	is_defined() const {
		return m_len != 0;
	}

	// ---------------------------------------------------------
	// Iterations.

	// Begin.
	constexpr
	auto& 	begin() const {
		return m_arr;
	}
	constexpr
	auto 	begin(const Length index) const {
		return m_arr + index;
	}

	// End
	constexpr
	auto 	end() const {
		return m_arr + m_len;
	}
	constexpr
	auto 	end(const Length index) const {
		return m_arr + index;
	}

	// Iterate.
	/* 	@docs {
		@title: Iterate
		@description:
			Iterate from index till index.
	 
			Optionally iterate the array reversed.
	 
			The start and end indexes of a reversed iteration are just like a normal iteration, so index `0` is the first index.
		@usage:
			Array<Int> x ({0, 1, 2, 3});
			for (auto& i: x.iterate(1, 2)) { ... }
		@funcs: 2
	} */
	template <typename Iter = Forwards, typename... Air> requires (
		is_Forwards<Iter>::value ||
		is_Backwards<Iter>::value
	) constexpr
	auto 	iterate() const {
		return vlib::internal::array::iter_t<Iter, Type, Length>(
			0,
			m_len,
			m_arr );
	}
	template <typename Iter = Forwards, typename... Air> requires (
		is_Forwards<Iter>::value ||
		is_Backwards<Iter>::value
	) constexpr
	auto 	iterate(const Length sindex, const Length eindex = internal::npos) const {
		switch (eindex) {
			case internal::npos:
				return vlib::internal::array::iter_t<Iter, Type, Length>(
					sindex,
					m_len,
					m_arr );
			default:
				return vlib::internal::array::iter_t<Iter, Type, Length>(
					sindex,
					eindex,
					m_arr );
		}
	}

	// Iterate indexes.
	/* 	@docs {
		@title: Indexes
		@description:
			Iterate the indexes from index till index.
	 
			Optionally iterate the indexes reversed.
	 
			The start and end indexes of a reversed iteration are just like a normal iteration, so index `0` is the first index.
		@usage:
			Array<Int> x ({0, 1, 2, 3});
			for (auto& i: x.iterate(1, 2)) { ... }
		@funcs: 2
	} */
	template <typename Iter = Forwards, typename... Air> requires (
		is_Forwards<Iter>::value ||
		is_Backwards<Iter>::value
	) constexpr
	auto 	indexes() const {
		return Range<Iter, Length>(0, m_len);
	}
	template <typename Iter = Forwards, typename... Air> requires (
		is_Forwards<Iter>::value ||
		is_Backwards<Iter>::value
	) constexpr
	auto 	indexes(const Length sindex, const Length eindex = internal::npos) const {
		switch (eindex) {
			case internal::npos:
				return Range<Iter, Length>(sindex, m_len);
			default:
				return Range<Iter, Length>(sindex, eindex);
		}

	}
    
    // Iterate lines.
    // End line should be 1 higher than the actual line to end with.
    // Just like with the default end index from iterating.
	/* 	@docs {
	 * 	@title: Indexes
	 * 	@description:
	 * 		Iterate the lines of a string with a handler function.
	 *
	 *	@parameter: {
	 *		@name: handler
	 *		@description:
	 *			The handler function takes the arguments `(const char*, ullong)`. The `const char*` is null terminated.
	 *	}
	 * 	@usage:
	 * 		String x = "Line 1\n Line 2";
	 * 		x.iterate_lines([](const char* data, ullong len) {
	 *			print(data);
	 *		});
	 *	@funcs: 2
	 } */
    template <typename Func> constexpr
    auto&   iterate_lines(Func&& handler) {
        return iterate_lines(0, 0, handler);
    }
    template <typename Func> constexpr
    auto&   iterate_lines(ullong start_line, ullong end_line, Func&& func) {
        ullong sindex = 0, index = 0, line = 0;
        for (auto& c: *this) {
            switch (c) {
                case '\n': {
					if (line >= start_line && (end_line == 0 || line < end_line)) {
						char* arr = data() + sindex;
						arr[index - sindex] = '\0';
						func(arr, index - sindex);
					}
					++line;
                    sindex = index + 1;
                    break;
                    
                }
                default:
                    break;
            }
            ++index;
        }
		char* arr = data() + sindex;
		arr[index - sindex] = '\0';
        func(arr, index - sindex);
        return *this;
    }

	// ---------------------------------------------------------
	// Functions.

	// Copy the object.
	/* @docs {
	  @title: copy
	  @description:
			Copy the data of the array to a new array.
	  @usage:
			Array<int> a = {1, 2, 3};
			Array<int> b = {4, 5, 6};
			Array<int> c = x.copy().concat_r(b);
	} */
	constexpr
	This 	copy() {
		return *this;
	}
	constexpr
	This 	copy() const {
		return *this;
	}
	
	// Reset.
	/*  @docs {
		@title: Reset
		@description: Reset the attributes.
	} */
	constexpr
	This& 	reset() requires (!is_char<Type>::value) {
		return destruct();
	}
	constexpr
	This& 	reset() requires (is_char<Type>::value) {
		m_len = 0;
		null_terminate_safe_h();
		return *this;
	}

	// Resize the array.
	// - The array may never be shrinked if the req_len is lower then m_capacity, ...
	//   This would break other types such as but not limited to restapi::Server & restapi::Endpoint.
	/*  @docs {
	 *  @title: Resize
	 *  @description:
	 *  	Resize the array to a required capacity.
	 *
	 *  	Does not edit the attribute, only the capactity.
	} */
	constexpr
	This&	resize(const Length req_len = 1) {
		if (array_h::resize(m_arr, m_len, m_capacity, req_len) < 0) {
			throw AllocError("The allocated length has already reached the maximum size.");
		}
		return *this;
	}
    template <typename Len> requires (is_Len<Len>::value) constexpr
    This&    resize(const Len& req_len = 1) {
        return resize(req_len.value());
    }

	// Expand the array.
	/*  @docs {
	 *  @title: Expand
	 *  @description:
	 *  	Expand the array with a capacity.
	 *
	 *  	Does not edit the length, only the capactity.
	} */
	constexpr
	This&	expand(const Length with_len) {
		if (array_h::expand(m_arr, m_len, m_capacity, with_len, m_increaser) < 0) {
			throw AllocError("The allocated length has already reached the maximum size.");
		}
		return *this;
	}
    template <typename Len> requires (is_Len<Len>::value) constexpr
    This&    expand(const Len& with_len) {
        return expand(with_len.value());
    }

	// Equals.
	// - Give len_x and len_y the same value to check if the first n items of the array are equal.
	/*  @docs {
	 *  @title: Equals
	 *  @description:
	 *  	Check if the array equals another array of pointer.
	 *
	 *  	Give `len_x` and `len_y` the same value to check if the first n items of the array are equal.
	 *  @funcs: 7
	} */
	constexpr
	bool 	eq(const This& obj) const {
		return array_h::eq(m_arr, m_len, obj.m_arr, obj.m_len);
	}
	constexpr
	bool 	eq(const This& obj, const Length len_to_check) const {
		return array_h::eq(m_arr, len_to_check, obj.m_arr, len_to_check);
	}
	constexpr
	bool 	eq(const CString& obj) const requires (is_char<Type>::value) {
		return array_h::eq(m_arr, m_len, obj.data(), obj.len());
	}
	constexpr
	bool 	eq(const Type* arr, const Length len) const {
		return array_h::eq(m_arr, m_len, arr, len);
	}
	constexpr
	bool 	eq(const Type* arr) const requires (is_char<Type>::value) {
		return array_h::eq(m_arr, m_len, arr, vlib::len(arr));
	}
	constexpr
	bool 	eq(const Type& x) const {
		return m_len == 1 && m_arr[0] == x;
	}
	SICE
	bool 	eq(
		const Type* 			arr_x,		// the first array of the comparison.
		const Length 			len_x,		// the length of the first array.
		const Type* 			arr_y,		// the second array of the comparison.
		const Length 			len_y		// the length to check.
	) {
		return array_h::eq(arr_x, len_x, arr_y, len_y);
	}
	
	// Equals first characters.
	/*  @docs {
	 *  @title: Equals first
	 *  @description:
	 *  	Check if the first items of the array are equal to another array.
	 *  @funcs: 3
	} */
	constexpr
	bool 	eq_first(const Type* arr, const Length len_to_check) const requires (is_char<Type>::value) {
		if (m_len < len_to_check) { return false; }
		return array_h::eq(m_arr, len_to_check, arr, len_to_check);
	}
	constexpr
	bool 	eq_first(const Array& obj, const Length len_to_check) const requires (is_char<Type>::value) {
		if (m_len < len_to_check) { return false; }
		return array_h::eq(m_arr, len_to_check, obj.data(), len_to_check);
	}
	template <typename String> requires (
		is_String_h<String>() ||
		is_CString<String>::value ||
		is_Pipe<String>::value ||
        internal::is_BaseArray<String>::value
	)
	constexpr
	bool 	eq_first(const String& obj, const Length len_to_check) const requires (is_char<Type>::value) {
		if (m_len < len_to_check) { return false; }
		return array_h::eq(m_arr, len_to_check, obj.data(), len_to_check);
	}

	// First element.
	/*  @docs {
		@title: First
		@description: Get the first item of the array.
		@warning: Will cause a segfault if the array's length is `0`.
	} */
	constexpr
	auto& 	first() {
        if (m_len == 0) {
            throw IndexError("Index is out of range.");
        }
		return m_arr[0];
	}
	constexpr
	auto& 	first() const {
        if (m_len == 0) {
            throw IndexError("Index is out of range.");
        }
		return m_arr[0];
	}

	// Last element.
	/*  @docs {
		@title: Last
		@description: Get the last item of the array.
		@warning: Will cause a segfault if the array's length is `0`.
	} */
	constexpr
	auto& 	last() {
        if (m_len == 0) {
            throw IndexError("Index is out of range.");
        }
		return m_arr[m_len-1];
	}
	constexpr
	auto& 	last() const {
        if (m_len == 0) {
            throw IndexError("Index is out of range.");
        }
		return m_arr[m_len-1];
	}

	// Get by reference.
	//  - Does not support negative indexes.
	//  - Does not check indexes.
	/*  @docs {
		@title: Get
		@description: Get an item of the array at a specified index.
		@warning: Will cause a segfault if the index is higher or equal to the array's length attribute.
	} */
	constexpr
	auto& 	get(const Length index) const {
        if (index >= m_len) {
            throw IndexError("Index is out of range.");
        }
		return m_arr[index];
	}
    template <typename Len> requires (is_Len<Len>::value) constexpr
    auto&    get(const Len& index) {
        return get(index.value());
    }
    
	/*  @docs {
		@title: Reversed get
		@description:
			Get an item of the array at a specified reversed index.
			
			Therefore `rget(1)` will return the last item of the array.
		@warning: Will cause a segfault if the index is higher or equal to the array's length attribute.
	} */
	constexpr
	auto& 	rget(const Length index) const {
        if (index > m_len) {
            throw IndexError("Index is out of range.");
        }
		return m_arr[m_len - index];
	}

	// Set an index to a value.
	/*  @docs {
		@title: Set
		@description:
			Set an item of the array at a specified index.
	 
			Automatically increments the length attribute when the item is assigned to the last index.
		@warning: Will cause a segfault if the index is higher than the array's length attribute.
	} */
	constexpr
	auto& 	set(const Length index, const Type& item) {
		m_arr[index] = item;
		if (index == m_len) { ++m_len; }
		return *this;
	}
	constexpr
	auto& 	set(const Length index, Type&& item) {
		m_arr[index] = item;
		if (index == m_len) { ++m_len; }
		return *this;
	}

	// Pop an index from the array with an optional default return.
	/*  @docs {
		@title: Pop
		@description:
			Pop an item from the array at a specified index, optionally define a default return.
		@warning: Will cause a segfault if the index is higher or equal to the array's length attribute.
		@funcs: 2
	} */
	constexpr
	auto	pop(const Length index) {
		if (m_len == 0 || index == internal::npos || index >= m_len) {
			return Type();
		} else if (index + 1 == m_len) {
			Type x = m_arr[index];
			--m_len;
			return x;
		} else {
			Type x = m_arr[index];
			lshift_h(index);
			m_len -= 1;
			return x;
		}
		return Type();
	}
	constexpr
	auto	pop(const Length index, const Type& def) {
		if (m_len == 0 || index == internal::npos || index >= m_len) {
			return def;
		} else if (index + 1 == m_len) {
			Type x = m_arr[index];
			--m_len;
			return x;
		} else {
			Type x = m_arr[index];
			lshift_h(index);
			m_len -= 1;
			return x;
		}
		return def;
	}

	// Insert.
	/*  @docs {
		@title: Insert
		@description:
			Insert an item into the array at a specified index.
		@warning: Will cause a segfault if the index is higher or equal to the array's length attribute.
	} */
	constexpr
	This&	insert(const Length index, const Type& item) {
		if (index == internal::npos) { return *this; }
		rshift_h(index);
		m_arr[index] = item;
		++m_len;
		return *this;
	}

	// Append an item to the array.
	/*  @docs {
		@title: Append
		@description:
			Append one or multiple items to the array.
		@funcs: 2
	} */
	template <typename... Args> constexpr
	This&	append(const Type& x, Args&&... args) {
		expand(1);
		m_arr[m_len] = x;
		++m_len;
		append(args...);
		return *this;
	}
	template <typename... Args> constexpr
	This&	append(Type&& x, Args&&... args) {
		expand(1);
		m_arr[m_len] = vlib::move(x);
		++m_len;
		append(args...);
		return *this;
	}
	constexpr
	void	append() {}

	// Append an item to the array without resizing.
	/*  @docs {
		@title: Append no resize
		@description:
			Append one or multiple items to the array, without resizing the array.
		@funcs: 2
	} */
	template <typename... Args> constexpr
	This&	append_no_resize(const Type& x, Args&&... args) {
		m_arr[m_len] = x;
		++m_len;
		append_no_resize(args...);
		return *this;
	}
	template <typename... Args> constexpr
	This&	append_no_resize(Type&& x, Args&&... args) {
		m_arr[m_len] = x;
		++m_len;
		append_no_resize(args...);
		return *this;
	}
	constexpr
	void	append_no_resize() {}

	// Concat the array to an array.
	/*  @docs {
		@title: Concat
		@description:
			Concat another array with the array.
		
			Function `concat_r` updates the current array, while `concat` creates a copy and concats the array with the copy.
		@funcs: 9
	} */
	constexpr
	This&	concat_r(const This& obj) {
		resize(m_len + obj.m_len);
		array_h::copy(m_arr + m_len, obj.m_arr, obj.m_len);
		m_len += obj.m_len;
		return *this;
	}
	constexpr
	This&	concat_r(This&& obj) {
		resize(m_len + obj.m_len);
		array_h::move(m_arr + m_len, obj.m_arr, obj.m_len);
		m_len += obj.m_len;
		return *this;
	}
	constexpr
	This&	concat_r(const Type* arr, const Length len) {
		expand(len);
		array_h::copy(m_arr + m_len, arr, len);
		m_len += len;
		return *this;
	}
	constexpr
	This&	concat_r(const Type* arr) requires (is_char<Type>::value) {
		while (*arr) { append(*arr); ++arr; }
		return *this;
	}
	template <typename Cast> requires (is_char<Type>::value && is_integral<Cast>::value) constexpr
	This&	concat_r(const Cast& cast) {
		return concats_r(cast);
	}
	template <typename Template>	requires (
		is_char<Type>::value &&
		(is_CString<Template>::value || is_Pipe<Template>::value || internal::is_BaseArray<Template>::value)
	) constexpr
	This&	concat_r(const Template& obj) {
		expand(obj.len());
		array_h::copy(m_arr + m_len, obj.data(), obj.len());
		m_len += obj.len();
		return *this;
	}
	template <typename Template>	requires (
		is_char<Type>::value &&
		(is_CString<Template>::value || is_Pipe<Template>::value || internal::is_BaseArray<Template>::value)
	) constexpr
	This&	concat_r(Template&& obj) {
		expand(obj.len());
		array_h::move(m_arr + m_len, obj.data(), obj.len());
		m_len += obj.len();
		return *this;
	}
	template <typename Template>	requires (
		is_char<Type>::value &&
		!is_String_h<Template>() &&
		!is_cstr<Template>::value &&
		!is_bool<Template>::value &&
		!is_char<Template>::value &&
		!is_any_integer<Template>::value &&
		!is_floating<Template>::value &&
		!is_CString<Template>::value &&
		!is_Pipe<Template>::value &&
        !internal::is_BaseArray<Template>::value
	) constexpr
	This&	concat_r(const Template& x) {
		Pipe pipe;
		pipe << x;
		concat_r(pipe);
		return *this;
	}
	
	// Concat as copy.
	template <typename... Args> constexpr
	This	concat(Args&&... args) {
		return copy().concat_r(args...);
	}
	
	// Concat the array to an array without resizing.
	/*  @docs {
		@title: Concat no resize
		@description:
			Concat another array with the array, without resizing the array.
		
			Function `concat_no_resize_r` updates the current array, while `concat_no_resize_r` creates a copy and concats the array with the copy.
		@funcs: 9
	} */
	constexpr
	This&	concat_no_resize_r(const This& obj) {
		array_h::copy(m_arr + m_len, obj.m_arr, obj.m_len);
		m_len += obj.m_len;
		return *this;
	}
	constexpr
	This&	concat_no_resize_r(This&& obj) {
		array_h::move(m_arr + m_len, obj.m_arr, obj.m_len);
		m_len += obj.m_len;
		return *this;
	}
	constexpr
	This&	concat_no_resize_r(const Type* arr, const Length len) {
		array_h::copy(m_arr + m_len, arr, len);
		m_len += len;
		return *this;
	}
	constexpr
	This&	concat_no_resize_r(const Type* arr) requires (is_char<Type>::value) {
		while (*arr) { append_no_resize(*arr); ++arr; }
		return *this;
	}
	template <typename Cast> requires (is_char<Type>::value && is_integral<Cast>::value) constexpr
	This&	concat_no_resize_r(const Cast& cast) {
		return concats_no_resize_r(cast);
	}
	template <typename Template>	requires (
		is_char<Type>::value &&
		(is_CString<Template>::value || is_Pipe<Template>::value || internal::is_BaseArray<Template>::value)
	) constexpr
	This&	concat_no_resize_r(const Template& obj) {
		array_h::copy(m_arr + m_len, obj.data(), obj.len());
		m_len += obj.len();
		return *this;
	}
	template <typename Template>	requires (
		is_char<Type>::value &&
		(is_CString<Template>::value || is_Pipe<Template>::value || internal::is_BaseArray<Template>::value)
	) constexpr
	This&	concat_no_resize_r(Template&& obj) {
		array_h::move(m_arr + m_len, obj.m_arr, obj.m_len);
		m_len += obj.m_len;
		return *this;
	}
	template <typename Template>	requires (
		is_char<Type>::value &&
		!is_String_h<Template>() &&
		!is_cstr<Template>::value &&
		!is_bool<Template>::value &&
		!is_char<Template>::value &&
		!is_any_integer<Template>::value &&
		!is_floating<Template>::value &&
		!is_CString<Template>::value &&
		!is_Pipe<Template>::value &&
        !internal::is_BaseArray<Template>::value
	) constexpr
	This&	concat_no_resize_r(const Template& x) {
		Pipe pipe;
		pipe << x;
		concat_no_resize_r(pipe);
		return *this;
	}
	
	// Concat as copy.
	template <typename... Args> constexpr
	This	concat_no_resize(Args&&... args) {
		return copy().concat_no_resize_r(args...);
	}
	
	// Fill array with an item * len.
	/* 	@docs {
		@title: Fill
		@description:
			Fill the array with items.
	 
			Fill appends to the array.
	 
			Function `fill_r` updates the current array, while `fill` creates a copy that will be filled.
		@usage:
			Array<int>().fill_r(3, 0) ==> {0, 0, 0};
		@funcs: 2
	} */
	constexpr
	This&	fill_r(const Len& len, const Type& item) {
		Length u_len = len.value();
		expand(u_len);
		while (u_len-- > 0) {
			m_arr[m_len] = item;
			++m_len;
		}
		return *this;
	}
	SICE
	This	fill(const Len& len, const Type& item) {
		return This().fill_r(len, item);
	}
    constexpr
    This&    fill_r(const Len& len) {
        expand(len.value());
        m_len += len.value();
        return *this;
    }

	// Generate random items.
	/*  @docs {
	 *	@title: Random
	 *	@description:
	 *		Append random items to the array.
	 *
	 *		Function `random_r` updates the current array, while `random` creates a new object that will be filled with random items.
	 *	@usage:
	 *		Array<short>().random_r(3) ==> {3, 2, 9};
	 *		Array<int>().random_r(3) ==> {2893, ...};
	 *		Array<double>().random_r(3) ==> {0.378223, ...};
	 *		Array<ullong>().random_r(3) ==> {37838394932256345.0, ...};
	 *	@funcs: 2
	 } */
	template <typename... Args> constexpr
	This& 	random_r(const Length len, Args&&... args) {
		Length u_len = len;
		expand(u_len);
		while (u_len-- > 0) {
			m_arr[m_len] = random::generate<Type>(args...);
			++m_len;
		}
		return *this;
	}
	template <typename... Args> SICE
	This 	random(const Length len, Args&&... args) {
		return This().random_r(len, args...);
	}

	// Find the index of an item.
	/* 	@docs {
	 *	@title: Find
	 *	@description:
	 *		Find the index of an item.
	 *	@usage:
	 *		Array<int> x = {1, 2, 3};
	 *		x.find(3) ==> 2;
	 *		x.find(3, 2) ==> 2;
	 *		x.find(3, 0, 2) ==> 2;
	 *		x.find(3, 0, 1) ==> npos;
	 *		x.find<Backwards>(3) ==> 2;
	} */
	template <typename Iter = Forwards, typename... Args> requires (
		// !is_char<Type>::value &&
		(is_Forwards<Iter>::value || is_Backwards<Iter>::value)
	) constexpr
	ullong 	find(const Type& to_find, Args&&... args) const {
		if (m_len == 0) { return internal::npos; } // due to garbage items.
		for (auto& i: indexes<Iter>(args...)) {
			if (m_arr[i] == to_find) { return i; }
		}
		return internal::npos;
	}

	// Find the index of an item.
	// template <typename Iter = Forwards, typename... Args> requires (
	// 	is_char<Type>::value &&
	// 	(is_Forwards<Iter>::value || is_Backwards<Iter>::value)
	// ) constexpr
	// ullong 	find(const Type& to_find, Args&&... args) const {
	// 	if (m_len == 0) { return internal::npos; } // due to garbage items.
	// 	switch (to_find) {
	// 		case '\t':
	// 		case ' ': {
	// 			for (auto& i: indexes<Iter>(args...)) {
	// 				switch (m_arr[i]) {
	// 					case ' ':
	// 					case '\t': return i;
	// 					default: continue;
	// 				}
	// 			}
	// 			return internal::npos;
	// 		}
	// 		default: {
	// 			for (auto& i: indexes<Iter>(args...)) {
	// 				if (m_arr[i] == to_find) { return i; }
	// 			}
	// 			return internal::npos;
	// 		}
	// 	}
	// }

	// Find the index of the first occurence of one of the chars.
	/*  @docs {
	 *	@parent: vlib::String
	 *	@title: Find first
	 *	@description:
	 *		Find the index of an item.
	 *	@usage:
	 *		String x = "123";
	 *		x.find_first('3') ==> 2;
	 *		x.find_first('3', 2) ==> 2;
	 *		x.find_first('3', 0, 3) ==> 2;
	 *		x.find_first('3', 0, 2) ==> npos;
	 *		x.find_first<Backwards>('3') ==> 2;
	 } */
	template <typename Iter = Forwards, typename... Args> requires (
		is_char<Type>::value &&
		(is_Forwards<Iter>::value || is_Backwards<Iter>::value)
	) constexpr
	auto 	find_first(
		const char*			to_find, 			// the array with chars to find.
		Args&&... 			args 				// the arguments for "indexes()".
	) const {
		const Length len = vlib::len(to_find);
		if (m_len == 0) { return internal::npos; } // due to garbage items.
		for (auto& i0: indexes<Iter>(args...)) {
			for (auto& i1: Range<Forwards>(0, len)) {
				if (m_arr[i0] == to_find[i1]) { return i0; }
			}
		}
		return internal::npos;
	}
    
    // Find the index of the first occurence of a char that is not one of the chars.
    /*  @docs {
	 *	@parent: vlib::String
	 *	@title: Find First Not Of
	 *	@description:
	 *		Find the index of the first occurence of a char that is not one of the chars.
	 *	@usage:
	 *		String x = "12A3B4";
	 *		x.find_first_not_of("1234") ==> 2;
	 *		x.find_first_not_of<Backwards>("123") ==> 4;
     } */
    template <typename Iter = Forwards, typename... Args> requires (
        is_char<Type>::value &&
        (is_Forwards<Iter>::value || is_Backwards<Iter>::value)
    ) constexpr
    auto     find_first_not_of(
        const char*           allowed,             // the array with chars to find.
        Args&&...             args                 // the arguments for "indexes()".
    ) const {
        const Length len = vlib::len(allowed);
        if (m_len == 0) { return internal::npos; } // due to garbage items.
        for (auto& i0: indexes<Iter>(args...)) {
            bool found = false;
            for (auto& i1: Range<Forwards>(0, len)) {
                if (m_arr[i0] == allowed[i1]) {
                    found = true;
                    break;
                }
            }
            if (!found) {
                return i0;
            }
        }
        return internal::npos;
    }
	
	// Find the index of a substring.
	// @TODO create a single func with len, and another func with len, sindex, eindex = internal::npos so you can provide a len for the to_find.
	/*  @docs {
	 *	@parent: vlib::String
	 *	@title: Find substring
	 *	@description:
	 *		Find the index of the first occurence of substring.
	 *
	 *		Returns `NPos::npos` when the substring is not found.
	 *	@usage:
	 *		String x = "12A3B4";
	 *		x.find("A3");
	 } */
	template <typename Iter = Forwards, typename... Args> requires (
		is_char<Type>::value &&
		(is_Forwards<Iter>::value || is_Backwards<Iter>::value)
	) constexpr
	auto 	find(
		const char*			to_find,			// the substr to find.
		// const Length		len, 				// the length of the array with chars to find.
		Args&&... 			args 				// the arguments for "indexes()".
	) const {
		Length len = vlib::len(to_find);
		if (len > m_len) { return internal::npos; } // due to garbage items.
		const Type* str = m_arr;
		auto iter = indexes<Iter>(args...);
		str += iter.min();
		// Length index = 0, max_index = m_len - len;
		for (auto& i: iter) {
			// if (index > max_index) { return NPos::npos; }
			// else
			if (eq(str, len, to_find, len)) { return i; }
			++str;
			// ++index;
		}
		return internal::npos;
	}
	template <typename Iter = Forwards, typename... Args> requires (
		is_char<Type>::value &&
		(is_Forwards<Iter>::value || is_Backwards<Iter>::value)
	) constexpr
	auto 	find(
		const This&			to_find,			// the substr to find.
		Args&&... 			args 				// the arguments for "indexes()".
	) const {
		if (to_find.m_len > m_len) { return internal::npos; } // due to garbage items.
		const Type* str = m_arr;
		auto iter = indexes<Iter>(args...);
		str += iter.min();
		// Length index = 0, max_index = m_len - to_find.m_len;
		for (auto& i: iter) {
			// if (index > max_index) { return NPos::npos; }
			// else
			if (eq(str, to_find.m_len, to_find.m_arr, to_find.m_len)) { return i; }
			++str;
			// ++index;
		}
		return internal::npos;
	}

	// Find the index of the first occurence of one of the CString's.
	/*  @docs {
	 *	@parent: vlib::String
	 *	@title: Find first of substrings
	 *	@description:
	 *		Find the index of the first occurence of one of the substrings.
	 *
	 *		Returns `NPos::npos` when the substring is not found.
	 *	@warning:
	 *		the array must be initialized inside the function call, otherwise the CString's will be dangling.
	 *	@usage:
	 *		String x = "12A3B4";
	 *		x.find_first({"A3", "B4"});
	 } */
	template <typename Iter = Forwards, typename... Args> requires (
		is_char<Type>::value &&
		(is_Forwards<Iter>::value || is_Backwards<Iter>::value)
	) constexpr
	auto 	find_first(
		const Array<const char*>& 	to_find, 	    // the array with substrings to find.
		Args&&...						args		// the arguments for "indexes()".
	) const {
		const Type* str = m_arr;
		auto iter0 = indexes<Iter>(args...);
		str += iter0.min();
		Length* lens = new Length [to_find.m_len];
		for (auto& i1: to_find.indexes<Forwards>()) {
			lens[i1] = vlib::len(to_find[i1]);
		}
		for (auto& i0: iter0) {
			for (auto& i1: to_find.indexes<Forwards>()) {
				if (eq(str, lens[i1], to_find.m_arr[i1], lens[i1])) {
					delete[] lens;
					return i0;
				}
			}
			++str;
		}
		delete[] lens;
		return internal::npos;
	}
	
	// Contains an item.
	/* 	@docs {
		@title: Contains
		@description:
			Check if the array contains an item.
		@usage:
			Array<int> x = {1, 2, 3};
			x.contains(3) ==> true;
		@parameter: {
			@name: args
			@description: The arguments for `Array::find()`.
		}
	} */
	template <typename Iter = Forwards, typename... Args> constexpr
	auto 	contains(
		Args&&... 			args 				// The arguments for "find()".
	) const {
		return find<Iter>(args...) != internal::npos;
	}
	
	// Count the occurences of an item.
	/* 	@docs {
		@title: Count
		@description:
			Count the occurences of an item.
		@usage:
			Array<int> x = {1, 0, 1};
			x.count(1) ==> 2;
		@parameter: {
			@name: to_find
			@description: The item to count.
		}
		@parameter: {
			@name: sindex
			@description: The start index.
		}
		@parameter: {
			@name: eindex
			@description: The end index.
		}
	} */
	constexpr
	ullong 	count(
		const Type&		to_find,
		ullong 			sindex = 0,
		ullong 			eindex = NPos::npos
	) const {
		ullong count;
		ullong pos = sindex;
		while ((pos = find(to_find, pos, eindex)) != NPos::npos) {
			++count;
			++pos;
		}
		return count;
	}
	// @TODO docs different from Array.
	constexpr
	ullong 	count(
		const Type*		to_find,
		ullong 			sindex = 0,
		ullong 			eindex = NPos::npos
	) const {
		ullong count;
		ullong pos = sindex;
		while ((pos = find(to_find, pos, eindex)) != NPos::npos) {
			++count;
			++pos;
		}
		return count;
	}

	// Replace item in array.
	/* 	@docs {
	 *	@parent: vlib::String
	 *	@title: Replace
	 *	@description:
	 * 		Replace an item with another item.
	 *
	 *		Function `replace_r` updates the current array, while `replace` creates a copy.
	 *	@usage:
	 *		Array<int> x = {1, 4, 3};
	 * 		x.replace_r(4, 2); x ==> {1, 2, 3};
	 *	@funcs: 2
	} */
	template <typename... Args> requires (!is_char<Type>::value) constexpr
	This& 	replace_r(
		const Type&			from,				// the from item.
		const Type&			to,					// the to item.
		Args&&... 			args 				// the arguments for "indexes()".
	) {
		if (from == to) { return *this; }
		for (auto& i: indexes<Forwards>(args...)) {
			if (m_arr[i] == from) { m_arr[i] = to; }
		}
		return *this;
	}
	template <typename... Args> constexpr
	This 	replace(
		const Type&			from,				// the from item.
		const Type&			to,					// the to item.
		Args&&... 			args 				// the arguments for "indexes()/iterate()".
	) const {
		return copy().replace_r(from, to, args...);
	}
	template <typename... Args> requires (is_char<Type>::value) constexpr
	This& 	replace_r(
		const Type&			from,				// the from item.
		const Type&			to,					// the to item.
		Args&&... 			args 				// the arguments for "indexes()/iterate()".
	) {
		if (from == to) { return *this; }
		if (to == Type()) {
			This obj;
			obj.m_capacity = m_len;
			array_h::alloc(obj.m_arr, m_len);
			for (auto& i: iterate(args...)) {
				if (i != from) { obj.set(obj.m_len, i); }
			}
			swap(obj);
		} else {
			for (auto& i: indexes<Forwards>(args...)) {
				if (m_arr[i] == from) { m_arr[i] = to; }
			}
		}
		return *this;
	}

	// Replace the chars from the start index till the end index with new chars of any length.
	/*  @docs {
	 *	@title: Replace Indexes
	 *	@description:
	 *		Replace the chars from the start index till the end index with new chars of any length.
	 *	@warning: Does not check any indexes.
	 } */
	constexpr
	This& 	replace_h(
		const Length		sindex,						// the start index.
		const Length		eindex,						// the end index (not included).
		const Type*			to,							// the new substr.
		const Length		to_len = internal::npos		// the new substr length (leave default to parse).
	) requires (is_char<Type>::value) {
		// if (sindex == npos) { return *this; }
		// if (eindex == npos) { return *this; }
		const Length nfrom = eindex - sindex;
		Length nto;
		switch (to_len) {
			case internal::npos: { nto = vlib::len(to); break; }
			default: { nto = to_len; break; }
		}
		expand(nto); // always expand in case the pos is larger then len.
		if (nto > nfrom) {
			if (m_len > eindex) {
				array_h::move(m_arr + (sindex + nto), m_arr + eindex, m_len - eindex);
			}
			m_len += (nto - nfrom);
		} else if (nto < nfrom) {
			if (m_len > eindex) {
				array_h::move(m_arr + (sindex + nto), m_arr + eindex, m_len - eindex);
			}
			m_len -= (nfrom - nto);
		}
		array_h::copy(m_arr + sindex, to, nto);
		return *this;
	}

	// Replace substring in string.
	/* 	@docs {
	 *	@parent: vlib::String
	 *	@title: Replace
	 *	@description:
	 *		Replace a substring with another substring.
	 *
	 *		Function `replace_r` updates the current array, while `replace` creates a copy.
	 *	@usage:
	 *		String x = "Hello Universe!";
	 *		x.replace_r("Universe", "World"); x ==> "Hello World!";
	 *	@funcs: 4
	} */
	constexpr
	This& 	replace_r(
		const String&		from,					// the from item.
		const String&		to,						// the to item.
		const Length 		sindex = 0,				// the start index.
		const Length 		eindex = internal::npos	// the end index.
	) requires (is_char<Type>::value) {
		return replace_r(
			from.data(),
			from.len(),
			to.data(),
			to.len(),
			sindex,
			eindex);
	}
	constexpr
	This& 	replace_r(
		const Type*			from,					// the from item.
		const Length		nfrom,
		const Type*			to,						// the to item.
		const Length		nto,
		const Length 		sindex,				// the start index.
		const Length 		eindex = internal::npos	// the end index.
	) requires (is_char<Type>::value) {
		if (m_len == 0) { return *this; }

		// @TODO
		// replace_r double char to single.

		// replace_r single char to double.
		if (nfrom == 1 && nto == 2 && from[0] == to[0] && from[0] == to[1]) {
			Length ei = eindex - 1;
			switch (ei) {
				case internal::npos: { ei = m_len - 1; break; }
				default: break;
			}
			This x;
			x.resize(len());
			for (auto& i: Range(sindex, ei)) {
				if (
					m_arr[i] == from[0] &&
					m_arr[i-1] != from[0] &&
					m_arr[i+1] != from[0]
				) {
					x.append_no_resize(from[0]);
					x.append_no_resize(from[0]);
				} else {
					x.append_no_resize(m_arr[i]);
				}
			}
			return swap(x);
		}

		// normal replace_r.
		else {
			String sto;
			sto.data() = (char*) to;
			sto.len() = nto;
			bool add_nto = sto.contains(from, nfrom);
			sto.data() = nullptr;
			Length si = sindex;
			while (si < eindex && (si = find(from, si, eindex)) != NPos::npos) {
				replace_h(si, si + nfrom, to, nto);
				if (add_nto) {
					si += nto;
				}
			}
			return *this;
		}
	}
	constexpr
	This 	replace(
		const String&		from,					// the from item.
		const String&		to,						// the to item.
		const Length 		sindex = 0,				// the start index.
		const Length 		eindex = internal::npos	// the end index.
	) const requires (is_char<Type>::value) {
		return copy().replace_r(
			from.data(),
			from.len(),
			to.data(),
			to.len(),
			sindex,
			eindex);
	}
	constexpr
	This 	replace(
		const Type*			from,					// the from item.
		const Length		nfrom,
		const Type*			to,						// the to item.
		const Length		nto,
		const Length 		sindex,				// the start index.
		const Length 		eindex = internal::npos	// the end index.
	) const requires (is_char<Type>::value) {
		return copy().replace_r(from, nfrom, to, nto, sindex, eindex);
	}
	// Replace multiple chars at the start of the string.
	/* 	@docs {
	 *	@parent: vlib::String
	 *	@title: Replace start
	 *	@description:
	 *		Replace multiple chars at the start of the string.
	 *
	 *		The replacement loop breaks if the first character is not one of the replacements characters.
	 *
	 *		Function `replace_start_r` updates the current array, while `replace_start` creates a copy.
	 *	@usage:
	 *		String x = "? !Hello World!";
	 *		x.replace_start_r(" !?"); x ==> "Hello World!";
	 *	@funcs: 2
	} */
	constexpr
	This& 	replace_start_r(const char* replacements) requires (is_char<Type>::value) {
		if (is_undefined()) { return *this; }
		bool found;
		Length len = m_len;
		const char* r;
		char* s = m_arr;
		while (*s && len > 0) {
			found = false;
			r = replacements;
			while (*r) {
				if (*s == *r) { found = true; break; }
				++r;
			}
			if (found) { ++s; --len; }
			else { break; }
		}
		m_len = len;
		array_h::move(m_arr, s, len);
		return *this;
	}
	constexpr
	This 	replace_start(const char* replacements) requires (is_char<Type>::value) {
		return copy().replace_start_r(replacements);
	}

	// Replace multiple chars at the end of the string.
	/* 	@docs {
	 *	@parent: vlib::String
	 *	@title: Replace end
	 *	@description:
	 *		Replace multiple chars at the end of the string.
	 *
	 *		The replacement loop breaks if the last character is not one of the replacements characters.
	 *
	 *		Function `replace_end_r` updates the current array, while `replace_end` creates a copy.
	 *	@usage:
	 *		String x = "Hello World!?> ";
	 *		x.replace_end_r(" >?"); x ==> "Hello World!";
	 *	@funcs: 2
	} */
	constexpr
	This& 	replace_end_r(const char*	replacements) requires (is_char<Type>::value) {
		bool found;
		const char* r;
		Length len = m_len;
		while (len > 0) {
			found = false;
			r = replacements;
			while (*r) {
				if (m_arr[len-1] == *r) { found = true; break; }
				++r;
			}
			if (found) { --len; }
			else { break; }
		}
		m_len = len;
        null_terminate_safe_h();
		return *this;
	}
	constexpr
	This 	replace_end(const char*	replacements) requires (is_char<Type>::value) {
		return copy().replace_end_r(replacements);
	}

	// Slice the array by indexes.
	/* 	@docs {
	 *	@title: Slice
	 *	@description:
	 *		Slice the array by indexes.
	 *
	 *		Function `slice_r` updates the current array, while `slice` creates a copy.
	 *	@notes:
	 *		Leave parameter `eindex` `0` to use the value of the length attribute.
	 *
	 *		Slices nothing when eiter `sindex` / `eindex` is out of range.
	 *	@usage:
	 *		Array<int> x = {1, 2, 3};
	 *		x.slice_r(1); x ==> {2, 3};
	 *	@funcs: 4
	} */
	constexpr
	This& 	slice_r(const Length sindex, const Length eindex) {
		if (m_len == 0) { return *this; }
		else if (sindex > eindex) {
			throw IndexError(String().concats_r(
				"Unable to slice_r from index \"",
				sindex,
				"\" till \"",
				eindex,
				"\"."
			));
		}
		if (sindex == 0) {
			m_len = eindex;
			return *this;
		}
		m_len = (eindex - sindex);
		array_h::move(m_arr, m_arr + sindex, m_len);
		return *this;
	}
	constexpr
	This& 	slice_r(const Length sindex) {
		return slice_r(sindex, m_len);
	}
	constexpr
	This 	slice(const Length sindex, const Length eindex) const {
		This obj;
		if (m_len == 0) { return *this; }
		else if (sindex > eindex) {
			throw IndexError(String().concats_r(
				"Unable to slice_r from index \"",
				sindex,
				"\" till \"",
				eindex,
				"\"."
			));
		}
		obj.m_len = (eindex - sindex);
		obj.m_capacity = obj.m_len;
		array_h::alloc(obj.m_arr, obj.m_len);
		array_h::copy(obj.m_arr, m_arr + sindex, obj.m_len);
		return obj;
	}
	constexpr
	This 	slice(const Length sindex) const {
		return slice(sindex, m_len);
	}

	// Slice by different delimiters.
	/*  @docs {
	 *	@title: Slice
	 *	@description:
	 *		Slice the array by different delimiters.
	 *
	 *		Function `slice_r` updates the current array, while `slice` creates a copy.
	 *	@parameter: {
	 *		@name: dstart
	 *		@description: The start delimiter, example `&cob;`.
	 *	}
	 *	@parameter: {
	 *		@name: dend
	 *		@description: The end delimiter, example `&ccb;`.
	 *	}
	 *	@parameter: {
	 *		@name: depth
	 *		@description: The depth of the occurences.
	 *	}
	 *	@usage:
	 *		String x = "Something before {Hello World!} {Hi {Hello Universe!} There} {Hello Earth!} something after.";
	 *		x.slice_r('{', '}', 0) => "Hello World!"
	 *		x.slice_r('{', '}', 1) => "Hi {Hello Universe!} There"
	 *		x.slice_r('{', '}', 2) => "Hello Earth!"
	 *		x.slice_r('{', '}', 2, true) => "{Hello Earth!}"
	 *	@funcs: 2
	}*/
	constexpr
	This& 	slice_r(
		Type 			dstart,					// the start delimiter.
		Type 			dend,					// the start delimiter.
		uint			depth,					// the delmiter depth.
		Length 			sindex = 0,				// the start index.
		Length 			eindex = internal::npos,// the end index.
		bool 			include = false			// include the delimiters.
	) requires (is_char<Type>::value) {
		This str;
		slice_h(str, dstart, dend, depth, sindex, eindex, include);
		return swap(str);
	}
	constexpr
	This 	slice(
		Type 			dstart,					// the start delimiter.
		Type 			dend,					// the start delimiter.
		uint			depth,					// the delmiter depth.
		Length 			sindex = 0,				// the start index.
		Length 			eindex = internal::npos,// the end index.
		bool 			include = false			// include the delimiters.
	) {
		This str;
		slice_h(str, dstart, dend, depth, sindex, eindex, include);
		return str;
	}
	constexpr
	void 	slice_h(
		This&			str,					// the result by reference.
		Type 			dstart,					// the start delimiter.
		Type 			dend,					// the start delimiter.
		uint			depth,					// the delmiter depth.
		Length 			sindex = 0,				// the start index.
		Length 			eindex = internal::npos,// the end index.
		bool 			include = false			// include the delimiters.
	) requires (is_char<Type>::value) {
		if (dstart == dend) { throw InvalidUsageError("Not yet supported."); }

		// Add start delimiter.
		if (include) { str.append(dstart); }

		// Iterate.
		Length ldepth = 0;
		Length ldepth_counter = 0;
		bool open = false;
		bool first_open = false;
		for (auto& i: iterate(sindex, eindex)) {
			first_open = false;
			if (i == dstart) {
				if (!open && ldepth == depth) { open = true; first_open = true; }
				++ldepth_counter;
			} else if (i == dend) {
				if (ldepth_counter > 0) { --ldepth_counter; }
				if (ldepth_counter == 0) { ++ldepth; }
				if (open && ldepth == depth + 1) { break; }
			}
			if (open && !first_open) {
				str.append(i);
			}
		}

		// Add end delimiter.
		if (include) { str.append(dend); }

		// Reset when empty.
		if (include && str.m_len == 2) {
			str.m_len = 0;
		}

		//
	}

	// Split by delimiter.
	/*  @docs {
	 *	@parent: vlib::String,
	 *	@title: Split
	 *	@description: Split the array by a delimiter.
	 *	@usage:
	 *		String("Hello???World!").split("???").first() => "Hello";
	 *		String("Hello???World!").split("???").last() => "World!";
	}*/
	constexpr
	Array<String> 	split(const Type* delimiter) const requires (is_char<Type>::value) {
		Length ndelimiter = vlib::len(delimiter);
		Array<This> splitted;
		Length pos = 0;
		Length lpos = internal::npos;
		bool run = true;
		while (run) {
			pos = find(delimiter, pos);
			if (pos == internal::npos) {
				pos = m_len;
				run = false;
			}
			if (lpos == internal::npos) {
				lpos = 0;
			}
			This str;
			str.m_len = pos - lpos;
			str.m_capacity = str.m_len;
			array_h::alloc(str.m_arr, str.m_len);
			array_h::copy(str.m_arr, m_arr + lpos, pos - lpos);
			splitted.append(move(str));
			pos += ndelimiter;
			lpos = pos;
		}
		return splitted;
	}

	// Sort the array.
	/* 	@docs {
	 *	@title: Sort
	 *	@description:
	 *		Sort the array.
	 *
	 *		Function `sort_r` updates the current array, while `sort` creates a copy.
	 *	@usage:
	 *		Array<int> x = {2, 1, 4, 3};
	 *		x.sort_r(); x ==> {1, 2, 3, 4};
	 *	@funcs: 2
	} */
	constexpr
	This& 	sort_r() {
		This obj;
		sort_h(obj);
		return swap(obj);
	}
	constexpr
	This 	sort() {
		This obj;
		sort_h(obj);
		return obj;
	}
	constexpr
	void 	sort_h(This& obj) {

		// Create a new temporary string.
		obj.m_capacity = m_len;
		array_h::alloc(obj.m_arr, m_len);

		// Iterate "m_arr".
		for (auto& i0: Range<Forwards>(0, m_len)) {

			// Always add first item.
			if (obj.m_len == 0) {
				obj.set(obj.m_len, m_arr[i0]);
			} else {

				// Iterate "x" to find the insert index.
				auto insert_index = internal::npos;
				for (auto& i1: Range<Forwards>(0, obj.m_len)) {
					if (m_arr[i0] <= obj.m_arr[i1]) {
						insert_index = i1;
						break;
					}
				}

				// Add to end.
				if (insert_index == npos) {
					obj.set(obj.m_len, m_arr[i0]);
				}

				// Insert (automatically shifts the array).
				else {
					obj.insert(insert_index, m_arr[i0]);
				}

				//
			}
		}

		//
	}

	// Reverse the array.
	/* 	@docs {
	 *	@title: Reverse
	 *	@description:
	 *		Reverse the array.
	 *
	 *		Function `reverse_r` updates the current array, while `reverse` creates a copy.
	 *	@usage:
	 *
	 *		// Reverse an array.
	 *		Array<int> x = {1, 2, 3, 4};
	 *		x.reverse_r(); x ==> {4, 3, 2, 1};
	 *
	 *		// Do not use reverse_r for iterations.
	 *		// Since this is quite inefficient.
	 *		// Use "iterate<Backwards>()" instead.
	 *		for (auto& i: x.reverse_r()) {}	 			<-- Incorrect
	 *		for (auto& i: x.iterate<Backwards>()) {} 	<-- Correct.
	 *	@funcs: 2
	} */
	constexpr
	This& 	reverse_r() {
		This obj;
		reverse_h(obj);
		return swap(obj);
	}
	constexpr
	This 	reverse() {
		This obj;
		reverse_h(obj);
		return obj;
	}
	constexpr
	void 	reverse_h(This& obj) {
		if (m_len == 0) { return ; }
		obj.m_capacity = m_len;
		array_h::alloc(obj.m_arr, m_len);
		for (auto& i: Range<Backwards>(0, m_len)) {
			obj.set(obj.m_len, m_arr[i]);
		}
	}

	// Remove items from the array.
	/* 	@docs {
	 *	@title: Remove
	 *	@description:
	 *		Remove one or multiple items from the array.
	 *
	 *		Function `remove_r` updates the current array, while `remove` creates a copy.
	 *	@usage:
	 *		Array<int> x = {0, 1, 2, 3, 4, 5};
	 *		x.remove_r(1, 3, 5); x ==> {0, 2, 4};
	 *	@funcs: 2
	} */
	template <typename... Args> constexpr
	This& 	remove_r(const Type& item, Args&&... items) {
		This obj;
		remove_h(obj, item, items...);
		return swap(obj);
	}
	template <typename... Args> constexpr
	This 	remove(const Type& item, Args&&... items) {
		This obj;
		remove_h(obj, item, items...);
		return obj;
	}
	template <typename... Args> constexpr
	void 	remove_h(
		This& 			obj,				// the result object by reference.
		const Type& 	item,			// the item to remove_r.
		Args&&... 		items			// the other items to remove_r.
	) {

		// Create a new temporary string.
		obj.m_capacity = m_len;
		array_h::alloc(obj.m_arr, m_len);

		// Iterate "m_arr".
		for (auto& i: Range<Forwards>(0, m_len)) {
			if (!remove_eq_h(m_arr[i], item, items...)) {
				obj.append(m_arr[i]);
			}
		}

	}
	template <typename... Args> constexpr
	bool 	remove_eq_h(const Type&) { return false; }
	template <typename... Args> constexpr
	bool 	remove_eq_h(
		const Type& 	pitem,			// the present item to check.
		const Type& 	ritem,			// the remove_r item to check.
		Args&&... 		ritems			// the other remove_r items to check.
	) {
		if (pitem == ritem) { return true; }
		return remove_eq_h(pitem, ritems...);
	}

	// Multipy an array.
	/* 	@docs {
	 *	@title: Multiply
	 *	@description:
	 *		Multiply the array.
	 *
	 *		Function `mult_r` updates the current array, while `mult` creates a copy.
	 *	@usage:
	 *		Array<int> x = {0};
	 *		x.mult_r(3); x ==> {0, 0, 0};
	 *	@funcs: 2
	} */
	constexpr
	This& 	mult_r(const Length x) {
		This obj;
		multiply_h(obj, x);
		return swap(obj);
	}
	constexpr
	This 	mult(const Length x) const {
		This obj;
		multiply_h(obj, x);
		return obj;
	}
	constexpr
	void	multiply_h(This& obj, const Length x) const {
		Length y = x;
		obj.m_capacity = m_len * y;
		array_h::alloc(obj.m_arr, m_len * y);
		while (y-- > 0) {
			for (Length i = 0; i < m_len; ++i) {
				obj.set(obj.m_len, m_arr[i]);
			}
		}
		obj.null_terminate_h();
	}

	// Divide an array.
	/* 	@docs {
	 *	@title: Divide
	 *	@description:
	 *		Divide the array into an array with arrays.
	 *	@usage:
	 *		Array<int> x = {0, 0};
	 *		x.div(2); x ==> {{0}, {0}};
	} */
	constexpr
	Array<This>	div(const Length x) const {
		switch (x) {
		case 1:
			return Array<This>({*this});
		default: break;
		}
		ullong step = m_len / x;
		ullong mod = m_len % x;
		ullong child = 0;
		ullong end = step;
		Array<This> div;
		div.resize(x);
		div.len() = x;
		for (auto& i: div) {
			i.resize(mod + step);
		}
		for (auto& index: indexes()) {
			if (index == end) {
				++child;
				end += step;
				if (child == x - 1) {
					end = m_len;
				}
			}
			div[child].append_no_resize(m_arr[index]);
		}
		return div;
	}


	// mod of array.
	/* 	@docs {
	 *	@title: Modulo
	 *	@description:
	 *		Get the modulo of the array.
	 *
	 *		Function `mod_r` updates the current array, while `mod` creates a copy.
	 *	@usage:
	 *		Array<int> x = {0, 0, 0, 0, 0, 0, 0, 0, 0, 0};
	 *		x.mod_r(3); x ==> {0};
	 *	@funcs: 2
	} */
	constexpr
	This&	mod_r(const Length x) {
		Length len = m_len % x;
		if (len == 0) { return reset(); }
		array_h::move(m_arr, m_arr + (m_len - len), len);
		m_len = len;
		null_terminate_h();
		return *this;
	}
	constexpr
	This	mod(const Length x) const {
		This obj;
		obj.m_len = m_len % x;
		if (obj.m_len == 0) { return obj; }
		obj.m_capacity = obj.m_len;
		array_h::alloc(obj.m_arr, obj.m_len);
		array_h::copy(obj.m_arr, m_arr + (m_len - obj.m_len), obj.m_len);
		obj.null_terminate_h();
		return obj;
	}

	// Load a file.
	/* 	@docs {
	 *	@parent: vlib::Array
	 *	@title: Load
	 *	@description: Load a file.
	 *	@usage:
	 *		Array<...> x = Array<...>::load("./myarray.txt");
	 *	@funcs: 2
	}*/
	SICE
	auto 	load(const char* path) requires (!is_char<Type>::value) {
		char* data = nullptr;
		ullong len;
		switch (vlib::load(path, data, len)) {
		case file::error::open:
			throw OpenError(String() << "Unable to open file \"" << path << "\" [" << ::strerror(errno) << "].");
		case file::error::read:
			throw ReadError(String() << "Unable to read file \"" << path << "\" [" << ::strerror(errno) << "].");
		case file::error::write:
			throw WriteError(String() << "Unable to write to file \"" << path << "\" [" << ::strerror(errno) << "].");
		}
		if (len > 0 && data[len - 1] == '\n') {
			--len;
		}
		This obj(parse(data, len));
		delete[] data;
        return obj;
	}
	SICE
	auto 	load(const String& path) requires (!is_char<Type>::value) {
		return load(path.c_str());
	}
	/* 	@docs {
	 *	@parent: vlib::String
	 *	@title: Load
	 *	@description: Load a file.
	 *	@usage:
	 *		String x = String::load("./myfile.txt");
	 *	@funcs: 2
	}*/
    SICE
	auto 	load(const char* path) requires (is_char<Type>::value) {
        This obj;
		switch (vlib::load(path, obj.m_arr, obj.m_len)) {
		case file::error::open:
			throw OpenError(String() << "Unable to open file \"" << path << "\" [" << ::strerror(errno) << "].");
		case file::error::read:
			throw ReadError(String() << "Unable to read file \"" << path << "\" [" << ::strerror(errno) << "].");
		case file::error::write:
			throw WriteError(String() << "Unable to write to file \"" << path << "\" [" << ::strerror(errno) << "].");
		}
        obj.m_capacity = obj.m_len;
        return obj;
	}
	SICE
	auto 	load(const String& path) requires (is_char<Type>::value) {
		return load(path.c_str());
	}
	
	// Save a file.
	/* 	@docs {
	 *	@parent: vlib::Array
	 *	@title: Save
	 *	@description: Save data to a file.
	 *	@usage:
	 *		Array<...> x = ...;
	 *		x.save("./myarray.txt");
	 *	@funcs: 2
	 }*/
	constexpr
	auto& 	save(const char* path) const requires (!is_char<Type>::value) {
		Pipe pipe;
		join_h(pipe);
		switch (vlib::save(path, pipe.data(), pipe.len())) {
		case file::error::open:
			throw OpenError(String() << "Unable to open file \"" << path << "\" [" << ::strerror(errno) << "].");
		case file::error::read:
			throw ReadError(String() << "Unable to read file \"" << path << "\" [" << ::strerror(errno) << "].");
		case file::error::write:
			throw WriteError(String() << "Unable to write to file \"" << path << "\" [" << ::strerror(errno) << "].");
		}
		return *this;
	}
	constexpr
	auto& 	save(const String& path) const requires (!is_char<Type>::value) {
		return save(path.c_str());
	}
	/* 	@docs {
	 *	@parent: vlib::String
	 *	@title: Save
	 *	@description: Save data to a file.
	 *	@usage:
	 *		String x = "Hello World!";
	 *		x.save("./myfile.txt");
	 *	@funcs: 2
	 }*/
	constexpr
	auto& 	save(const char* path) const requires (is_char<Type>::value) {
		switch (vlib::save(path, c_str(), m_len)) {
		case file::error::open:
			throw OpenError(String() << "Unable to open file \"" << path << "\" [" << ::strerror(errno) << "].");
		case file::error::read:
			throw ReadError(String() << "Unable to read file \"" << path << "\" [" << ::strerror(errno) << "].");
		case file::error::write:
			throw WriteError(String() << "Unable to write to file \"" << path << "\" [" << ::strerror(errno) << "].");
		}
		return *this;
	}
	constexpr
	auto& 	save(const String& path) const requires (is_char<Type>::value) {
		return save(path.c_str());
	}
    
    // ---------------------------------------------------------
    // String only functions.
    // Not all string only functions are here.
    
    // As variable name.
	/* 	@docs {
	 *	@parent: vlib::String
	 *	@title: As variable name.
	 *	@description:
	 *		Convert the string to a variable name style.
	 *
	 *		Only catches special characters ' ' and '-'.
	 *	@usage:
	 *		String x = "Hello World";
	 *		String y = x.variable_name();
	 *		y ==> "hello_world"
	 }*/
    constexpr
    This    variable_name() const requires (is_char<Type>::value) {
        This name;
        ullong index = 0;
        for (auto& c: *this) {
            switch (c) {
                case '-':
                case ' ':
                    name.append('_');
                    break;
                default:
                    if (is_uppercase(c)) {
                        if (index > 0 && m_arr[index - 1] != ' ') {
                            name.append('_');
                            name.append(vlib::lowercase(c));
                        } else {
                            name.append(vlib::lowercase(c));
                        }
                    } else {
                        name.append(c);
                    }
                    break;
            }
            ++index;
        }
        return name;
    }
	
	// Quote.
	/* 	@docs {
	 *	@parent: vlib::String
	 *	@title: Quote
	 *	@description:
	 *		Quote the char array.
	 *
	 *		Function `quote_r` updates the current array, while `quote` creates a copy.
	 *	@usage:
	 *		String x = "/tmp/";
	 *		x.quote_r(); x ==> "\"/tmp/\"";
	 *	@funcs: 2
	} */
	constexpr
	This& 	quote_r() requires (is_char<Type>::value) {
		insert(0, '"');
		append('"');
		return *this;
	}
	constexpr
	This 	quote() const requires (is_char<Type>::value) {
		return copy().quote_r();
	}

	// Unquote.
	/* 	@docs {
	 *	@parent: vlib::String
	 *	@title: Unquote
	 *	@description:
	 *		Unquote the char array.
	 *
	 *		Function `unquote_r` updates the current array, while `unquote` creates a copy.
	 *	@usage:
	 *		String x = "\"/tmp/\"";
	 *		x.unquote_r(); x ==> "/tmp/";
	 *	@funcs: 2
	} */
	constexpr
	This& 	unquote_r() requires (is_char<Type>::value) {
		if (m_len > 0) {
			if (m_arr[0] == '"') {
				--m_len;
				array_h::move(m_arr, m_arr + 1, m_len);
			}
			if (m_arr[m_len - 1] == '"') {
				--m_len;
			}
			null_terminate_h();
		}
		return *this;
	}
	This& 	unquote() const requires (is_char<Type>::value) {
		return copy().unquote_r();
	}
	
	// To uppercase.
	/*  @docs {
	 *	@parent: vlib::String
	 *	@title: Uppercase
	 *	@description:
	 *	    Create an uppercase `String` from the `String`.
	 *
	 *	    Function `uppercase_r` updates the `String`, while `uppercase` creates a new `String`.
	 *	@usage:
	 *	    String x = "hello";
	 *	    String y = x.uppercase(); y ==> "HELLO";
	 *	@funcs: 2
	} */
	constexpr
	This     uppercase() const requires (is_char<Type>::value) {
		This up;
		up.resize(m_len);
		for (auto& c: *this) {
			up.append_no_resize(::toupper(c));
		}
		return up;
	}
	constexpr
	This&     uppercase_r() requires (is_char<Type>::value) {
		for (auto& c: *this) {
			c = ::toupper(c);
		}
		return *this;
	}
	
	// To lowercase.
	/*  @docs {
	 *	@parent: vlib::String
	 *	@title: Lowercase
	 *	@description:
	 *	    Create a lowercase `String` from the `String`.
	 *
	 *	    Function `uppercase_r` updates the `String`, while `uppercase` creates a new `String`.
	 *	@usage:
	 *	    String x = "hello";
	 *	    String y = x.uppercase(); y ==> "HELLO";
	 *	@funcs: 2
	} */
	constexpr
	This     lowercase() const requires (is_char<Type>::value) {
		This up;
		up.resize(m_len);
		for (auto& c: *this) {
			up.append_no_resize(::tolower(c));
		}
		return up;
	}
	constexpr
	This&     lowercase_r() requires (is_char<Type>::value) {
		for (auto& c: *this) {
			c = ::toupper(c);
		}
		return *this;
	}

	// Ensure start / end padding to a required length.
	/* 	@docs {
	 *	@parent: vlib::String
	 *	@title: Ensure start padding
	 *	@description:
	 *		Ensure start padding to a required full length.
	 *
	 *		Function `ensure_start_padding_r` updates the current array, while `ensure_start_padding` creates a copy.
	 *	@notes:
	 *		The minus (`-`) from a `tostr(-1)` is also included in the required length.
	 *	@usage:
	 *		String x = "1";
	 *		x.ensure_start_padding_r('0', 2); x ==> "01";
	 *		String y = "1";
	 *		y.ensure_start_padding_r('0', 1); x ==> "1";
	 *	@funcs: 2
	} */
	constexpr
	This& 	ensure_start_padding_r(char padding, const Length req_len) {
		if (m_len >= req_len) { return *this; }
		Length padding_len = req_len - m_len;
		expand(padding_len);
		if (m_arr[0] == '-') {
			array_h::move(m_arr + padding_len + 1, m_arr + 1, m_len - 1);
			++padding_len;
			while (padding_len-- > 1) { m_arr[padding_len] = padding; }
		} else {
			array_h::move(m_arr + padding_len, m_arr, m_len);
			while (padding_len-- > 0) { m_arr[padding_len] = padding; }
		}
		m_len = req_len;
		null_terminate_h();
		return *this;
	}
	constexpr
	This	ensure_start_padding(char padding, const Length req_len) const {
		return copy().ensure_start_padding_r(padding, req_len);
	}
	/* 	@docs {
	 *	@title: Ensure end padding
	 *	@parent: vlib::String
	 *	@description:
	 *		Ensure end padding to a required full length.
	 *
	 *		Function `ensure_end_padding_r` updates the current array, while `ensure_end_padding` creates a copy.
	 *	@notes:
	 *		The minus (`-`) from a `tostr(-1)` is also included in the required length.
	 *	@usage:
	 *		String x = "1";
	 *		x.ensure_end_padding_r(' ', 2); x ==> "1 ";
	 *		String y = "1";
	 *		y.ensure_end_padding_r(' ', 1); x ==> "1";
	 *	@funcs: 2
	} */
	constexpr
	This& 	ensure_end_padding_r(char padding, const Length req_len) {
		if (m_len >= req_len) { return *this; }
		Length padding_len = req_len - m_len;
		expand(padding_len);
		while (padding_len-- > 0) { m_arr[m_len] = padding; ++m_len; }
		null_terminate_h();
		return *this;
	}
	constexpr
	This 	ensure_end_padding(char padding, const Length req_len) const {
		return copy().ensure_end_padding_r(padding, req_len);
	}

	// Set default.
	/*  @docs {
	 *  @title: Set Default
	 *  @description:
	 *      Set default value if the object is undefined.
	 *
	 *      Function `concats_r` updates the current array, while `concats` creates a copy.
	 *  @usage:
	 *      String x, y = "Hello World!";
	 *      x.def_r("Hello Universe!"); x ==> "Hello Universe!"
	 *      y.def_r("Hello Universe!"); y ==> "Hello World!"
	 *  @funcs: 2
	 }*/
	constexpr
	This     def(const This& def) const {
		if (is_undefined()) {
			return def;
		}
		return *this;
	}
	This&    def_r(const This& def) {
		if (is_undefined()) {
			copy(def);
		}
		return *this;
	}
	
	// Null terminate.
	/* 	@docs {
	 *	@parent: vlib::String
	 *	@title: Null terminate
	 *	@description:
	 *		Null terminate the char array.
	 *
	 *		Function `null_terminate()` always updates the current array.
	 *	@usage:
	 *		String x;
	 *		x.null_terminate();
	 }*/
	constexpr
	This& 	null_terminate() requires (!is_char<Type>::value) { return *this; }
	constexpr
	This& 	null_terminate() requires (is_char<Type>::value) {
		if (m_arr == nullptr) { expand(1); }
		m_arr[m_len] = '\0';
		return *this;
	}
	constexpr
	void	null_terminate_h() requires (!is_char<Type>::value) {}
	constexpr
	void	null_terminate_h() requires (is_char<Type>::value) {
		m_arr[m_len] = '\0';
	}
	constexpr
	void 	null_terminate_safe_h() requires (!is_char<Type>::value) {}
	constexpr
	void 	null_terminate_safe_h() requires (is_char<Type>::value) {
		if (m_arr != nullptr) {
			m_arr[m_len] = '\0';
		}
	}
	

	// ---------------------------------------------------------
	// Parsing.

	// Append parsed item.
	// - With type: bool.
	SICE
	void 	append_parsed_item_h(
		This& 						obj,
		const char*& 				arr,
		ullong&		 	value_start,
		ullong&
	) requires (
		!is_char<Type>::value &&
		is_bool<Type>::value
	) {
		switch (arr[value_start]) {
			case 'T':
			case 't': {
				obj.append(true);
				break;
			}
			default: {
				obj.append(false);
				break;
			}
		}
	}
	// - With type: any numeric.
	SICE
	void 	append_parsed_item_h(This& obj, const char*& arr, ullong& value_start, ullong& value_end) requires (
		!is_char<Type>::value &&
		is_any_numeric<Type>::value
	) {
		obj.append(tonumeric<Type>(arr + value_start, value_end - value_start));
	}
	// - With type: all other.
	SICE
	void 	append_parsed_item_h(This& obj, const char*& arr, ullong& value_start, ullong& value_end) requires (
		!is_char<Type>::value &&
		!is_bool<Type>::value &&
		!is_any_numeric<Type>::value
	) {
		switch (arr[value_start]) {
			case '"': {
				++value_start;
				--value_end;
				obj.append(Type::parse(arr + value_start, value_end - value_start));
				break;
			}
			default: {
				obj.append(Type::parse(arr + value_start, value_end - value_start));
				break;
			}
		}
	}

	// Parse a json formatted array from a const char*.
	/* 	@docs {
		@title: Parse
		@description:
			Parse a json formatted array from a `const char*`.
	}*/
	static inline // do not place a constexpr tag since this will create a nasty llvm bug on linux.
	This 	parse(const char* arr, ullong len) requires (!is_char<Type>::value) {

		// Checks.
		if (!arr || len < 2 || arr[0] != '[' || arr[len-1] != ']') {
			throw ParseError("A string representation of an array must start with a \"[\" and end with a \"]\".");
		}

		// Variables.
		ullong 	value_start = 1; 			// start index of the new value.
		ullong 	value_end = 0; 				// end index of the new value.
		bool 				is_str = false; 			// is inside string.
		int 				depth = 0; 					// bracket depth.
		ullong 	index = 1;					// skip first bracket.
		ullong 	l_len = len - 1;			// skip last bracket.
		This 				obj;

		// Iterate, skip first curly bracket.
		obj.resize();
		for (; index < l_len; ++index) {
			if (is_str) {
				switch (arr[index]) {
					case '"': { is_str = false; break; }
					default: break;
				}
			} else {
				switch (arr[index]) {

					// Skip spaces at the start of a key / value.
					case ' ': {
						if (index == value_start) { ++value_start; break; }
						break;
					}

					// Found string start / end.
					case '"': { is_str = !is_str; break; }

					// Found opening (curly) bracket.
					case '{':
					case '[': { ++depth; break; }

					// Found closing (curly) bracket.
					case '}':
					case ']': { --depth; break; }

					// Found end of value by delimiter.
					case ',': {
						switch (depth) {
							case 0: {
								value_end = index;
								append_parsed_item_h(obj, arr, value_start, value_end);
								value_start = index + 1;
								break;
							}
							default: break;
						}
						break;
					}
				}
			}
		}

		// Add last key & value.
		if (len > 2) {
			value_end = l_len;
			append_parsed_item_h(obj, arr, value_start, value_end);
		}
		return obj;
		++value_end;
	}
	SICE
	This 	parse(const char* arr) requires (!is_char<Type>::value) {
		return parse(arr, vlib::len(arr));
	}

	// Parse a String from a const char*.
	SICE
	This 	parse(const char* arr, ullong len) requires (is_char<Type>::value) {
		return This(arr, len);
	}
	SICE
	This 	parse(const char* arr) requires (is_char<Type>::value) {
		return arr;
	}

	// ---------------------------------------------------------
	// Joining.

	// Join helper's helper.
	// - With type: char* / const char*.
	constexpr
	void 	join_h_h(Pipe& pipe, const Length i) const requires (
		!is_char<Type>::value &&
		(
			// is_str<Type>::value ||
			is_cstr<Type>::value
		)
	) {
		pipe << '"' << m_arr[i] << '"';
	}
	// - With type: bool / any numeric / any pointer (not str/cstr).
	constexpr
	void 	join_h_h(Pipe& pipe, const Length i) const requires (
		!is_char<Type>::value &&
		(
			is_bool<Type>::value ||
			is_any_numeric<Type>::value ||
			(
				 is_ptr<Type>::value &&
				 // !is_str<Type>::value &&
				 !is_cstr<Type>::value
			)
		)
	) {
		pipe << m_arr[i];
	}
	// - With all remaining types.
	void 	join_h_h(Pipe& pipe, const Length i) const requires (
		!is_char<Type>::value &&
		// !is_str<Type>::value &&
		!is_cstr<Type>::value &&
		!is_bool<Type>::value &&
		!is_any_numeric<Type>::value &&
		!is_ptr<Type>::value
	) {
		pipe << m_arr[i].json();
	}

	// Join helper.
	// - Without pre, joiner, post.
	constexpr
	void 	join_h(Pipe& pipe) const requires (!is_char<Type>::value) {
		// String sindent;
		// sindent.fill_r(4, ' ');
		pipe << '[';
		for (auto& i: Range<Forwards>(0, m_len)) {
			// pipe << '\n';
			// pipe.dump(sindent.c_str(), sindent.len());
			join_h_h(pipe, i);
			if (i + 1 < m_len) { pipe << ',' << ' '; }
		}
		pipe << ']';
		pipe.null_terminate();
	}
	// - Without spaces.
	constexpr
	void 	join_no_space_h(Pipe& pipe) const requires (!is_char<Type>::value) {
		pipe << '[';
		for (auto& i: Range<Forwards>(0, m_len)) {
			join_h_h(pipe, i);
			if (i + 1 < m_len) { pipe << ','; }
		}
		pipe << ']';
		pipe.null_terminate();
	}
	// - With pre, joiner, post.
	constexpr
	void 	join_h(
		Pipe& pipe,
		const char* pre,
		const char* joiner,
		const char* post
	) const requires (!is_char<Type>::value) {
		pipe << pre;
		for (auto& i: Range<Forwards>(0, m_len)) {
			join_h_h(pipe, i);
			if (i + 1 < m_len) { pipe << joiner; }
		}
		pipe << post;
		pipe.null_terminate();
	}

	// Join to String.
	/* 	@docs {
		@title: Join
		@description:
			Join the items of the array into a string.
	}*/
	constexpr
	String 	join() const requires (!is_char<Type>::value) {
		Pipe pipe;
		join_h(pipe);
		return pipe;
	}
	/* 	@docs {
		@title: Join
		@description:
			Join the items of the array into a string, with a pre, joiner and post substring.
	}*/
	constexpr
	String 	join(
		const char* 		pre,
		const char* 		joiner,
		const char* 		post
	) const requires (!is_char<Type>::value) {
		Pipe pipe;
		join_h(pipe, pre, joiner, post);
		return pipe;
	}

	// ---------------------------------------------------------
	// Cast concats_r.

	// Empty concat_r.
	// - Concats will always null terminate the array for "tostr".
	constexpr
	This&	concats_r() {
		null_terminate();
		return *this;
	}

	// Concat with This.
	/* 	@docs {
		@title: Concats
		@description:
			Concatenate one or multiple items to the string with a cast.
	 
			Function `concats_r` updates the current array, while `concats` creates a copy.
		@funcs: 11
	}*/
	template <typename... Args> constexpr
	This&	concats_r(const This& x, Args&&... args) {
		concat_r(x);
		concats_r(args...);
		return *this;
	}
	template <typename... Args> constexpr
	This&	concats_r(This&& x, Args&&... args) {
		concat_r(x);
		concats_r(args...);
		return *this;
	}

	// Concat a char*.
	template <typename Arg, typename... Args> requires (is_char<Arg>::value) constexpr
	This&	concats_r(const Arg* x, Args&&... args) {
        if (x != NULL && x != nullptr) {
            concat_r(x);
        }
		concats_r(args...);
		return *this;
	}

	// Concat a bool.
	template <typename Arg, typename... Args> requires (is_bool<Arg>::value) constexpr
	This&	concats_r(const Arg& x, Args&&... args) {
		if (x) { concat_r("true", 4); }
		else { concat_r("false", 5); }
		concats_r(args...);
		return *this;
	}

	// Concat a char.
	template <typename Arg, typename... Args> requires (is_char<Arg>::value) constexpr
	This&	concats_r(const Arg& x, Args&&... args) {
		append(x);
		concats_r(args...);
		return *this;
	}

	// Concat any integer.
	template <typename Arg, typename... Args> requires (is_any_integer<Arg>::value) constexpr
	This&	concats_r(const Arg& x, Args&&... args) {
		if (x == 0) { append('0'); }
        else if (::isinf(x)) { concat_r("inf", 3); }
		else {
			if (x < 0) { append('-'); }
			concat_digits_h(x);
		}
		concats_r(args...);
		return *this;
	}

	// Concat any double.
	template <typename Arg, typename... Args> requires (is_floating<Arg>::value) constexpr
	This&	concats_r(const Arg& x, Args&&... args) {
		Length old_len = m_len;
        if (::isinf(x)) { concat_r("inf", 3); }
        else {
            if (x < 0) {
                append('-');
                old_len = m_len;
            }
            concat_digits_h(x);
            if (m_len == old_len) { append('0'); }
            append('.');
            concat_decimals_h(x);
            if (m_len > 0 && m_arr[m_len-1] == '.') {
                --m_len;
            }
        }
		concats_r(args...);
		return *this;
	}

	// Concats with CString / Pipe.
	template <typename Template, typename... Args>	requires (
		is_char<Type>::value &&
		(is_CString<Template>::value || is_Pipe<Template>::value || internal::is_BaseArray<Template>::value)
	) constexpr
	This&	concats_r(const Template& x, Args&&... args) {
		concat_r(x);
		concats_r(args...);
		return *this;
	}
	template <typename Template, typename... Args>	requires (
		is_char<Type>::value &&
		(is_CString<Template>::value || is_Pipe<Template>::value || internal::is_BaseArray<Template>::value)
	) constexpr
	This&	concats_r(Template&& x, Args&&... args) {
		concat_r(x);
		concats_r(args...);
		return *this;
	}

	// Concats by Pipe.
	template <typename Template, typename... Args>	requires (
		is_char<Type>::value &&
		!is_String_h<Template>() &&
		!is_cstr<Template>::value &&
		!is_bool<Template>::value &&
		!is_char<Template>::value &&
		!is_any_integer<Template>::value &&
		!is_floating<Template>::value &&
		!is_CString<Template>::value &&
		!is_Pipe<Template>::value &&
        !internal::is_BaseArray<Template>::value
	) constexpr
	This&	concats_r(const Template& x, Args&&... args) {
		Pipe pipe;
		pipe << x;
		concat_r(pipe);
		concats_r(args...);
		return *this;
	}
	
	// Concats as copy.
	template <typename... Args> constexpr
	This	concats(Args&&... args) {
		return copy().concats_r(args...);
	}

	// Empty concat_r without resizing.
	constexpr
	This&	concats_no_resize_r() {
		null_terminate();
		return *this;
	}

	// Concat with This without resizing.
	/* 	@docs {
		@title: Concats without resizing
		@description:
			Concatenate one or multiple items to the string with a cast, without resizing the array.
	 
			Function `concats_no_resize_r` updates the current array, while `concats_no_resize` creates a copy.
		@funcs: 11
	}*/
	template <typename... Args> constexpr
	This&	concats_no_resize_r(const This& x, Args&&... args) {
		concat_no_resize_r(x);
		concats_no_resize_r(args...);
		return *this;
	}
	template <typename... Args> constexpr
	This&	concats_no_resize_r(This&& x, Args&&... args) {
		concat_no_resize_r(x);
		concats_no_resize_r(args...);
		return *this;
	}

	// Concat a char* without resizing.
	template <typename Arg, typename... Args> requires (is_char<Arg>::value) constexpr
	This&	concats_no_resize_r(const Arg* x, Args&&... args) {
		concat_no_resize_r(x);
		concats_no_resize_r(args...);
		return *this;
	}

	// Concat a bool without resizing.
	template <typename Arg, typename... Args> requires (is_bool<Arg>::value) constexpr
	This&	concats_no_resize_r(const Arg& x, Args&&... args) {
		if (x) { concat_no_resize_r("true", 4); }
		else { concat_no_resize_r("false", 5); }
		concats_no_resize_r(args...);
		return *this;
	}

	// Concat a char without resizing.
	template <typename Arg, typename... Args> requires (is_char<Arg>::value) constexpr
	This&	concats_no_resize_r(const Arg& x, Args&&... args) {
		append_no_resize(x);
		concats_no_resize_r(args...);
		return *this;
	}

	// Concat any integer without resizing.
	template <typename Arg, typename... Args> requires (is_any_integer<Arg>::value) constexpr
	This&	concats_no_resize_r(const Arg& x, Args&&... args) {
		if (x == 0) { append_no_resize('0'); }
		else {
			if (x < 0) { append_no_resize('-'); }
			concat_digits_no_resize_h(x);
		}
		concats_no_resize_r(args...);
		return *this;
	}

	// Concat any double without resizing.
	template <typename Arg, typename... Args> requires (is_floating<Arg>::value) constexpr
	This&	concats_no_resize_r(const Arg& x, Args&&... args) {
		Length old_len = m_len;
		if (x < 0) {
			append_no_resize('-');
			old_len = m_len;
		}
		concat_digits_no_resize_h(x);
		if (m_len == old_len) { append_no_resize('0'); }
		append_no_resize('.');
		concat_decimals_no_resize_h(x);
		if (m_len > 0 && m_arr[m_len-1] == '.') {
			--m_len;
		}
		concats_no_resize_r(args...);
		return *this;
	}

	// Concats with CString / Pipe / bArray without resizing.
	template <typename Template, typename... Args>	requires (
		is_char<Type>::value &&
		(is_CString<Template>::value || is_Pipe<Template>::value || internal::is_BaseArray<Template>::value)
	) constexpr
	This&	concats_no_resize_r(const Template& x, Args&&... args) {
		concat_r(x);
		concats_r(args...);
		return *this;
	}
	template <typename Template, typename... Args>	requires (
		is_char<Type>::value &&
		(is_CString<Template>::value || is_Pipe<Template>::value || internal::is_BaseArray<Template>::value)
	) constexpr
	This&	concats_no_resize_r(Template&& x, Args&&... args) {
		concat_no_resize_r(x);
		concats_no_resize_r(args...);
		return *this;
	}

	// Concats by Pipe.
	template <typename Template, typename... Args>	requires (
		is_char<Type>::value &&
		!is_String_h<Template>() &&
		!is_cstr<Template>::value &&
		!is_bool<Template>::value &&
		!is_char<Template>::value &&
		!is_any_integer<Template>::value &&
		!is_floating<Template>::value &&
		!is_CString<Template>::value &&
		!is_Pipe<Template>::value &&
        !internal::is_BaseArray<Template>::value
	) constexpr
	This&	concats_no_resize_r(const Template& x, Args&&... args) {
		Pipe pipe;
		pipe << x;
		concat_no_resize_r(pipe);
		concats_no_resize_r(args...);
		return *this;
	}
	
	// Concats as copy.
	template <typename... Args> constexpr
	This	concats_no_resize(Args&&... args) {
		return copy().concats_no_resize_r(args...);
	}

	// Concat the digits before the dot.
	template <typename Arg> constexpr
	void 	concat_digits_h(const Arg& y) {

		// Length.
		long double 			x = vlib::abs<long double>(y);
		ullong		len = 0;
		while (x >= 1) { x /= 10; ++len; }
		if (len == 0) { return ; }

		// Power.
		ullong 		pow = vlib::pow<ullong>(10, len-1);

		// Vars.
		ushort 			digit;
		x = 			vlib::abs<long double>(y);

		// Iterate.
		for (Length i = 0; i < len; ++i) {
			digit = vlib::floor<ushort>(x / pow);
			append(digit_to_char_h(digit));
			x -= pow * digit;
			pow /= 10;
		}

		//
	}
	template <typename Arg> constexpr
	void 	concat_digits_no_resize_h(const Arg& y) {

		// Length.
		long double 			x = vlib::abs<long double>(y);
		ullong		len = 0;
		while (x >= 1) { x /= 10; ++len; }
		if (len == 0) { return ; }

		// Power.
		ullong 		pow = vlib::pow<ullong>(10, len-1);

		// Vars.
		ushort 			digit;
		x = 					vlib::abs<long double>(y);

		// Iterate.
		for (Length i = 0; i < len; ++i) {
			digit = vlib::floor<ushort>(x / pow);
			append_no_resize(digit_to_char_h(digit));
			x -= pow * digit;
			pow /= 10;
		}

		//
	}

	// Concat the digits after the dot.
	template <typename Arg> requires (is_floating<Arg>::value) constexpr
	void 	concat_decimals_h(const Arg& x) {

		// Vars.
		bool 				is_zero = 		false;
		uint 		digit;

		// Get decimals.
		Arg y = vlib::todecimals(abs(x));
		y = vlib::round(y, (int) vlib::casts::tostr::precision);
		y += 1.0 / vlib::pow<ullong>(10, (int) vlib::casts::tostr::precision + 1); // add padding to avoid rounding errors.

		// Iterate.
		for (auto& i: Range<Forwards>(vlib::casts::tostr::precision)) {
			if (is_zero) {
				if (!vlib::casts::tostr::zero_padding) { m_len = i; break; }
				append('0');
			} else {
				y *= 10;
				Arg decimals = todecimals(y);
				digit = vlib::round<uint>(y - decimals);
				append(digit_to_char_h(digit));
				y = decimals;
			}
		}

		// Remove last zeros.
		while (!vlib::casts::tostr::zero_padding && m_len > 0 && m_arr[m_len - 1] == '0') {
			--m_len;
		}

		//
	}
	template <typename Arg> requires (is_floating<Arg>::value) constexpr
	void 	concat_decimals_no_resize_h(const Arg& x) {

		// Vars.
		bool 				is_zero = 		false;
		uint 		digit;

		// Get decimals.
		Arg y = vlib::todecimals(abs(x));
		y = vlib::round(y, (int) vlib::casts::tostr::precision);
		y += 1.0 / vlib::pow<ullong>(10, (int) vlib::casts::tostr::precision + 1); // add padding to avoid rounding errors.

		// Iterate.
		for (auto& i: Range<Forwards>(vlib::casts::tostr::precision)) {
			if (is_zero) {
				if (!vlib::casts::tostr::zero_padding) { m_len = i; break; }
				append_no_resize('0');
			} else {
				y *= 10;
				Arg decimals = todecimals(y);
				digit = vlib::round<uint>(y - decimals);
				append_no_resize(digit_to_char_h(digit));
				y = decimals;
			}
		}

		// Remove last zeros.
		while (!vlib::casts::tostr::zero_padding && m_len > 0 && m_arr[m_len - 1] == '0') {
			--m_len;
		}

		//
	}

	// Cast a digit to a char.
	template <typename Digit> requires (is_any_integer<Digit>::value)
	auto 	digit_to_char_h(const Digit& digit) {
		switch (digit) {
			case 0: { return '0'; }
			case 1: { return '1'; }
			case 2: { return '2'; }
			case 3: { return '3'; }
			case 4: { return '4'; }
			case 5: { return '5'; }
			case 6: { return '6'; }
			case 7: { return '7'; }
			case 8: { return '8'; }
			case 10: // fix for round from 9 to 10 for tostr.
			case 9: { return '9'; }
			default: {
				std::cout << "DIGIT: " << digit << "\n";
				throw InvalidUsageError("Invalid usage, the digit must be between 0 & 9.");
			}
		}
	}

	// ---------------------------------------------------------
	// Casts.

	// As const char*.
	/* 	@docs {
	 *	@parent: vlib::String
	 *	@title: C string.
	 *	@description:
	 *		Get as null terminated `const char*`
	}*/
	constexpr
	const char*	c_str() requires(is_char<Type>::value) {
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
	const char*	c_str() const requires(is_char<Type>::value) {
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

	// As json formatted String.
	/* 	@docs {
	 *	@title: JSON
	 *	@description:
	 *		Get json formatted string.
	}*/
	constexpr
	String 	json() const requires (!is_char<Type>::value) {
		Pipe pipe;
		join_no_space_h(pipe);
		return pipe;
	}
	constexpr
	This	json() const requires (is_char<Type>::value) {
		return This().append('"').concat_r(m_arr, m_len).append('"');
	}

	// As String.
	/* 	@docs {
	 *	@parent: vlib::Array
	 *	@title: String
	 *	@description:
	 *		Get as string.
	}*/
	constexpr
	String 	str() const requires(!is_char<Type>::value) {
		Pipe pipe;
		join_h(pipe);
		return pipe;
	}

	// As bool.
	/* 	@docs {
		@parent: vlib::String
		@title: As bool
		@description:
			Get as bool.
	}*/
	template <typename As> requires (
		is_char<Type>::value &&
		(
         is_bool<As>::value ||
         is_Bool<As>::value
        )
	) constexpr
	As	as() const {
		return tobool(m_arr, m_len);
	}
	
	// As numeric.
	/* 	@docs {
	 *	@parent: vlib::String
	 *	@title: As numeric
	 *	@description:
	 *		Get as numeric.
	}*/
	template <typename As> requires (
		is_char<Type>::value &&
		is_any_numeric<As>::value
	) constexpr
	As		as() const {
		return tonumeric<As>(m_arr, m_len);
	}
    template <typename As> requires (
        is_char<Type>::value &&
        is_any_Numeric<As>::value
    ) constexpr
    As        as() const {
        return As::parse(m_arr, m_len);
    }

	// ---------------------------------------------------------
	// Operators.

	// Operator "*".
	constexpr
	auto& 	operator *() const {
		return *m_arr;
	}

	// Equals.
	constexpr friend
	bool	operator ==(const This& x, const This& y) {
		return x.eq(y);
	}
	constexpr friend
	bool	operator !=(const This& x, const This& y) {
		return !x.eq(y);
	}
	
	// Is null.
	constexpr friend
	bool	operator ==(const This& obj, const Null&) {
		return obj.m_len == 0;
	}
	constexpr friend
	bool	operator !=(const This& obj, const Null&) {
		return obj.m_len != 0;
	}

	// Equals with char array.
	constexpr friend
	bool	operator ==(const This& x, const char* y) requires (is_char<Type>::value) {
		return x.eq(y);
	}
	constexpr friend
	bool	operator !=(const This& x, const char* y) requires (is_char<Type>::value) {
		return !x.eq(y);
	}
	
	// Equals with char.
	constexpr friend
	bool	operator ==(const This& x, char y) requires (is_char<Type>::value) {
		return x.eq(y);
	}
	constexpr friend
	bool	operator !=(const This& x, char y) requires (is_char<Type>::value) {
		return !x.eq(y);
	}

	// Less / greater.
	constexpr
	bool 	operator >(const This& x) const {
		for (auto& i: indexes(0, min(m_len, x.m_len))) {
			if (m_arr[i] > x.m_arr[i]) { return true; }
			else if (m_arr[i] < x.m_arr[i]) { return false; }
		}
		return m_len > x.m_len;
	}
	constexpr
	bool 	operator <(const This& x) const {
		for (auto& i: indexes(0, min(m_len, x.m_len))) {
			if (m_arr[i] > x.m_arr[i]) { return false; }
			else if (m_arr[i] < x.m_arr[i]) { return true; }
		}
		return m_len < x.m_len;
	}
	constexpr
	bool 	operator >=(const This& x) const {
		for (auto& i: indexes(0, min(m_len, x.m_len))) {
			if (m_arr[i] >= x.m_arr[i]) { return true; }
			else if (m_arr[i] < x.m_arr[i]) { return false; }
		}
		return m_len >= x.m_len;
	}
	constexpr
	bool 	operator <=(const This& x) const {
		for (auto& i: indexes(0, min(m_len, x.m_len))) {
			if (m_arr[i] > x.m_arr[i]) { return false; }
			else if (m_arr[i] <= x.m_arr[i]) { return true; }
		}
		return m_len <= x.m_len;
	}

	// Compare array lengths with any numeric.
	constexpr
	bool 	operator >(const Length x) const {
		return m_len > x;
	}
	constexpr
	bool 	operator <(const Length x) const {
		return m_len < x;
	}
	constexpr
	bool 	operator >=(const Length x) const {
		return m_len >= x;
	}
	constexpr
	bool 	operator <=(const Length x) const {
		return m_len <= x;
	}

	// Operators "+, ++, +=" with any numeric.
	constexpr
	This& 	operator ++() {
		if (m_len == 0) { return *this; }
		--m_len;
		array_h::move(m_arr, m_arr + 1, m_len);
		null_terminate_h();
		return *this;
	}
	constexpr
	This& 	operator ++(int) {
		if (m_len == 0) { return *this; }
		--m_len;
		array_h::move(m_arr, m_arr + 1, m_len);
		null_terminate_h();
		return *this;
	}
	constexpr
	This 	operator +(const Length x) const {
		This obj;
		if (m_len == 0) { return obj; }
		const Length y = x;
		if (y >= m_len) { return obj; }
		obj.m_capacity = obj.m_len;
		array_h::alloc(obj.m_arr, obj.m_len);
		obj.m_len = m_len - y;
		array_h::copy(obj.m_arr, m_arr + y, obj.m_len);
		obj.null_terminate_h();
		return obj;
	}
	constexpr
	This& 	operator +=(const Length x) {
		if (m_len == 0) { return *this; }
		const Length y = x;
		if (y >= m_len) { return reset(); }
		m_len = m_len - y;
		array_h::move(m_arr + y, m_len);
		null_terminate_h();
		return *this;
	}

	// Operators "-, --, -=" with any numeric.
	constexpr
	This& 	operator --() {
		if (m_len == 0) { return *this; }
		--m_len;
		null_terminate_h();
		return *this;
	}
	constexpr
	This& 	operator --(int) {
		if (m_len == 0) { return *this; }
		--m_len;
		null_terminate_h();
		return *this;
	}
	constexpr
	This 	operator -(const Length x) const {
		if (m_len == 0) { return *this; }
		const Length y = x;
		if (y >= m_len) { return This(); }
		This obj (*this);
		obj.m_len = max((Length) 0, x.m_len - y);
		obj.null_terminate_h();
		return obj;
	}
	constexpr
	This& 	operator -=(const Length x) {
		if (m_len == 0) { return *this; }
		const Length y = x;
		if (y >= m_len) { return destruct(); }
		m_len = max((Length) 0, m_len - y);
		null_terminate_h();
		return *this;
	}

	// Operators "+, +=" with a memory type.
	constexpr friend
	This	operator +(const This obj, const This& x) {
		return obj.copy().concat_r(x);
	}
	constexpr
	This& 	operator +=(const This& x) {
		return concat_r(x);
	}

	// Operators "+, +=" with a char array.
	constexpr friend
	This	operator +(const This obj, const Type* x) requires (is_char<Type>::value) {
		return obj.copy().concat_r(x);
	}
	constexpr
	This& 	operator +=(const Type* x) requires (is_char<Type>::value) {
		return concat_r(x);
	}

	// Operators "+, +=" with cast.
	template <typename Cast> requires (is_char<Type>::value && is_integral<Cast>::value) constexpr friend
	This	operator +(const This obj, const Cast& x) {
		return obj.copy().concats_r(x);
	}
	template <typename Cast> requires (is_char<Type>::value && is_integral<Cast>::value) constexpr
	This& 	operator +=(const Cast& x) {
		return concats_r(x);
	}

	// Operators "+, +=" with CString / Pipe.
	template <typename Template>	requires (
		is_char<Type>::value &&
		(is_CString<Template>::value || is_Pipe<Template>::value || internal::is_BaseArray<Template>::value)
	) constexpr friend
	This	operator +(const This obj, const Template& x) {
		return obj.copy().concat_r(x);
	}
	template <typename Template>	requires (
		is_char<Type>::value &&
		(is_CString<Template>::value || is_Pipe<Template>::value || internal::is_BaseArray<Template>::value)
	) constexpr
	This& 	operator +=(const Template& x) {
		return concat_r(x);
	}

	// Operators "*, *=" with any numeric.
	constexpr friend
	This	operator *(const This obj, const Length x) {
		return obj.mult(x);
	}
	constexpr
	This& 	operator *=(const Length x) {
		return mult_r(x);
	}

	// Operators "/, /=" with any numeric.
	constexpr friend
	Array<This>	operator /(const This obj, const Length x) {
		return obj.div(x);
	}

	// Operators "%, %=" with any numeric.
	constexpr friend
	This	operator %(const This obj, const Length x) {
		return obj.mod(x);
	}
	constexpr
	This& 	operator %=(const Length x) {
		return mod_r(x);
	}

	// Subscript operator
	constexpr
	Type& 	operator [](const Length index) const {
        if (index >= m_len) {
            throw IndexError("Index is out of range.");
        }
		return m_arr[index];
	}
    constexpr
    Type&     operator [](const Len& index) const {
        if (index.value() >= m_len) {
            throw IndexError("Index is out of range.");
        }
        return m_arr[index.value()];
    }

	// Concat by operator "<<".
	constexpr
	This&	operator <<(const This& x) {
		return concat_r(x);
	}
	constexpr
	This&	operator <<(This&& x) {
		return concat_r(x);
	}

	// Concat by operator "<<" with CString / Pipe.
	template <typename Template>	requires (
		is_char<Type>::value &&
		(is_CString<Template>::value || is_Pipe<Template>::value || internal::is_BaseArray<Template>::value)
	) constexpr
	This& 	operator <<(const Template& x) {
		return concat_r(x);
	}

	// Concat by operator "<<" with char array.
	constexpr
	This& 	operator <<(const Type* x) requires (is_char<Type>::value) {
		return concat_r(x);
	}

	// Concat by operator "<<" with cast.
	template <typename Cast> requires (
        is_char<Type>::value && (
         is_integral<Cast>::value ||
         is_any_Numeric<Cast>::value ||
         is_Bool<Cast>::value
        )
    ) constexpr
	This& 	operator <<(const Cast& x) {
		return concats_r(x);
	}

	// Dump to pipe.
	constexpr friend
	auto&	operator <<(Pipe& pipe, const This& x) requires (!is_char<Type>::value) {
		x.join_h(pipe);
		return pipe;
	}
	constexpr friend
	auto&	operator <<(Pipe& pipe, const This& x) requires (is_char<Type>::value) {
		return pipe << x.c_str();
	}

};

// ---------------------------------------------------------
// Alias.

// Type definition String is already defined by Exception.

// ---------------------------------------------------------
// Instances.

// Is instance.
template<typename Type>	struct is_instance<Array<Type>, Array<Type>>		{ SICEBOOL value = true;  };
template<> 				struct is_instance<String, String>		{ SICEBOOL value = true;  };

// Is type.
template<typename Type> 		struct is_Array 												{ SICEBOOL value = false; };
template<typename Type, typename Length>	struct is_Array<Array<Type, Length>> 					{ SICEBOOL value = true;  };

// Is type.
template<typename Type> 		struct is_String 					{ SICEBOOL value = false; };
template<>						struct is_String<String> 				{ SICEBOOL value = true;  };

// Is forwardable.
template<typename From, typename To>
struct is_forwardable { SICEBOOL value = false; };
template<>
struct is_forwardable<const char*, String> { SICEBOOL value = true;  };
template<ullong N>
struct is_forwardable<char[N], String> { SICEBOOL value = true;  };

// ---------------------------------------------------------
// Out of line definitions.

// Create the "tostr" function.
// template         <typename... Args> inline constexpr
// auto     tostr(Args&&... args) {
//     String value;
//     tostr_r(value, args...);
//     return value;
// }

// Enum description.
constexpr
String  enum_desc(short value, short desc_value, const String& desc) {
    if (value == desc_value) {
        return desc;
    }
    return "NaN";
}
template <typename... Args> constexpr
String  enum_desc(short value, short desc_value, const String& desc, Args&&... args) {
    if (value == desc_value) {
        return desc;
    }
    return enum_desc(value, args...);
}

// ---------------------------------------------------------
// Definitions for NPos.

// Create the "NPos:: str & json" functions.
constexpr
auto 	NPos::str() const {
	return String(NPos::npos);
}
constexpr
auto 	NPos::json() const {
	return String(NPos::npos);
}

// ---------------------------------------------------------
// Definitions for Null.

// Create the "Null:: str & json" functions.
constexpr
auto 	Null::str() const {
	return String("null", 4);
}
constexpr
auto 	Null::json() const {
	return String("null", 4);
}

// ---------------------------------------------------------
// Definitions for Bool.

// Create the "Bool:: str & json" functions.
constexpr
auto 	Bool::str() const {
	return String(m_bool);
}
constexpr
auto 	Bool::json() const {
	return String(m_bool);
}

// ---------------------------------------------------------
// Definitions for Numeric.

// Create the "Numeric:: str & json" functions.
template <typename Type> requires (is_any_numeric<Type>::value) constexpr
auto 	Numeric<Type>::str() const {
	String x;
	x.concats_r(m_numeric);
	return x;
}
template <typename Type> requires (is_any_numeric<Type>::value) constexpr
auto 	Numeric<Type>::json() const {
	String x;
	x.concats_r(m_numeric);
	return x;
}

// ---------------------------------------------------------
// Definitions for CString.

// Create the "CString:: str & json" functions.
constexpr
auto 	CString::str() const {
	return String(data(), len());
}
constexpr
auto 	CString::json() const {
	String x;
	x.expand(len() + 2);
	x.append_no_resize('"');
	x.concat_no_resize_r(data(), len());
	x.append_no_resize('"');
	return x.null_terminate();
}

// ---------------------------------------------------------
// Definitions for Pipe.

// Create the "Pipe::operator <<" with integral types function.
template <typename Cast> requires (!is_char<Cast>::value && is_integral<Cast>::value) constexpr
Pipe&	Pipe::operator <<(const Cast& x) {
	String y;
	y.concats_r(x);
	dump(y.m_arr, y.m_len);
	return *this;
}

// Create the "Pipe:: str & json" functions.
constexpr
auto 	Pipe::str() const {
	return String(data(), len());
}
constexpr
auto 	Pipe::json() const {
	String x;
	x.expand(len() + 2);
	x.append_no_resize('"');
	x.concat_no_resize_r(data(), len());
	x.append_no_resize('"');
	return x.null_terminate();
}

// ---------------------------------------------------------
// Definitions for Exception.

// Constructor from String err.
constexpr
Exception::Exception (const char* type, const String& err) :
m_type_id(internal::npos),
m_type(type),
m_err_id(internal::npos),
m_err(err.data(), err.len())
{
#if vlib_enable_trace == true
    m_trace.init();
#endif
}

// Constructor from String&& err.
constexpr
Exception::Exception (const char* type, String&& err) :
m_type_id(internal::npos),
m_type(type),
m_err_id(internal::npos)
{
    m_err.len() = err.len();
    m_err.capacity() = err.capacity();
    m_err.data() = err.data();
    err.data() = nullptr;
#if vlib_enable_trace == true
    m_trace.init();
#endif
}

// Create the "Exception" template args constructor.
template <typename Arg1, typename Arg2, typename... Args>
requires (!vlib::is_any_numeric<Arg1>::value || !vlib::is_any_numeric<Arg2>::value) // can not both be numerics.
constexpr
Exception::Exception(const char* type, const Arg1& arg1, const Arg2& arg2, Args&&... args) :
m_type_id(internal::npos),
m_type(type),
m_err_id(internal::npos)
{
    String str;
    str.concats_r(arg1, arg2, args...);
    m_err.len() = str.len();
    m_err.capacity() = str.capacity();
    m_err.data() = str.data();
    str.data() = nullptr;
#if vlib_enable_trace == true
    m_trace.init();
#endif
}

// Create the "Exception::dump" function.
void 	Exception::dump() {
    
    // Add exception.
    Pipe msg;
    msg << colors::bold;
    // if (parent() != nullptr) {
    //     msg << "[" << parent() << "] ";
    // }
    msg << colors::red << type();
    if (err() != nullptr) {
        msg << ':' << ' ' << colors::end << colors::bold << err() << colors::end << '\n';
    } else {
        msg << '.' << '\n';
    }
    
// Add trace.
#if vlib_enable_trace == true
    auto trace = this->trace();
    if (trace.m_arr != nullptr) {
        msg << trace.c_str() << '\n';
    }
#endif
    
	// Dump m_message.
	msg.null_terminate();
	vlib::err.dump(msg.data(), msg.len());

	//
}

// ---------------------------------------------------------
// Shortcuts.

namespace types { namespace shortcuts {

template <typename Type, typename Length = ullong>
using Array = 	vlib::Array<Type, Length>;
using String =		vlib::String;

}; 		// End namespace types.
}; 		// End namespace shortcuts.

// ---------------------------------------------------------
// End.

}; 		// End namespace vlib.

// To string.
// Can not be both inside namespace and in shortcuts.
// So do outside namespace as an exception.
/*     @docs {
 @chapter: casts
 @title: To string
 @type: String
 @description:
 Concatenate arg(s) to a `String`.
 @usage:
 #include <vlib/types.h>
 tostr("Hello", " ", "World!") ==> "Hello World!";
 tostr(true) ==> "true";
 tostr("Bool: ", true) ==> "Bool: true";
 tostr(1) ==> "1";
 tostr("Int: ", 1) ==> "Int: 1";
 tostr(0.1) ==> "0.100000";
 tostr("Double: ", 0.1) ==> "Double: 0.100000";
 tostr(1, " == ", 1, " = ", 1 == 1) ==> "1 == 1 = true";
 } */
template         <typename... Args> inline constexpr
vlib::String tostr(Args&&... args) {
    vlib::String value;
    value.concats_r(args...);
    return value;
}

#endif 	// End header.
