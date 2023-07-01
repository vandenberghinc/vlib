// Author: Daan van den Bergh
// Copyright: © 2022 Daan van den Bergh.

// Header.
#ifndef VLIB_DICT_T_H
#define VLIB_DICT_T_H

// Namespace vlib.
namespace vlib {

// Pair type.
// - Used for initializations and iterations.
template <typename Key, typename Value>
class Pair {
public:

	// ---------------------------------------------------------
	// Aliases.

	using 		This = Pair;
    using       value_type = Value;

	// ---------------------------------------------------------
	// Attributes.

	Key 		m_key;
	Value 		m_value;

	// ---------------------------------------------------------
	// Constructors.

	// Default constructor.
	constexpr
	Pair	() {}

	// Constructor.
	constexpr
	Pair	(const Key& key, const Value& value) : m_key(key), m_value(value) {}
	constexpr
	Pair	(Key&& key, const Value& value) : m_key(key), m_value(value) {}
	constexpr
	Pair	(const Key& key, Value&& value) : m_key(key), m_value(value) {}
	constexpr
	Pair	(Key&& key, Value&& value) : m_key(key), m_value(value) {}

	// Copy constructor.
	constexpr
	Pair	(const This& obj) :
	m_key(obj.m_key),
	m_value(obj.m_value) {}

	// Move constructor.
	constexpr
	Pair	(This&& obj) :
	m_key(move(obj.m_key)),
	m_value(move(obj.m_value)) {}

	// ---------------------------------------------------------
	// Operators.

	// Copy assignment operator.
	constexpr
	auto& 	operator =(const This& obj) {
		m_key = obj.m_key;
		m_value = obj.m_value;
		return *this;
	}

	// Move assignment operator.
	constexpr
	auto& 	operator =(This&& obj) {
		m_key = move(obj.m_key);
		m_value = move(obj.m_value);
		return *this;
	}

	// Equals.
	constexpr friend
	auto 	operator ==(const This& obj, const This& x) {
		return obj.m_key == x.m_key && obj.m_value == x.m_value;
	}
	constexpr friend
	auto 	operator !=(const This& obj, const This& x) {
		return obj.m_key != x.m_key || obj.m_value != x.m_value;
	}

	//
};

// Dict requires clause.
#define VLIB_DICT_REQUIRES_CLAUSE requires ( \
(!is_CString<Key>::value && !is_CString<Value>::value) && \
(is_unsigned_numeric<Length>::value) && \
(is_Unique<Status>::value || is_Shared<Status>::value) \
)

// Dictionary type.
/*  @docs {
	@chapter: types
	@title: Dictionary
	@description:
		Dictionary type.
	@usage:
        #include <vlib/types.h>
		vlib::Dict<vlib::String, int> x ({
            {"A", 1},
            {"B", 2},
            {"C", 3},
        });
} */
// @TODO docs, some still have Array in usage.
template <
	typename Key,
	typename Value,
	typename Length = ullong,
	typename Status = Unique
> VLIB_DICT_REQUIRES_CLAUSE
struct Dict {

	// ---------------------------------------------------------
	// Aliases.

	using 		This = 			Dict;
	using 		Pair = 			vlib::Pair<Key, Value>;
	using 		KeyArray = 		Array<Key, Length>;
	using 		ValueArray = 	Array<Value, Length>;
	typedef 	Key				key_type;
	typedef 	Value			value_type;

	// ---------------------------------------------------------
	// Attributes.

	Ptr<KeyArray, Status> 	m_keys;
	Ptr<ValueArray, Status>	m_values;

	// ---------------------------------------------------------
	// Static attributes.

	static inline const char* id = "Dict";

	// ---------------------------------------------------------
	// Construct functions.

	// Construct from initializer list.
	constexpr
	auto& 	reconstruct(const std::initializer_list<Pair>& x) {
		if (m_keys) {
			m_keys->destruct();
		} else {
			m_keys.init();
		}
		if (m_values) {
			m_values->destruct();
		} else {
			m_values.init();
		}
		m_keys->resize(x.size());
		m_values->resize(x.size());
		for (auto& i: x) {
			m_keys->set(m_keys->len(), i.m_key);
			m_values->set(m_values->len(), i.m_value);
		}
		return *this;
	}

	// Copy.
	constexpr
	auto& 	copy(const This& obj) {
		m_keys.copy(obj.m_keys);
		m_values.copy(obj.m_values);
		return *this;
	}

	// Swap.
	/* @docs {
	  @title: Swap
	  @description:
			Swap dictionaries.
	  @usage:
			Dict<...> x = { ... };
			Dict<...> y;
			y.swap(x);
			x ==> {};
			y ==> { ... };
	} */
	constexpr
	auto& 	swap(This& obj) {
		if (this == &obj) { return *this; }
		m_keys.swap(obj.m_keys);
		m_values.swap(obj.m_values);
		return *this;
	}

	// Safely destruct the array.
	constexpr
	void 	destruct() {
		m_keys.destruct();
		m_values.destruct();
	}

	// ---------------------------------------------------------
	// Constructors.

	// Default constructor.
	constexpr
	Dict () :
	m_keys(KeyArray()),
	m_values(ValueArray()) {}
	
	// Constructor from initializer list.
	/*  @docs {
		@title: Constructor
		@description:
			Construct a `Dict` object.
		@usage:
			vlib::Dict<vlib::String, int> x ({
				{"A", 1},
				{"B", 2},
				{"C", 3},
			});
	} */
	constexpr
	Dict (const std::initializer_list<Pair>& x) :
	m_keys(KeyArray()),
	m_values(ValueArray())
	{
		m_keys->resize(x.size());
		m_values->resize(x.size());
		for (auto& i: x) {
			m_keys->set(m_keys->len(), move(i.m_key));
			m_values->set(m_values->len(), move(i.m_value));
		}
	}

	// Copy constructor from pointers.
	constexpr
	Dict (const Ptr<KeyArray, Status>& keys, const Ptr<ValueArray, Status>& values) :
	m_keys(keys),
	m_values(values) {}

	// Move constructor from pointers.
	constexpr
	Dict (Ptr<KeyArray, Status>&& keys, Ptr<ValueArray, Status>&& values) :
	m_keys(keys),
	m_values(values) {}

	// Copy constructor.
	constexpr
	Dict (const This& obj) :
	m_keys(obj.m_keys),
	m_values(obj.m_values) {}

	// Move constructor.
	constexpr
	Dict (This&& obj) :
	m_keys(move(obj.m_keys)),
	m_values(move(obj.m_values)) {}

	// ---------------------------------------------------------
	// Assignment operators.
	
	// Assignment operator from initializer list.
	constexpr
	auto&		operator =(const std::initializer_list<Pair>& x) {
		return reconstruct(x);
	}
	
	// Copy assignment operator.
	constexpr
	auto&		operator =(const This& x) {
		return copy(x);
	}

	// Move assignment operator.
	constexpr
	auto&		operator =(This&& x) {
		return swap(x);
	}

	// ---------------------------------------------------------
	// Functions.
	
	// Copy the data of the dictionary to a new dictionary.
	/* 	@docs {
		@title: Copy
		@description:
			Copy the data of the dictionary to a new dictionary.
	} */
	constexpr
	This 		copy() {
		return *this;
	}
	constexpr
	This 		copy() const {
		return *this;
	}

	// Reset all attributes.
	/* @docs {
	  @title: Reset
	  @description:
			Reset all attributes.
	  @usage:
			Array<char> x = "Hello World!";
			x.reset(); ==> ""
	} */
	constexpr
	auto& 		reset() {
		m_keys->reset();
		m_values->reset();
		return *this;
	}
	
	// Automatically resize an array to the required length.
	//  - Only resizes when required.
	/*  @docs {
		@title: Resize
		@description:
			Resize the dictionary to a required capacity.
	 
			Does not edit the length, only the capactity.
	} */
	constexpr
	auto&		resize(
		const Length	req_len = 1   		// the required alloc length.
	) {
		m_keys->resize(req_len);
		m_values->resize(req_len);
		return *this;
	}

	// Automatically expand an array to with a length.
	/*  @docs {
		@title: Expand
		@description:
			Expand the dictionary with a capacity.
	 
			Does not edit the length, only the capactity.
	} */
	constexpr
	auto&		expand(
		const Length 	with_len   			// the arrays length by reference. to expand alloc length with.
	) {
		m_keys->expand(with_len);
		m_values->expand(with_len);
		return *this;
	}
	
	// Is undefined.
	/* 	@docs {
		@title: Is undefined
		@description:
			Check if the object is undefined.
		@usage:
			Dict<...> x;
			x.is_undefined(); ==> true;
	} */
	constexpr
	bool 	is_undefined() const {
		return m_keys.is_undefined() || m_keys->is_undefined();
	}
	
	// Is defined.
	/* 	@docs {
		@title: Is defined
		@description:
			Check if the object is defined.
		@usage:
			Dict<...> x;
			x.is_undefined(); ==> false;
	} */
	constexpr
	bool 	is_defined() const {
		return m_keys->is_defined();
	}
	
	// Length.
	/* 	@docs {
		@title: Length
		@type: ullong&
		@description:
			Get the length of the dictionary.
	} */
	constexpr
	auto&	len() const {
		return m_keys->len();
	}
	
	// Allocated length.
	/* 	@docs {
		@title: Capacity
		@type: ullong&
		@description:
			Get the capacity of the dictionary.
	} */
	constexpr
	auto& 	capacity() const {
		return m_keys->m_capacity;
	}
	
	// Get a key by index.
	/* 	@docs {
		@title: Key
		@description:
			Get a key by index.
	} */
	constexpr
	Key& 	key(const Length index) {
		return m_keys->get(index);
	}
	constexpr
	Key& 	key(const Length index) const {
		return m_keys->get(index);
	}

	// Get a value by index.
	/* 	@docs {
		@title: Value
		@description:
			Get a value by index.
	} */
	constexpr
	Value& 	value(const Length index) requires (!is_any_integer<Key>::value) {
		return m_values->get(index);
	}
	constexpr
	Value& 	value(const Length index) const requires (!is_any_integer<Key>::value) {
		return m_values->get(index);
	}

	// Get a value by key.
	/* 	@docs {
		@title: Value
		@description:
			Get a value by key.
	} */
	constexpr
	Value& 	value(const Key& key) {
		for (auto& i: indexes()) {
			if (m_keys->get(i) == key) { return m_values->get(i); }
		}
		m_keys->append(key);
		m_values->append(Value());
		return m_values->last();
	}
	constexpr
	Value& 	value(const char* key, const Length len) requires (is_CString<Key>::value || is_String<Key>::value) {
		for (auto& i: indexes()) {
			if (m_keys->get(i).eq(key, len)) { return m_values->get(i); }
		}
		m_keys->append(Key(key, len));
		m_values->append(Value());
		return m_values->last();
	}
	constexpr
	Value& 	value(const Key& key) const {
		for (auto& i: indexes()) {
			if (m_keys->get(i) == key) { return m_values->get(i); }
		}
        throw KeyError(tostr("Key \"", key, "\" does not exist."));
	}
	constexpr
	const Value& 		value(const char* key, const Length len) const requires (is_CString<Key>::value || is_String<Key>::value) {
		for (auto& i: indexes()) {
			if (m_keys->get(i).eq(key, len)) { return m_values->get(i); }
		}
        throw KeyError(tostr("Key \"", key, "\" does not exist."));
	}

	// Set a key and value by index.
	/* @docs {
	  @title: Set
	  @description:
			Set a key and value by index.
			
			Automatically increments the length of the dictionary.
			
			Does not resize the dictionary (capacity).
			
			Does not support negative indexes.
			
			Causes segfaults when the index is out of range.
	  @usage:
			dict<String, String> x;
			x.expand(1);
			x.set(0, "my_key", "my_value"); ==> {"my_key": "my_value"};
	} */
	constexpr
	This&	set(
		const Length 		index,				// the requested index.
		const Key&			key,				// the key to assign.
		const Value&		value				// the value to assign.
	) {
		m_keys->set(index, key);
		m_values->set(index, value);
		return *this;
	}
	constexpr
	This&	set(
		const Length 		index,				// the requested index.
		Key&&				key,				// the key to assign.
		const Value&		value				// the value to assign.
	) {
		m_keys->set(index, key);
		m_values->set(index, value);
		return *this;
	}
	constexpr
	This&	set(
		const Length 		index,				// the requested index.
		const Key&			key,				// the key to assign.
		Value&&				value				// the value to assign.
	) {
		m_keys->set(index, key);
		m_values->set(index, value);
		return *this;
	}
	constexpr
	This&	set(
		const Length 		index,				// the requested index.
		Key&&				key,				// the key to assign.
		Value&&				value				// the value to assign.
	) {
		m_keys->set(index, key);
		m_values->set(index, value);
		return *this;
	}

	// First element.
	/*  @docs {
		@title: First
		@description: Get the first value of the dictionary.
		@warning: Will cause a segfault if the array's length is `0`.
	} */
	constexpr
	Value& 	first() const {
		return m_values->first();
	}

	// Last element.
	/*  @docs {
		@title: Last
		@description: Get the last value of the dictionary.
		@warning: Will cause a segfault if the array's length is `0`.
	} */
	constexpr
	Value& 	last() const {
		return m_values->last();
	}
	
	// Equals.
	/*  @docs {
		@title: Equals
		@description: Check if the dictionary is equal to another dictionary.
	} */
	constexpr
	bool 	eq(
		const This& 	obj				// the second array of the comparison.
	) const {
		return m_keys->eq(*obj.m_keys) && m_values->eq(*obj.m_values);
	}
	
	// Append item(s) to an array.
	//  - Make sure the key is not already appended.
	/*  @docs {
		@title: Append
		@description:
			Append a key and value to the dictionary.
		@warning:
			Causes undefined behaviour if the key is already present.
	} */
	constexpr
	This&	append(
		const Key& 		key,				// the key to append.
		const Value& 	value			// the key to append.
	) {
		m_keys->append(key);
		m_values->append(value);
		return *this;
	}
	constexpr
	This&	append(
		Key&&	 		key,				// the key to append.
		const Value& 	value			// the key to append.
	) {
		m_keys->append(key);
		m_values->append(value);
		return *this;
	}
	constexpr
	This&	append(
		const Key& 		key,				// the key to append.
		Value&&		 	value			// the key to append.
	) {
		m_keys->append(key);
		m_values->append(value);
		return *this;
	}
	constexpr
	This&	append(
		Key&&	 		key,				// the key to append.
		Value&& 		value			// the key to append.
	) {
		m_keys->append(key);
		m_values->append(value);
		return *this;
	}
	
	// Concat with another Dict.
	/* 	@docs {
		@title: Concatenate
		@description:
			Concatenate one or multiple dictoinaries.
	 
			Function `concat_r` updates the current dictionary, while `concat` creates a copy and concats the array with the copy.
		@usage:
			Array<int> a = {1, 2};
			Array<int> b = {3};
			a.concat_r(y); a ==> {1, 2, 3};
		@funcs: 2
	} */
	template <typename... Args> constexpr
	This&	concat_r(const This& obj, Args&&... args) {
        for (auto& index: obj.indexes()) {
            value(obj.key(index)) = obj.value(index);
        }
        return concat_r(args...);
	}
	template <typename... Args> constexpr
	This	concat(const This& obj, Args&&... args) const {
		return copy().concat_r(obj, args...);
	}
    constexpr
    This&    concat_r() { return *this; }
	
	// Remove a key & value by index.
	/* 	@docs {
		@title: Pop
		@description:
			Pop a key & value by index, optionally with a default return.
	 
			Returns the removed value when present.
		@warning:
			Will cause a segfault if the index is higher or equal to the array's length attribute.
		@funcs: 2
	} */
	constexpr
	Value 	pop(ullong index) requires (!is_ullong<Key>::value) {
		m_keys->pop(index);
		return m_values->pop(index);
	}
	constexpr
	Value	pop(ullong index, const Value& def) requires (!is_ullong<Key>::value) {
		m_keys->pop(index);
		return m_values->pop(index, def);
	}

	// Remove a key`` & value by key.
	/* 	@docs {
		@title: Pop
		@description:
			Pop a key & value by key, optionally with a default return.
	 
			Returns the removed value when present.
	 
			Throws a `KeyError` if the default return is not specified and the key does not exist.
		@funcs: 2
	} */
	constexpr
	Value	pop(const Key& key) {
		ullong i = m_keys->find(key);
		if (i == NPos::npos) {
			throw KeyError(tostr(
				 "Index \"",
				 i,
				 "\" is out of range, size is \"",
				 m_keys->len(),
				 "\"."
			));
		}
		m_keys->pop(i);
		return m_values->pop(i);
	}
	constexpr
	Value	pop(const Key& key, const Value& def) {
		ullong i = m_keys->find(key);
		if (i == NPos::npos) {
			return def;
		}
		m_keys->pop(i, def);
		return m_values->pop(i, def);
	}

	// Find the index of a key.
	/* 	@docs {
		@title: Find
		@description:
			Find the index of a key.
	} */
	constexpr
	ullong	find(const Key& key) const {
		return m_keys->find(key);
	}
	constexpr
	ullong 	find(const char* key, const Length len) const requires (is_CString<Key>::value || is_String<Key>::value) {
		for (auto& i: indexes()) {
			if (m_keys->get(i).eq(key, len)) { return i; }
		}
		return NPos::npos;
	}

	// Find the index of a value.
	/* 	@docs {
		@title: Find value
		@description:
			Find the index of a value.
	} */
	constexpr
	ullong 	find_value(const Value& value) const {
		return m_values->find(value);
	}
	constexpr
	ullong 	find_value(const char* value, const Length len) const requires (is_CString<Value>::value || is_String<Value>::value) {
		for (auto& i: indexes()) {
			if (m_values->get(i).eq(value, len)) { return i; }
		}
		return NPos::npos;
	}

	// Check if dictionary contains a key.
	/* 	@docs {
		@title: Contains
		@description:
			Check if dictionary contains a key.
		@usage:
			Dict<CString, int> x = {
				{"a", 0},
				{"b", 0}
			};
			x.contains("b") ==> true
			x.contains("c") ==> false
	} */
	constexpr
	bool 	contains(const Key& key) const {
		return m_keys->find(key) != NPos::npos;
	}
	constexpr
	bool 	contains(const char* key, const Length len) const requires (is_CString<Key>::value || is_String<Key>::value) {
		return find(key, len) != NPos::npos;
	}

	// Find the index of a value.
	/* @docs {
	  @title: Contains value
	  @description:
			Find the index of a value.
	  @usage:
			Dict<CString, int> x = {
				{"a", 13},
				{"b", 14}
			};
			x.contains_value(14) ==> true
			x.contains_value(15) ==> false
	} */
	constexpr
	bool 	contains_value(const Value& value) const {
		return m_values->find(value) != NPos::npos;
	}
	constexpr
	bool 	contains_value(const char* value, const Length len) const requires (is_CString<Value>::value || is_String<Value>::value) {
		return find_value(value, len) != NPos::npos;
	}
	
	// Slice the array.
	/* 	@docs {
		@title: Slice
		@description:
			Slice the dictionary by indexes.
	 
			Function `slice_r` updates the current dictionary, while `slice` creates a copy.
		@notes:
			Leave parameter `eindex` `0` to use the value of the length attribute.
	 
			Slices nothing when eiter `sindex` / `eindex` is out of range.
		@funcs: 2
	} */
	constexpr
	This& 	slice_r(ullong sindex, ullong eindex = NPos::npos) {
		m_keys->slice_r(sindex, eindex);
		m_values->slice_r(sindex, eindex);
		return *this;
	}
	constexpr
	This 	slice(ullong sindex, ullong eindex = NPos::npos) {
		return copy().slice_r(sindex, eindex);
	}
	
	// Replace item in array.
	/* 	@docs {
		@title: Replace
		@description:
			Replace a value with another value.
			
			Function `replace_r` updates the current dictionary, while `replace` creates a copy.
		@funcs: 2
	} */
	template <typename... Args> constexpr
	This& 		replace_r(
		const Value&			from,				// the from item.
		const Value&			to,					// the to item.
		Args&&... 			args 				// the arguments for "indexes()".
	) {
		m_values->replace_r(from, to, args...);
		return *this;
	}
	template <typename... Args> constexpr
	This 		replace(
		const Value&			from,				// the from item.
		const Value&			to,					// the to item.
		Args&&... 			args 				// the arguments for "indexes()".
	) {
		return copy().replace_r(from, to, args...);
	}

	// Sort helper.
	template <bool by_keys> constexpr
	void 		sort_h(This& obj, bool reversed = false) {

		// Create a new temporary string.
		obj.resize(m_keys->len());

		// Iterate.
		for (auto& i0: Range<Forwards>(0, m_keys->len())) {

			// Always add first item.
			if (obj.m_keys->len() == 0) {
				obj.append(m_keys->get(i0), m_values->get(i0));
			} else {

				// Iterate "x" to find the insert index.
				auto insert_index = NPos::npos;
				for (auto& i1: Range<Forwards>(0, obj.m_keys->len())) {
					if (
						(by_keys &&
						 ((!reversed && m_keys->get(i0) <= obj.m_keys->get(i1)) ||
						 (reversed && m_keys->get(i0) >= obj.m_keys->get(i1)))
						) ||
						(!by_keys &&
						 ((!reversed && m_values->get(i0) <= obj.m_values->get(i1)) ||
						 (reversed && m_values->get(i0) >= obj.m_values->get(i1)))
						)
					) {
						insert_index = i1;
						break;
					}
				}

				// Add to end.
				if (insert_index == npos) {
					obj.append(m_keys->get(i0), m_values->get(i0));
				}

				// Insert (automatically shifts the array).
				else {
					obj.m_keys->insert(insert_index, m_keys->get(i0));
					obj.m_values->insert(insert_index, m_values->get(i0));
				}

				//
			}
		}

		//
	}

	// Sort by keys.
	/* 	@docs {
		@title: Sort by keys
		@description:
			Sort the dictionary by keys.
	 
			Function `sort_r` updates the current dictionary, while `sort` creates a copy.
		@funcs: 2
	} */
	constexpr
	This& 	sort_r(bool reversed = false) {
		This obj;
		sort_h<true>(obj, reversed);
		return swap(obj);
	}
	constexpr
	This 	sort(bool reversed = false) {
		This obj;
		sort_h<true>(obj, reversed);
		return obj;
	}

	// Sort by values.
	/* 	@docs {
		@title: Sort by values
		@description:
			Sort the dictionary by values.
	 
			Function `sort_r` updates the current dictionary, while `sort` creates a copy.
		@funcs: 2
	} */
	constexpr
	This& 	sort_values_r(bool reversed = false) {
		This obj;
		sort_h<false>(obj, reversed);
		return swap(obj);
	}
	constexpr
	This 	sort_values(bool reversed = false) {
		This obj;
		sort_h<false>(obj, reversed);
		return obj;
	}
	
	// Reverse
	/* 	@docs {
		@title: Reverse
		@description:
			Reverse the dictionary.
		@usage:
			Dict<CString, int> x = {
				{"a", 1},
				{"b", 2}
			};
			x.reverse_r(); ==> {
				{"b", 2},
				{"a", 1}
			}
		@funcs: 2
	} */
	constexpr
	auto& 	reverse_r() {
		m_keys->reverse_r();
		m_values->reverse_r();
		return *this;
	}
	auto 	reverse() {
		return copy().reverse_r();
	}
	
	// Add.
	// @TODO

	// Subtract.
	// @TODO
	
	// Multiply.
	/* 	@docs {
		@title: Multiply
		@description:
			Multiply the dictionary.
	 
			Function `mult_r` updates the current dictionary, while `mult` creates a copy.
		@usage:
			Dict<int, int> x = {{0, 0}};
			x.mult_r(2); x ==> {{0, 0}, {0, 0}};
		@funcs: 2
	} */
	template <typename Numeric> requires (is_any_numeric<Numeric>::value || is_any_Numeric<Numeric>::value) constexpr
	This& 	mult_r(const Numeric& x) {
		m_keys->mult_r(x);
		m_values->mult_r(x);
		return *this;
	}
	template <typename Numeric> requires (is_any_numeric<Numeric>::value || is_any_Numeric<Numeric>::value) constexpr
	This 	mult(const Numeric& x) {
		return copy().mult_r(x);
	}
	
	// Divide.
	/* 	@docs {
		@title: Divide
		@description:
			Divide the dictionary.
	 
			Function `div_r` updates the current dictionary, while `div` creates a copy.
		@usage:
			Dict<int, int> x = {{0, 0}, {0, 0}};
			x.div_r(2); x ==> {{0, 0}};
		@funcs: 2
	} */
	template <typename Numeric> requires (is_any_numeric<Numeric>::value || is_any_Numeric<Numeric>::value) constexpr
	This&	div_r(const Numeric& x) {
		m_keys->div_r(x);
		m_values->div_r(x);
		return *this;
	}
	template <typename Numeric> requires (is_any_numeric<Numeric>::value || is_any_Numeric<Numeric>::value) constexpr
	This	div(const Numeric& x) {
		return copy().div_r(x);
	}
	
	// mod.
	/* 	@docs {
		@title: Modulo
		@description:
			Get the modulo of the dictionary.
	 
			Function `mod_r` updates the current dictionary, while `mod` creates a copy.
		@usage:
			Dict<int, int> x = {{0, 0}, {0, 0}, {0, 0}, {0, 0}, {0, 0}, {0, 0}, {0, 0}, {0, 0}, {0, 0}, {0, 0}};
			x.mod_r(3); x ==> {{0, 0}};
		@funcs: 2
	} */
	template <typename Numeric> requires (is_any_numeric<Numeric>::value || is_any_Numeric<Numeric>::value) constexpr
	This& 	mod_r(const Numeric& x) {
		m_keys->mod_r(x);
		m_values->mod_r(x);
		return *this;
	}
	template <typename Numeric> requires (is_any_numeric<Numeric>::value || is_any_Numeric<Numeric>::value) constexpr
	This	mod(const Numeric& x) {
		return copy().mod_r(x);
	}

	// Join helper's helper.
	// - With type: char* / const char*.
	template <typename Type> requires (
		// is_str<Type>::value ||
		is_cstr<Type>::value
	) SICE
	void join_h_h(Pipe& pipe, const Type& type) {
		pipe << '"' << type << '"';
	}
	// - With type: bool / any numeric / any pointer (not str/cstr).
	template <typename Type> requires (
		is_bool<Type>::value ||
		is_any_numeric<Type>::value ||
		(
			is_ptr<Type>::value &&
			// !is_str<Type>::value &&
			!is_cstr<Type>::value
		)
	) SICE
	void join_h_h(Pipe& pipe, const Type& type) {
		pipe << type;
	}
	// - With all remaining types.
	template <typename Type> requires (
		// !is_str<Type>::value &&
		!is_cstr<Type>::value &&
		!is_bool<Type>::value &&
		!is_any_numeric<Type>::value &&
		!is_ptr<Type>::value
	) SICE
	void join_h_h(Pipe& pipe, Type& type) {
		pipe << type.json();
	}
	template <typename Type> requires (
		// !is_str<Type>::value &&
		!is_cstr<Type>::value &&
		!is_bool<Type>::value &&
		!is_any_numeric<Type>::value &&
		!is_ptr<Type>::value
	) SICE
	void join_h_h(Pipe& pipe, const Type& type) {
		pipe << type.json();
	}

	// Join helper.
	constexpr
	void join_h(Pipe& pipe) const {
		pipe << '{';
		for (auto& i: indexes()) {
			join_h_h(pipe, m_keys->get(i));
			pipe << ':' << ' ';
			join_h_h(pipe, m_values->get(i));
			if (i < m_keys->len() - 1) { pipe << ',' << ' '; }
		}
		pipe << '}';
		pipe.null_terminate();
	}
	constexpr
	void join_no_space_h(Pipe& pipe) const {
		pipe << '{';
		for (auto& i: indexes()) {
			join_h_h(pipe, m_keys->get(i));
			pipe << ':';
			join_h_h(pipe, m_values->get(i));
			if (i < m_keys->len() - 1) { pipe << ','; }
		}
		pipe << '}';
		pipe.null_terminate();
	}

	// Static join helper with a template type as dictionary.
	// The template type must conform to the Dict attributes "m_keys & m_values".
	template <typename Dict> SICE
	void join_h(Pipe& pipe, Dict& dict) {
		pipe << '{';
		for (auto& i: dict.indexes()) {
			join_h_h(pipe, dict.m_keys->get(i));
			pipe << ':' << ' ';
			join_h_h(pipe, dict.m_values->get(i));
			if (i < dict.m_keys->len() - 1) { pipe << ',' << ' '; }
		}
		pipe << '}';
		pipe.null_terminate();
	}
	template <typename Dict> SICE
	void join_no_space_h(Pipe& pipe, Dict& dict) {
		pipe << '{';
		for (auto& i: dict.indexes()) {
			join_h_h(pipe, dict.m_keys->get(i));
			pipe << ':';
			join_h_h(pipe, dict.m_values->get(i));
			if (i < dict.m_keys->len() - 1) { pipe << ','; }
		}
		pipe << '}';
		pipe.null_terminate();
	}

	// Dump.
	/* 	@docs {
		@title: Join
		@description:
			Join the dictionary keys and values into a string.
	}*/
	constexpr
	String 	join() const {
		Pipe pipe;
		join_h(pipe);
		return pipe;
	}
    constexpr
    String  join_no_space() const {
        Pipe pipe;
        join_no_space_h(pipe);
        return pipe;
    }

	// Append parsed item.
	// - With type: bool.
	template <typename ArrayType, typename ArrayPointer> requires (is_bool<ArrayType>::value) SICE
	void 	append_parsed_item_h(
		ArrayPointer& 				ptr,
		const char*& 				arr,
		ullong&		 	item_start,
		ullong&
	) {
		switch (arr[item_start]) {
			case 'T':
			case 't': {
				ptr->append(true);
				break;
			}
			default: {
				ptr->append(false);
				break;
			}
		}
	}
	// - With type: any numeric.
	template <typename ArrayType, typename ArrayPointer> requires (is_any_numeric<ArrayType>::value) SICE
	void 	append_parsed_item_h(
		ArrayPointer& 				ptr,
		const char*& 				arr,
		ullong&		 	item_start,
		ullong&		 	item_end
	) {
		ptr->append(tonumeric<ArrayType>(arr + item_start, item_end - item_start));
	}
	// - With type: all other.
	template <typename ArrayType, typename ArrayPointer> requires (
		!is_bool<ArrayType>::value &&
		!is_any_numeric<ArrayType>::value
	) SICE
	void 	append_parsed_item_h(
		ArrayPointer& 				ptr,
		const char*& 				arr,
		ullong& 		item_start,
		ullong& 		item_end
	) {
		switch (arr[item_start]) {
			case '"': {
				++item_start;
				--item_end;
				ptr->append(ArrayType::parse(arr + item_start, item_end - item_start));
				break;
			}
			default: {
				ptr->append(ArrayType::parse(arr + item_start, item_end - item_start));
				break;
			}
		}
	}
	
	// Parse from json formatted const char*.
	static inline // do not place a constexpr tag since this will create a nasty llvm bug on linux.
	/* 	@docs {
		@title: Parse
		@description:
			Parse a json formatted dictionary from a `const char*`.
	}*/
	auto 	parse(const char* arr, ullong len) {
		
		// Checks.
		if (!arr || len < 2 || arr[0] != '{' || arr[len-1] != '}') {
			throw ParseError("A string representation of a dictionary must start with a \"{\" and end with a \"}\".");
		}

		// Variables.
		ullong 	key_start = 1; 				// start index of the new key.
		ullong 	key_end = 0; 				// end index of the new key.
		ullong 	value_start = 0; 			// start index of the new value.
		ullong 	value_end = 0; 				// end index of the new value.
		bool 				is_str = false; 			// is inside string.
		int 				depth = 0; 					// (curly) bracket depth.
		ullong 	index = 1;					// skip first curly bracket.
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
					case '\n':
					case '\t':
					case ' ': {
						if (index == key_start) { ++key_start; break; }
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

					// Found end of key.
					case ':': {
						switch (depth) {
							case 0: {
								key_end = index;
								value_start = index + 1;
								break;
							}
							default: break;
						}
						break;
					}

					// Found end of value by delimiter.
					case ',': {
						switch (depth) {
							case 0: {
								value_end = index;
								append_parsed_item_h<Key>(obj.m_keys, arr, key_start, key_end);
								append_parsed_item_h<Value>(obj.m_values, arr, value_start, value_end);
								key_start = index + 1;
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
			while (true) {
				switch (arr[value_end - 1]) {
					case ' ':
					case '\t':
					case '\n': { --value_end; continue; }
					default: break;
				}
				break;
			}
			append_parsed_item_h<Key>(obj.m_keys, arr, key_start, key_end);
			append_parsed_item_h<Value>(obj.m_values, arr, value_start, value_end);
		}
		return obj;
	}
	SICE
	auto 	parse(const char* arr) {
		return parse(arr, vlib::len(arr));
	}
	
	// Load a file.
	/* @docs {
		@title: Load
		@type: This&
		@description: Load from a file.
		@usage:
			Dict<...> x = Dict<...>::load("./mydict");
	}*/
	SICE
	auto 	load(const char* path) {
		char* data = nullptr;
		ullong len;
		switch (vlib::load(path, data, len)) {
		case file::error::open:
			throw OpenError(String() << "Unable to open file \"" << path << "\".");
		case file::error::read:
			throw ReadError(String() << "Unable to open file \"" << path << "\".");
		case file::error::write:
			throw WriteError(String() << "Unable to open file \"" << path << "\".");
		}
		if (len > 0 && data[len - 1] == '\n') {
			--len;
		}
		This obj(parse(data, len));
		delete[] data;
        return obj;
	}
	SICE
	auto 	load(const String& path) {
		return load(path.c_str());
	}

	// Save a file.
	/* @docs {
		@title: Save
		@type: This&
		@description: Save the dictionary to a file.
		@usage:
		    Dict<...> x = ...;
		    x.save("./mydict");
	}*/
	constexpr
	auto&	save(const char* path) const {
		Pipe pipe;
		join_no_space_h(pipe);
		String(move(pipe)).save(path);
		return *this;
	}
	constexpr
	auto&	save(const String& path) const {
		return save(path.c_str());
	}
	
	// Get the keys.
	/* 	@docs {
		@title: Keys
		@description: Get the keys array.
	} */
	auto& 	keys() const { return *m_keys; }

	// Get the values
	/* 	@docs {
		@title: Values
		@description: Get the values array.
	} */
	auto& 	values() const { return *m_values; }
	
	// ---------------------------------------------------------
	// Iterations.
    
    struct IterPair {
        Key* key;
        Value* value;
    };
    template <typename Mode>
    struct Iter {
        
        // Attributes.
        Key* m_keys;
        Value* m_values;
        IterPair m_pair;
        ullong m_start = 0;
        ullong m_end = 0;
        
        // Constructor.
        constexpr Iter (Key* keys, Value* values) :
        m_keys(keys),
        m_values(values)
        {}
        constexpr Iter (Key* keys, Value* values, ullong start) :
        m_keys(keys),
        m_values(values),
        m_start(start)
        {}
        constexpr Iter (Key* keys, Value* values, ullong start, ullong end) :
        m_keys(keys),
        m_values(values),
        m_start(start),
        m_end(end)
        {}
        
        // Functions.
        constexpr auto& begin () { return *this; }
        constexpr auto& end () { return *this; }
        
        // Forwards.
        constexpr bool operator !=(const Iter&) requires (is_Forwards<Mode>::value) {
            return m_start < m_end;
        }
        constexpr auto& operator *() requires (is_Forwards<Mode>::value) {
            m_pair.key = &m_keys[m_start];
            m_pair.value = &m_values[m_start];
            return m_pair;
        }
        constexpr auto& operator ++() requires (is_Forwards<Mode>::value) {
            ++m_start;
            return *this;
        }
        
        // Backwards.
        constexpr bool operator !=(const Iter&) requires (is_Backwards<Mode>::value) {
            return m_end > m_start;
        }
        constexpr auto& operator *() requires (is_Backwards<Mode>::value) {
            m_pair.key = &m_keys[m_end - 1];
            m_pair.value = &m_values[m_end - 1];
            return m_pair;
        }
        constexpr auto& operator ++() requires (is_Backwards<Mode>::value) {
            --m_end;
            return *this;
        }
        
    };

	// Iterate.
	/* 	@docs {
		@title: Iterate
		@description:
			Iterate from index till index.
		
			Optionally iterate the dictionary reversed.
		@usage:
			dic_t<...> x = ...;
			for (auto& [key, value]: x.iterate()) {
                print(*key, ": ", *value);
            }
            for (auto& [key, value]: x.iterate(1, 9)) { // iterate indexes 1 till 8.
                print(*key, ": ", *value);
            }
            for (auto& [key, value]: x.iterate<Backwards>()) {
                print(*key, ": ", *value);
            }
		@parameter: {
			@name: args
			@description: The arguments for `indexes()`.
		}
		@funcs: 2
	} */
	template <typename Iter = Forwards, typename... Args> requires (
        is_Forwards<Iter>::value ||
        is_Backwards<Iter>::value
    ) constexpr
	Dict::Iter<Iter>    iterate(Args&&... args) const {
        Dict::Iter<Iter> iter (m_keys->data(), m_values->data(), args...);
        if (iter.m_end == 0) {
            iter.m_end = m_keys->len();
        }
        return iter;
	}

	// Iterate indexes.
	/* 	@docs {
		@title: Indexes
		@description:
			Iterate the indexes from index till index.
	 
			Optionally iterate the indexes reversed.
	 
			The start and end indexes of a reversed iteration are just like a normal iteration, so index `0` is the first index.
		@usage:
			Array<int> x ({0, 1, 2, 3});
			for (auto& i: x.iterate(1, 2)) { ... }
		@funcs: 2
	} */
	template <typename Iter = Forwards, typename... Air> requires (is_Forwards<Iter>::value || is_Backwards<Iter>::value) constexpr
	auto 	indexes() const {
		return Range<Iter, Length>(0, m_keys->len());
	}
	template <typename Iter = Forwards, typename... Air> requires (is_Forwards<Iter>::value || is_Backwards<Iter>::value) constexpr
	auto 	indexes(const Len& sindex, const Len& eindex = NPos::npos) const {
		return Range<Iter, Length>(
			sindex.subscript(m_keys->len(), m_keys->len()),
			eindex.subscript(m_keys->len(), m_keys->len())
		);
	}

	// ---------------------------------------------------------
	// Casts.

	// As string.
	/* @docs {
		@title: String
		@description: Get the dictionary as a string.
		@usage:
			Dict<...> x = { ... };
			String y = x.str();
	} */
	constexpr
	String 	str() const {
		Pipe pipe;
		join_h(pipe);
		return pipe;
	}

	// As json formatted string.
	/* @docs {
		@title: JSON
		@description: Get the dictionary as json formatted string.
	} */
	constexpr
	String 	json() const {
		Pipe pipe;
		join_no_space_h(pipe);
		return pipe;
	}
	
	// ---------------------------------------------------------
	// Operators.
	
	// Operator "*".
	constexpr
	auto& 	operator *() const {
		return *m_values;
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

	// Compare array lengths.
	constexpr
	bool 	operator >(const This& x) const {
		return m_keys->len() > x.m_keys->len();
	}
	constexpr
	bool 	operator <(const This& x) const {
		return m_keys->len() < x.m_keys->len();
	}
	constexpr
	bool 	operator >=(const This& x) const {
		return m_keys->len() >= x.m_keys->len();
	}
	constexpr
	bool 	operator <=(const This& x) const {
		return m_keys->len() <= x.m_keys->len();
	}

	// Compare array lengths with any numeric.
	template <typename Numeric> requires (
		is_any_numeric<Numeric>::value ||
		is_any_Numeric<Numeric>::value
	) constexpr
	bool 	operator >(const Numeric& x) const {
		return m_keys->len() > abs<Length>(x);
	}
	template <typename Numeric> requires (
		is_any_numeric<Numeric>::value ||
		is_any_Numeric<Numeric>::value
	) constexpr
	bool 	operator <(const Numeric& x) const {
		return m_keys->len() < abs<Length>(x);
	}
	template <typename Numeric> requires (
		is_any_numeric<Numeric>::value ||
		is_any_Numeric<Numeric>::value
	) constexpr
	bool 	operator >=(const Numeric& x) const {
		return m_keys->len() >= abs<Length>(x);
	}
	template <typename Numeric> requires (
		is_any_numeric<Numeric>::value ||
		is_any_Numeric<Numeric>::value
	) constexpr
	bool 	operator <=(const Numeric& x) const {
		return m_keys->len() <= abs<Length>(x);
	}


	// Operators "+, ++, +=" with any numeric.
	constexpr
	auto& 	operator ++() {
		if (m_keys->len() == 0) { return *this; }
		++(*m_keys);
		++(*m_values);
		return *this;
	}
	constexpr
	auto& 	operator ++(int) {
		if (m_keys->len() == 0) { return *this; }
		++(*m_keys);
		++(*m_values);
		return *this;
	}
	template <typename Numeric> requires (
		is_any_numeric<Numeric>::value ||
		is_any_Numeric<Numeric>::value
	) constexpr
	auto 	operator +(const Numeric& x) const {
		if (m_keys->len() == 0) { return *this; }
		This obj (*this);
		(*obj.m_keys) += x;
		(*obj.m_values) += x;
		return obj;
	}
	template <typename Numeric> requires (
		is_any_numeric<Numeric>::value ||
		is_any_Numeric<Numeric>::value
	) constexpr
	auto& 	operator +=(const Numeric& x) {
		if (m_keys->len() == 0) { return *this; }
		(*m_keys) += x;
		(*m_values) += x;
		return *this;
	}

	// Operators "-, --, -=" with any numeric.
	constexpr
	auto& 	operator --() {
		if (m_keys->len() == 0) { return *this; }
		--(*m_keys);
		--(*m_values);
		return *this;
	}
	constexpr
	auto& 	operator --(int) {
		if (m_keys->len() == 0) { return *this; }
		--(*m_keys);
		--(*m_values);
		return *this;
	}
	template <typename Numeric> requires (
		is_any_numeric<Numeric>::value ||
		is_any_Numeric<Numeric>::value
	) constexpr
	auto 	operator -(const Numeric& x) const {
		if (m_keys->len() == 0) { return *this; }
		This obj (*this);
		(*obj.m_keys) -= x;
		(*obj.m_values) -= x;
		return obj;
	}
	template <typename Numeric> requires (
		is_any_numeric<Numeric>::value ||
		is_any_Numeric<Numeric>::value
	) constexpr
	auto& 	operator -=(const Numeric& x) {
		if (m_keys->len() == 0) { return *this; }
		(*m_keys) -= x;
		(*m_values) -= x;
		return *this;
	}

	// Operators "*, *=" with a memory type.
	constexpr
	auto	operator +(const This& x) const {
		return concat(x);
	}
	constexpr
	auto& 	operator +=(const This& x) {
		return concat_r(x);
	}
	
	// Operators "*, *=" with any numeric.
	template <typename Numeric> requires (
		is_any_numeric<Numeric>::value ||
		is_any_Numeric<Numeric>::value
	) constexpr
	auto	operator *(const Numeric& x) const {
		return mult(x);
	}
	template <typename Numeric> requires (
		is_any_numeric<Numeric>::value ||
		is_any_Numeric<Numeric>::value
	) constexpr
	auto& 	operator *=(const Numeric& x) {
		return mult_r(x);
	}

	// Operators "/, /=" with any numeric.
	template <typename Numeric> requires (
		is_any_numeric<Numeric>::value ||
		is_any_Numeric<Numeric>::value
	) constexpr
	auto	operator /(const Numeric& x) const {
		return div(x);
	}
	template <typename Numeric> requires (
		is_any_numeric<Numeric>::value ||
		is_any_Numeric<Numeric>::value
	) constexpr
	auto& 	operator /=(const Numeric& x) {
		return div_r(x);
	}

	// Operators "%, %=" with any numeric.
	template <typename Numeric> requires (
		is_any_numeric<Numeric>::value ||
		is_any_Numeric<Numeric>::value
	) constexpr
	auto	operator %(const Numeric& x) const {
		return mod(x);
	}
	template <typename Numeric> requires (
		is_any_numeric<Numeric>::value ||
		is_any_Numeric<Numeric>::value
	) constexpr
	auto& 	operator %=(const Numeric& x) {
		return mod_r(x);
	}
	
	// Get a key by index.
	/* @docs {
	  @title: operator[]
	  @description:
			Get a value by index.
			Throws an index error when the index is out of range.
	  @usage:
			Dict<String, String> x = {
				{"my_key", "Hello World!"}
			};
			x[0] ==> my_key
	} */
	constexpr
	auto& 	operator [](const Length index) requires (!is_any_integer<Key>::value) {
		return m_values->operator[](index);
	}

	// Get a value by key.
	/* @docs {
	  @title: operator[]
	  @description:
			Get a value by key.
			Creates a new value when the key is not present.
	  @usage:
			Dict<CString, CString> x = {
				{"my_key", "Hello World!"}
			};
			x["my_key"] ==> Hello World!
	} */
	constexpr
	auto& 	operator [](const Key& key) {
		for (auto& i: indexes()) {
			if (m_keys->get(i) == key) { return m_values->get(i); }
		}
		m_keys->append(key);
		m_values->append(Value());
		return m_values->last();
	}
	constexpr
	auto& 	operator [](const Key& key) const {
		for (auto& i: indexes()) {
			if (m_keys->get(i) == key) { return m_values->get(i); }
		}
		throw KeyError(tostr("Key \"", key, "\" does not exist."));
	}
	
	// Dump to pipe.
	constexpr friend
	auto&	operator <<(Pipe& pipe, const This& x) {
		x.join_h(pipe);
		return pipe;
	}

	//
};

// ---------------------------------------------------------
// Aliases.

template<typename Key, typename Value, typename Length = ullong>
using uDict = Dict<Key, Value, Length, Unique>;
template<typename Key, typename Value, typename Length = ullong>
using sDict = Dict<Key, Value, Length, Shared>;

// ---------------------------------------------------------
// Instances.

// Is instance.
template<typename Key, typename Value, typename Length, typename Status>
struct is_instance<Dict<Key, Value, Length, Status>, Dict<Key, Value, Length, Status>>	{ SICEBOOL value = true;  };

// Is type.
template<typename Type>
struct is_Dict 										{ SICEBOOL value = false; };
template<typename Key, typename Value, typename Length, typename Status>
struct is_Dict<Dict<Key, Value, Length, Status>> 	{ SICEBOOL value = true;  };

// ---------------------------------------------------------
// Shortcuts.

namespace shortcuts {
namespace types {

template <typename Key, typename Value>
using Pair =        vlib::Pair<Key, Value>;

template <typename Key, typename Value, typename Length = ullong, typename Status = Unique>
using Dict =		vlib::Dict<Key, Value, Length, Status>;
template <typename Key, typename Value, typename Length = ullong>
using uDict =		vlib::uDict<Key, Value, Length>;
template <typename Key, typename Value, typename Length = ullong>
using sDict =		vlib::sDict<Key, Value, Length>;

}; 		// End namespace sockets.
}; 		// End namespace shortcuts.

// ---------------------------------------------------------
// End.

}; 		// End namespace vlib.
#endif 	// End header.
