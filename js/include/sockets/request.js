/*
 * Author: Daan van den Bergh
 * Copyright: © 2022 - 2023 Daan van den Bergh.
 */

// ---------------------------------------------------------
// Imports

const libhttps = require("https")
const zlib = require('zlib');

// ---------------------------------------------------------
// Request.

// Make a request.
/*  @docs {
 *  @title: Request
 *  @description:
 *      Make a request
 *  @param:
 *      @name: host
 *		@desc: The host name.
 *		@type: string
 *  @param:
 *      @name: port
 *		@desc: The port.
 *		@type: number
 *  @param:
 *      @name: endpoint
 *		@desc: The endpoint url.
 *		@type: string
 *  @param:
 *      @name: method
 *		@desc: The request method.
 *		@type: string
 *  @param:
 *      @name: headers
 *		@desc: The request headers.
 *		@type: object
 *  @param:
 *      @name: params
 *		@desc: The params string, array or object. When the method is `GET` and `query` is `true` then only an `object` type is allowed for parameter `params`.
 *		@type: string, array or object.
 *  @param:
 *      @name: compress
 *		@desc: Compress the params.
 *		@type: boolean
 *  @param:
 *      @name: decompress
 *		@desc: Automatically decompress the response when it is compressed.
 *		@type: boolean
 *  @param:
 *      @name: query
 *		@desc: Automatically add the params as query string when the method is `GET`.
 *		@type: boolean
 *  @param:
 *      @name: json
 *		@desc: Try to parse the response body to json.
 *		@type: boolean
 *  @param:
 *      @name: reject_unauthorized
 *		@desc: Reject unauthorized tls certificates.
 *		@type: boolean
 *  @usage:
 *      ...
 *      const {error, body, status} = await vlib.request({host: "https://google.com"});
 } */
vlib.request = async function({
	host,
	port = 432,
	endpoint,
	method,
	headers = {},
	params = null,
	compress = false,
	decompress = true,
	query = true,
	json = false,
	reject_unauthorized = true,
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
		if (typeof params === "object") {
			params = JSON.stringify(params);
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
		
		// Request options.
		options = {
			hostname: host,
			port: port,
			path: endpoint,
			method: method,
			headers: headers,
			rejectUnauthorized: reject_unauthorized,
		};

		// Vars.
		let error = null, body = "", status = null;

		// On end.
		const on_end = () => {
			
			// Parse json.
			if (body.length > 0 && json) {
				try { body = JSON.parse(body); }
				catch (e) {}
			}

			// Resolve.
			resolve({
				body,
				error,
				status,
			});
		}
		
		// Make request.
		const req = libhttps.request(options, (res) => {
			
			// Set status code.
			status = res.statusCode;

			// Decompress data.
	        const content_encoding = res.headers['content-encoding'];
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
                res.on("end", on_end)
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
	});
}