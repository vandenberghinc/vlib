// Author: Daan van den Bergh
// Copyright: © 2022 Daan van den Bergh.

// Header.
#ifndef VLIB_PTR_T_H
#define VLIB_PTR_T_H

// Namespace vlib.
namespace vlib {

// Pointer type.
/* 	@docs {
 *	@chapter: types
 *	@title: Pointer
 *	@description:
 *		Pointer type.
 *	@template: {
 *		@name: Type
 *		@description: The type of the pointee.
 *	}
 *	@template: {
 *		@name: Status
 *		@description: The shared or unique status. Use `Shared` for a shared pointer and use `Unique` for a unique pointer.
 *	}
 *	@usage:
 *	    #include <vlib/types.h>
 *		vlib::Ptr<int> x(0);
} */
template <
	typename Type,					// the pointee type.
	typename Status = Shared		// the shared status.
> requires (is_Unique<Status>::value || is_Shared<Status>::value)
struct Ptr {

// Private:
private:

	// ---------------------------------------------------------
	// Aliases.

	using 			This = 				Ptr;
	using 			Links =				ullong;

	// ---------------------------------------------------------
	// Attributes.

	Type*			m_ptr;
	Links*			m_links;

// Public:
public:

	// ---------------------------------------------------------
	// Constructors.

	// Default constructor.
	constexpr
	Ptr () requires (is_Unique<Status>::value) :
	m_ptr(nullptr) {}
	constexpr
	Ptr () requires (is_Shared<Status>::value) :
	m_ptr(nullptr),
	m_links(new Links (0)) {}

	// Type args constructor.
	//
	template <typename Arg_0, typename Arg_1, typename... Args> constexpr
	Ptr (const Arg_0& arg_0, const Arg_1& arg_1, Args&&... args) requires (is_Unique<Status>::value) :
	m_ptr(new Type(arg_0, arg_1, args...)) {}
	template <typename Arg_0, typename Arg_1, typename... Args> constexpr
	Ptr (Arg_0&& arg_0, Arg_1&& arg_1, Args&&... args) requires (is_Unique<Status>::value) :
	m_ptr(new Type(arg_0, arg_1, args...)) {}
	//
	template <typename Arg_0, typename Arg_1, typename... Args> constexpr
	Ptr (const Arg_0& arg_0, const Arg_1& arg_1, Args&&... args) requires (is_Shared<Status>::value) :
	m_ptr(new Type(arg_0, arg_1, args...)),
	m_links(new Links (0)) {}
	template <typename Arg_0, typename Arg_1, typename... Args> constexpr
	Ptr (Arg_0&& arg_0, Arg_1&& arg_1, Args&&... args) requires (is_Shared<Status>::value) :
	m_ptr(new Type(arg_0, arg_1, args...)),
	m_links(new Links (0)) {}

	// Type constructor.
	constexpr
	Ptr (Type x) requires (is_Unique<Status>::value) :
	m_ptr(new Type (move(x))) {}
	constexpr
	Ptr (Type x) requires (is_Shared<Status>::value) :
	m_ptr(new Type (move(x))),
	m_links(new Links (0)) {}

	// Copy constructor.
	constexpr
	Ptr (const This& obj) requires (is_Unique<Status>::value) :
	m_ptr(obj.m_ptr ? new Type (*obj.m_ptr) : nullptr) {}
	constexpr
	Ptr (const This& obj) requires (is_Shared<Status>::value) :
	m_ptr(obj.m_ptr),
	m_links(obj.m_links)
	{
		++(*m_links);
	}

	// Swap constructor.
	constexpr
	Ptr (This&& obj) requires (is_Unique<Status>::value) :
	m_ptr(obj.m_ptr)
	{
		obj.m_ptr = nullptr;
	}
	constexpr
	Ptr (This&& obj) requires (is_Shared<Status>::value) :
	m_ptr(obj.m_ptr),
	m_links(obj.m_links)
	{
		obj.m_ptr = nullptr;
		obj.m_links = new Links (0);
	}

	// Destructor.
	constexpr
	void 	final_destruct() requires (is_Unique<Status>::value) {
		delete m_ptr;
	}
	constexpr
	void 	final_destruct() requires (is_Shared<Status>::value) {
		if (*m_links == 0) 	{
			delete m_ptr;
			delete m_links;
		} else {
			--(*m_links);
		}
	}
	constexpr
	~Ptr () { final_destruct(); }

	// ---------------------------------------------------------
	// Assignment operators.

	// Assignment operator.
	constexpr
	auto&	operator =(const Type& x) {
		return reconstruct(x);
	}
	constexpr
	auto&	operator =(Type&& x) {
		return reconstruct(x);
	}

	// Copy assignment operator.
	constexpr
	auto&	operator =(const This& x) {
		return copy(x);
	}

	// Swap assignment operator.
	constexpr
	auto&	operator =(This&& x) {
		return swap(x);
	}
	
	// ---------------------------------------------------------
	// Utilities.

	// Initialize.
	/* 	@docs {
		@title: Initialize
		@description:
			Initialize the pointer.
		@warning:
			Causes a memory leak when the pointer is already initialized.
	} */
	constexpr
	This&	init() {
		m_ptr = new Type();
		return *this;
	}

	// Reconstructor from Type.
	/* 	@docs {
		@title: Reconstruct
		@description:
			Reconstruct the pointer.
	} */
	constexpr
	This& 	reconstruct(Type pointee) {
		if (m_ptr)	{ *m_ptr = move(pointee); }
		else 		{ m_ptr = new Type (move(pointee)); }
		return *this;
	}

	// Reconstruct by Type args.
	/* 	@docs {
		@title: Reconstruct
		@description:
			Reconstruct by type args.
	} */
	template <typename... Args> constexpr
	This& 	reconstruct_by_type_args(Args&&... args) requires (is_Unique<Status>::value) {
		if (m_ptr)	{ *m_ptr = move(Type(args...)); }
		else 		{ m_ptr = new Type (args...); }
		return *this;
	}
	template <typename... Args> constexpr
	This& 	reconstruct_by_type_args(Args&&... args) requires (is_Shared<Status>::value) {
		if (m_ptr)	{ *m_ptr = move(Type(args...)); }
		else 		{ m_ptr = new Type (args...); }
		// if (*m_links != 0) {
		// 	--(*m_links);
		// 	m_links = new Links(0);
		// }
		return *this;
	}

	// Copy.
	constexpr
	This& 	copy(const This& obj) requires (is_Unique<Status>::value) {
		if (this == &obj) { return *this; }
		delete m_ptr;
		if (obj.m_ptr) {
			m_ptr = new Type (*obj.m_ptr);
		} else {
			m_ptr = nullptr;
		}
		return *this;
	}
	constexpr
	This& 	copy(const This& obj) requires (is_Shared<Status>::value) {
		if (this == &obj) { return *this; }
		if (*m_links == 0) 	{
			delete m_ptr;
			delete m_links;
		} else {
			--(*m_links);
		}
		m_ptr = obj.m_ptr;
		m_links = obj.m_links;
		++(*m_links);
		return *this;
	}

	// Swap.
	constexpr
	This& 	swap(This& obj) requires (is_Unique<Status>::value) {
		if (this == &obj) { return *this; }
		delete m_ptr;
		m_ptr = obj.m_ptr;
		obj.m_ptr = nullptr;
		return *this;
	}
	constexpr
	This& 	swap(This& obj) requires (is_Shared<Status>::value) {
		if (this == &obj) { return *this; }
		if (*m_links == 0) 	{
			delete m_ptr;
			delete m_links;
		} else {
			--(*m_links);
		}
		m_ptr = obj.m_ptr;
		obj.m_ptr = nullptr;
		m_links = obj.m_links;
		obj.m_links = new Links (0);
		return *this;
	}
	constexpr
	This& 	swap(This&& obj) {
		return swap(obj);
	}

	// Destruct.
	/* 	@docs {
		@title: Destruct
		@description:
			Destruct the pointer.
	} */
	constexpr
	This& 	destruct() requires (is_Unique<Status>::value) {
		delete m_ptr;
		m_ptr = nullptr;
		return *this;
	}
	constexpr
	This& 	destruct() requires (is_Shared<Status>::value) {
		if (*m_links == 0) 	{
			delete m_ptr;
			m_ptr = nullptr;
			delete m_links;
			m_links = new Links(0);
		} else {
			--(*m_links);
			m_ptr = nullptr;
			m_links = new Links(0);
		}
		return *this;
	}

	// ---------------------------------------------------------
	// Functions.

	// Is undefined.
	/* 	@docs {
		@title: Is undefined
		@description:
			Check if the pointer is undefined.
	} */
	constexpr
	bool 	is_undefined() const { return m_ptr == nullptr; }

	// Is allocated.
	/* 	@docs {
		@title: Is defined
		@description:
			Check if the pointer is defined.
	} */
	constexpr
	bool 	is_defined() const { return m_ptr != nullptr; }

	// Is unique.
	/* 	@docs {
		@title: Is unique
		@description:
			Check if the pointer is unique.
	} */
	constexpr
	bool 	is_unqiue() const { return is_Unique<Status>::value; }

	// Is shared.
	/* 	@docs {
		@title: Is shared
		@description:
			Check if the pointer is shared.
	} */
	constexpr
	bool 	is_shared() const { return is_Shared<Status>::value; }

	// Links.
	/* 	@docs {
		@title: Links
		@description:
			Get the amount of shared links.
	} */
	constexpr
	auto 	links() const requires (is_Unique<Status>::value) {
		return 0;
	}
	constexpr
	auto& 	links() const requires (is_Shared<Status>::value) {
		return *m_links;
	}

	// Copy memory.
	/* 	@docs {
		@title: Copy
		@description:
			Make a copy of the pointer without any links between the objects.
	} */
	constexpr
	This 	copy() requires (is_Unique<Status>::value) {
		return *this;
	}
	constexpr
	This 	copy() const requires (is_Unique<Status>::value) {
		return *this;
	}
	constexpr
	This 	copy() requires (is_Shared<Status>::value) {
		This obj;
		if (m_ptr) {
			obj.m_ptr = new Type (*m_ptr);
			obj.m_links = new Links (0);
		}
		return obj;
	}
	constexpr
	This 	copy() const requires (is_Shared<Status>::value) {
		This obj;
		if (m_ptr) {
			obj.m_ptr = new Type (*m_ptr);
			obj.m_links = new Links (0);
		}
		return obj;
	}

	// Reset.
	/* 	@docs {
		@title: Reset
		@description:
			Reset all attributes.
	} */
	constexpr
	This& 	reset() {
		destruct();
		return *this;
	}

	// Length.
	// - Returns "0" when the pointer is unallocated.
	// - Returns "1" when the pointer is allocated.
	constexpr
	uint 	len() {
		if (!m_ptr) { return 0; }
		return 1;
	}

	// Get pointer as reference.
	/* 	@docs {
		@title: Pointer
		@description:
			Get the pointer by reference.
	} */
	constexpr
	auto& 	ptr() {
		return m_ptr;
	}
	constexpr
	auto& 	ptr() const {
		return m_ptr;
	}

	// Get pointee as reference.
	/* 	@docs {
		@title: Pointee
		@description:
			Get the pointee by reference.
	} */
	constexpr
	auto& 	pointee() {
        if (m_ptr == nullptr) {
            throw PointerError("Pointer is not allocated.");
        }
		return *m_ptr;
	}
	constexpr
	auto& 	pointee() const {
        if (m_ptr == nullptr) {
            throw PointerError("Pointer is not allocated.");
        }
		return *m_ptr;
	}

	// ---------------------------------------------------------
	// Operators.

	// Get pointee as reference.
	constexpr
	auto& 	operator->() {
		return m_ptr;
	}
	constexpr
	auto& 	operator->() const {
		return m_ptr;
	}
	constexpr
	auto& 	operator*() {
        if (m_ptr == nullptr) {
            throw PointerError("Pointer is not allocated.");
        }
		return *m_ptr;
	}
	constexpr
	auto& 	operator*() const {
        if (m_ptr == nullptr) {
            throw PointerError("Pointer is not allocated.");
        }
		return *m_ptr;
	}

	// Operators "==, !=".
	constexpr friend
	bool	operator ==(const This& obj, const Null&) {
		return obj.m_ptr == nullptr;
	}
	constexpr friend
	bool	operator !=(const This& obj, const Null&) {
		return obj.m_ptr != nullptr;
	}
	
	// Dump to pipe.
	constexpr friend
	This&	operator <<(This& pipe, const This& obj) {
		if (obj.m_ptr == nullptr) {
			return pipe << "nullptr";
		} else {
			return pipe << *obj.m_ptr;
		}
	}

	// ---------------------------------------------------------
	// Casts.

	// As String.
	constexpr
	auto 	str() const {
		return m_ptr->str();
	}

	// As json formatted String.
	constexpr
	auto 	json() const {
		return m_ptr->json();
	}

	// Is allocated.
	constexpr
	operator bool() const {
		return m_ptr;
	}

	//
};

// ---------------------------------------------------------
// Aliases.

template <typename Type>
using UPtr =		vlib::Ptr<Type, Unique>;
template <typename Type>
using SPtr =		vlib::Ptr<Type, Shared>;

// ---------------------------------------------------------
// Instances.

// Is instance.
template<typename Type, typename Status>
struct is_instance<Ptr<Type, Status>, Ptr<Type, Status>>		{ SICEBOOL value = true;  };

// Is type.
template<typename Type>
struct is_Ptr 								{ SICEBOOL value = false; };
template<typename Type, typename Status>
struct is_Ptr<Ptr<Type, Status>> 			{ SICEBOOL value = true;  };

// ---------------------------------------------------------
// Global functions.

// Create pointers.
template <class T, class... Args> auto unique_ptr(Args&&... args) { return Ptr<T, Unique>(args...); }
template <class T, class... Args> auto shared_ptr(Args&&... args) { return Ptr<T, Shared>(args...); }

// ---------------------------------------------------------
// Shortcuts.

namespace types { namespace shortcuts {

template <typename Type, typename Status = Shared>
using Ptr =		vlib::Ptr<Type, Status>;
template <typename Type>
using UPtr =		vlib::UPtr<Type>;
template <typename Type>
using SPtr =		vlib::SPtr<Type>;

}; 		// End namespace sockets.
}; 		// End namespace shortcuts.

// ---------------------------------------------------------
// End.

}; 		// End namespace vlib.
#endif 	// End header.
