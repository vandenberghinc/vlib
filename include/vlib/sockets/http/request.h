// Author: Daan van den Bergh
// Copyright: © 2022 Daan van den Bergh.

// Header.
#ifndef VLIB_HTTP_REQUEST_T_H
#define VLIB_HTTP_REQUEST_T_H

// Namespace vlib.
namespace vlib {

// Namespace http.
namespace http {

// ---------------------------------------------------------
// HTTP request type.
//
// Notes:
//
// - Example first line of a request: "GET /hello.html HTTP/1.1".
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
// - GET request parameters are by default passed in the payload body.
//   You can use the "Request" functions seperately to create a request that conforms to your wishes.
//
/* @docs
	@chapter: HTTP
	@title: Request
	@description:
		HTTP request type.
	@notes:
		- Only supports HTTP versions [0.9, 1.0, 1.1]. HTTP/2 is currently not supported.
		- Only supports status codes that are included in "vlib::http::status".
		- GET request parameters are by default passed in the payload body. You can use the "Request" functions seperately to create a request that conforms to your wishes.
	@usage:
		#include <vlib/sockets/http.h>
		vlib::http::Request request;
*/

struct Request {

// Public.
public:
	
	// ---------------------------------------------------------
	// Aliases.
	
	using 		This = 		Request;
	using 		Length = 	ullong;
	
	// ---------------------------------------------------------
	// Attributes.
	
	short 			m_version = vlib::http::version::undefined; 		// the http version.
	short 			m_method = vlib::http::method::undefined; 		// the http method.
	String			m_endpoint;		// a shared pointer to the http endpoint.
	short			m_content_type = vlib::http::content_type::undefined;	// the content type id.
	Headers			m_headers;		// a shared pointer to the headers.
	String			m_body;			// a shared pointer to http message body.
	String			m_data;			// a shared pointer to the entire request in string format.
	
	// ---------------------------------------------------------
	// Static attribute.
	
	SICE short type = 1; // 1 for request and 2 for response.

// Private.
private:

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
		reset();
		Parser parser (*this);
		parser.parse(m_data);
		return *this;
	}

// Public.
public:
	
	// ---------------------------------------------------------
	// Construct functions.

	// Reconstruct from string representation.
	constexpr
	This&	reconstruct(const String& data) {
		m_data = data;
		return parse();
	}
	constexpr
	This&	reconstruct(String&& data) {
		m_data = data;
		return parse();
	}

	// Reconstruct.
	constexpr
	auto& 	reconstruct(short method, const String& endpoint, const Headers& headers, short version = http::version::v1_1) {
		m_data.reset();
		add_method(method);
		add_endpoint(endpoint);
		add_version(version);
		add_headers(headers);
        // add_header("Content-Length", 14, "0", 1);
		add_end();
		return *this;
	}
	constexpr
	auto& 	reconstruct(short method, const String& endpoint, const Headers& headers, const String& body, short version = http::version::v1_1) {
		m_data.reset();
		add_method(method);
		add_endpoint(endpoint);
		add_version(version);
		add_headers(headers);
		String content_length;
		content_length << body.len();
		add_header("Content-Length", 14, content_length.data(), content_length.len());
		add_body(body);
		return *this;
	}
	constexpr
	auto& 	reconstruct(short method, const String& endpoint, const Headers& headers, const Json& params, short version = http::version::v1_1) {
		return reconstruct(method, endpoint, headers, params.json(), version);
	}

	// Copy.
	constexpr
	auto&	copy(const This& obj) {
		m_version = obj.m_version;
		m_method = obj.m_method;
		m_endpoint.copy(obj.m_endpoint);
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
		m_method = obj.m_method;
		m_endpoint.swap(obj.m_endpoint);
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
	Request () :
	m_data(String()) {}

	// Constructor from a data parse.
	/*  @docs
		@title: Constructor
		@description:
			Construct a request from the server side in string format.
		@parameter:
			@name: data
			@description: The request in string format.
		}
		@usage:
			vlib::String data;
			data << "GET /hello_world HTTP/1.1\r\n"
			data << "Content-Type:application/json\r\n"
			data << "\r\n"
	 
			vlib::http::Request request(data);
	*/
	constexpr
	Request (String data) :
	m_data(move(data))
	{ parse(); }
	constexpr
	Request (const char* data, ullong len) :
	m_data(String(data, len))
	{ parse(); }

	// Request constructor.
	/*  @docs
		@title: Constructor
		@description:
			Construct a request from the client side.
		@parameter:
			@name: method
			@description: The used HTTP method, use `vlib::http::method::get` etc.
		}
		@parameter:
			@name: endpoint
			@description: The endpoint subpath.
		}
		@parameter:
			@name: headers
			@description: The request headers.
		}
		@parameter:
			@name: version
			@description: The HTTP version, use `vlib::http::version::v1_1` etc.
		}
		@usage:
			vlib::http::Request request(
				vlib::http::method::get,
				"/",
				{{"Content-Type", "application/json"}},
				vlib::http::version::v1_1
			);
	*/
	constexpr
	Request (short method, const String& endpoint, const Headers& headers, short version = http::version::v1_1) :
	m_data(String())
	{
		reconstruct(method, endpoint, headers, version);
	}
	/*  @docs
		@title: Constructor
		@description:
			Construct a request from the client side.
		@parameter:
			@name: method
			@description: The used HTTP method, use `vlib::http::method::get` etc.
		}
		@parameter:
			@name: endpoint
			@description: The endpoint subpath.
		}
		@parameter:
			@name: headers
			@description: The request headers.
		}
		@parameter:
			@name: body
			@description: The request body.
		}
		@parameter:
			@name: version
			@description: The HTTP version, use `vlib::http::version::v1_1` etc.
		}
		@usage:
			vlib::http::Request request(
				vlib::http::method::post,
				"/",
				{{"Content-Type", "application/json"}},
				"Hello World!",
				vlib::http::version::v1_1
			);
	*/
	constexpr
	Request (short method, const String& endpoint, const Headers& headers, const String& body, short version = http::version::v1_1) :
	m_data(String())
	{
		reconstruct(method, endpoint, headers, body, version);
	}
	/*  @docs
		@title: Constructor
		@description:
			Construct a request from the client side.
		@parameter:
			@name: method
			@description: The used HTTP method, use `vlib::http::method::get` etc.
		}
		@parameter:
			@name: endpoint
			@description: The endpoint subpath.
		}
		@parameter:
			@name: headers
			@description: The request headers.
		}
		@parameter:
			@name: params
			@description: The request parameters.
		}
		@parameter:
			@name: version
			@description: The HTTP version, use `vlib::http::version::v1_1` etc.
		}
		@usage:
			vlib::http::Request request(
				vlib::http::method::post,
				"/",
				{{"Content-Type", "application/json"}},
				{{"a", "Hello World!"}},
				vlib::http::version::v1_1
			);
	*/
	constexpr
	Request (short method, const String& endpoint, const Headers& headers, const Json& params, short version = http::version::v1_1) :
	m_data(String())
	{
		reconstruct(method, endpoint, headers, params.json(), version);
	}
	
	// Copy constructor.
	constexpr
	Request (const This& obj) :
	m_version(obj.m_version),
	m_method(obj.m_method),
	m_endpoint(obj.m_endpoint),
	m_content_type(obj.m_content_type),
	m_headers(obj.m_headers),
	m_body(obj.m_body),
	m_data(obj.m_data) {}
	
	// Move constructor.
	constexpr
	Request (This&& obj) :
	m_version(obj.m_version),
	m_method(obj.m_method),
	m_endpoint(move(obj.m_endpoint)),
	m_content_type(obj.m_content_type),
	m_headers(move(obj.m_headers)),
	m_body(move(obj.m_body)),
	m_data(move(obj.m_data)) {}
	
	// ---------------------------------------------------------
	// Assignment operators.
	
	// Assignment operator from a data copy.
	constexpr
	auto&	operator =(const String& data) {
		m_data = data;
		return parse();
	}
	
	// Assignment operator from a data swap.
	constexpr
	auto&	operator =(String&& data) {
		m_data = data;
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
	/*  @docs
		@title: Has version
		@type: bool
		@description:
			Check if the request has a defined version.
		@notes:
			- Only available when the request has been constructed through a data parse.
	*/
	constexpr
	bool 	has_version() const {
		return m_version != vlib::http::version::undefined;
	}
	/*  @docs
		@title: Version
		@type: short&
		@description:
			Get the HTTP version.
		@notes:
			- Only available when the request has been constructed through a data parse.
	*/
	constexpr
	auto& 	version() {
		return m_version;
	}
	constexpr
	auto& 	version() const {
		return m_version;
	}
	
	// Method.
	/*  @docs
		@title: Has method
		@type: bool
		@description:
			Check if the request has a defined method.
		@notes:
			- Only available when the request has been constructed through a data parse.
	*/
	constexpr
	bool 	has_method() const {
		return m_method != vlib::http::method::undefined;
	}
	/*  @docs
		@title: Method
		@type: short&
		@description:
			Get the HTTP method.
		@notes:
			- Only available when the request has been constructed through a data parse.
	*/
	constexpr
	auto& 	method() {
		return m_method;
	}
	constexpr
	auto& 	method() const {
		return m_method;
	}

	// Endpoint.
	/*  @docs
		@title: Has endpoint
		@type: bool
		@description:
			Check if the request has a defined endpoint.
		@notes:
			- Only available when the request has been constructed through a data parse.
	*/
	constexpr
	bool 	has_endpoint() const {
		return m_endpoint.is_defined();
	}
	/*  @docs
		@title: Endpoint
		@type: String&
		@description:
			Get the HTTP endpoint.
		@notes:
			- Only available when the request has been constructed through a data parse.
	*/
	constexpr
	auto& 	endpoint() {
		return m_endpoint;
	}
	constexpr
	auto& 	endpoint() const {
		return m_endpoint;
	}

	// Status description.
	/*  @docs
		@title: Has content type
		@type: bool
		@description:
			Check if the request has a defined content type.
		@notes:
			- Only available when the request has been constructed through a data parse.
	*/
	constexpr
	bool 	has_content_type() const {
		return m_content_type != http::content_type::undefined;
	}
	/*  @docs
		@title: Content type
		@type: short&
		@description:
			Get the HTTP content type.
		@notes:
			- Only available when the request has been constructed through a data parse.
	*/
	constexpr
	auto& 	content_type() {
		return m_content_type;
	}
	constexpr
	auto& 	content_type() const {
		return m_content_type;
	}
	
	// Headers.
	/*  @docs
		@title: Has headers
		@type: bool
		@description:
			Check if the request has defined headers.
		@notes:
			- Only available when the request has been constructed through a data parse.
	*/
	constexpr
	bool 	has_headers() const {
		return m_headers.len() != 0;
	}
	/*  @docs
		@title: Headers
		@type: Headers&
		@description:
			Get the HTTP headers.
		@notes:
			- Only available when the request has been constructed through a data parse.
	*/
	constexpr
	auto& 	headers() {
		return m_headers;
	}
	constexpr
	auto& 	headers() const {
		return m_headers;
	}
	
	// Body.
	/*  @docs
		@title: Has body
		@type: bool
		@description:
			Check if the request has a defined body.
		@notes:
			- Only available when the request has been constructed through a data parse.
	*/
	constexpr
	bool 	has_body() const {
		return m_body.is_defined();
	}
	/*  @docs
		@title: Body
		@type: String&
		@description:
			Get the HTTP body.
		@notes:
			- Only available when the request has been constructed through a data parse.
	*/
	constexpr
	auto& 	body() {
		return m_body;
	}
	constexpr
	auto& 	body() const {
		return m_body;
	}
	
	// Data.
	/*  @docs
		@title: Has data
		@type: bool
		@description:
			Check if the request has a string representation data.
	*/
	constexpr
	bool 	has_data() const {
		return m_data.is_defined();
	}
	/*  @docs
		@title: Data
		@type: String&
		@description:
			Get the string representation data.
	*/
	constexpr
	auto& 	data() {
		return m_data;
	}
	constexpr
	auto& 	data() const {
		return m_data;
	}
	
	// ---------------------------------------------------------
	// Functions.
	
	// Reset.
	/*  @docs
		@title: Reset
		@description: Reset all attributes.
	*/
	constexpr
	This& 	reset() {
		m_version = vlib::http::version::undefined;
		m_method = vlib::http::method::undefined;
		m_endpoint.reset();
		m_headers.reset();
		m_body.reset();
		m_data.reset();
		return *this;
	}
	
	// Add a method to the data string.
	/*  @docs
		@title: Add method
		@description: Add a method to the data string.
		@notes:
			- Does not assign to the attribute `m_method`.
	*/
	constexpr
	This& 	add_method(short method) {
		m_data.concat_r(http::method::to_str(method));
		m_data.append(' ');
		return *this;
	}
	
	// Add an endpoint to the data string.
	/*  @docs
		@title: Add endpoint
		@description: Add a endpoint to the data string.
		@notes:
			- Does not assign to the attribute `m_endpoint`.
		@funcs: 2
	*/
	constexpr
	This& 	add_endpoint(const String& endpoint) {
		return add_endpoint(endpoint.data(), endpoint.len());
	}
	constexpr
	This& 	add_endpoint(const char* endpoint, const Length len) {
		m_data.expand(len + 1);
		m_data.concat_no_resize_r(endpoint, len);
		m_data.append_no_resize(' ');
		return *this;
	}

	// Add a version to the data string.
	/*  @docs
		@title: Add version
		@description: Add a HTTP version to the data string.
		@notes:
			- Does not assign to the attribute `m_version`.
	*/
	constexpr
	This& 	add_version(short version) {
		m_data.expand(10);
		m_data.concat_no_resize_r(http::version::to_str(version));
		m_data.append_no_resize('\r');
		m_data.append_no_resize('\n');
		return *this;
	}
	
	// Add a header key & value to the data string.
	/*  @docs
		@title: Add header
		@description: Add a header key & value to the data string.
		@notes:
			- Does not assign to the attribute `m_headers`.
		@funcs: 2
	*/
	constexpr
	This&	add_header(
		const String& 				key,
		const String& 				value
	) {
		m_data.expand(key.len() + value.len() + 3);
		m_data.concat_no_resize_r(key);
		m_data.append_no_resize(':');
		m_data.concat_no_resize_r(value);
		m_data.append_no_resize('\r');
		m_data.append_no_resize('\n');
		return *this;
	}
	constexpr
	This&	add_header(
		const char* 				key,
		const Length		 		key_len,
		const char* 				value,
		const Length		 		value_len
	) {
		m_data.expand(key_len + value_len + 3);
		m_data.concat_no_resize_r(key, key_len);
		m_data.append_no_resize(':');
		m_data.concat_no_resize_r(value, value_len);
		m_data.append_no_resize('\r');
		m_data.append_no_resize('\n');
		return *this;
	}	
	
	// Add headers to the data string.
	/*  @docs
		@title: Add headers
		@description: Add headers to the data string.
		@notes:
			- Does not assign to the attribute `m_headers`.
	*/
	constexpr
	This&	add_headers(const Headers& headers) {
		for (auto& i: headers.indexes()) {
			add_header(headers.key(i), headers.value(i));
		}
		return *this;
	}
	
	// Add a body to the data string.
	/*  @docs
		@title: Add body
		@description: Add a body to the data string.
		@notes:
			- Automatically calls `add_end()`.
			- Does not assign to the attribute `m_body`.
		@funcs: 3
	*/
	constexpr
	This&	add_body(const String& body) {
		m_data.expand(body.len() + 2);
		m_data.append_no_resize('\r');
		m_data.append_no_resize('\n');
		m_data.concat_no_resize_r(body);
		m_data.null_terminate();
		return *this;
	}
	constexpr
	This&	add_body(const Json& body) {
		const String dumped = body.json();
		m_data.expand(dumped.len() + 2);
		m_data.append_no_resize('\r');
		m_data.append_no_resize('\n');
		m_data.concat_no_resize_r(dumped);
		m_data.null_terminate();
		return *this;
	}
	constexpr
	This&	add_body(const char* body, ullong len) {
		m_data.expand(len + 2);
		m_data.append_no_resize('\r');
		m_data.append_no_resize('\n');
		m_data.concat_no_resize_r(body, len);
		m_data.null_terminate();
		return *this;
	}

	// Add the end CRLF.
	/*  @docs
		@title: Add end
		@description: Add the end CRLF.
		@notes:
			- Automatically called in `add_body()`.
	*/
	constexpr
	This&	add_end() {
		m_data.expand(2);
		m_data.append_no_resize('\r');
		m_data.append_no_resize('\n');
		m_data.null_terminate();
		return *this;
	}

	// Null terminate the data string.
	/*  @docs
		@title: Null terminate
		@description: Null terminate the data string.
	*/
	constexpr
	This& 	null_terminate() {
		m_data.null_terminate();
		return *this;
	}

	// Get a header value by key.
	/*  @docs
		@title: Header
		@description: Get a header value by key.
		@funcs: 2
	*/
	constexpr
	auto&	header(const String& key) {
		return m_headers.value(key);
	}
	constexpr
	auto&	header(const char* key, const Length len) {
		return m_headers.value(key, len);
	}
    
	// ---------------------------------------------------------
	// Operators.

	// Dump to pipe.
	constexpr friend
	auto& 	operator <<(Pipe& pipe, const This& obj) {
		if (obj.m_data.is_defined()) {
			return pipe << obj.m_data;
		}
		else {
			pipe <<
			vlib::http::method::to_str(obj.m_method) << ' ' <<
			obj.m_endpoint << ' ' <<
			vlib::http::version::to_str(obj.m_version) << "\r\n";
			for (auto& [k,v]: obj.m_headers.iterate()) {
				pipe << *k << ": " << *v << "\r\n";
			}
			if (obj.m_body.is_defined()) {
				pipe << "\r\n" << obj.m_body;
			}
			return pipe;
		}
	}

};

// ---------------------------------------------------------
// Instances.

// Is type.
template<typename Type> 	struct is_Request 								{ SICEBOOL value = false; };
template<>				 	struct is_Request<http::Request>				{ SICEBOOL value = true;  };
template<>				 	struct is_Request<http::Request&> 				{ SICEBOOL value = true;  };
template<>				 	struct is_Request<http::Request&&> 				{ SICEBOOL value = true;  };
template<>				 	struct is_Request<const http::Request> 			{ SICEBOOL value = true;  };
template<>				 	struct is_Request<const http::Request&> 		{ SICEBOOL value = true;  };

// ---------------------------------------------------------
// End.

}; 		// End namespace http.

// Shortcuts.
namespace http { namespace shortcuts {
using Request =		vlib::http::Request;
};};

}; 		// End namespace vlib.
#endif 	// End header.
