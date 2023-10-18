/*
 * Author: Daan van den Bergh
 * Copyright: © 2022 - 2023 Daan van den Bergh.
 */

// ---------------------------------------------------------
// Imports

const libhttps = require("https")
const zlib = require('zlib');

// ---------------------------------------------------------
// Request
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
 *  @usage:
 *      ...
 *      vlib.request({host: "https://google.com"});
 } */

async function request({
	host,
	port = 432,
	endpoint,
	method,
	headers = {},
	params = null,
	compress = false,
	decompress = true,
	query = true,
}) {
	return new Promise((resolve, reject) => {
		
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
		};
		
		// Make request.
		let error, body = "", status;
		const req = libhttps.request(options, (res) => {
			
			// Set status code.
			status = res.statusCode;

			// Decompress data.
			if (decompress) {
				const content_encoding = res.headers['content-encoding'];
				if (content_encoding === "gzip") {
					res.pipe(zlib.createGunzip());
				} else if (content_encoding === "deflate") {
					res.pipe(zlib.createInflate());
				}
			}
			
			// On data.
			res.on("data", (chunk) => {
				body += chunk;
			});

			// On end.
			res.on("end", () => {
				resolve({
					body,
					error,
					status,
				})
			});
		});

		// Handle error.
		req.on("error", (error) => {
			if (error.response) {
				status = error.response.statusCode;
			}
			reject({
				body,
				error,
				status,
			})
		});
		
		// Write params.
		if (params != null) {
			res.write(params);
		}

		// End.
		req.end();
	});
}