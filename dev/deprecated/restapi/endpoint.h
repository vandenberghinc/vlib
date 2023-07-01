/*
 Author: Daan van den Bergh
 Copyright: © 2022 Daan van den Bergh.
*/

// Header.
#ifndef VLIB_RESTAPI_ENDPOINT_T_H
#define VLIB_RESTAPI_ENDPOINT_T_H

// Namespace vlib.
namespace vlib {

// Namespace restapi.
namespace restapi {

// ---------------------------------------------------------
// Type definitions.

// Endpoint function.
typedef http::Response (*EndpointFunc)(const String&, const Json&, const http::Headers&);

// ---------------------------------------------------------
// RestAPI endpoint type.

/* @docs {
	@chapter: restapi
	@title: Endpoint
	@description:
		RESTAPI Endpoint type.
	@notes:
		The endpoint function must be like `vlib::http::Response somefunc(const vlib::String& username, const vlib::Json& params, const vlib::http:Headers& headers)`
	@usage:
		#include <vlib/sockets/restapi.h>
		vlib::Endpoint endpoint;
} */
template <
	int			http_version = 	http::version::v1_1 	// the http version
>
class Endpoint {
public:

	// ---------------------------------------------------------
	// Aliases.

	using 		This =		Endpoint;

	// ---------------------------------------------------------
	// Attributes.
	
	/*  @docs {
		@title: Endpoint attributes
		@description:
			Attributes for a `Endpoint` object.
			
			Attributes `mutex` and `rate_limits` are reserved, to not use these.
		@notes:
			Authentication methods can be joined like ` { .auth = vlib::restapi::auth::token | vlib::restapi::auth::api_key | vlib::restapi::auth::sign }`
		
	} */
	struct attr {
		short					content_type = http::content_type::undefined;	// the content type.
		short 					method = http::method::get;						// the endpoint method.
		String					endpoint;										// the endpoint path.
		int						auth = 0;										// auth methods.
		int						rate_limit = -1;								// the rate limit, -1 for no rate limit.
		int						rate_limit_duration = 60;						// the rate limit duration.
		int						rate_limit_format = rate_limit::sec;			// the rate limit format.
		EndpointFunc				func;											// the endpoint function.
		Compression			compression;									// the compression object.
		
		// Reserved.
		Mutex					mutex;											// the mutex lock for rate limits.
		Array<RateLimit>	rate_limits;									// the rate limit array.
	};
	SPtr<attr>	m_attr;

	// ---------------------------------------------------------
	// Constructors.

	// Default constructor.
	constexpr
	Endpoint() :
	m_attr(attr{}) {}

	// Constructor.
	constexpr
	Endpoint(
		const short& 			method,
		const String& 			endpoint,
		EndpointFunc&&			func
	) :
	m_attr(attr{ .method = method, .endpoint = endpoint, .func = func }) {}
	constexpr
	Endpoint(
		const short& 			content_type,
		const short& 			method,
		const String& 			endpoint,
		EndpointFunc&&			func
	) :
	m_attr(attr{ .content_type = content_type, .method = method, .endpoint = endpoint, .func = func }) {}

	// Constructor from attributes.
	/*  @docs {
		@title: Constructor
		@description:
			Construct from attributes.
		@notes:
			Authentication methods can be joined like ` { .auth = vlib::restapi::auth::token | vlib::restapi::auth::api_key | vlib::restapi::auth::sign }`
		@parameter: {
			@name: a
			@description: The endpoint attributes.
		}
		@usage:
			vlib::http::Response hello_world(const vlib::String& username, const vlib::Json& params, const vlib::Headers& headers) {
				return http::Response(...);
			}
			vlib::Endpoint endpoint({
				.content_type = http::content_type::json,
				.method = http::method::get,
				.endpoint = "/hello_world",
				.auth = vlib::restapi::auth::token | vlib::restapi::auth::api_key | vlib::restapi::auth::sign,
				.rate_limit = -1,
				.rate_limit_duration = 60,
				.rate_limit_format = rate_limit::sec,
				.func = hello_world,
			});
	} */
	constexpr
	Endpoint(const attr& a) :
	m_attr(a) {}
	constexpr
	Endpoint(attr&& a) :
	m_attr(a) {}

	// Copy constructor.
	constexpr
	Endpoint(const This& obj) :
	m_attr(obj.m_attr) {}

	// Move constructor.
	constexpr
	Endpoint(This&& obj) :
	m_attr(move(obj.m_attr)) {}

	// ---------------------------------------------------------
	// Assignment operators.

	// Copy assignment operator.
	constexpr
	auto& 	operator =(const This& obj) {
		m_attr.copy(obj.m_attr);
		return *this;
	}

	// Move assignment operator.
	constexpr
	auto& 	operator =(This&& obj) {
		m_attr.swap(obj.m_attr);
		return *this;
	}

	// ---------------------------------------------------------
	// Attribute functions.

	// Content type.
	/*  @docs {
		@title: Content type
		@type: short&
		@description:
			Get the content type attribute.
	} */
	constexpr
	auto& 	content_type() { return m_attr->content_type; }

	// Method.
	/*  @docs {
		@title: Method
		@type: short&
		@description:
			Get the method attribute.
	} */
	constexpr
	auto& 	method() { return m_attr->method; }

	// Endpoint.
	/*  @docs {
		@title: Endpoint
		@type: String&
		@description:
			Get the endpoint attribute.
	} */
	constexpr
	auto& 	endpoint() { return m_attr->endpoint; }
	
	// Requires authentication.
	/*  @docs {
		@title: Authentication
		@type: short&
		@description:
			Get the auth attribute.
	} */
	constexpr
	auto& 	auth() { return m_attr->auth; }
	
	// Function.
	/*  @docs {
		@title: Function
		@description:
			Get the function attribute.
	} */
	constexpr
	auto& 	func() { return m_attr->func; }
	
	// Compression.
	/*  @docs {
		@title: Compression
		@type: vlib::Compression&
		@description:
			Get the compression attribute.
	} */
	constexpr
	auto& 	compression() { return m_attr->compression; }

	// Is undefined.
	/*  @docs {
		@title: Is undefined
		@description:
			Check if the object is undefined.
	} */
	constexpr
	bool 	is_undefined() { return m_attr->endpoint.is_undefined(); }

	// ---------------------------------------------------------
	// Functions.

	// Equals.
	/*  @docs {
		@title: Equals
		@description:
			Get the endpoint equals a content type, method and endpoint.
	} */
	constexpr
	bool 	eq(const short& content_type, const short& method, const String& endpoint) {
		return (
			m_attr->method == method &&
            (content_type == 0 || m_attr->content_type == content_type) && // content type 0 for html pages.
			m_attr->endpoint.eq(endpoint)
		);
	}
	
	// Verify the rate limit for a uid.
	/*  @docs {
		@title: Verify rate limit
		@type: ullong
		@description:
			Verify the rate limit for an ip.
	} */
	constexpr
	int 	verify_rate_limit(const ullong& ip) {
		
		// No rate limit.
		if (m_attr->rate_limit == -1) { return 0; }
		
		// Lock.
        m_attr->mutex.lock();
		
		// Resize.
		m_attr->rate_limits.resize(ip);
		if (ip > m_attr->rate_limits.len()) {
			m_attr->rate_limits.len() = ip;
		}
		
		// Get item.
		auto& item = m_attr->rate_limits.get(ip);
		
		// Unlock.
        m_attr->mutex.unlock();
		
		// Verify rate limit.
		long sec = Date::get_seconds();
		if (item.timestamp == 0) {
			item.timestamp = sec;
			item.count = 1;
		} else if (sec > item.timestamp + (rate_limit::to_seconds(m_attr->rate_limit) * m_attr->rate_limit_duration)) {
			item.timestamp = sec;
			item.count = 1;
		} else {
			++item.count;
		}
		if (item.count > m_attr->rate_limit) {
			return restapi::error::rate_limit_exceeded;
		}
		return 0;
	}

};

// ---------------------------------------------------------
// End.

}; 		// End namespace restapi.
}; 		// End namespace vlib.
#endif 	// End header.
