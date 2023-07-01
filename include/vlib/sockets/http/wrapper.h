// Author: Daan van den Bergh
// Copyright: © 2022 Daan van den Bergh.

// header.
#ifndef VLIB_HTTP_WRAPPER_H
#define VLIB_HTTP_WRAPPER_H

// Namespace vlib.
namespace vlib {

// Namespace http.
namespace http {

// HTTP wrapper.
struct wrapper {

	// Aliases.
	using 		Length = 	ullong;

	// Static attributes.
	static inline char 		out_of_range_char = '?';
	static inline String 	null_str;

	// Add a header to the data pointer.
	SICE
	void	add_header(
		SPtr<String>& 				m_data,
		const char* 				key,
		const Length 				key_len,
		const char* 				value,
		const Length		 		value_len
	) {
		m_data->expand(key_len + value_len + 3);
		m_data->concat_no_resize_r(key, key_len);
		m_data->append_no_resize(':');
		m_data->concat_no_resize_r(value, value_len);
		m_data->append_no_resize('\r');
		m_data->append_no_resize('\n');
	}

	// Add a body to the data pointer.
	SICE
	void	add_body(
		SPtr<String>& 	m_data,
		const char* 	body,
		ullong 			len
	) {
		m_data->expand(len + 2);
		m_data->append_no_resize('\r');
		m_data->append_no_resize('\n');
		m_data->concat_no_resize_r(body, len);
		m_data->null_terminate();
	}

	// Get a char from the data safely, without causing a segfault.
	SICE
	auto&	safe_get(char*& data, const Length index, const Length len) {
		if (index >= len) { return out_of_range_char; }
		return data[index];
	}

	// Parse a method from a buffer by index(es).
	SICE
	void 	parse_method(
		short& 			m_method,
		char*&			data,
		const Length	len,
		Length&			start_index
	) {
		switch (data[start_index]) {
			case 'G': { m_method = vlib::http::method::get; return; }
			case 'H': { m_method = vlib::http::method::head; return; }
			case 'P': {
				switch (safe_get(data, start_index + 1, len)) {
					case 'O': { m_method = vlib::http::method::post; return; }
					case 'U': { m_method = vlib::http::method::put; return; }
					case 'A': { m_method = vlib::http::method::patch; return; }
					default: return;
				}
			}
			case 'D': { m_method = vlib::http::method::del; return; }
			case 'C': { m_method = vlib::http::method::connect; return; }
			case 'O': { m_method = vlib::http::method::options; return; }
			case 'T': { m_method = vlib::http::method::trace; return; }
			default: return;
		}
	}

	// Parse a http version from a buffer by index(es).
	SICE
	void 	parse_version(
		short& 			m_version,
		char*&			data,
		const Length	len,
		Length&			start_index
	) {
		switch (safe_get(data, start_index + 5, len)) {
			case '0': { m_version = vlib::http::version::v0_9; break; }
			case '1': {
				switch (safe_get(data, start_index + 7, len)) {
					case '0': { m_version = vlib::http::version::v1_0; break; }
					case '1': { m_version = vlib::http::version::v1_1; break; }
					default: break;
				}
				break;
			}
			case '2': { m_version = vlib::http::version::v2_0; break; }
			default: break;
		}
	}

	// Parse a http status code from a buffer by index(es).
	// @TODO convert to end_index without safe get, instead of start_index.
	SICE
	void 	parse_status(
		short& 			m_status,
		char*&			data,
		const Length	len,
		Length&			start_index
	) {
		switch (data[start_index]) {
			case '1': {
				switch (safe_get(data, start_index + 2, len)) {
					case '0': { m_status = vlib::http::status::continue_; break; }
					case '1': { m_status = vlib::http::status::switching_protocols; break; }
					case '3': { m_status = vlib::http::status::early_hints; break; }
					default: break;
				}
				break;
			}
			case '2': {
				switch (safe_get(data, start_index + 2, len)) {
					case '0': { m_status = vlib::http::status::success; break; }
					case '1': { m_status = vlib::http::status::created; break; }
					case '2': { m_status = vlib::http::status::accepted; break; }
					case '3': { m_status = vlib::http::status::no_auth_info; break; }
					case '4': { m_status = vlib::http::status::no_content; break; }
					case '5': { m_status = vlib::http::status::reset_content; break; }
					case '6': { m_status = vlib::http::status::partial_content; break; }
					default: break;
				}
				break;
			}
			case '3': {
				switch (safe_get(data, start_index + 2, len)) {
					case '0': { m_status = vlib::http::status::multiple_choices; break; }
					case '1': { m_status = vlib::http::status::moved_permanently; break; }
					case '2': { m_status = vlib::http::status::found; break; }
					case '3': { m_status = vlib::http::status::see_other; break; }
					case '4': { m_status = vlib::http::status::not_modified; break; }
					case '7': { m_status = vlib::http::status::temporary_redirect; break; }
					case '8': { m_status = vlib::http::status::permanent_redirect; break; }
					default: break;
				}
				break;
			}
			case '4': {
				switch (safe_get(data, start_index + 1, len)) {
					case '0': {
						switch (safe_get(data, start_index + 2, len)) {
							case '0': { m_status = vlib::http::status::bad_request; break; }
							case '1': { m_status = vlib::http::status::unauthorized; break; }
							case '2': { m_status = vlib::http::status::payment_required; break; }
							case '3': { m_status = vlib::http::status::forbidden; break; }
							case '4': { m_status = vlib::http::status::not_found; break; }
							case '5': { m_status = vlib::http::status::method_not_allowed; break; }
							case '6': { m_status = vlib::http::status::not_acceptable; break; }
							case '7': { m_status = vlib::http::status::proxy_auth_required; break; }
							case '8': { m_status = vlib::http::status::Requestimeout; break; }
							case '9': { m_status = vlib::http::status::conflict; break; }
							default: break;
						}
						break;
					}
					case '1': {
						switch (safe_get(data, start_index + 2, len)) {
							case '0': { m_status = vlib::http::status::gone; break; }
							case '1': { m_status = vlib::http::status::length_required; break; }
							case '2': { m_status = vlib::http::status::precondition_failed; break; }
							case '3': { m_status = vlib::http::status::payload_too_large; break; }
							case '4': { m_status = vlib::http::status::uri_too_large; break; }
							case '5': { m_status = vlib::http::status::unsupported_media_type; break; }
							case '6': { m_status = vlib::http::status::range_not_statisfiable; break; }
							case '7': { m_status = vlib::http::status::expectation_failed; break; }
							case '8': { m_status = vlib::http::status::imateapot; break; }
							default: break;
						}
						break;
					}
					case '2': {
						switch (safe_get(data, start_index + 2, len)) {
							case '2': { m_status = vlib::http::status::unprocessable_entity; break; }
							case '5': { m_status = vlib::http::status::too_early; break; }
							case '6': { m_status = vlib::http::status::upgrade_required; break; }
							case '8': { m_status = vlib::http::status::precondition_required; break; }
							case '9': { m_status = vlib::http::status::too_many_requests; break; }
							default: break;
						}
						break;
					}
					case '3': { m_status = vlib::http::status::request_header_fields_too_large; break; }
					case '5': { m_status = vlib::http::status::unavailable_for_legal_reasons; break; }
					default: break;
				}
				break;
			}
			case '5': {
				switch (safe_get(data, start_index + 1, len)) {
					case '0': {
						switch (safe_get(data, start_index + 2, len)) {
							case '0': { m_status = vlib::http::status::internal_server_error; break; }
							case '1': { m_status = vlib::http::status::not_implemented; break; }
							case '2': { m_status = vlib::http::status::bad_gateway; break; }
							case '3': { m_status = vlib::http::status::service_unvailable; break; }
							case '4': { m_status = vlib::http::status::gateway_timeout; break; }
							case '5': { m_status = vlib::http::status::http_version_not_supported; break; }
							case '6': { m_status = vlib::http::status::variant_also_negotiates; break; }
							case '7': { m_status = vlib::http::status::insufficient_storage; break; }
							case '8': { m_status = vlib::http::status::loop_detected; break; }
							default: break;
						}
						break;
					}
					case '1': {
						switch (safe_get(data, start_index + 2, len)) {
							case '0': { m_status = vlib::http::status::not_extended; break; }
							case '1': { m_status = vlib::http::status::network_auth_required; break; }
							default: break;
						}
						break;
					}
					default: break;
				}
				break;
			}
			default: break;
		}
	}

	// Parse a http headers and body from data buffer and start index.
	SICE
	void 	parse_headers_and_body(
		short& 					m_content_type,
		Headers&		 		m_headers,
		SPtr<String>& 			m_body,
		SPtr<String>& 			m_data,
		Length&					index,
		Length&					start_index
	) {

		// Variables.
		Length 			key_start = index;
		Length 			key_end = 0;
		bool 			stop = false;
		char*&			data = m_data->data();
		const Length&	len = m_data->len();

		// Is type variable.
		// - 0 for the header key.
		// - 1 for the header value.
		ushort 	is_type = 0;

		// Iterate.
		for (; index < len; ++index) {
			switch (is_type) {

				// Is key.
				case 0: {
					switch (data[index]) {

						// Start of body.
						case '\n': {
							switch (data[index-1]) {
								case '\r': {
									++index;
									if (index != len) {
										Length value_end = len - 1; // including (not length format).
										while (true) {
											switch (data[value_end]) {
												case '\r': { --value_end; continue; }
												case '\n': { --value_end; continue; }
												default: break;
											}
											break;
										}
										m_body.reconstruct_by_type_args(
											data + index,
											value_end - index + 1
										);
										index = len;
									}
									break;
								}
								default: continue;
							}
							break;
						}

						// End of key.
						case ':': {
							is_type = 1;
							key_end = index;
							start_index = index + 1;
							continue;
						}
						default: continue;
					}
					break;
				}

				// Is value.
				case 1: {
					switch (data[index]) {

						// Skip spaces after the key delimiter.
						case ' ': {
							if (index == start_index) { ++start_index; }
							continue;
						}

						// End of value.
						case '\n': {
							switch (data[index-1]) {
								case '\r': {
									const char* k = data + key_start;
									const ullong klen = key_end - key_start;
									const char* v = data + start_index;
									const ullong vlen = index - 1 - start_index;
									if (
										m_content_type == http::content_type::undefined &&
										vlib::array<char>::eq(k, klen, "Content-Type", 12)
									) {
										if (vlib::array<char>::eq(v, vlen, "application/html", 16)) {
											m_content_type = http::content_type::html;
										} else if (vlib::array<char>::eq(v, vlen, "application/json", 16)) {
											m_content_type = http::content_type::json;
										} else if (vlib::array<char>::eq(v, vlen, "application/xml", 15)) {
											m_content_type = http::content_type::xml;
										} else {
											m_content_type = http::content_type::unknown;
										}
									}
									m_headers.append(
										String(k, klen),
										String(v, vlen)
									);
									is_type = 0;
									key_start = index + 1;
									continue;
								}
								default: continue;
							}
							continue;
						}
						default: continue;
					}
					continue;
				}
				default: break;
			}
			if (stop) { break; }
		}
	}

	// Parse a vlib uri query string.
	// - The query string must be formatted like this: .../?{"a":0}
	//   This is to preserve type differentiations from arrays and dictionaries inside the json.
	/*SICE
	 int 	parse_uri_query(
		Json& 			params,				// a reference to the json parameters.
		const char*			data,				// the entire uri or the sliced query string (must contain with a '?' though).
		const Length		len				// the length of the data.
	) {

		// Variables.
		Length 				index = 0;
		Length 				start_index = 0;	// the key's start index.
		short 				is_type = 0; 		// 0 for closed - 1 for open.
		Length 				depth = 0; 			// curly brackets depth.

		// Iterate.
		print("Parsing URI: [", data, "]");
		for (; index < len; ++index) {
			switch (is_type) {

				// Is closed.
				case 0: {
					switch (data[index]) {
						case '?': {
							is_type = 1;
							start_index = index + 1;
							continue;
						}
						default: continue;
					}
				}

				// Is open.
				case 1: {
					switch (data[index]) {
						case '{': {
							++depth;
							continue;
						}
						case '}': {
							--depth;
							switch (depth) {
								case 0: {
									int status;
									params = Json::parse(status, data + start_index, index - start_index + 1);
									if (status != 0) { return status; } // failed to parse.
									return 0; // success.
								}
								default: continue;
							}
							continue;
						}
						default: continue;
					}
				}

				// Unknown.
				default: continue;
			}
		}

		// Not found.
		switch (is_type) {
			case 0: 	return 0; 						// no params present.
			default: 	return json::error::parse;		// failed to parse.
		}

		//
	}
	*/

};
}; 		// End namespace http.
}; 		// End namespace vlib.
#endif 	// End header.
