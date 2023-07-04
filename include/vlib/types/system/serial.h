// Author: Daan van den Bergh
// Copyright: © 2022 Daan van den Bergh.

// Header.
#ifndef VLIB_SERIAL_H
#define VLIB_SERIAL_H

// Includes.
#include <stdio.h>
#include <stdlib.h>
// #include <ioctl.h>
#include <sys/ioctl.h>
#include <fcntl.h>
#include <termios.h>
#include <unistd.h>
#include <stdio.h>
#include <errno.h>
#include <string.h>

// Default serial timeout.
#ifndef VLIB_SERIAL_TIMEOUT
#define VLIB_SERIAL_TIMEOUT 900000 // 15 minutes in milliseconds.
#endif

// Namespace vlib.
namespace vlib {

// ---------------------------------------------------------
// Process type
/*     @docs {
    @chapter: system
    @title: Serial
	@warning:
		Function family `read` is not thread safe when framing is enabled.
    @description:
        Serial port communication.
} */
struct Serial {

    // ---------------------------------------------------------
    // Aliases.
    
    using                     This =             Proc;
	
	// ---------------------------------------------------------
	// Attributes.
	
	String	port;
	Int		speed = 9600;
    // Int        min_read = 1;
	Int		min_read_wait = 0;
	Bool    framing = true;
	Int		fd = -1;
	
	// ---------------------------------------------------------
	// Private attributes.
	
	String  m_buff;
	
	// ---------------------------------------------------------
	// Functions.
	
	// Open.
	void	open() {
        // fd = ::open(port.c_str(), O_RDWR | O_NOCTTY | O_SYNC | O_NONBLOCK);
        if ((fd = ::open(port.c_str(), O_RDWR | O_NONBLOCK)) < 0) {
			throw SerialError(tostr("Unable to open serial port \"", port, "\" [", ::strerror(errno), "]."));
		}
	}
	
	// Configure.
	void 	configure() {
		
		// Check open.
		switch (fd.value()) {
			case -1:
				throw SerialError("Open the file descriptor first by calling \"open()\".");
			default:
				break;
		}
		
		/* Set up the control structure */
		struct termios toptions;
		
		/* Get currently set options for the tty */
		if (tcgetattr(fd.value(), &toptions) != 0) {
			throw SerialError(tostr("Unable to get the termios attributes of the file descriptor [", ::strerror(errno), "]."));
		}
		
		/* Set custom options */
		
		/* 9600 baud */
		cfsetispeed(&toptions, speed.value()); //B9600);
		cfsetospeed(&toptions, speed.value()); //B9600);
		/* 8 bits, no parity, no stop bits */
		toptions.c_cflag &= ~PARENB;
		toptions.c_cflag &= ~CSTOPB;
		toptions.c_cflag &= ~CSIZE;
		toptions.c_cflag |= CS8;
		/* no hardware flow control */
		toptions.c_cflag &= ~CRTSCTS;
		/* enable receiver, ignore status lines */
		toptions.c_cflag |= CREAD | CLOCAL;
		/* disable input/output flow control, disable restart chars */
		toptions.c_iflag &= ~(IXON | IXOFF | IXANY);
		/* disable canonical input, disable echo,
		 disable visually erase chars,
		 disable terminal-generated signals */
		toptions.c_lflag &= ~(ICANON | ECHO | ECHOE | ISIG);
		/* disable output processing */
		toptions.c_oflag &= ~OPOST;
		
		/* wait for 12 characters to come in before read returns */
		/* WARNING! THIS CAUSES THE read() TO BLOCK UNTIL ALL */
		/* CHARACTERS HAVE COME IN! */
        // toptions.c_cc[VMIN] = min_read.value();
		/* no minimum time to wait before read returns */
		toptions.c_cc[VTIME] = min_read_wait.value();
		// Set blocking.
		bool blocking = false;
		toptions.c_cc[VMIN]  = blocking ? 1 : 0;
		
		/* commit the options */
		if (tcsetattr(fd.value(), TCSANOW, &toptions) != 0) {
			throw SerialError(tostr("Unable to set the termios attributes of the file descriptor [", ::strerror(errno), "]."));
		}
	}
	
	// Flush all data in the serial buffer.
	void	flush() {
		switch (fd.value()) {
			case -1:
				throw SerialError("Open the file descriptor first by calling \"open()\".");
			default:
				break;
		}
		if (::tcflush(fd.value(), TCIFLUSH) != 0) {
			throw SerialError(tostr("Unable to flush the serial buffer [", ::strerror(errno), "]."));
		}
	}
	
	// Read.
	template <uint BuffLen = 128, typename... Air> constexpr
	void	read(String& data, const Int& timeout = VLIB_SERIAL_TIMEOUT) {
		
		// Check open.
		switch (fd.value()) {
			case -1:
				throw SerialError("Open the file descriptor first by calling \"open()\".");
			default:
				break;
		}
		
		// Vars.
		String tmp_data;
		ullong frame_len = NPos::npos, content_len = 0, content_index = 0, bytes = 0, start = Date::get_mseconds();
		
		// Check frame length.
		auto get_frame_len = [&]() {
			content_index = 0;
			for (auto& c: tmp_data) {
				switch (c) {
					case ':':
						++content_index;
						vlib::tonumeric_r(content_len, tmp_data.data(), content_index);
						frame_len = content_index + content_len;
						return ;
					default:
						++content_index;
						break;
				}
			}
		};
		
		// Check buff.
		if (m_buff.len() != 0) {
			tmp_data.concat_r(m_buff);
			m_buff.reset();
			get_frame_len();
		}
		
		// Read.
		tmp_data.resize(tmp_data.len() + BuffLen);
		while (frame_len == NPos::npos || tmp_data.len() < frame_len) {
			
			// Poll.
			// poll(fd, POLLIN, POLLIN, timeout);
			
			// Read.
			if ((int) (bytes = ::read(fd.value(), tmp_data.data() + tmp_data.len(), BuffLen)) == -1) {
                m_buff.concat_r(tmp_data);
				throw ReadError(tostr("Encountered an error while reading from the serial [", ::strerror(errno), "]."));
			} else if (bytes > 0) {
				tmp_data.len() += bytes;
				tmp_data.resize(tmp_data.len() + BuffLen);
			}
			
			// Check frame length.
			if (frame_len == NPos::npos && tmp_data.len() > 0) {
				get_frame_len();
			}
            
            // Timeout.
            if (timeout != -1 && (int) (Date::get_mseconds() - start) >= timeout) {
                m_buff.concat_r(tmp_data);
                throw TimeoutError("Operation timed out.");
            }
			
		}
		
		// Add overflow to buff.
		if (tmp_data.len() > frame_len) {
			m_buff.reset();
			m_buff.concat_r(tmp_data.data() + frame_len, tmp_data.len() - frame_len);
		}
		
		// Frame.
		data.concat_r(tmp_data.data() + content_index, content_len);
		
	}
	template <uint BuffLen = 128, typename... Air> constexpr
	String	read(const Int& timeout = VLIB_SERIAL_TIMEOUT) {
		String data;
		read(data, timeout);
		return data;
	}
	
	// Create frame.
	constexpr
	String	create_frame(const String& data) {
		String frame;
		frame.resize(data.len() + 64);
		frame.concats_r(data.len(), ':');
		frame.concat_r(data);
		return frame;
	}
	
	// Write.
	void	write(const String& data, const Int& timeout = VLIB_SERIAL_TIMEOUT) {
		
		// Check open.
		switch (fd.value()) {
			case -1:
				throw SerialError("Open the file descriptor first by calling \"open()\".");
			default:
				break;
		}
		
		// Write.
		String frame = create_frame(data);
		ullong written = 0, bytes = 0, start = Date::get_mseconds();
		while (written < frame.len()) {
			
			// Poll.
			// poll(fd, POLLOUT, POLLOUT, timeout);
			
			// Write.
			if ((int) (bytes = ::write(fd.value(), frame.data() + written, frame.len() - written)) == -1) {
				throw WriteError(tostr("Encountered an error while reading from the serial [", ::strerror(errno), "]."));
			} else if (bytes == 0) {
				throw WriteError(tostr("Encountered an error while reading from the serial [Written zero bytes]."));
			} else {
				written += bytes;
			}
            
            // Check timeout.
            if (timeout != -1 && (int) (Date::get_mseconds() - start) >= timeout) {
                throw TimeoutError("Operation timed out.");
            }
		}
	}
	
	// Close.
	void	close() {
		::close(fd.value());
	}
	
	// Poll.
	static inline
	void	 	poll(
		const Int&		fd,
		const Short&	events,
		const Short&	revents,
		const Int&		timeout = VLIB_SERIAL_TIMEOUT
	) {
		struct pollfd pfd {fd.value(), events.value(), 0};
		switch (::poll(&pfd, 1, timeout.value())) {
			case 0:
				throw TimeoutError("Operation timed out.");
			case -1:
				throw SerialError(tostr("Unknown poll error [", ::strerror(errno), "]."));
			default:
				if (pfd.revents & revents.value()) { return ; }
				else if (pfd.revents & POLLNVAL) {
					throw SerialError("File descriptor is not open.");
				}
				else if (pfd.revents & POLLERR) {
					throw SerialError("File descriptor is closed.");
				}
				else if (pfd.revents & POLLHUP) {
					throw SerialError("File descriptor is closed.");
				}
				else {
					throw SerialError("Unknown poll error.");
				}
		}
	}
};

// ---------------------------------------------------------
// End.

};         // End namespace vlib.
#endif     // End header.
