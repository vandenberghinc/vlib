// Author: Daan van den Bergh
// Copyright: © 2022 Daan van den Bergh.

// Header.
#ifndef VLIB_PAIR_H
#define VLIB_PAIR_H

// Namespace vlib.
namespace vlib {

// Pair type.
// - Used for initializations and iterations.
template <typename Key, typename Value>
struct Pair {

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

// ---------------------------------------------------------
// Shortcuts.

namespace types { namespace shortcuts {

template <typename Key, typename Value>
using Pair =        vlib::Pair<Key, Value>;

}; 		// End namespace sockets.
}; 		// End namespace shortcuts.

// ---------------------------------------------------------
// End.

}; 		// End namespace vlib.
#endif 	// End header.
