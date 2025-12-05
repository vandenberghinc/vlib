var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);
var stdin_exports = {};
__export(stdin_exports, {
  request: () => request
});
module.exports = __toCommonJS(stdin_exports);
var https = __toESM(require("https"));
var http2 = __toESM(require("http2"));
var zlib = __toESM(require("zlib"));
async function request({
  host,
  port = null,
  endpoint = "/",
  method = "GET",
  headers = {},
  params = void 0,
  compress = false,
  // decompress = true,
  query = true,
  json = false,
  reject_unauthorized = true,
  delay = null,
  http2: use_http2 = false
}) {
  return new Promise((resolve) => {
    method = method.toUpperCase();
    if (query && method === "GET" && params != null) {
      if (typeof params === "object") {
        params = Object.entries(params).map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`).join("&");
      } else {
        throw Error('Invalid value type for parameter "params", the valid type is "object".');
      }
      endpoint += `?${params}`;
      params = void 0;
    }
    if (params != null && typeof params === "object") {
      params = JSON.stringify(params);
    }
    if (compress) {
      params = zlib.gzipSync(params);
      headers["Content-Encoding"] = "gzip";
    }
    if (params != null) {
      headers["Content-Length"] = params.length;
    }
    let error = null, body = "", status = null, res_headers = {};
    const on_end = () => {
      if (body.length > 0 && json) {
        try {
          body = JSON.parse(body);
        } catch (e) {
        }
      }
      const response = {
        body,
        error,
        status,
        headers: res_headers,
        json: () => JSON.parse(body)
      };
      if (delay == null) {
        resolve(response);
      } else {
        setTimeout(() => resolve(response), delay);
      }
    };
    if (!use_http2) {
      const options = {
        hostname: host,
        port,
        path: endpoint,
        method,
        headers,
        rejectUnauthorized: reject_unauthorized
      };
      const req = https.request(options, (res) => {
        status = res.statusCode ?? null;
        res_headers = res.headers;
        const content_encoding = res.headers["content-encoding"];
        if (content_encoding === "gzip" || content_encoding === "deflate") {
          const stream = content_encoding === "gzip" ? zlib.createGunzip() : zlib.createInflate();
          res.pipe(stream);
          stream.on("data", (chunk) => {
            body += chunk.toString();
          });
          stream.on("end", on_end);
        } else {
          res.on("data", (chunk) => {
            body += chunk.toString();
          });
          res.on("end", on_end);
        }
      });
      req.on("error", (e) => {
        error = e;
        if (error != null && "response" in error && error.response) {
          status = error.response.statusCode;
        }
        on_end();
      });
      if (params != null) {
        req.write(params);
      }
      req.end();
    } else {
      const session = http2.connect(`https://${host}`, {
        rejectUnauthorized: reject_unauthorized
      });
      session.on("error", (e) => {
        error = e;
        if (error != null && "response" in error && error.response) {
          status = error.response.statusCode;
        }
        on_end();
        session.close();
      });
      const req = session.request({
        ":method": method,
        ":path": endpoint,
        ...headers
      });
      req.on("response", (headers2) => {
        status = headers2[":status"] ?? null;
        res_headers = headers2;
        const content_encoding = headers2["content-encoding"];
        let stream = req;
        if (content_encoding === "gzip" || content_encoding === "deflate") {
          stream = content_encoding === "gzip" ? req.pipe(zlib.createGunzip()) : req.pipe(zlib.createInflate());
        }
        stream.on("data", (chunk) => {
          body += chunk.toString();
        });
        stream.on("end", () => {
          on_end();
          session.close();
        });
      });
      req.on("error", (err) => {
        error = err;
        on_end();
        session.close();
      });
      if (params != null && method !== "GET") {
        req.write(params);
      }
      req.end();
    }
  });
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  request
});
