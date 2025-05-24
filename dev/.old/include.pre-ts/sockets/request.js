/*
 * Author: Daan van den Bergh
 * Copyright: © 2022 - 2023 Daan van den Bergh.
 */

// ---------------------------------------------------------
// Request.

// Make a request.
/*  @docs
	@chapter: Sockets
    @title: Request
    @description:
        Make a request
    @param:
        @name: host
  		@desc: The host name.
  		@type: string
    @param:
        @name: port
  		@desc: The port.
  		@type: number
    @param:
        @name: endpoint
  		@desc: The endpoint url.
  		@type: string
    @param:
        @name: method
  		@desc: The request method.
  		@type: string
    @param:
        @name: headers
  		@desc: The request headers.
  		@type: object
    @param:
        @name: params
  		@desc: The params string, array or object. When the method is `GET` and `query` is `true` then only an `object` type is allowed for parameter `params`.
  		@type: string, array or object.
    @param:
        @name: compress
  		@desc: Compress the params.
  		@type: boolean
    @param:
        @name: decompress
  		@desc: Automatically decompress the response when it is compressed.
  		@type: boolean
    @param:
        @name: query
  		@desc: Automatically add the params as query string when the method is `GET`.
  		@type: boolean
    @param:
        @name: json
  		@desc: Try to parse the response body to json.
  		@type: boolean
    @param:
        @name: reject_unauthorized
  		@desc: Reject unauthorized tls certificates.
  		@type: boolean
    @param:
        @name: delay
  		@desc: Wait a number of milliseconds after the request, can be useful for rate-limiting.
  		@type: null, number
    @param:
        @name: http2
  		@desc: Use http/2.
  		@type: boolean
    @usage:
        ...
        const {error, body, status} = await vlib.request({host: "https://google.com"});
 */
vlib.request = async function({
	host,
	port = null,
	endpoint,
	method = "GET",
	headers = {},
	params = null,
	compress = false,
	decompress = true,
	query = true,
	json = false,
	reject_unauthorized = true,
	delay = null,
	http2 = false,
}) {
	return new Promise((resolve) => {

		// Uppercase method.
		method = method.toUpperCase();
		
		// Query params.
		if (query && method === "GET" && params != null) {
			if (typeof params === "object") {
				params = Object.entries(params).map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`).join('&');
			} else {
				throw Error("Invalid value type for parameter \"params\", the valid type is \"object\".");
			}
			endpoint += `?${params}`;
			params = null;
		}
		
		// Convert params to string.
		if (params != null && typeof params === "object") {
			params = JSON.stringify(params);
			// params = Object.stringify(params); // since the vlib functino supports circular references DOES NOT WORK
		}
		
		// Compress data.
		if (compress) {
			params = zlib.gzipSync(params);
			headers["Content-Encoding"] = "gzip";
		}
		
		// Set content length.
		if (params != null) {
			headers["Content-Length"] = params.length;
		}
		
		// Vars.
		let error = null, body = "", status = null, res_headers = {};

		// On end.
		const on_end = () => {

			// Parse json.
			if (body.length > 0 && json) {
				try { body = JSON.parse(body); }
				catch (e) {}
			}

			// Resolve.
			if (delay == null) {
				resolve({
					body,
					error,
					status,
					headers: res_headers,
					json: () => JSON.parse(body),
				});
			} else {
				setTimeout(() => resolve({
					body,
					error,
					status,
					headers: res_headers,
					json: () => JSON.parse(body),
				}), delay)
			}
		}

		// ---------------------------------------------------
		// HTTP1

		if (!http2) {

			// Request options.
			options = {
				hostname: host,
				port: port,
				path: endpoint,
				method: method,
				headers: headers,
				rejectUnauthorized: reject_unauthorized,
			};
			
			// Make request.
			const req = libhttps.request(options, (res) => {
				
				// Set status code.
				status = res.statusCode;
				res_headers = res.headers;

				// Decompress data.
		        const content_encoding = res_headers['content-encoding'];
		        if (content_encoding === "gzip" || content_encoding === "deflate") {
		            let stream;
		            if (content_encoding === "gzip") {
		                stream = zlib.createGunzip();
		            } else if (content_encoding === "deflate") {
		                stream = zlib.createInflate();
		            }
		            res.pipe(stream)
		            stream.on("data", (chunk) => {
		                body += chunk.toString();
		            })
	                stream.on("end", on_end)
		        }

		        // Create a promise to await the incoming data.
		        else {
		            res.on("data", (chunk) => {
		                body += chunk.toString();
		            })
	                res.on("end", () => {
	                	on_end()
	                })
		        }
			});

			// Handle error.
			req.on("error", (e) => {
				error = e;
				if (error.response) {
					status = error.response.statusCode;
				}
				on_end()
			});
			
			// Write params.
			if (params != null) {
				req.write(params);
			}

			// End.
			req.end();

		}

		// ---------------------------------------------------
		// HTTP2.

		else {
			const session = libhttp2.connect(`https://${host}`, {
				rejectUnauthorized: reject_unauthorized,
				settings: {
			        // Adjust timeout settings as needed
			        timeout: 60000, // 60 seconds
			    },
			});

			session.on('error', (e) => {
				error = e;
				if (error.response) {
					status = error.response.statusCode;
				}
				on_end()
				session.close();
			});

			// Make request
			const req = session.request({
			    ':method': method,
			    ':path': endpoint,
			    ...headers
			});

			// To handle compressed response
			let decompress_stream;

			req.on('response', (headers, flags) => {
			    
			    // Set status code
			    status = headers[':status'];
			    res_headers = headers;

			    // Encoding.
			    const content_encoding = headers['content-encoding'];
			    if (content_encoding === 'gzip' || content_encoding === 'deflate') {
			        if (content_encoding === 'gzip') {
			            decompress_stream = zlib.createGunzip();
			        } else if (content_encoding === 'deflate') {
			            decompress_stream = zlib.createInflate();
			        }
			    }

			    // Stream.
			    let stream = req;
			    if (decompress_stream) {
			        stream = stream.pipe(decompress_stream);
			    }
			    let body = '';
			    stream.on('data', (chunk) => {
			        body += chunk.toString();
			    });

			    stream.on('end', () => {
			        on_end(); // Handle the end of the response
			        session.close();
			    });
			});

			// Handle errors
			req.on('error', (err) => {
			    error = err;
			    on_end(); // Consider defining `on_end` to handle completion logic
			    session.close();
			});

			// Write params if present and not GET method
			console.log("WRITE DATA")
			if (params != null && method !== 'GET') {
			    req.write(typeof params === 'object' ? JSON.stringify(params) : params);
			}

			// End the request
			console.log("call req.end()")
			// req.end();
		}
	});
}