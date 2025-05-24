/**
 * @author Daan van den Bergh
 * @copyright © 2024 - 2025 Daan van den Bergh. All rights reserved.
 */
import * as https from 'https';
import * as http2 from 'http2';
import * as zlib from 'zlib';
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
*/
export async function request({ host, port = null, endpoint = "/", method = "GET", headers = {}, params = undefined, compress = false, decompress = true, query = true, json = false, reject_unauthorized = true, delay = null, http2: use_http2 = false, }) {
    return new Promise((resolve) => {
        // Uppercase method.
        method = method.toUpperCase();
        // Query params.
        if (query && method === "GET" && params != null) {
            if (typeof params === "object") {
                params = Object.entries(params)
                    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
                    .join('&');
            }
            else {
                throw Error("Invalid value type for parameter \"params\", the valid type is \"object\".");
            }
            endpoint += `?${params}`;
            params = undefined;
        }
        // Convert params to string.
        if (params != null && typeof params === "object") {
            // try {
            params = JSON.stringify(params);
            // } catch (e) {
            //     function findCircularReferences(obj) {
            //         const circularPaths = [];
            //         const seenObjects = new WeakMap();
            //         function detect(obj, path = '', ancestors = []) {
            //             // Skip non-objects
            //             if (obj === null || typeof obj !== 'object') {
            //                 return;
            //             }
            //             // Check if we've seen this object before in the current path
            //             if (seenObjects.has(obj)) {
            //                 circularPaths.push(`${path} -> circular reference to ${seenObjects.get(obj)}`);
            //                 return;
            //             }
            //             // Add this object to our seen map with its path
            //             seenObjects.set(obj, path);
            //             ancestors.push({ obj, path });
            //             // Recursively check all properties
            //             for (const key of Object.keys(obj)) {
            //                 const value = obj[key];
            //                 const newPath = path ? `${path}.${key}` : key;
            //                 // Skip functions and primitive values
            //                 if (value === null || typeof value !== 'object' || typeof value === 'function') {
            //                     continue;
            //                 }
            //                 // Check if this value exists in our ancestors (circular reference)
            //                 const ancestorIndex = ancestors.findIndex(a => a.obj === value);
            //                 if (ancestorIndex >= 0) {
            //                     const ancestorPath = ancestors[ancestorIndex].path;
            //                     circularPaths.push(`${newPath} -> circular reference to ${ancestorPath}`);
            //                     continue;
            //                 }
            //                 // Continue search
            //                 detect(value, newPath, [...ancestors]);
            //             }
            //         }
            //         detect(obj);
            //         return circularPaths;
            //     }
            //     console.log("Circular references:", findCircularReferences(params));
            //     throw e;
            // }
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
                try {
                    body = JSON.parse(body);
                }
                catch (e) { }
            }
            // Resolve.
            const response = {
                body,
                error,
                status,
                headers: res_headers,
                json: () => JSON.parse(body),
            };
            if (delay == null) {
                resolve(response);
            }
            else {
                setTimeout(() => resolve(response), delay);
            }
        };
        if (!use_http2) {
            // HTTP1 Implementation
            const options = {
                hostname: host,
                port: port,
                path: endpoint,
                method: method,
                headers: headers,
                rejectUnauthorized: reject_unauthorized,
            };
            const req = https.request(options, (res) => {
                status = res.statusCode ?? null;
                res_headers = res.headers;
                // Handle compressed responses
                const content_encoding = res.headers['content-encoding'];
                if (content_encoding === "gzip" || content_encoding === "deflate") {
                    const stream = content_encoding === "gzip" ?
                        zlib.createGunzip() :
                        zlib.createInflate();
                    res.pipe(stream);
                    stream.on("data", (chunk) => {
                        body += chunk.toString();
                    });
                    stream.on("end", on_end);
                }
                else {
                    res.on("data", (chunk) => {
                        body += chunk.toString();
                    });
                    res.on("end", on_end);
                }
            });
            req.on("error", (e) => {
                error = e;
                if (error != null && 'response' in error && error.response) {
                    status = error.response.statusCode;
                }
                on_end();
            });
            if (params != null) {
                req.write(params);
            }
            req.end();
        }
        else {
            // HTTP2 Implementation
            const session = http2.connect(`https://${host}`, {
                rejectUnauthorized: reject_unauthorized,
            });
            session.on('error', (e) => {
                error = e;
                if (error != null && 'response' in error && error.response) {
                    status = error.response.statusCode;
                }
                on_end();
                session.close();
            });
            const req = session.request({
                ':method': method,
                ':path': endpoint,
                ...headers
            });
            req.on('response', (headers) => {
                status = headers[':status'] ?? null;
                res_headers = headers;
                const content_encoding = headers['content-encoding'];
                let stream = req;
                if (content_encoding === 'gzip' || content_encoding === 'deflate') {
                    stream = content_encoding === 'gzip' ?
                        req.pipe(zlib.createGunzip()) :
                        req.pipe(zlib.createInflate());
                }
                stream.on('data', (chunk) => {
                    body += chunk.toString();
                });
                stream.on('end', () => {
                    on_end();
                    session.close();
                });
            });
            req.on('error', (err) => {
                error = err;
                on_end();
                session.close();
            });
            if (params != null && method !== 'GET') {
                req.write(params);
            }
            req.end();
        }
    });
}
export default request;
//# sourceMappingURL=request.js.map