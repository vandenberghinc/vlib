// Author: Daan van den Bergh
// Copyright: © 2022 Daan van den Bergh.
//
// DEPRECATED
//

// Header.
#ifndef VLIB_RESPONSE_T_H
#define VLIB_RESPONSE_T_H

// Namespace vlib.
namespace vlib {

// Response type.
/* 	@docs
	@chapter: System
	@title: Response
	@description:
		Response type
		- Status number 0 is reserved for a success response.
		- Status number -1 is reserved for an error response without a status.
		- A response type acts as a shared pointer for the internal attributes.
	@warning:
		Using the `Response(bool, const char*, int, Type*, Links*)` constructor directly will very easily cause undefined behaviour, use `vlib::success()` and `vlib::error()` instead.
	@usage:
		// Minimal example.
		auto somefunc() {
			// Success.
			if (...) {
				return vlib::success();
			}
			// Error. {
				return vlib::error();
			}
		}
		auto response = somefunc();
		if (response.success()) {
			...
		} else {
			...
		}
*/
template <typename Type = bool>
struct Response {
	
	// ---------------------------------------------------------
	// Aliases.

	using			This = 			Response;
	using 			Links =			ullong;

	// ---------------------------------------------------------
	// Attributes.

	bool			m_success;
	int				m_status;
	String* 			m_message;
	Type* 			m_value;
	Links*			m_links;	// links must be initialized when either m_message or m_value is initialized.

	// ---------------------------------------------------------
	// Construct functions.

	// Destruct.
	constexpr
	auto&	destruct() {
		if (m_links) {
			if (*m_links == 0) 	{
				delete m_message;
				m_message = nullptr;
				delete m_value;
				m_value = nullptr;
				delete m_links;
				m_links = nullptr;
			} else {
				--(*m_links);
				m_message = nullptr;
				m_value = nullptr;
				m_links = nullptr;
			}
		}
		return *this;
	}

	// Copy.
	constexpr
	auto&	copy(const This& obj) {
		if (this == &obj) { return *this; }
		m_success = obj.m_success;
		m_status = obj.m_status;
		destruct();
		if (obj.m_links) {
			m_message = obj.m_message;
			m_value = obj.m_value;
			m_links = obj.m_links;
			++(*m_links);
		}
		return *this;
	}

	// Swap.
	constexpr
	auto&	swap(This& obj) {
		if (this == &obj) { return *this; }
		m_success = obj.m_success;
		m_status = obj.m_status;
		destruct();
		m_message = obj.m_message;
		obj.m_message = nullptr;
		m_value = obj.m_value;
		obj.m_value = nullptr;
		m_links = obj.m_links;
		obj.m_links = nullptr;
		return *this;
	}

	// ---------------------------------------------------------
	// Constructors.

	// Default constructor.
	constexpr
	Response()
	:	m_success(true),
		m_status(-1),
		m_message(nullptr),
		m_value(nullptr),
		m_links(nullptr) {}

	// Constructor from bool.
	constexpr
	Response(bool success)
	:	m_success(success),
		m_status(success ? 0 : -1),
		m_message(nullptr),
		m_value(nullptr),
		m_links(nullptr) {}

	// Internal constructor.
	// - WARNING: For internal use only!
	constexpr
	Response(
		bool 		success,
		int 		error,
		String* 	message,
		Type* 		value,
		Links* 		links
	) :	m_success(success),
		m_status(error),
		m_message(message),
		m_value(value),
		m_links(links) {}

	// Copy constructor.
	constexpr
	Response(const This& obj)
	:	m_success(obj.m_success),
		m_status(obj.m_status),
		m_message(obj.m_message),
		m_value(obj.m_value),
		m_links(obj.m_links)
	{
		if (obj.m_links) { ++(*m_links); }
	}

	// Move constructor.
	constexpr
	Response(This&& obj)
	:	m_success(obj.m_success),
		m_status(obj.m_status),
		m_message(obj.m_message),
		m_value(obj.m_value),
		m_links(obj.m_links)
	{
		obj.m_message = nullptr;
		obj.m_value = nullptr;
		obj.m_links = nullptr;
	}

	// Desctructor.
	#if DESTRUCT_LOGS == 1
	~Response() {
		std::cout << "Destruct Response. \n";
		destruct();
	}
	#else
	constexpr
	~Response() {
		destruct();
	}
	#endif
	
	// ---------------------------------------------------------
	// Assignment operators.

	// Assignment operator from bool.
	constexpr
	auto&		operator =(bool success) {
		m_success = success;
		m_status = success ? 0 : -1;
		destruct();
	}

	// Copy assignment operator.
	constexpr
	auto&		operator =(const This& obj) { return copy(obj); }

	// Move assignment operator.
	constexpr
	auto&		operator =(This&& obj) { return swap(obj); }

	// ---------------------------------------------------------
	// Attribute functions.
	
	constexpr
	auto&	success() { return m_success; }
	constexpr
	auto&	status() { return m_status; }
	constexpr
	auto&	message() { return *m_message; }
	constexpr
	auto&	value() { return *m_value; }
	constexpr
	auto&	links() { return *m_links; }

	// ---------------------------------------------------------
	// Functions.

	// Check if the response has a message.
	constexpr
	bool	has_msg() { return m_message; }

	// Check if the response has a value.
	constexpr
	bool	has_value() { return m_value; }

	// Check if the response has links.
	constexpr
	bool	has_links() { return m_links; }

	// Reset all variables.
	constexpr
	auto&	reset() {
		m_success = true;
		m_status = 0;
		return destruct();
	}

	// ---------------------------------------------------------
	// Operators.

	constexpr
	auto& 	operator ==(bool x) const { return m_success == x; }
	constexpr
	auto& 	operator !=(bool x) const { return m_success != x; }
	constexpr
	auto 	operator !() const { return !m_success; }
	constexpr
	auto& 	operator *() const { return *m_value; }
	constexpr
	auto& 	operator ->() const { return m_value; }

	// Causes issues with assignment operators since you can also assign from a bool.
	// constexpr
	// operator bool() const { return m_success; }

};

// ---------------------------------------------------------
// Instances.

// Success responses.
template <typename Type = bool> constexpr
Response<Type> success() {
	return true;
}
template <typename Type = bool> constexpr
Response<Type> success(const char* msg) {
	return Response<Type> (
		true,
		0,
		new String (msg),
		nullptr,
		new ullong (0)
	);
}
template <typename Type = bool, typename Message> requires (
	is_Pipe<Message>::value ||
	is_CString<Message>::value ||
	is_String<Message>::value
) constexpr
Response<Type> success(const Message& msg) {
	return Response<Type> (
		true,
		0,
		new String (msg),
		nullptr,
		new ullong (0)
	);
}
template <typename Type = bool, typename Message> requires (
	is_Pipe<Message>::value ||
	// is_CString<Message>::value ||
	is_String<Message>::value
) constexpr
Response<Type> success(Message&& msg) {
	return Response<Type> (
		true,
		0,
		new String (msg),
		nullptr,
		new ullong (0)
	);
}
template <typename Type = bool> constexpr
Response<Type> success(const char* msg, const Type& value) {
	return Response<Type> (
		true,
		0,
		new String (msg),
		new Type (value),
		new ullong (0)
	);
}
template <typename Type = bool> constexpr
Response<Type> success(const char* msg, Type&& value) {
	return Response<Type> (
		true,
		0,
		new String (msg),
		new Type (value),
		new ullong (0)
	);
}
template <typename Type = bool, typename Message> requires (
	is_Pipe<Message>::value ||
	is_CString<Message>::value ||
	is_String<Message>::value
) constexpr
Response<Type> success(const Message& msg, const Type& value) {
	return Response<Type> (
		true,
		0,
		new String (msg),
		new Type (value),
		new ullong (0)
	);
}
template <typename Type = bool, typename Message> requires (
	is_Pipe<Message>::value ||
	// is_CString<Message>::value ||
	is_String<Message>::value
) constexpr
Response<Type> success(Message&& msg, const Type& value) {
	return Response<Type> (
		true,
		0,
		new String (msg),
		new Type (value),
		new ullong (0)
	);
}
template <typename Type = bool, typename Message> requires (
	is_Pipe<Message>::value ||
	is_CString<Message>::value ||
	is_String<Message>::value
) constexpr
Response<Type> success(const Message& msg, Type&& value) {
	return Response<Type> (
		true,
		0,
		new String (msg),
		new Type (value),
		new ullong (0)
	);
}
template <typename Type = bool, typename Message> requires (
	is_Pipe<Message>::value ||
	// is_CString<Message>::value ||
	is_String<Message>::value
) constexpr
Response<Type> success(Message&& msg, Type&& value) {
	return Response<Type> (
		true,
		0,
		new String (msg),
		new Type (value),
		new ullong (0)
	);
}
template <typename Type = bool> constexpr
Response<Type> success_without_msg(const Type& value) {
	return Response<Type> (
		true,
		0,
		nullptr,
		new Type (value),
		new ullong (0)
	);
}
template <typename Type = bool> constexpr
Response<Type> success_without_msg(Type&& value) {
	return Response<Type> (
		true,
		0,
		nullptr,
		new Type (value),
		new ullong (0)
	);
}

// Error responses.
template <typename Type = bool> constexpr
Response<Type> error() {
	return false;
}
template <typename Type = bool> constexpr
Response<Type> error(int status) {
	return Response<Type>(
		false,
		status,
		nullptr,
		nullptr,
		nullptr
	);
}
template <typename Type = bool> constexpr
Response<Type> error(const char* msg, int status = -1) {
	return Response<Type>(
		false,
		status,
		new String (msg),
		nullptr,
		new ullong (0)
	);
}
template <typename Type = bool, typename Message> requires (
	is_Pipe<Message>::value ||
	is_CString<Message>::value ||
	is_String<Message>::value
) constexpr
Response<Type> error(const Message& msg, int status = -1) {
	return Response<Type>(
		false,
		status,
		new String (msg),
		nullptr,
		new ullong (0)
	);
}
template <typename Type = bool, typename Message> requires (
	is_Pipe<Message>::value ||
	// is_CString<Message>::value ||
	is_String<Message>::value
) constexpr
Response<Type> error(Message&& msg, int status = -1) {
	return Response<Type>(
		false,
		status,
		new String (msg),
		nullptr,
		new ullong (0)
	);
}

// ---------------------------------------------------------
// Instances.

// Is type.
template<typename Type>							struct is_Response 								{ SICEBOOL value = false; };
template<typename Type> 						struct is_Response<Response<Type>> 						{ SICEBOOL value = true;  };

// ---------------------------------------------------------
// Shortcuts.

namespace types { namespace shortcuts {

template <typename Type>
using Response =		vlib::Response<Type>;

}; 		// End namespace sockets.
}; 		// End namespace shortcuts.

// ---------------------------------------------------------
// End.

}; 		// End namespace vlib.
#endif 	// End header.
