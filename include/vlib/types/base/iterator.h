// Author: Daan van den Bergh
// Copyright: © 2022 Daan van den Bergh.

// Header.
#ifndef VLIB_ITERATOR_H
#define VLIB_ITERATOR_H

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

// Template.
template <typename Iter, typename Type, typename Length = ullong>
struct Iterator {};

// Normal teration type.
//  - Used for array pointers.
template <typename Type, typename Length>
struct Iterator<Forwards, Type, Length> {

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
	Iterator() = default;

	// Constructor from Type* with start & end index.
	constexpr
	Iterator(const Length sindex, const Length eindex, const Type* arr) : m_arr(arr), m_start(sindex), m_end(eindex) {}

	// ---------------------------------------------------------
	// Functions.

	// Get min & max.
	constexpr
	auto& 	min() const	{
		return m_start;
	}
	constexpr
	auto& 	max() const	{
		return m_end;
	}

	// Get the index.
	constexpr
	auto& 	index() const {
		return m_start;
	}

	// ---------------------------------------------------------
	// Iteration.

	// Start & end.
	constexpr
	auto& 	begin() const {
		return *this;
	}
	constexpr
	auto& 	end	() const {
		return *this;
	}

	// Operator "!=".
	constexpr
	bool	operator !=(const Iterator&) {
		return m_start < m_end;
	}

	// Operator "*".
	constexpr
	auto&	operator *() const {
		return m_arr[m_start];
	}

	// Operator "++".
	constexpr
	auto&	operator ++() {
		++m_start;
		return *this;
	}

	//
};

// Reversed teration type.
//  - Used for array pointers.
template <typename Type, typename Length>
struct Iterator<Backwards, Type, Length> {

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
	void 	construct(const Length sindex, const Length eindex, const Type* arr) {
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
	Iterator() = default;

	// Constructor from Type* with start & end index.
	constexpr
	Iterator(const Length sindex, const Length eindex, const Type* arr) : m_arr(arr), m_index(eindex-1), m_start(sindex), m_end(eindex), m_stop(false) {}

	// ---------------------------------------------------------
	// Functions.

	// Get min & max.
	constexpr
	auto&	min() const	{
		return m_start;
	}
	constexpr
	auto& 	max() const	{
		return m_end;
	}

	// Get the index.
	constexpr
	auto& 	index() const {
		return m_index;
	}

	// ---------------------------------------------------------
	// Iteration.

	// Start & end.
	constexpr
	auto& 	begin() const {
		return *this;
	}
	constexpr
	auto& 	end() const {
		return *this;
	}

	// Operator "!=".
	constexpr
	bool 	operator !=(const Iterator& x) const {
		return !m_stop && m_index >= x.m_start;
	}

	// Operator "*".
	constexpr
	auto& 	operator *() const {
		return m_arr[m_index];
	}

	// Operator "++".
	constexpr
	auto& 	operator ++() {
		if (m_index == 0) { m_stop = true; }
		--m_index;
		return *this;
	}

	//
};

// ---------------------------------------------------------
// Type definitions.

/*
 
template <typename Iter, typename Type, typename Length = ullong>
struct Iterator {};

// Normal Iterator.
//  - Does not support negative indexes.
template <typename Type, typename Length>
struct Iterator<Forwards, Type, Length> : public normal_Iterator<Type, Length> {
	constexpr
	Iterator() : normal_Iterator<Type, Length>() {}
	constexpr
	Iterator(const Length sindex, const Length eindex, const Type* arr) : normal_Iterator<Type, Length>(sindex, eindex, arr) {}
	constexpr
	auto reverse() { return Iterator<Backwards, Type, Length>(this->m_start, this->m_end, this->m_arr); }
};

// Reversed Iterator.
//  - Does not support negative indexes.
template <typename Type, typename Length>
struct Iterator<Backwards, Type, Length> : public reversed_Iterator<Type, Length> {
	constexpr
	Iterator() : reversed_Iterator<Type, Length>() {}
	constexpr
	Iterator(const Length sindex, const Length eindex, const Type* arr) : reversed_Iterator<Type, Length>(sindex, eindex, arr) {}
	constexpr
	auto reverse() { return Iterator<Forwards, Type, Length>(this->m_start, this->m_end, this->m_arr); }
};

*/

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
//		 Enable the line_by_line() and use File::get_line() to fix this.
//
struct Iterator {
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
	bool 			m_is_backtick;
	short 			m_is_backtick_count;
	bool 			m_is_comment;
	bool 			m_is_multi_line_comment;
	short 			m_new_comment_count;
    short 			m_new_scomment_count;
	short 			m_parentheses_depth;
	short 			m_brackets_depth;
	short 			m_curly_brackets_depth;
	short 			m_template_depth;
	char 			m_current;
	char 			m_prev; // previous char.
	char 			m_pprev;	// one before the previous char.
	char 			m_next;	// the next char.
	bool 			m_reversed;	// is reversed.
	bool			m_is_line_by_line = false;

	// Initialize.
	constexpr
	Iterator() = default;
	constexpr
	Iterator(
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
		m_is_backtick = false;
		m_is_backtick_count = 0;
		m_is_comment = false;
		m_is_multi_line_comment = false;
		m_new_comment_count = 0;
		m_new_scomment_count = 0;
		m_parentheses_depth = 0;
		m_brackets_depth = 0;
		m_curly_brackets_depth = 0;
		m_template_depth = 0;
	}
	
	// Assign data and keep the variables.
	// - Warning: causes undefined behaviour when parameter "data" goes out of scope.
	constexpr
	auto& assign(const char* data, const Length len, const Length index = 0) {
		m_arr = data;
		m_len = len;
		this->index = index;
		return *this;
	}
	
	// Get the line by line attribute.
	// - Used when iterating over the lines of a code file as a fix for the
	//   \n inside comment line bug.
	constexpr
	auto&	line_by_line() {
		return m_is_line_by_line;
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

		// Get current, next and previous char's.
		m_current = m_arr[index];
		switch (index) {
		case 0: {
			if (m_reversed) {
				m_prev = m_arr[index+1];
				m_pprev = m_arr[index+2];
				m_next = null_char;
			} else {
				m_prev = null_char;
				m_pprev = null_char;
				m_next = m_arr[index+1];
			}
			break;
		}
		case 1: {
			if (m_reversed) {
				m_prev = m_arr[index+1];
				m_pprev = m_arr[index+2];
				m_next = null_char;
			} else {
				m_prev = m_arr[index-1];
				m_pprev = null_char;
				m_next = m_arr[index+1];
			}
			break;
		}
		default:
			if (m_reversed) {
				m_prev = m_arr[index+1];
				m_pprev = m_arr[index+2];
				m_next = m_arr[index-1];
			} else {
				m_prev = m_arr[index-1];
				m_pprev = m_arr[index-2];
				m_next = m_arr[index+1];
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
		if (m_is_backtick_count > 0) {
			m_is_backtick_count -= 1;
			if (m_is_backtick_count == 0){
				m_is_backtick = false;
			}
		}
		
        // End of comment.
		if (m_is_comment && ((!m_is_line_by_line && m_current == '\n') || (m_is_line_by_line && index + 1 == m_len))) {
			m_new_scomment_count = 1;
			return ;
		}
		else if  (m_is_multi_line_comment && ((!m_reversed && m_current == '*' && m_next == '/') || (m_reversed && m_current == '/' && m_next == '*'))) {
			m_new_comment_count = 2;
			return ;
		}

        // Begin of comment.
        if (!m_is_str && !m_is_char && !m_is_backtick) {
            if (m_current == '/' && m_next == '/') {
                m_is_comment = true;
				return ;
            } else if ((!m_reversed && m_current == '/' && m_next == '*') || (m_reversed && m_current == '*' && m_next == '/')) {
                m_is_multi_line_comment = true;
				return ;
            }
        }

        // No comments.
        if (!m_is_comment && !m_is_multi_line_comment) {
			
			// Open string / char.
            switch (m_current) { // && (m_prev != '\\' || (m_prev == '\\' && m_pprev == '\\'))
                case '"':
					if (m_is_char || m_is_backtick) { break; }
					else if (m_prev == '\\' && m_pprev != '\\') { break; }
                    if (m_is_str) {
                        m_is_str_count = 1;
                    } else {
                        m_is_str = true;
                    }
					return ;
                case '\'':
					if (m_is_str || m_is_backtick) { break; }
					else if (m_prev == '\\' && m_pprev != '\\') { break; }
                    if (m_is_char) {
                        m_is_char_count = 1;
                    } else {
                        m_is_char = true;
                    }
					return ;
				case '`': // for js support.
					if (m_is_str || m_is_char) { break; }
					else if (m_prev == '\\' && m_pprev != '\\') { break; }
					if (m_is_backtick) {
						m_is_backtick_count = 1;
					} else {
						m_is_backtick = true;
					}
					return ;
                default: break;
            }
			
			// Increase / decrease depth of: "( ) [ ] < >".
			if (!m_is_str && !m_is_char && !m_is_backtick) {
				switch (m_current) {
					case '(':
						m_parentheses_depth += 1;
						return ;
					case ')':
						m_parentheses_depth -= 1;
						return ;
					case '[':
						m_brackets_depth += 1;
						return ;
					case ']':
						m_brackets_depth -= 1;
						return ;
					case '{':
						m_curly_brackets_depth += 1;
						return ;
					case '}':
						m_curly_brackets_depth -= 1;
						return ;
					case '<':
						m_template_depth += 1;
						return ;
					case '>':
						m_template_depth -= 1;
						return ;
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
	bool operator ==(const Iterator& x, char y) {
		return x.m_current == y;
	}
	constexpr friend
	bool operator !=(const Iterator& x, char y) {
		return x.m_current != y;
	}
	
	// Stop.
	constexpr
	bool operator !=(const Iterator &x) const {
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
		return !m_is_str && !m_is_char && !m_is_backtick && !m_is_comment && !m_is_multi_line_comment;
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
	bool is_any_str() const {
		return m_is_str || m_is_char || m_is_backtick;
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
	
	// is inside a backtick block.
	constexpr
	auto& is_backtick() const {
		return m_is_backtick;
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
template<typename Type> struct is_Forwards<vlib::internal::array::Iterator<Forwards, Type>> 			{ SICEBOOL value = true;   };

// Is reversed type.
template<typename Type> struct is_Backwards<vlib::internal::array::Iterator<Backwards, Type>> 		{ SICEBOOL value = true;   };

}; 		// End namespace vlib.
#endif 	// End header.

