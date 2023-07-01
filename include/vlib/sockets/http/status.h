// Author: Daan van den Bergh
// Copyright: © 2022 Daan van den Bergh.

// Header.
#ifndef VLIB_HTTP_STATUS_H
#define VLIB_HTTP_STATUS_H

// Namespace vlib.
namespace vlib {

// Namespace http.
namespace http {

// Namespace method.
namespace status {

// HTTP response status.
// - Does not include all status codes.
/* 	@docs: {
 * 	@chapter: http
 * 	@title: Status
 * 	@description: HTTP status codes.
 * 	@usage:
 * 		#include <vlib/sockets/http.h>
 * 		short success = vlib::http::status::success;
 * 	@show_code: true
 } */
enum statuses {
	undefined = 						0,
	continue_ = 						100,
	switching_protocols = 				101,
	early_hints = 						103,
	success =							200,
	created = 							201,
	accepted = 							202,
	no_auth_info = 						203,
	no_content = 						204,
	reset_content = 					205,
	partial_content =					206,
	multiple_choices = 					300,
	moved_permanently = 				301,
	found = 							302,
	see_other = 						303,
	not_modified = 						304,
	temporary_redirect = 				307,
	permanent_redirect = 				308,
	bad_request = 						400,
	unauthorized = 						401,
	payment_required =					402,
	forbidden = 						403,
	not_found = 						404,
	method_not_allowed = 				405,
	not_acceptable =	 				406,
	proxy_auth_required = 				407,
	Requestimeout = 					408,
	conflict =		 					409,
	gone =			 					410,
	length_required =			 		411,
	precondition_failed =			 	412,
	payload_too_large =			 		413,
	uri_too_large =				 		414,
	unsupported_media_type =			415,
	range_not_statisfiable =	 		416,
	expectation_failed =				417,
	imateapot = 						418,
	unprocessable_entity = 				422,
	too_early = 						425,
	upgrade_required = 					426,
	precondition_required = 			428,
	too_many_requests = 				429,
	request_header_fields_too_large =	431,
	unavailable_for_legal_reasons =		451,
	internal_server_error = 			500,
	not_implemented = 					501,
	bad_gateway = 						502,
	service_unvailable = 				503,
	gateway_timeout = 					504,
	http_version_not_supported = 		505,
	variant_also_negotiates =			506,
	insufficient_storage =				507,
	loop_detected =						508,
	not_extended =						510,
	network_auth_required =				511,
    // Custom statuses.
    two_factor_auth_required =          601,
};

// Descriptions.
struct desc {
	SICE const CString 	undefined							= "Undefined";
	SICE const CString 	continue_							= "Continue";
	SICE const CString 	switching_protocols					= "Switching Protocols";
	SICE const CString 	early_hints							= "Early Hints";
	SICE const CString 	success								= "OK";
	SICE const CString 	created								= "Created";
	SICE const CString 	accepted							= "Accepted";
	SICE const CString 	no_auth_info						= "Non-Authoritative Information";
	SICE const CString 	no_content							= "No Content";
	SICE const CString 	reset_content						= "Reset Content";
	SICE const CString 	partial_content						= "Partial Content";
	SICE const CString 	multiple_choices					= "Multiple Choices";
	SICE const CString 	moved_permanently					= "Moved Permanently";
	SICE const CString 	found								= "Found";
	SICE const CString 	see_other							= "See Other";
	SICE const CString 	not_modified						= "Not Modified";
	SICE const CString 	temporary_redirect					= "Temporary Redirect";
	SICE const CString 	permanent_redirect					= "Permanent Redirect";
	SICE const CString 	bad_request							= "Bad Request";
	SICE const CString 	unauthorized						= "Unauthorized";
	SICE const CString 	payment_required					= "Payment Required";
	SICE const CString 	forbidden							= "Forbidden";
	SICE const CString 	not_found							= "Not Found";
	SICE const CString 	method_not_allowed					= "Method Not Allowed";
	SICE const CString 	not_acceptable						= "Not Acceptable";
	SICE const CString 	proxy_auth_required					= "Proxy Authentication Required";
	SICE const CString 	Requestimeout						= "Request Timeout";
	SICE const CString 	conflict							= "Conflict";
	SICE const CString 	gone								= "Gone";
	SICE const CString 	length_required						= "Length Required";
	SICE const CString 	precondition_failed					= "Precondition Failed";
	SICE const CString 	payload_too_large					= "Payload Too Large";
	SICE const CString 	uri_too_large						= "URI Too Long";
	SICE const CString 	unsupported_media_type				= "Unsupported Media Type";
	SICE const CString 	range_not_statisfiable				= "Range Not Satisfiable";
	SICE const CString 	expectation_failed					= "Expectation Failed";
	SICE const CString 	imateapot							= "I'm a teapot";
	SICE const CString 	unprocessable_entity				= "Unprocessable Entity";
	SICE const CString 	too_early							= "Too Early";
	SICE const CString 	upgrade_required					= "Upgrade Required";
	SICE const CString 	precondition_required				= "Precondition Required";
	SICE const CString 	too_many_requests					= "Too Many Requests";
	SICE const CString 	request_header_fields_too_large		= "Request Header Fields Too Large";
	SICE const CString 	unavailable_for_legal_reasons		= "Unavailable For Legal Reasons";
	SICE const CString 	internal_server_error				= "Internal Server Error";
	SICE const CString 	not_implemented						= "Not Implemented";
	SICE const CString 	bad_gateway							= "Bad Gateway";
	SICE const CString 	service_unvailable					= "Service Unavailable";
	SICE const CString 	gateway_timeout						= "Gateway Timeout";
	SICE const CString 	http_version_not_supported			= "HTTP Version Not Supported";
	SICE const CString 	variant_also_negotiates				= "Variant Also Negotiates";
	SICE const CString 	insufficient_storage				= "Insufficient Storage";
	SICE const CString 	loop_detected						= "Loop Detected";
	SICE const CString 	not_extended						= "Not Extended";
	SICE const CString 	network_auth_required				= "Network Authentication Required";
    SICE const CString  two_factor_auth_required            = "Additional authentication required";
};

// Convert the error number to a string description.
inline constexpr
auto& tostr(int status) {
	switch (status) {
		case statuses::undefined:
			return desc::undefined;
		case statuses::continue_:
			return desc::continue_;
		case statuses::switching_protocols:
			return desc::switching_protocols;
		case statuses::early_hints:
			return desc::early_hints;
		case statuses::success:
			return desc::success;
		case statuses::created:
			return desc::created;
		case statuses::accepted:
			return desc::accepted;
		case statuses::no_auth_info:
			return desc::no_auth_info;
		case statuses::no_content:
			return desc::no_content;
		case statuses::reset_content:
			return desc::reset_content;
		case statuses::partial_content:
			return desc::partial_content;
		case statuses::multiple_choices:
			return desc::multiple_choices;
		case statuses::moved_permanently:
			return desc::moved_permanently;
		case statuses::found:
			return desc::found;
		case statuses::see_other:
			return desc::see_other;
		case statuses::not_modified:
			return desc::not_modified;
		case statuses::temporary_redirect:
			return desc::temporary_redirect;
		case statuses::permanent_redirect:
			return desc::permanent_redirect;
		case statuses::bad_request:
			return desc::bad_request;
		case statuses::unauthorized:
			return desc::unauthorized;
		case statuses::payment_required:
			return desc::payment_required;
		case statuses::forbidden:
			return desc::forbidden;
		case statuses::not_found:
			return desc::not_found;
		case statuses::method_not_allowed:
			return desc::method_not_allowed;
		case statuses::not_acceptable:
			return desc::not_acceptable;
		case statuses::proxy_auth_required:
			return desc::proxy_auth_required;
		case statuses::Requestimeout:
			return desc::Requestimeout;
		case statuses::conflict:
			return desc::conflict;
		case statuses::gone:
			return desc::gone;
		case statuses::length_required:
			return desc::length_required;
		case statuses::precondition_failed:
			return desc::precondition_failed;
		case statuses::payload_too_large:
			return desc::payload_too_large;
		case statuses::uri_too_large:
			return desc::uri_too_large;
		case statuses::unsupported_media_type:
			return desc::unsupported_media_type;
		case statuses::range_not_statisfiable:
			return desc::range_not_statisfiable;
		case statuses::expectation_failed:
			return desc::expectation_failed;
		case statuses::imateapot:
			return desc::imateapot;
		case statuses::unprocessable_entity:
			return desc::unprocessable_entity;
		case statuses::too_early:
			return desc::too_early;
		case statuses::upgrade_required:
			return desc::upgrade_required;
		case statuses::precondition_required:
			return desc::precondition_required;
		case statuses::too_many_requests:
			return desc::too_many_requests;
		case statuses::request_header_fields_too_large:
			return desc::request_header_fields_too_large;
		case statuses::unavailable_for_legal_reasons:
			return desc::unavailable_for_legal_reasons;
		case statuses::internal_server_error:
			return desc::internal_server_error;
		case statuses::not_implemented:
			return desc::not_implemented;
		case statuses::bad_gateway:
			return desc::bad_gateway;
		case statuses::service_unvailable:
			return desc::service_unvailable;
		case statuses::gateway_timeout:
			return desc::gateway_timeout;
		case statuses::http_version_not_supported:
			return desc::http_version_not_supported;
		case statuses::variant_also_negotiates:
			return desc::variant_also_negotiates;
		case statuses::insufficient_storage:
			return desc::insufficient_storage;
		case statuses::loop_detected:
			return desc::loop_detected;
		case statuses::not_extended:
			return desc::not_extended;
		case statuses::network_auth_required:
			return desc::network_auth_required;
        case statuses::two_factor_auth_required:
            return desc::two_factor_auth_required;
		default:
			return desc::undefined;
	}
}


}; 		// End namespace status.
}; 		// End namespace http.
}; 		// End namespace vlib.
#endif 	// End header.
