// Author: Daan van den Bergh
// Copyright: © 2022 Daan van den Bergh.

// Header.
#ifndef VLIB_ITER_T_H
#define VLIB_ITER_T_H

// Namespace vlib.
namespace vlib {

// Namespace internal.
namespace internal {

// Null character.
constexpr char null_char = char();

// ---------------------------------------------------------
// Array.

// Namespace array.
namespace array {

// Normal teration type.
//  - Used for array pointers.
template <typename Type, typename Length = ullong>
struct normal_iter_t {

// Private.
private:

	// ---------------------------------------------------------
	// Attributes.

	const Type* 		m_arr;
	Length 				m_start;
	Length 				m_end;

// Public.
public:

	// ---------------------------------------------------------
	// Construct functions.

	// Construct.
	constexpr
	void construct	(const Length sindex, const Length eindex, const Type* arr) {
		m_arr = arr;
		m_start = sindex;
		m_end = eindex;
	}

	// ---------------------------------------------------------
	// Constructors.

	// Default constructor.
	constexpr
	normal_iter_t	() {}

	// Constructor from Type* with start & end index.
	constexpr
	normal_iter_t	(const Length sindex, const Length eindex, const Type* arr) : m_arr(arr), m_start(sindex), m_end(eindex) {}

	// ---------------------------------------------------------
	// Functions.

	// Get min & max.
	constexpr
	auto& 			min() const	{
		return m_start;
	}
	constexpr
	auto& 			max() const	{
		return m_end;
	}

	// Get the index.
	constexpr
	auto& 			index() const {
		return m_start;
	}

	// ---------------------------------------------------------
	// Iteration.

	// Start & end.
	constexpr
	auto& 			begin() const {
		return *this;
	}
	constexpr
	auto& 			end	() const {
		return *this;
	}

	// Operator "!=".
	constexpr
	bool		 	operator !=(const normal_iter_t&) {
		return m_start < m_end;
	}

	// Operator "*".
	constexpr
	auto&			operator *() const {
		return m_arr[m_start];
	}

	// Operator "++".
	constexpr
	auto& 			operator ++() {
		++m_start;
		return *this;
	}

	//
};

// Reversed teration type.
//  - Used for array pointers.
template <typename Type, typename Length = ullong>
struct reversed_iter_t {

// Private.
private:

	// ---------------------------------------------------------
	// Attributes.

	const Type* 		m_arr;
	Length 				m_index;
	Length 				m_start;
	Length 				m_end;
	bool 				m_stop;

// Public.
public:

	// ---------------------------------------------------------
	// Construct functions.

	// Construct.
	constexpr
	void construct	(const Length sindex, const Length eindex, const Type* arr) {
		m_arr = arr;
		m_index = eindex-1;
		m_start = sindex;
		m_end = eindex;
		m_stop = false;
	}

	// ---------------------------------------------------------
	// Constructors.

	// Default constructor.
	constexpr
	reversed_iter_t	() {}

	// Constructor from Type* with start & end index.
	constexpr
	reversed_iter_t	(const Length sindex, const Length eindex, const Type* arr) : m_arr(arr), m_index(eindex-1), m_start(sindex), m_end(eindex), m_stop(false) {}

	// ---------------------------------------------------------
	// Functions.

	// Get min & max.
	constexpr
	auto& 			min() const	{
		return m_start;
	}
	constexpr
	auto& 			max() const	{
		return m_end;
	}

	// Get the index.
	constexpr
	auto& 			index() const {
		return m_index;
	}

	// ---------------------------------------------------------
	// Iteration.

	// Start & end.
	constexpr
	auto& 			begin() const {
		return *this;
	}
	constexpr
	auto& 			end() const {
		return *this;
	}

	// Operator "!=".
	constexpr
	bool 			operator !=(const reversed_iter_t& x) const {
		return !m_stop && m_index >= x.m_start;
	}

	// Operator "*".
	constexpr
	auto& 			operator *() const {
		return m_arr[m_index];
	}

	// Operator "++".
	constexpr
	auto& 			operator ++() {
		if (m_index == 0) { m_stop = true; }
		--m_index;
		return *this;
	}

	//
};

// ---------------------------------------------------------
// Type definitions.

template <typename Iter, typename Type, typename Length = ullong>
struct 		iter_t {};

// Normal iter_t.
//  - Does not support negative indexes.
template <typename Type, typename Length>
struct 		iter_t<Forwards, Type, Length> : public normal_iter_t<Type, Length> {
	constexpr
	iter_t() : normal_iter_t<Type, Length>() {}
	constexpr
	iter_t(const Length sindex, const Length eindex, const Type* arr) : normal_iter_t<Type, Length>(sindex, eindex, arr) {}
	constexpr
	auto reverse() { return iter_t<Backwards, Type, Length>(this->m_start, this->m_end, this->m_arr); }
};

// Reversed iter_t.
//  - Does not support negative indexes.
template <typename Type, typename Length>
struct 		iter_t<Backwards, Type, Length> : public reversed_iter_t<Type, Length> {
	constexpr
	iter_t() : reversed_iter_t<Type, Length>() {}
	constexpr
	iter_t(const Length sindex, const Length eindex, const Type* arr) : reversed_iter_t<Type, Length>(sindex, eindex, arr) {}
	constexpr
	auto reverse() { return iter_t<Forwards, Type, Length>(this->m_start, this->m_end, this->m_arr); }
};

// End namespace array.
};

// ---------------------------------------------------------
// Code.

// Namespace code.
namespace code {

// Iteration struct.
//
// @BUG: Has a bug when a \n is present in a comment line.
//       Then the comment line gets terminated prematurely.
//       For example with the comment line: "// Handle the \n character"
//       Then the comments gets terminated too early.
//
struct iter_t {
public:

	// Aliases.
	using 			Length = 		ullong;

	// Attributes.
	const char* 	m_arr;
	Length 			index;
	Length 			m_len;
	bool 			m_is_str;
	short 			m_is_str_count;
	bool 			m_is_char;
	short 			m_is_char_count;
	bool 			m_is_comment;
	bool 			m_is_multi_line_comment;
	short 			m_new_comment_count;
    short 			m_new_scomment_count;
	int 			m_parentheses_depth;
	int 			m_brackets_depth;
	int 			m_curly_brackets_depth;
	int 			m_template_depth;
	char 			m_current;
	char 			m_prev; // previous char.
	char 			m_pprev;	// one before the previous char.
	char 			m_next;	// the next char.
	bool 			m_reversed;	// is reversed.

	// Initialize.
	constexpr
	iter_t	() {}
	constexpr
	iter_t	(
		Length 			sindex,				// the start index.
		Length 			eindex,				// the end index.
		const char* 	arr,				// the char array.
		bool 			reversed = false	// is m_reversedd.
	) :
	m_arr(arr),
	index(sindex),
	m_len(eindex),
	m_reversed(reversed)
	{
		set_defaults();
	}

	// Set the defaults.
	constexpr
	void set_defaults() {
		m_is_str = false;
		m_is_str_count = 0;
		m_is_char = false;
		m_is_char_count = 0;
		m_is_comment = false;
		m_is_multi_line_comment = false;
		m_new_comment_count = 0;
		m_new_scomment_count = 0;
		m_parentheses_depth = 0;
		m_brackets_depth = 0;
		m_curly_brackets_depth = 0;
		m_template_depth = 0;
	}

	// Start && end.
	constexpr
	auto& begin() const {
		return *this;
	}
	constexpr
	auto& end() const {
		return *this;
	}

	// Increment.
	constexpr
	auto& operator++() {
		++index;
		return *this;
	}

	// Next.
	constexpr
	void next_iter() {
		const Length& i = index;

		// Get current, next and previous char's.
		m_current = m_arr[i];
		switch (i) {
		case 0: {
			if (m_reversed) {
				m_prev = m_arr[i+1];
				m_pprev = m_arr[i+2];
				m_next = null_char;
			} else {
				m_prev = null_char;
				m_pprev = null_char;
				m_next = m_arr[i+1];
			}
			break;
		}
		case 1: {
			if (m_reversed) {
				m_prev = m_arr[i+1];
				m_pprev = m_arr[i+2];
				m_next = null_char;
			} else {
				m_prev = m_arr[i-1];
				m_pprev = null_char;
				m_next = m_arr[i+1];
			}
			break;
		}
		default:
			if (m_reversed) {
				m_prev = m_arr[i+1];
				m_pprev = m_arr[i+2];
				m_next = m_arr[i-1];
			} else {
				m_prev = m_arr[i-1];
				m_pprev = m_arr[i-2];
				m_next = m_arr[i+1];
			}
			break;
		}
        
		// Close comment.
		if (m_new_scomment_count > 0) {
			m_new_scomment_count -= 1;
			if (m_new_scomment_count == 0) {
				m_is_comment = false;
			}
		}
		if (m_new_comment_count > 0) {
			m_new_comment_count -= 1;
			if (m_new_comment_count == 0) {
				m_is_multi_line_comment = false;
			}
		}
		
		// Close string / char.
		if (m_is_str_count > 0) {
			m_is_str_count -= 1;
			if (m_is_str_count == 0){
				m_is_str = false;
			}
		}
		if (m_is_char_count > 0) {
			m_is_char_count -= 1;
			if (m_is_char_count == 0){
				m_is_char = false;
			}
		}
		
        // End of comment.
		if (m_is_comment && m_current == '\n') {
			m_new_scomment_count = 1;
		}
		else if  (m_is_multi_line_comment && ((!m_reversed && m_current == '*' && m_next == '/') || (m_reversed && m_current == '/' && m_next == '*'))) {
			m_new_comment_count = 2;
		}

        // Begin of comment.
        if (!m_is_str && !m_is_char) {
            if (m_current == '/' && m_next == '/') {
                m_is_comment = true;
            } else if ((!m_reversed && m_current == '/' && m_next == '*') || (m_reversed && m_current == '*' && m_next == '/')) {
                m_is_multi_line_comment = true;
            }
        }

        // No comments.
        if (!m_is_comment && !m_is_multi_line_comment) {
			
			// Open string / char.
            switch (m_current) { // && (m_prev != '\\' || (m_prev == '\\' && m_pprev == '\\'))
                case '"':
					if (m_is_char) { break; }
					else if (m_prev == '\\') { break; }
                    if (m_is_str) {
                        m_is_str_count = 1;
                    } else {
                        m_is_str = true;
                    }
                    break;
                case '\'':
					if (m_is_str) { break; }
					else if (m_prev == '\\') { break; }
                    if (m_is_char) {
                        m_is_char_count = 1;
                    } else {
                        m_is_char = true;
                    }
                    break;
                default: break;
            }
			
			// Increase / decrease depth of: "( ) [ ] < >".
			if (!m_is_str && !m_is_char) {
				switch (m_current) {
					case '(':
						m_parentheses_depth += 1;
						break;
					case ')':
						m_parentheses_depth -= 1;
						break;
					case '[':
						m_brackets_depth += 1;
						break;
					case ']':
						m_brackets_depth -= 1;
						break;
					case '{':
						m_curly_brackets_depth += 1;
						break;
					case '}':
						m_curly_brackets_depth -= 1;
						break;
					case '<':
						m_template_depth += 1;
						break;
					case '>':
						m_template_depth -= 1;
						break;
					default: break;
				}
			}
			
        }

	}

	// For return.
	constexpr
	auto& operator*() {
		next_iter();
		return *this;
	}

	// Equals char.
	constexpr friend
	bool operator ==(const iter_t& x, char y) {
		return x.m_current == y;
	}
	constexpr friend
	bool operator !=(const iter_t& x, char y) {
		return x.m_current != y;
	}
	
	// Stop.
	constexpr
	bool operator !=(const iter_t &x) const {
		return index < x.m_len;
	}

	// Get character.
	constexpr
    auto& prev() const {
		return m_prev;
	}
	constexpr
    auto& next() const {
		return m_next;
	}
	constexpr
    auto& character() const {
		return m_current;
	}

	// is a code character.
	constexpr
	bool is_code() const {
		return !m_is_str && !m_is_char && !m_is_comment && !m_is_multi_line_comment;
	}

	// is a space character.
	constexpr
	bool is_space() const {
		return vlib::is_space(m_current);
	}

	// is inside of comment.
	constexpr
	bool is_comment() const {
		return m_is_comment || m_is_multi_line_comment;
	}

	// is inside a string block.
	constexpr
	auto& is_str() const {
		return m_is_str;
	}

	// is inside a char block.
	constexpr
	auto& is_char() const {
		return m_is_char;
	}

	// inside depth.
	constexpr
	auto& parentheses_depth() const {
		return m_parentheses_depth;
	}
	constexpr
	auto& brackets_depth() const {
		return m_brackets_depth;
	}
	constexpr
	auto& curly_brackets_depth() const {
		return m_curly_brackets_depth;
	}
	constexpr
	auto& template_depth() const {
		return m_template_depth;
	}

	//
};

// End namespaces code & internal.
}; };

// ---------------------------------------------------------
// Instances.

// Is normal type.
template<typename Type> struct is_Forwards<vlib::internal::array::iter_t<Forwards, Type>> 			{ SICEBOOL value = true;   };

// Is reversed type.
template<typename Type> struct is_Backwards<vlib::internal::array::iter_t<Backwards, Type>> 		{ SICEBOOL value = true;   };

}; 		// End namespace vlib.
#endif 	// End header.

