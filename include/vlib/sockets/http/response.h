// Author: Daan van den Bergh
// Copyright: © 2022 Daan van den Bergh.

// Header.
#ifndef VLIB_HTTP_RESPONSE_T_H
#define VLIB_HTTP_RESPONSE_T_H

// Namespace vlib.
namespace vlib {

// Namespace http.
namespace http {

// ---------------------------------------------------------
// HTTP response type.
//
// Notes:
//
// - Example first line of a response: "HTTP/1.1 200 OK".
//
// - A header key & pair has to be seperated by a ":" character.
//
// - A header has to be seperated by the CRLF ("\r\n").
//
// - Only supports HTTP versions [0.9, 1.0, 1.1].
//   HTTP/2 is currently not supported.
//   Requires an update in functions "parse()" to support new versions.
//
// - Only supports status codes that are included in "vlib::http::status".
//
/* @docs {
	@chapter: http
	@title: Response
	@description:
		HTTP response type.
	@notes:
		- Only supports HTTP versions [0.9, 1.0, 1.1]. HTTP/2 is currently not supported.
		- Only supports status codes that are included in "vlib::http::status".
	@usage:
		#include <vlib/sockets/http.h>
		vlib::http::Response response;
} */

struct Response {

// Private.
private:

	// ---------------------------------------------------------
	// Aliases.

	using 		This = 		Response;

	// ---------------------------------------------------------
	// Attributes.

	short 					m_version = vlib::http::version::undefined; // the http version.
	short 					m_status; 		// the http status code.
	SPtr<String>			m_status_desc;	// a shared pointer to the http status code description.
	short					m_content_type;	// the content type id.
	Headers				    m_headers;		// a shared pointer to the array of http header values.
	SPtr<String>			m_body;			// a shared pointer to http message body.
	SPtr<String>			m_data;			// a shared pointer to the entire request in string format.

	// ---------------------------------------------------------
	// Private functions.

	// Parse the data.
	// - Parsing the data does not reset the previously assigned attributes that are not present in the data.
	// - Only supports status codes that are included in "vlib::http::status"
	// - The parsing will cause undefined behaviour on of the following conditions:
	//   * The delimiter space characters are tabs instead of spaces.
	//   * The data contains multiple spaces in the first line.
	//   * The data contains multiple spaces after the key/value header delimiter (":").
	//   * The data contains one or multiple spaces after the header delimiter (CRLF) (":").
	//   * The method string is not comprised of uppercase characters.
	constexpr
	This& 	parse() {

		// Init / reset.
		if (!m_data) { return *this; }
		m_version = vlib::http::version::undefined;
		m_status = vlib::http::status::undefined;
		if (m_status_desc) { m_status_desc->reset(); }
		else { m_status_desc.init(); }
		m_content_type = vlib::http::content_type::undefined;
		if (!m_headers.is_undefined()) { m_headers.reset(); }
		if (m_body) { m_body->reset(); }
		else { m_body.init(); }

		// Variables.
		char*& 			data = m_data->data();
		const ullong& 	len = m_data->len();
		ullong 			start_index = 0;
		ullong 			index = 0;
		bool 			stop = false;

		// Is type variable.
		// - 0 for the 1th item of the first line.
		// - 1 for the 2th item of the first line
		// - 2 for the 3th item of the first line.
		ushort 	is_type = 0;

		// Iterate.
		for (; index < len; ++index) {
			switch (is_type) {

				// Is the first item of the first line.
				case 0: {
					switch (data[index]) {
						case ' ': {
							vlib::http::wrapper::parse_version(m_version, data, len, start_index);
							is_type = 1;
							start_index = index + 1;
							continue;
						}
						default: continue;
					}
				}

				// Is the second item of the first line.
				case 1: {
					switch (data[index]) {
						case ' ': {
							vlib::http::wrapper::parse_status(m_status, data, len, start_index);
							is_type = 2;
							start_index = index + 1;
							continue;
						}
						default: continue;
					}
				}

				// Is the third item of the first line.
				case 2: {
					switch (data[index]) {
						case '\n': {
							switch (data[index-1]) {
								case '\r': {
									m_status_desc.reconstruct_by_type_args(
										data + start_index,
										index - start_index - 1
									);
									start_index = index + 1;
									stop = true;
									break;
								}
								default: continue;
							}
							break;
						}
						default: continue;
					}
					break;
				}
				default: continue;
			}
			if (stop) { break; }
		}
		++index;
		vlib::http::wrapper::parse_headers_and_body(m_content_type, m_headers, m_body, m_data, index, start_index);

		// Handler.
		return *this;
	}

// Public.
public:

	// ---------------------------------------------------------
	// Construct functions.

	// Reconstructor from a data parse.
	constexpr
	auto&	reconstruct(const char* data, const ullong& len) {
		m_data->reconstruct(data, len);
		parse();
		return *this;
	}

	// Reconstructor from a data parse.
	constexpr
	auto&	reconstruct(const String& data) {
		m_data->copy(data);
		parse();
		return *this;
	}

	// Reconstructor from a data parse swap.
	constexpr
	auto&	reconstruct(String&& data) {
		m_data->swap(data);
		parse();
		return *this;
	}

	// Constructor from response attributes.
	constexpr
	auto& 	reconstruct(const short& version, const int& status, const Headers& headers) {
		add_version(version);
		add_status(status);
		add_headers(headers);
        // build();
		return *this;
	}
	constexpr
	auto& 	reconstruct(const short& version, const int& status, const Headers& headers, const String& body) {
		add_version(version);
		add_status(status);
		add_headers(headers);
		add_body(body);
        // build();
		return *this;
	}
	constexpr
	auto& 	reconstruct(const short& version, const int& status, const Headers& headers, const Json& body) {
		return reconstruct(version, status, headers, body.json());
	}

	// Copy.
	constexpr
	auto&	copy(const This& obj) {
		m_version = obj.m_version;
		m_status = obj.m_status;
		m_status_desc.copy(obj.m_status_desc);
		m_content_type = obj.m_content_type;
		m_headers.copy(obj.m_headers);
		m_body.copy(obj.m_body);
		m_data.copy(obj.m_data);
		return *this;
	}

	// Swap.
	constexpr
	auto&	swap(This& obj) {
		m_version = obj.m_version;
		m_status = obj.m_status;
		m_status_desc.swap(obj.m_status_desc);
		m_content_type = obj.m_content_type;
		m_headers.swap(obj.m_headers);
		m_body.swap(obj.m_body);
		m_data.swap(obj.m_data);
		return *this;
	}

	// ---------------------------------------------------------
	// Constructors.

	// Default constructor.
	constexpr
	Response () :
	m_data(String()) {}

	// Constructor from a data parse.
	/*  @docs {
		@title: Constructor
		@description:
			Construct a response from the client side in string format.
		@parameter: {
			@name: data
			@description: The request in string format.
		}
		@usage:
			vlib::String data;
			data << "HTTP/1.1 200 OK\r\n"
			data << "Retry-After:0\r\n"
			data << "Content-Type:application/json\r\n"
			data << "\r\n"
			data << "{\"success\":true,\"message\":\"Hello World!\"}"
	 
			vlib::http::Response response(data);
	} */
	constexpr
	Response (const String& data) :
	m_data(data)
	{ parse(); }
	constexpr
	Response (const char* data, const ullong& len) :
	m_data(String(data, len))
	{ parse(); }

	// Constructor from a data swap.
	constexpr
	Response (String&& data) :
	m_data(data)
	{ parse(); }

	// Constructor from response attributes.
	/*  @docs {
		@title: Constructor
		@description:
			Construct a response from the server side.
		@parameter: {
			@name: version
			@description: The used HTTP version, use `vlib::http::version::v1_1` etc.
		}
		@parameter: {
			@name: status
			@description: The response status, optionally use `vlib::http::status::success`.
		}
		@parameter: {
			@name: headers
			@description: The response headers.
		}
		@usage:
			vlib::http::Response response(
				vlib::http::version::v1_1,
				vlib::http::status::success,
				{{"Content-Type", "application/json"}}
			);
	} */
	constexpr
	Response (const short& version, const int& status, const Headers& headers) :
	m_data(String()) {
		reconstruct(version, status, headers);
	}
	/*  @docs {
		@title: Constructor
		@description:
			Construct a response from the server side.
		@parameter: {
			@name: version
			@description: The used HTTP version, use `vlib::http::version::v1_1` etc.
		}
		@parameter: {
			@name: status
			@description: The response status, optionally use `vlib::http::status::success`.
		}
		@parameter: {
			@name: headers
			@description: The response headers.
		}
		@parameter: {
			@name: body
			@description: The response body.
		}
		@usage:
			vlib::http::Response response(
				vlib::http::version::v1_1,
				vlib::http::status::success,
				{{"Retry-After", 10}},
				"Hello World!"
			);
	} */
	constexpr
	Response (const short& version, const int& status, const Headers& headers, const String& body) :
	m_data(String()) {
		reconstruct(version, status, headers, body);
	}
	Response (const short& version, const int& status, const Headers& headers, const Json& body) :
	m_data(String()) {
		reconstruct(version, status, headers, body);
	}

	// Copy constructor.
	constexpr
	Response (const This& obj) :
	m_version(obj.m_version),
	m_status(obj.m_status),
	m_status_desc(obj.m_status_desc),
	m_content_type(obj.m_content_type),
	m_headers(obj.m_headers),
	m_body(obj.m_body),
	m_data(obj.m_data) {}

	// Move constructor.
	constexpr
	Response (This&& obj) :
	m_version(obj.m_version),
	m_status(obj.m_status),
	m_status_desc(move(obj.m_status_desc)),
	m_content_type(obj.m_content_type),
	m_headers(move(obj.m_headers)),
	m_body(move(obj.m_body)),
	m_data(move(obj.m_data)) {}

	// ---------------------------------------------------------
	// Assignment operators.

	// Assignment operator from a data copy.
	constexpr
	auto&	operator =(const String& data) {
		if (m_data) { m_data->copy(data); }
		else { m_data = data; }
		return parse();
	}

	// Assignment operator from a data swap.
	constexpr
	auto&	operator =(String&& data) {
		if (m_data) { m_data->swap(data); }
		else { m_data = data; }
		return parse();
	}

	// Copy assignment operator.
	constexpr
	auto&	operator =(const This& obj) { return copy(obj); }

	// Move assignment operator.
	constexpr
	auto&	operator =(This&& obj) { return swap(obj); }


	// ---------------------------------------------------------
	// Attribute functions.

	// Version.
	/*  @docs {
		@title: Has version
		@type: bool
		@description:
			Check if the response has a defined version.
		@notes:
			- Only available when the response has been constructed through a data parse.
	} */
	constexpr
	bool 	has_version() const {
		return m_version != vlib::http::version::undefined;
	}
	/*  @docs {
		@title: Version
		@type: short
		@description:
			Get the HTTP version.
		@notes:
			- Only available when the response has been constructed through a data parse.
	} */
	constexpr
	auto& 	version() {
		return m_version;
	}
	constexpr
	auto& 	version() const {
		return m_version;
	}

	// Status.
	/*  @docs {
		@title: Has status
		@type: bool
		@description:
			Check if the response has a defined status.
		@notes:
			- Only available when the response has been constructed through a data parse.
	} */
	constexpr
	bool 	has_status() const {
		return m_status != vlib::http::status::undefined;
	}
	/*  @docs {
		@title: Status
		@type: short&
		@description:
			Get the HTTP status.
		@notes:
			- Only available when the response has been constructed through a data parse.
	} */
	constexpr
	auto& 	status() {
		return m_status;
	}
	constexpr
	auto& 	status() const {
		return m_status;
	}

	// Status description.
	/*  @docs {
		@title: Has status description
		@type: bool
		@description:
			Check if the response has a defined status description.
		@notes:
			- Only available when the response has been constructed through a data parse.
	} */
	constexpr
	bool 	has_status_desc() const {
		return m_status_desc && m_status_desc->is_defined();
	}
	/*  @docs {
		@title: Status description
		@type: String&
		@description:
			Get the HTTP status description.
		@notes:
			- Only available when the response has been constructed through a data parse.
	} */
	constexpr
	auto& 	status_desc() {
		return *m_status_desc;
	}
	constexpr
	auto& 	status_desc() const {
		return *m_status_desc;
	}

	// Status description.
	/*  @docs {
		@title: Has content type
		@type: bool
		@description:
			Check if the response has a defined content type.
		@notes:
			- Only available when the response has been constructed through a data parse.
	} */
	constexpr
	bool 	has_content_type() const {
		return m_content_type != http::content_type::undefined;
	}
	/*  @docs {
		@title: Content type
		@type: short&
		@description:
			Get the HTTP content type.
		@notes:
			- Only available when the response has been constructed through a data parse.
	} */
	constexpr
	auto& 	content_type() {
		return m_content_type;
	}
	constexpr
	auto& 	content_type() const {
		return m_content_type;
	}

	// Headers.
	/*  @docs {
		@title: Has headers
		@type: bool
		@description:
			Check if the response has defined headers.
		@notes:
			- Only available when the response has been constructed through a data parse.
	} */
	constexpr
	bool 	has_headers() const {
		return m_headers.len() != 0;
	}
	/*  @docs {
		@title: Headers
		@type: Headers&
		@description:
			Get the HTTP headers.
		@notes:
			- Only available when the response has been constructed through a data parse.
	} */
	constexpr
	auto& 	headers() {
		return m_headers;
	}
	constexpr
	auto& 	headers() const {
		return m_headers;
	}

	// Body.
	/*  @docs {
		@title: Has body
		@type: bool
		@description:
			Check if the response has a defined body.
		@notes:
			- Only available when the response has been constructed through a data parse.
	} */
	constexpr
	bool 	has_body() const {
		return m_body && m_body->is_defined();
	}
	/*  @docs {
		@title: Body
		@type: String&
		@description:
			Get the HTTP body.
		@notes:
			- Only available when the response has been constructed through a data parse.
	} */
	constexpr
	auto& 	body() {
		return *m_body;
	}
	constexpr
	auto& 	body() const {
		return *m_body;
	}
	
	/*  @docs {
		@title: JSON
		@type: Json
		@description:
			Get the body as `Json`.
	} */
	constexpr
	Json 	json() const {
		if (m_body) { return *m_body; }
		return Json();
	}
    
    /*  @docs {
        @title: JSON Array
        @description:
            Get the body as `Json`.
    } */
    constexpr
    JArray  jarray() const {
        if (m_body) { return Json::parse_brackets(m_body->data(), m_body->len()); }
        return JArray();
    }

	// Data.
	/*  @docs {
		@title: Has data
		@type: bool
		@description:
			Check if the response has a string representation data.
	} */
	constexpr
	bool 	has_data() const {
		return m_data.is_defined() && m_data->is_defined();
	}
	/*  @docs {
		@title: Data
		@type: String&
		@description:
			Get the string representation data.
	} */
	constexpr
	auto& 	data() {
        if (m_data.is_undefined() || m_data->is_undefined()) {
            build();
        }
		return *m_data;
	}
	constexpr
	auto& 	data() const {
        if (!m_data || m_data->is_undefined()) {
            throw InvalidUsageError("The response body has not yet been build and can not be build for a const object.");
        }
		return *m_data;
	}
	
	// ---------------------------------------------------------
	// Functions.

	// Reset.
	/*  @docs {
		@title: Reset
		@description: Reset all attributes.
	} */
	constexpr
	auto& 	reset() {
		m_version = vlib::http::version::undefined;
		m_status = vlib::http::status::undefined;
		m_status_desc->reset();
		m_headers.reset();
		m_body->reset();
		m_data->reset();
		return *this;
	}
    
    // Is defined.
    /*  @docs {
        @title: Is Defined
        @description: Check if the `Response` object is defined.
     } */
    constexpr
    Bool     is_defined() {
        return m_version != vlib::http::version::undefined;
    }
    
    // Is undefined.
    /*  @docs {
     @title: Is Undefined
     @description: Check if the `Response` object is undefined.
     } */
    constexpr
    Bool     is_undefined() {
        return m_version == vlib::http::version::undefined;
    }

	// Add a version to the data string.
	/*  @docs {
		@title: Add version
		@description: Add a HTTP version to the data string.
	} */
	constexpr
	This& 	add_version(const short& version) {
        m_version = version;
		return *this;
	}

	// Add a status to the data string.
	/*  @docs {
		@title: Add status
		@description: Add a status to the data string.
	} */
	constexpr
	This& 	add_status(const int& status) {
        m_status = status;
        m_status_desc = http::status::tostr(status);
		return *this;
	}

	// Add a header key & value to the data string.
	/*  @docs {
		@title: Add header
		@description: Add a header key & value to the data string.
		@notes:
			- Does not assign to the attribute `m_headers`.
		@funcs: 2
	} */
	constexpr
	This&	add_header(const String& key, const String& value) {
        m_headers.append(key, value);
		return *this;
	}
    constexpr
    This&    add_header(String&& key, String&& value) {
        m_headers.append(key, value);
        return *this;
    }
	
	// Add headers to the data string.
	/*  @docs {
		@title: Add headers
		@description: Add headers to the data string.
		@notes:
			- Does not assign to the attribute `m_headers`.
	} */
	constexpr
	This&	add_headers(const Headers& headers) {
		for (auto& i: headers.indexes()) {
			add_header(headers.key(i), headers.value(i));
		}
		return *this;
	}

	// Add a body to the data string.
	/*  @docs {
		@title: Add body
		@description: Add a body to the data string.
		@notes:
			- Automatically calls `add_end()`.
			- Does not assign to the attribute `m_body`.
		@funcs: 3
	} */
	constexpr
	This&	add_body(
		const String& 				body
	) {
        m_body = body;
		return *this;
	}
	constexpr
	This&	add_body(
		const Json& 				body
	) {
        m_body = body.json();
		return *this;
	}
	constexpr
	This&	add_body(
		const char* 				body,
		const ullong&	len
	) {
        m_body->reconstruct(body, len);
		return *this;
	}

	// Get a header value by key.
	/*  @docs {
		@title: Header
		@description: Get a header value by key.
		@funcs: 2
	} */
	constexpr
	auto&	header(const String& key) {
		return m_headers.value(key);
	}
	constexpr
	auto&	header(const char* key, const ullong& len) {
		return m_headers.value(key, len);
	}
    
    // Build the http response.
    constexpr
    This&   build() {
        m_data->reset();
        
        // Add version.
        m_data->expand(9);
        m_data->concat_no_resize_r(http::version::tostr(m_version));
        m_data->append_no_resize(' ');
        
        // Add status.
        m_data->expand(6);
        m_data->concat_no_resize_r(m_status);
        m_data->append_no_resize(' ');
        m_data->concat_r(*m_status_desc);
        m_data->expand(2);
        m_data->append_no_resize('\r');
        m_data->append_no_resize('\n');
        
        // Add headers.
        for (auto& i: m_headers.indexes()) {
            String &key = m_headers.key(i), &value = m_headers.value(i);
            vlib::http::wrapper::add_header(m_data, key.data(), key.len(), value.data(), value.len());
        }
        
        // Add body.
        if (m_body && m_body->is_defined()) {
            
            // Add content length header.
            String cont_len;
            cont_len << m_body->len();
            vlib::http::wrapper::add_header(m_data, "Content-Length", 14, cont_len.data(), cont_len.len());
            
            // Add body.
            vlib::http::wrapper::add_body(m_data, m_body->data(), m_body->len());
            
        // Add end crlf's.
        } else {
            m_data->expand(2);
            m_data->append_no_resize('\r');
            m_data->append_no_resize('\n');
            m_data->null_terminate();
        }
        
        // Null terminate.
        m_data->null_terminate();
        return *this;
    }
	
	// ---------------------------------------------------------
	// Static functions.
	
	// Receive from socket.
	// Only supports HTTP/1.1.
	template <typename Socket> SICE
	This 	receive(
		Socket& 	sock,
		const int&	timeout = -1
	) {
		
		// Vars.
		short mode = 0;
		This response;
		String received;
		ullong received_len = 0;
		ullong start_index = 0;
		ullong hkey_index = 0; // end index of header key.
		ullong body_start = 0, body_end = 0, body_len = 0;
		bool chunked = false;
		
		// Loop.
		bool loop = true;
		while (loop) {
			
			// Receive.
            sock.recv(received, timeout);
			auto& data = received.data();
			
			// Iterate new data.
			for (auto& index: received.indexes(received_len, received.len())) {
				switch (mode) {
					
				// HTTP Version.
				case 0:
					switch (data[index]) {
					case ' ':
						http::wrapper::parse_version(response.m_version, received.data(), received.len(), start_index);
						start_index = index + 1;
						mode = 1;
						continue;
					default:
						continue;
					}
					
				// Status code.
				case 1:
					switch (data[index]) {
					case ' ':
						http::wrapper::parse_status(response.m_status, received.data(), received.len(), start_index);
						start_index = index + 1;
						mode = 2;
						continue;
					default:
						continue;
					}
					
				// Status description.
				case 2:
					switch (data[index]) {
					case '\n':
						switch (data[index-1]) {
						case '\r':
							response.m_status_desc.reconstruct_by_type_args(
								data + start_index,
								index - start_index - 1
							);
							start_index = index + 1;
							mode = 3;
							continue;
						default:
							continue;
						}
					default:
						continue;
					}
					
				// Headers.
				case 3:
					switch (data[index]) {
					case ':':
						if (hkey_index == 0) {
							hkey_index = index;
						}
						continue;
					case '\n':
						switch (data[index-1]) {
						case '\r': {
							if (start_index + 1 == index) { // End of headers.
								body_start = index + 1;
								if (body_len != 0) {
									body_end = body_start + body_len - 1;
                                }
                                else if (!chunked) {
                                    loop = false;
                                    continue;
                                }
								mode = 4;
								continue;
							}
							while (data[start_index] == ' ') { ++start_index; }
							String key (data + start_index, hkey_index - start_index);
							ullong start = hkey_index + 1;
							while (data[start] == ' ') { ++start; }
							String value (data + start, index - start - 1);
							if (body_len == 0 && key.eq("Content-Length", 14)) {
								body_len = value.as<ullong>();
							}
							else if (!chunked && key.eq("Transfer-Encoding", 17) && value.eq("chunked", 7)) {
								chunked = true;
							}
							response.m_headers.keys().append(move(key));
							response.m_headers.values().append(move(value));
							start_index = index + 1;
							hkey_index = 0;
							continue;
						}
						default:
							continue;
						}
					default:
						continue;
					}
				
				// Body.
				case 4:
					
					// Chunked.
					if (chunked) {
						
						// Start of chunk.
						if (body_len == 0 && index + 1 != received.len()) {
							switch (data[index]) {
							case '\n':
								switch (data[index-1]) {
								case '\r':
									if (index < body_start) { continue; }
									body_len = from_hex(data + body_start, index - body_start - 1);
									// print("Slices: ", body_start, " ", index - body_start - 1, " ", String(data + body_start, index - body_start - 1));
									body_start = index + 1;
									body_end = body_start + body_len - 1;
									if (body_len == 0) {
										loop = false;
										continue;
									}
									if (response.m_body.is_undefined()) {
										response.m_body.init();
									}
								default:
									continue;
								}
							default:
								continue;
							}
						}
						
						// End of chunk.
						else if (body_len != 0 && index >= body_end) {
							response.m_body->concat_r(data + body_start, body_len);
							body_start = index + 3;
							body_len = 0;
							continue;
						}
					}
					
					// End of body by content-length.
					else if (body_len != 0 && index >= body_end) {
						response.m_body.reconstruct_by_type_args(data + body_start, body_len);
						loop = false;
						continue;
					}
                        
                    // No body.
                    else if (body_len == 0) {
                        loop = false;
                        continue;
                    }
                        
					// Continue.
					continue;
				}
			}
			// print("----------------------\n", received, "\n----------------------");
			// if (received_len == received.len()) {
			// 	break;
			// }
			received_len = received.len();
			
		}
		response.m_data = received;
		
		// Handler.
		return response;
	}

	// ---------------------------------------------------------
	// Operators.

	// Dump to pipe.
	constexpr friend
	auto& 	operator <<(Pipe pipe, const This& obj) {
		return pipe << *obj.m_data;
	}

};

// ---------------------------------------------------------
// Instances.

// Is type.
template<typename Type> 	struct is_Response 								{ SICEBOOL value = false; };
template<>				 	struct is_Response<http::Response>				{ SICEBOOL value = true;  };
template<>				 	struct is_Response<http::Response&> 			{ SICEBOOL value = true;  };
template<>				 	struct is_Response<http::Response&&> 			{ SICEBOOL value = true;  };
template<>				 	struct is_Response<const http::Response> 		{ SICEBOOL value = true;  };
template<>				 	struct is_Response<const http::Response&> 		{ SICEBOOL value = true;  };

// ---------------------------------------------------------
// Global functions.
// - Basically only for the "response / compressed_response" consistency.

// Return a response.
constexpr
auto	response(const int& version, const int& status, const http::Headers& headers) {
	return http::Response(version, status, headers);
}
constexpr
auto	response(const int& version, const int& status, const http::Headers& headers, const String& body) {
	return http::Response(version, status, headers, body);
}
constexpr
auto	response(const int& version, const int& status, const http::Headers& headers, const Json& body) {
	return http::Response(version, status, headers, body.json());
}

// Return a compressed response.
// - Only the body will be compressed.
// - When the compression fails, the request will be send uncompressed.
// - Warning: should not be used when the body contains sensitive information.
auto	compressed_response(const int& version, const int& status, const http::Headers& headers, const String& body) {
	return http::Response(version, status, headers, vlib::compress(body));
}
auto	compressed_response(const int& version, const int& status, const http::Headers& headers, const Json& body) {
	return http::Response(version, status, headers, vlib::compress(body.json()));
}

// ---------------------------------------------------------
// End.

}; 		// End namespace http.

// Shortcuts.
namespace shortcuts { namespace http {
using Response =		vlib::http::Response;
};};

}; 		// End namespace vlib.
#endif 	// End header.
