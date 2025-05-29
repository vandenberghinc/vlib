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
  websocket: () => websocket
});
module.exports = __toCommonJS(stdin_exports);
var http = __toESM(require("http"));
var https = __toESM(require("https"));
var bson = __toESM(require("bson"));
var url = __toESM(require("url"));
var import_ws = __toESM(require("ws"));
globalThis.WebSocket = import_ws.default;
var websocket;
(function(websocket2) {
  class Server {
    port;
    ip;
    https_config;
    server;
    api_keys;
    rate_limit;
    wss;
    streams;
    commands;
    events;
    rate_limit_cache;
    _clear_caches_timeout;
    constructor({ ip = null, port = 8e3, https: https2 = null, rate_limit = {
      limit: 5,
      interval: 60
    }, api_keys = [], server = null }) {
      this.port = port;
      this.ip = ip;
      this.https_config = https2;
      this.server = server;
      this.api_keys = api_keys;
      this.rate_limit = rate_limit;
      this.streams = /* @__PURE__ */ new Map();
      this.commands = /* @__PURE__ */ new Map();
      this.events = /* @__PURE__ */ new Map();
      this.rate_limit_cache = /* @__PURE__ */ new Map();
    }
    /*  @docs:
     *  @title: Start
     *  @descr: Start the server.
     */
    start() {
      if (this.server === null) {
        if (this.https_config != null) {
          this.server = https.createServer(this.https_config, (req, res) => {
            res.writeHead(426, { "Content-Type": "text/plain" });
            res.end("This service requires WebSocket protocol.");
          });
          this.server.__is_https = true;
        } else {
          this.server = http.createServer((req, res) => {
            res.writeHead(426, { "Content-Type": "text/plain" });
            res.end("This service requires WebSocket protocol.");
          });
        }
      }
      this.wss = new import_ws.WebSocketServer({ noServer: true });
      this.server.on("upgrade", (request, socket, head) => {
        if (this.rate_limit !== false) {
          const ip = request.socket.remoteAddress;
          const now = Date.now();
          if (this.rate_limit_cache.has(ip)) {
            let data = this.rate_limit_cache.get(ip);
            if (now >= data.expiration) {
              data = {
                count: 0,
                expiration: now + this.rate_limit.interval * 1e3
              };
            }
            ++data.count;
            if (data.count > this.rate_limit.limit) {
              socket.write(`HTTP/1.1 429 Too Many Requests\r
\r
Rate limit exceeded, please try again in ${Math.floor((data.expiration - now) / 1e3)} seconds.`);
              socket.destroy();
              return;
            }
            this.rate_limit_cache.set(ip, data);
          } else {
            this.rate_limit_cache.set(ip, {
              count: 1,
              expiration: now + this.rate_limit.interval * 1e3
            });
          }
        }
        const { query } = url.parse(request.url, true);
        if (this.api_keys.length > 0 && !this.api_keys.includes(query.api_key)) {
          socket.write("HTTP/1.1 401 Unauthorized\r\n\r\n");
          socket.destroy();
          return;
        }
        this.wss.handleUpgrade(request, socket, head, (stream) => {
          this.wss.emit("connection", stream, request);
        });
      });
      this.wss.on("connection", (stream) => {
        stream.id = Math.random().toString(36).substring(2, 16);
        this.streams.set(stream.id, stream);
        stream.messages = /* @__PURE__ */ new Map();
        stream.on("message", (message) => {
          try {
            let parsed = bson.deserialize(message);
            if (typeof parsed === "object") {
              if (!parsed.timestamp) {
                parsed.timestamp = Date.now();
              }
              if (parsed.command && this.commands.has(parsed.command)) {
                this.commands.get(parsed.command)(stream, parsed.id, parsed.data);
              } else if (parsed.id) {
                stream.messages.set(parsed.id, parsed);
              }
            }
          } catch (error) {
            if (message.toString() === "ping") {
              stream.send("pong");
              return;
            }
          }
        });
        if (this.events.has("open")) {
          this.events.get("open")(stream);
        }
        stream.on("close", (code, reason) => {
          stream.connected = false;
          if (this.events.has("close")) {
            this.events.get("close")(stream, code, reason);
          }
        });
        const err_callback = this.events.get("error");
        if (err_callback) {
          stream.on("error", (error) => err_callback(stream, error));
        }
      });
      const listen_callback = () => {
        if (this.events.has("listen")) {
          this.events.get("listen")(`${this.server.__is_https ? "https" : "http"}://${this.ip || "localhost"}:${this.port}`);
        }
      };
      if (this.ip) {
        this.server.listen(this.port, this.ip, listen_callback);
      } else {
        this.server.listen(this.port, listen_callback);
      }
      this._clear_caches();
    }
    /*  @docs:
     *  @title: Stop
     *  @descr: Stop the server.
     */
    async stop() {
      return new Promise((resolve) => {
        clearTimeout(this._clear_caches_timeout);
        let closed = 0;
        this.wss.clients.forEach((client) => {
          client.close();
        });
        this.wss.close(() => {
          ++closed;
          if (closed === 2) {
            resolve();
          }
        });
        this.server.close(() => {
          ++closed;
          if (closed === 2) {
            resolve();
          }
        });
      });
    }
    /*  @docs:
     *  @title: Event callback
     *  @descr:
     *      Set an event callback.
     *
     *      The following callbacks can be set:
     *      - listen: (address) => {}
     *      - open: (stream) => {}
     *      - close: (stream, code, reason) => {}
     *      - error: (stream, error) => {}
     */
    on_event(event, callback) {
      this.events.set(event, callback);
    }
    /*  @docs:
     *  @title: Command
     *  @descr:
     *      Set a command callback.
     *      Will be called when an incoming message has the specified command type.
     *      The function can take the following arguments: `(stream, id, data) => {}`.
     */
    on(command, callback) {
      this.commands.set(command, callback);
    }
    /*  @docs:
     *  @title: Send
     *  @descr:
     *      Send data through the websocket.
     *      When responding on a request use the same message id to create a response.
     *      Each message should have a message id so a request/response system can be created.
     */
    async send({ stream, command, id = Math.random().toString(36).substr(2, 32), data }) {
      stream.send(bson.serialize({
        command,
        id,
        data
      }));
      return id;
    }
    /*  @docs:
     *  @title: Await response
     *  @descr: Wait for a message to be filled out.
     *  @note: This only works when there is a single response message, any more response messages will be lost.
     */
    async await_response({ stream, id, timeout = 6e4, step = 10 }) {
      let elapsed = 0;
      return new Promise((resolve, reject) => {
        const wait = () => {
          if (stream.messages.has(id)) {
            const data = stream.messages.get(id);
            stream.messages.delete(id);
            resolve(data);
          } else {
            elapsed += step;
            if (elapsed > timeout) {
              reject(new Error("Operation timed out."));
            } else {
              setTimeout(wait, step);
            }
          }
        };
        wait();
      });
    }
    /*  @docs:
     *  @title: Request
     *  @descr: Send a command and expect a single response.
     *  @note: This only works when there is a single response message, any more response messages will be lost.
     */
    async request({ stream, command, data, timeout = 6e4 }) {
      const id = await this.send({ stream, command, data });
      return await this.await_response({ stream, id, timeout });
    }
    _clear_caches() {
      const now = Date.now();
      this.streams.forEach((client, id) => {
        if (client.connected) {
          client.messages.forEach((msg, msg_id) => {
            if (msg.timestamp && now >= msg.timestamp + 3600 * 1e3) {
              client.messages.delete(msg_id);
            }
          });
        } else {
          this.streams.delete(id);
        }
      });
      this._clear_caches_timeout = setTimeout(() => this._clear_caches(), 3600 * 1e3);
    }
  }
  websocket2.Server = Server;
  class Client {
    url;
    api_key;
    reconnect;
    auto_ping;
    commands;
    events;
    messages;
    stream;
    connected = false;
    try_reconnect = true;
    auto_ping_timeout;
    constructor({ url: url2 = "wss://localhost:8080", api_key = null, reconnect = {
      interval: 10,
      max_interval: 3e4
    }, ping = true }) {
      this.url = url2;
      this.api_key = api_key;
      if (reconnect === false) {
        this.reconnect = false;
      } else {
        this.reconnect = reconnect;
        if (typeof this.reconnect !== "object") {
          this.reconnect = {};
        }
        this.reconnect.interval ??= 10, this.reconnect.max_interval ??= 3e4, this.reconnect.attempts ??= 0;
      }
      if (ping === true) {
        this.auto_ping = 3e4;
      } else if (typeof ping === "number") {
        this.auto_ping = ping;
      } else {
        this.auto_ping = false;
      }
      this.commands = /* @__PURE__ */ new Map();
      this.events = /* @__PURE__ */ new Map();
      this.messages = /* @__PURE__ */ new Map();
    }
    /*  @docs:
     *  @title: Connect
     *  @descr: Connect the websocket
     */
    async connect() {
      return new Promise((resolve) => {
        this.try_reconnect = true;
        this.stream = new import_ws.default(this.api_key ? `${this.url}?api_key=${this.api_key}` : this.url);
        this.stream.on("open", () => {
          this.connected = true;
          if (this.try_reconnect && this.reconnect !== false) {
            this.reconnect.attempts = 0;
          }
          if (this.events.has("open")) {
            this.events.get("open")();
          }
          resolve();
        });
        this.stream.on("message", (message) => {
          try {
            let parsed = bson.deserialize(message);
            if (parsed.command != null && this.commands.has(parsed.command)) {
              this.commands.get(parsed.command)(parsed.id, parsed.data);
            } else if (parsed.id) {
              if (parsed.timestamp == null) {
                parsed.timestamp = Date.now();
              }
              this.messages.set(parsed.id, parsed);
            }
          } catch (error) {
            if (message.toString() === "pong") {
              return;
            }
          }
        });
        this.stream.on("close", (code, reason) => {
          this.connected = false;
          if (this.try_reconnect && this.reconnect !== false) {
            if (this.events.has("reconnect")) {
              this.events.get("reconnect")(code, reason);
            }
            const timeout = Math.min(this.reconnect.interval * Math.pow(2, this.reconnect.attempts), this.reconnect.max_interval);
            this.reconnect.attempts++;
            setTimeout(() => this.connect(), timeout);
          } else if (this.events.has("close")) {
            this.events.get("close")(code, reason);
          }
        });
        this.stream.on("error", (error) => {
          this.stream?.close();
          if (this.events.has("error")) {
            this.events.get("error")(error);
          }
        });
        if (this.auto_ping !== false) {
          clearTimeout(this.auto_ping_timeout);
          const auto_ping = () => {
            if (this.connected && this.stream) {
              this.stream.send("ping");
              this.auto_ping_timeout = setTimeout(auto_ping, typeof this.auto_ping === "number" ? this.auto_ping : 3e4);
            }
          };
          this.auto_ping_timeout = setTimeout(auto_ping, typeof this.auto_ping === "number" ? this.auto_ping : 3e4);
        }
      });
    }
    /*  @docs:
     *  @title: Disconnect
     *  @descr:
     *      Disconnect from the server.
     *      Automatically calls `close()`.
     */
    disconnect() {
      this.try_reconnect = false;
      this.stream?.close();
      if (this.auto_ping_timeout) {
        clearTimeout(this.auto_ping_timeout);
      }
    }
    /*  @docs:
     *  @title: Event callback
     *  @descr:
     *      Set an event callback.
     *      The following callbacks can be set:
     *      - open: (stream) => {}
     *      - error: (stream, error) => {}
     *      - reconnect: (stream, code, reason) => {}
     *      - close: (stream, code, reason) => {}
     */
    on_event(event, callback) {
      this.events.set(event, callback);
    }
    /*  @docs:
     *  @title: Command callback
     *  @descr:
     *      Set a command callback.
     *      Will be called when an incoming message has the specified command type.
     *      The function can take the following arguments: `(stream, id, data) => {}`.
     */
    on(command, callback) {
      this.commands.set(command, callback);
    }
    /*  @docs:
     *  @title: Send raw
     *  @descr: Send raw data through the websocket.
     */
    async send_raw(data) {
      await this.await_till_connected();
      this.stream?.send(data);
    }
    /*  @docs:
     *  @title: Send
     *  @descr:
     *      Send data through the websocket.
     *      When responding on a request use the same message id to create a response.
     *      Each message should have a message id so a request/response system can be created.
     */
    async send({ command, id = Math.random().toString(36).substring(2, 32), data }) {
      await this.await_till_connected();
      this.stream?.send(bson.serialize({
        command,
        id,
        data
      }));
      return id;
    }
    async await_till_connected(timeout = 6e4) {
      if (this.connected) {
        return;
      }
      const step = 10;
      let elapsed = 0;
      return new Promise((resolve, reject) => {
        const is_connected = () => {
          if (this.connected) {
            resolve();
          } else {
            elapsed += step;
            if (elapsed > timeout) {
              reject(new Error("Timeout."));
            } else {
              setTimeout(is_connected, step);
            }
          }
        };
        is_connected();
      });
    }
    /*  @docs:
     *  @title: Await response
     *  @descr: Wait for a message to be filled out.
     *  @note: This only works when there is a single response message, any more response messages will be lost.
     */
    async await_response({ id, timeout = 6e4, step = 10 }) {
      let elapsed = 0;
      return new Promise((resolve, reject) => {
        const wait = () => {
          if (this.messages.has(id)) {
            const data = this.messages.get(id);
            this.messages.delete(id);
            resolve(data);
          } else {
            elapsed += step;
            if (elapsed > timeout) {
              reject(new Error("Operation timed out."));
            } else {
              setTimeout(wait, step);
            }
          }
        };
        wait();
      });
    }
    /*  @docs:
     *  @title: Request
     *  @descr: Send a command and expect a single response.
     *  @note: This only works when there is a single response message, any more response messages will be lost.
     */
    async request({ command, data, timeout = 6e4 }) {
      const id = await this.send({ command, data });
      return await this.await_response({ id, timeout });
    }
  }
  websocket2.Client = Client;
})(websocket || (websocket = {}));
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  websocket
});
