// Author: Daan van den Bergh
// Copyright: © 2022 Daan van den Bergh.

// Header.
#ifndef VLIB_PERFORMANCE_H
#define VLIB_PERFORMANCE_H

// Namespace vlib.
namespace vlib {

// ---------------------------------------------------------
// Daemon type.

/* 	@docs
	@chapter: System
	@title: SpeedTest
	@description:
		Speed object to test performance.
*/
struct SpeedTest {
	
	// ---------------------------------------------------------
	// Definitions.
	
	using 	This = 	 SpeedTest;
	
	// ---------------------------------------------------------
	// Attributes.
	
    Array<String> m_labels;
    Array<ullong> m_speeds;
	
	// ---------------------------------------------------------
	// Constructors.
	
	// Default constructor.
	constexpr
    SpeedTest() = default;
	
// Public.
public:
	
	// ---------------------------------------------------------
	// Public functions.
	
	// Get the timestamp.
	/* @docs
		@title: Time
		@description:
			Get the current timestamp.
	*/
	void 	start(const String& label) {
        m_labels.append(label);
        m_speeds.append(Date::get_mseconds());
	}
	
	// Add a speed mark.
	/* @docs
		@title: Add
		@description:
			Add a performance test.
	*/
	void    end() {
        m_speeds.last() = Date::get_mseconds() - m_speeds.last();
	}
	
	// Dump.
	/* @docs
		@title: Dump
		@description:
			Dump the performance test.
	*/
	void    dump() {
        m_labels.append("Total");
        ullong total = 0;
        for (auto& i: m_speeds) {
            total += i;
        }
        m_speeds.append(total);
        ullong max_len = 0;
        for (auto& i: m_labels) {
            if (i.len() > max_len) {
                max_len = i.len();
            }
        }
        for (auto& index: m_labels.indexes()) {
            vlib::out << m_labels[index] << ':';
            for (int i = 0; i < (int) (max_len - m_labels[index].len()); ++i) {
                vlib::out << ' ';
            }
            vlib::out << ' ' << float(m_speeds[index]) / 1000 << 's' << '.' << '\n';
        }
	}
	
};

// ---------------------------------------------------------
// Shortcuts.

namespace types { namespace shortcuts {

using SpeedTest =        vlib::SpeedTest;

}; 		// End namespace types.
}; 		// End namespace shortcuts.


// ---------------------------------------------------------
// End.

}; 		// End namespace vlib.
#endif 	// End header.
