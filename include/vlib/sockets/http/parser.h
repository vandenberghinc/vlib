// Author: Daan van den Bergh
// Copyright: © 2022 Daan van den Bergh.

// Header.
#ifndef VLIB_HTTP_PARSER_H
#define VLIB_HTTP_PARSER_H

// Namespace vlib.
namespace vlib {

// Namespace http.
namespace http {

// ---------------------------------------------------------
// Response parser.
// - Used to parse a response in blocks.
//   The full response can also be parsed.
// - Also supports chunked responses.
// - Only supports status codes that are included in "vlib::http::status"
// - The parsing will cause undefined behaviour on of the following conditions:
//   * The delimiter space characters are tabs instead of spaces.
//   * The data contains multiple spaces in the first line.
//   * The data contains multiple spaces after the key/value header delimiter (":").
//   * The data contains one or multiple spaces after the header delimiter (CRLF) (":").
//   * The method string is not comprised of uppercase characters.

template <typename Type>
struct Parser {
	
// Private.
private:
	
	// ---------------------------------------------------------
	// Attributes.
	
	// The output response / request.
	Type* output = NULL;
	
	// Mode variable.
	// - 0 for the 1th item of the first line.
	// - 1 for the 2th item of the first line
	// - 2 for the 3th item of the first line.
	// - 3 is for the header keys.
	// - 4 is for the header values.
	// - 5 is for the body.
	ushort 	mode = 0;
	
	// Iteration variables.
	const char*	data = NULL;
	ullong 		len = 0;
	ullong		index = 0;					// peristant index from within full received data.
	ullong 		start_index = 0;			// start index of value to parse.
	bool		is_chunked = false;			// is chunked request.
	ullong		content_len = 0;			// content len header value.
	ullong		remaining_content_len = 0; 	// only used when the a non chunked body is received in pieces.
	ullong 		chunk_len = 0; 				// the chunk length for chunked transmissions.
	ullong 		chunk_start = 0; 			// the start index of the chunk.
	ullong 		chunk_end = 0; 				// the actual last index of the chunk, not +1 like with len.
	
	// ---------------------------------------------------------
	// Static attributes.
	
	static inline char 		out_of_range_char = '?';
	
	// ---------------------------------------------------------
	// Private functions.
	
	// Get a char from the data safely, without causing a segfault.
	SICE
	const char&	safe_get(const char*& data, const ullong index, const ullong len) {
		if (index >= len) { return out_of_range_char; }
		return data[index];
	}

	// Parse a method from a buffer by index(es).
	SICE
	void 	parse_method(
		short& 			m_method,
		const char*&	data,
		const ullong	len,
		ullong&			start_index
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
		const char*&	data,
		const ullong	len,
		ullong&			start_index
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
		const char*&	data,
		const ullong	len,
		ullong&			start_index
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
	
	// Parse the first item of the first line.
	//
	// Request: parse method.
	constexpr
	void	parse_first_item_first_line() requires (Type::type == 1) {
		parse_method(output->m_method, data, len, start_index);
	}
	//
	// Response: parse version.
	constexpr
	void	parse_first_item_first_line() requires (Type::type == 2) {
		parse_version(output->m_version, data, len, start_index);
	}
	
	// Parse the second item of the first line.
	//
	// Request: parse endpoint.
	constexpr
	void	parse_second_item_first_line() requires (Type::type == 1) {
		output->m_endpoint.reconstruct(
			data + start_index,
			index - start_index
		);
	}
	//
	// Response: parse status.
	constexpr
	void	parse_second_item_first_line() requires (Type::type == 2) {
		parse_status(output->m_status, data, len, start_index);
	}
	
	// Parse the third item of the first line.
	//
	// Request: parse version.
	constexpr
	void	parse_third_item_first_line() requires (Type::type == 1) {
		parse_version(output->m_version, data, len, start_index);
	}
	//
	// Response: parse status description.
	constexpr
	void	parse_third_item_first_line() requires (Type::type == 2) {
		output->m_status_desc.reconstruct(
			data + start_index,
			index - start_index - 1
		);
	}
	
// Public.
public:
	
	
	// ---------------------------------------------------------
	// Constructors.
	
	// Default constructor.
	constexpr Parser() = default;
	
	// Constructor from output response / request.
	constexpr
	Parser(Type& _output) : output(&_output) {}
	
	// ---------------------------------------------------------
	// Functions.
	
	// Parse.
	// - Returns true when the full http request / response has been parsed.
	// - This function can be called multiple times for seperated data in a single response.
	// - The first line of the response and the full headers should always be in a single block.
	constexpr
	bool	parse(String& full_data) {
		
		// Reset iteration variables.
		data = full_data.data();
		len = full_data.len();
		
		// New vars.
		ullong key_start = 0;
		ullong key_end = 0;
		
		// Iterate.
		for (; index < len; ++index) {
			switch (mode) {

				// Is the first item of the first line.
				case 0: {
					switch (data[index]) {
						case ' ': {
							parse_first_item_first_line();
							mode = 1;
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
							parse_second_item_first_line();
							mode = 2;
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
									parse_third_item_first_line();
									mode = 3;
									start_index = index + 1;
									key_start = start_index;
									continue;
								}
								default: continue;
							}
						}
						default: continue;
					}
					break;
				}
					
				// Header key.
				case 3:
					switch (data[index]) {
						
						// Start of body.
						case '\n': {
							switch (data[index-1]) {
								case '\r': {
									
									// Chunked body.
									if (is_chunked) {
										chunk_start = index + 1;
										mode = 5;
										continue;
									}
									
									// No body.
									else if (content_len == 0) {
										return true;
									}
									
									// Parse non chunked body.
									++index;
									if (index != len) {
										
										// Remove optional CRLF at the end of the body.
										ullong value_end = len - 1; // including (not length format).
										while (true) {
											switch (data[value_end]) {
												case '\r': { --value_end; continue; }
												case '\n': { --value_end; continue; }
												default: break;
											}
											break;
										}
										
										// Reconstruct.
										ullong bl = value_end - index + 1;
										ullong body_len = bl > content_len ? content_len : bl;
										output->m_body.reconstruct(
											data + index,
											body_len
										);
										index = len;
										mode = 5;
										// @TODO store the remaining data that is received but exceeds the content len in a buffer, since this may be the next request / response.
										
										// Check full body.
										remaining_content_len = content_len - body_len;
										bool finished = output->m_body.len() == content_len;
										if (finished && is_compressed(output->m_body)) {
											output->m_body = decompress(output->m_body);
										}
										return finished;
										
									}
									continue;
								}
								default: continue;
							}
						}
							
						// End of key.
						case ':': {
							mode = 4;
							key_end = index;
							start_index = index + 1;
							continue;
						}
						default: continue;
					}
					
				// Header value.
				case 4:
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
									String key(data + key_start, key_end - key_start);
									String value(data + start_index, index - 1 - start_index);
									if (
										output->m_content_type == http::content_type::undefined &&
										key.eq("Content-Type", 12)
									) {
										output->m_content_type = http::content_type::from_str(value.data(), value.len());
									}
									else if (
										content_len == 0 &&
										key.eq("Content-Length", 14)
									) {
										content_len = value.as<ullong>();
									}
									else if (
										!is_chunked && key.eq("Transfer-Encoding", 17) &&
										value.eq("chunked", 7)
									) {
										is_chunked = true;
									}
									output->m_headers.append(move(key), move(value));
									mode = 3;
									key_start = index + 1;
									continue;
								}
								default: continue;
							}
						}
							
						// Other character.
						default: continue;
							
					}
				
				// Body.
				case 5:
					
					// Not chunked.
					if (!is_chunked) {
						
						// Concat to body.
						ullong body_len = len > remaining_content_len ? remaining_content_len : len;
						output->m_body.reconstruct(
							data,
							body_len
						);
						index = len;
						remaining_content_len -= body_len;
						// @TODO store the remaining data that is received but exceeds the content len in a buffer, since this may be the next request / response.
						
						// Check full body.
						bool finished = output->m_body.len() == content_len;
						if (finished && is_compressed(output->m_body)) {
							output->m_body = decompress(output->m_body);
						}
						return finished;
						
					}
					
					// Start of chunk.
					else if (chunk_len == 0 && index >= chunk_start && index + 1 != len) {
						switch (data[index]) {
							case '\n':
								switch (data[index-1]) {
									case '\r':
										chunk_len = from_hex(data + chunk_start, index - chunk_start - 1);
										if (chunk_len == 0) {
											
											// Decompress.
											if (is_compressed(output->m_body)) {
												output->m_body = decompress(output->m_body);
											}
											
											// Finished parsing.
											return true;
											
										}
										chunk_start = index + 1;
										chunk_end = chunk_start + chunk_len - 1;
										continue;
									default: continue;
								}
							default: continue;
						}
					}
					
					// End of chunk.
					else if (chunk_len != 0 && index >= chunk_end) {
						output->m_body.concat_r(data + chunk_start, chunk_len);
						chunk_start = index + 3;
						chunk_len = 0;
						continue;
					}
					
					// Other char.
					continue;
					
				// Unknown mode.
				default: continue;
			}
			
		}
		
		// Not finished parsing.
		return false;
		
	}
	
};

// ---------------------------------------------------------
// End.

}; 		// End namespace http.
}; 		// End namespace vlib.
#endif 	// End header.
