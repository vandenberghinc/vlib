// Author: Daan van den Bergh
// Copyright: © 2022 Daan van den Bergh.

// Header.
#ifndef VLIB_REGEX_H
#define VLIB_REGEX_H

// Namespace vlib.
namespace vlib {

// ---------------------------------------------------------
// Regex type.

struct Regex {
	
	
// Public.
public:
	
	// ---------------------------------------------------------
	// Structures.
	
	enum Options {
		i = (1u << 1), // ignore case.
		g = (1u << 2), // match all patterns instead of stopping after first match.
		m = (1u << 3), // multiline, when enabled ^ matches start of the line instead of start of the string and same for $ with the end of the line.
		s = (1u << 4), // makes the . include newlines.
		x = (1u << 5), // NOT SUPPORTED, ignore whitespace and allow comments.
		U = (1u << 6), // non greedy, capture as little as possible.
		A = (1u << 7), // NOT SUPPORTED, forces the pattern to match only at the start of the string.
		D = (1u << 8), // NOT SUPPORTED, forces the pattern to match only at the end of the string.
		X = (1u << 9), // NOT SUPPORTED.
	};
	
	struct Pattern {
		String 	chars; // allowed chars.
		String 	or_words; // words using the | or.
		Options opts;
		Int		match[2] = {0, 0};	// match times.
	};
	
// Private.
private:
	
	// ---------------------------------------------------------
	// Attributes.
	
	Array<Pattern> 	m_patterns;
	Options 		m_opts;
	
	// ---------------------------------------------------------
	// Private functions.
	
	// Check the next char for a special pattern.
	
	// Initialize patterns.
	void	init_patterns(const String& pattern) {
		m_patterns.reset();
		
		const char* data = pattern.data();
		const char null_char = '\0';
		for (auto& i: pattern.indexes()) {
			auto& next = i < pattern.len() ? data[i + 1] : null_char;
			switch (data[i]) {
				
				// Whitespace.
				case '\s':
					m_patterns.append({
						.chars = {' ', '\t', '\n'},
					});
					if (next == '')
					break;
			}
		}
		
	}
	
// Public.
public:
	
	// ---------------------------------------------------------
	// Constructors.
	
	// Default constructor.
	constexpr Regex() = default;
	
	// Constructor.
	constexpr
	Regex(const String& pattern, const Options& ops = {}) :
	m_opts(opts)
	{
		init_patterns(pattern);
	}

	// ---------------------------------------------------------
	// Functions.

};

// ---------------------------------------------------------
// End.

}; 		// End namespace vlib.
#endif 	// End header.
